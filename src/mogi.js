import { Roster } from './roster.js';
import { Placement, POINTS_BY_PLACEMENT, Race } from './race.js';
import { info, success } from './ui/toast.js';
import { onLocaleChange, t } from './i18n/i18n.js';
import { Team } from './team.js';
import { levenshteinWeighted, solveAssignmentDP } from './util.js';
import { normalizeName } from './player.js';

export const RACE_COUNT = 12;

export class Mogi extends EventTarget {
        /** @type {Roster} */ #roster;
        get roster() { return this.#roster; }

        /** @type {Race[]} */ #races = [];
        get races() { return [...this.#races]; }

        get size() { return this.#races.length; }
        get ended() { return this.#races.length >= RACE_COUNT; }
        get maxScore() { return POINTS_BY_PLACEMENT.reduce((a, b) => a + b) * RACE_COUNT; }

        /** @type {number} */
        #startTime = Date.now();
        get startDate() { return new Date(this.#startTime); }

        /**
         * Cache di TUTTI i nomi OCR rilevati (dalla pause screen o dalla race
         * screen), sia quelli abbinati a un player sia quelli non abbinati.
         * Usati dalla dropdown nell'Edit Roster per permettere all'utente di
         * assegnarli o riassegnarli manualmente. Anche i nomi già abbinati
         * vengono salvati: nella dropdown appariranno sbarrati in rosso
         * quando sono già usati in un input IGN. @type {string[]}
         */
        #unassignedOCRNames = [];
        get unassignedOCRNames() { return [...this.#unassignedOCRNames]; }

        /**
         * Aggiunge nomi OCR alla cache (senza duplicati).
         * @param {string[]} names
         */
        addUnassignedOCRNames(names) {
                for (const n of names) {
                        const trimmed = (n || '').trim();
                        if (!trimmed) continue;
                        if (!this.#unassignedOCRNames.includes(trimmed)) {
                                this.#unassignedOCRNames.push(trimmed);
                        }
                }
        }

        /**
         * Rimuove un nome OCR dalla cache (es. quando l'utente lo assegna
         * a un player tramite la dropdown).
         * @param {string} name
         */
        removeUnassignedOCRName(name) {
                const trimmed = (name || '').trim();
                this.#unassignedOCRNames = this.#unassignedOCRNames.filter(n => n !== trimmed);
                this.triggerUpdate();
        }

        /**
         * Svuota completamente la cache dei nomi OCR non assegnati.
         * Usato dal tasto "Reset names" nell'Edit Roster per ripartire da
         * zero con l'autofill.
         */
        clearUnassignedOCRNames() {
                this.#unassignedOCRNames = [];
                this.#detectedInitials = [];
                this.triggerUpdate();
        }

        /**
         * Cache delle INIZIALI rilevate automaticamente dall'autofill
         * (primi caratteri di ogni nome OCR: candidati tag dei team).
         * Massimo 6 diverse (i team di un 2v2): le letture fantasma
         * dell'OCR oltre la sesta vengono scartate. Maiuscole/minuscole
         * preservate così a video il tag è quello vero. Usate dalla
         * dropdown nella riga tag dell'Edit Roster per compilare i tag
         * velocemente senza riscriverli a mano. @type {string[]}
         */
        #detectedInitials = [];
        get detectedInitials() { return [...this.#detectedInitials].slice(0, 6); }

        /**
         * Aggiunge iniziali alla cache (senza duplicati, le più frequenti
         * prima, max 6). Il confronto è case-sensitive: "l" e "L" sono
         * due iniziali diverse. @param {string[]} initials
         */
        addDetectedInitials(initials) {
                /** @type {Map<string, number>} */
                const freq = new Map();
                for (const n of this.#detectedInitials) freq.set(n, (freq.get(n) ?? 0) + 1);
                for (const raw of initials) {
                        const trimmed = (raw || '').trim();
                        if (!trimmed) continue;
                        freq.set(trimmed, (freq.get(trimmed) ?? 0) + 1);
                }
                this.#detectedInitials = [...freq.entries()]
                        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
                        .map(e => e[0])
                        .slice(0, 6);
        }

        playersPerTeam = 1;
        /** @type {Team[]} */ #teams = [];
        get teams() { return [...this.#teams]; }
        /** @param {number} seed */
        teamBySeed(seed) { return this.#teams.find(t => t.seed === seed); }

        /** @param {Roster} roster */
        constructor(roster) {
                super();
                this.#roster = roster;
                const players = [...roster];
                this.playersPerTeam = players.filter(p => p.seed === 1).length;
                if( this.playersPerTeam > 1) {
                        const teamCount = Math.max(...players.map(p=>p.seed));
                        for( let i = 1; i <= teamCount; i++) {
                                const team = new Team(i, players.filter(p => p.seed === i));
                                if (roster.isWar && roster.warTags[i - 1]) team.tag = roster.warTags[i - 1];
                                this.#teams.push(team);
                        }
                }
                window.addEventListener('beforeunload', e => {
                        if( this.#races.length > 0 && !this.ended) {
                                e.preventDefault();
                                e.returnValue = '';
                        }
                });
                queueMicrotask(() => this.triggerUpdate());
                onLocaleChange(() => this.triggerUpdate()); // refresh all dynamic UI elements
        }

        triggerUpdate() {
                this.dispatchEvent(new Event('update'));
                // Persisti lo stato per l'OBS overlay (pagine altre possono
                // leggere questo stato via localStorage e visualizzarlo).
                this.#saveOverlayState();
        }

        /**
         * Ricalcola l'abbinamento playerId/resolvedName di TUTTI i placement
         * di TUTTE le race salvate, basandosi sull'ocrText già salvato in ogni
         * Placement e sul roster corrente (che l'utente potrebbe aver appena
         * modificato in Edit Roster: cambiato IGN, corretto tag, ecc.).
         *
         * L'algoritmo ripete lo stesso matching del sistema OCR originale
         * (Levenshtein pesato) ma usando ocrText invece di fare re-OCR.
         * La POSIZIONE (placement) viene preservata: se prima "Marcosky" era
         * 4°, resta 4°, ma se ora il roster ha un nuovo IGN che matcha meglio,
         * viene assegnato a quel player.
         *
         * Viene chiamato da edit-roster-dialog.js dopo che l'utente salva.
         */
        rematchAllRaces() {
                const rosterArray = [...this.#roster];
                const N = rosterArray.length;
                if (N === 0 || this.#races.length === 0) return;

                for (let rIdx = 0; rIdx < this.#races.length; rIdx++) {
                        const oldRace = this.#races[rIdx];
                        const oldPlacements = oldRace.placements;

                        // Prepara gli ocrText nell'ordine di placement (1..12)
                        /** @type {{placement: number, ocrText: string, dc: boolean}[]} */
                        const rows = oldPlacements.map(p => ({
                                placement: p.placement,
                                ocrText: p.ocrText || '',
                                dc: p.dc,
                        }));

                        // Normalizza ocrText
                        const normRows = rows.map(r => normalizeName(r.ocrText));
                        const isBlankCol = normRows.map(s => !s);

                        // Cost matrix: player (rows) × placement (cols)
                        // Copia del algoritmo in ocr.js senza il debug report
                        const levCosts = { ins: 3, del: 1, sub: 2 };
                        /** @type {number[][]} */
                        const cost = Array.from({ length: N }, () => Array(N).fill(0));
                        let maxNonBlankCost = 0;
                        const targetNorm = rosterArray.map(p => normalizeName(p.activePlayer.ign));

                        for (let i = 0; i < N; i++) {
                                for (let j = 0; j < N; j++) {
                                        if (isBlankCol[j]) continue;
                                        const d = levenshteinWeighted(targetNorm[i], normRows[j], levCosts);
                                        cost[i][j] = d;
                                        if (d > maxNonBlankCost) maxNonBlankCost = d;
                                }
                        }
                        const BLANK_COST = maxNonBlankCost + 2;
                        const IGN_MISMATCH_PENALTY = maxNonBlankCost + 50;
                        for (let i = 0; i < N; i++) {
                                for (let j = 0; j < N; j++) {
                                        if (isBlankCol[j]) cost[i][j] = BLANK_COST;
                                }
                        }
                        for (let j = 0; j < N; j++) {
                                if (isBlankCol[j]) continue;
                                const owner = targetNorm.indexOf(normRows[j]);
                                if (owner < 0) continue;
                                for (let i = 0; i < N; i++) {
                                        if (i === owner) continue;
                                        cost[i][j] += IGN_MISMATCH_PENALTY;
                                }
                        }

                        // Solve assignment (stesso algoritmo DP bitmask di ocr.js)
                        const assign = solveAssignmentDP(cost, N);

                        // Costruisci i nuovi placement
                        /** @type {Placement[]} */
                        const newPlacements = rows.map(r => new Placement(
                                r.placement, null, r.ocrText, r.ocrText, 0, r.dc
                        ));
                        for (let i = 0; i < N; i++) {
                                const j = assign[i];
                                newPlacements[j] = newPlacements[j].withPlayerIdAndResolvedName(
                                        rosterArray[i].id,
                                        rosterArray[i].activePlayer.name
                                );
                        }
                        // Marca DC quelli che erano DC
                        for (let j = 0; j < N; j++) {
                                if (rows[j].dc && !newPlacements[j].playerId) {
                                        newPlacements[j] = newPlacements[j].withPlacement(newPlacements[j].placement, true);
                                }
                        }

                        // Sostituisci la race
                        this.#races[rIdx] = oldRace.withPlacements(newPlacements);
                }
                console.log(`[mogi] rematchAllRaces: ${this.#races.length} race rianalizzate col nuovo roster.`);
                this.triggerUpdate();
        }

        /** @type {BroadcastChannel|null} */
        #overlayChannel = null;

        /**
         * Inizializza il canale BroadcastChannel per inviare notifiche
         * cross-tab all'OBS overlay quando lo stato cambia.
         */
        #initOverlayChannel() {
                if (this.#overlayChannel) return;
                try {
                        this.#overlayChannel = new BroadcastChannel('mkw-obs-overlay');
                } catch (e) {
                        // BroadcastChannel non supportato: fallback a localStorage
                        this.#overlayChannel = null;
                }
        }

        /**
         * Salva lo stato corrente (teams + punteggi totali) in localStorage
         * sotto la chiave 'mkw-obs-overlay-state'. L'OBS overlay legge questo
         * stato e si aggiorna in tempo reale.
         */
        #saveOverlayState() {
                try {
                        const totals = this.calculatePlayerScores();
                        /** @type {Map<number, number>} */
                        const totalsPerTeam = new Map();
                        totals.forEach((score, playerId) => {
                                const player = [...this.roster].find(p => p.id === playerId);
                                if (!player) return;
                                totalsPerTeam.set(player.seed, (totalsPerTeam.get(player.seed) || 0) + score);
                        });

                        // Per FFA, raggruppa per seed (= posizione nel roster) — ma in FFA
                        // ogni player è un "team" di 1, quindi mostriamo i top 6 player.
                        if (this.playersPerTeam === 1) {
                                const players = [...this.roster].map(p => ({
                                        id: p.id,
                                        name: p.activePlayer.name,
                                        score: totals.get(p.id) || 0,
                                        seed: p.seed,
                                })).sort((a, b) => b.score - a.score);
                                const state = {
                                        playersPerTeam: 1,
                                        raceCount: this.size,
                                        teams: players.slice(0, 6).map((p, idx) => ({
                                                tag: p.name,
                                                score: p.score,
                                                rank: idx + 1,
                                                color: '#5b8cff',
                                                playerCount: 1,
                                        })),
                                };
                                localStorage.setItem('mkw-obs-overlay-state', JSON.stringify(state));
                                return;
                        }

                        // Team mode
                        const teams = this.teams.map(t => {
                                const score = totalsPerTeam.get(t.seed) || 0;
                                return {
                                        tag: t.tag || String.fromCharCode(64 + t.seed),
                                        score,
                                        color: t.colour || '#5b8cff',
                                        seed: t.seed,
                                };
                        });
                        // Calcola il rank
                        teams.sort((a, b) => b.score - a.score);
                        teams.forEach((t, idx) => { t.rank = idx + 1; });

                        const state = {
                                playersPerTeam: this.playersPerTeam,
                                raceCount: this.size,
                                teams,
                        };
                        localStorage.setItem('mkw-obs-overlay-state', JSON.stringify(state));
                        // Notifica anche via BroadcastChannel per update cross-tab
                        // anche quando la pagina principale è in background.
                        this.#initOverlayChannel();
                        if (this.#overlayChannel) {
                                this.#overlayChannel.postMessage({ type: 'state-update' });
                        }
                } catch (e) {
                        console.warn('[mogi] Impossibile salvare lo stato OBS overlay:', e);
                }
        }

        /**
         * @param {Race} race
         */
        addRace(race) {
                if( this.ended) throw new Error('Too many races');
                this.#races.push(race);
                this.triggerUpdate();
                success(t('capture.raceSaved', { number: this.#races.length }));
        }

        /**
         * @param {number} idx
         * @param {Placement[]} placements
         */
        updateRace(idx, placements) {
                const oldRace = this.#races.at(idx);
                if( !oldRace) throw new Error('Race not found');
                const newRace = oldRace.withPlacements(placements);
                this.#races.splice(idx, 1, newRace);
                this.triggerUpdate();
                success(t('editRace.raceUpdated', { number: idx+1 }));
        }

        /**
         * @param {number} idx
         */
        deleteRace(idx) {
                const race = this.#races.at(idx);
                if( !race) throw new Error('Race not found');
                this.#races.splice(idx, 1);
                this.triggerUpdate();
                info(t('editRace.raceDeleted', { number: idx+1 }));
        }

        /**
         * @returns {Map<string,number>} Player ID => Score
         */
        calculatePlayerScores() {
                const scores = new Map();
                for (const race of this.#races) {
                        const playerScores = race.calculatePlayerScores();
                        for (const [playerId, score] of playerScores) {
                                const oldScore = scores.get(playerId) ?? 0;
                                scores.set(playerId, oldScore + score);
                        }
                }
                return scores;
        }

        export() {
                return {
                        meta: {
                                createdAt: this.startDate.toISOString(),
                                playersPerTeam: this.playersPerTeam,
                                tier: this.roster.tier,
                                formatVersion: 5
                        },
                        roster: [...this.roster].map(p => ({
                                id: p.id,
                                name: p.name,
                                seed: p.seed,
                                mmr: p.mmr,
                                ign: p.ign,
                                substitutes: p.substitutes.map(s => ({
                                        id: s.id,
                                        name: s.name,
                                        ign: s.ign,
                                        joinedAt: s.joinedAt
                                })),
                                team: p.team?.index
                        })),
                        teams: this.#teams.map(t => ({
                                index: t.index,
                                seed: t.seed,
                                tag: t.tag,
                                colour: t.colour,
                                icon: t.icon,
                                players: t.players.map(p=>p.id)
                        })),
                        races: this.races.map(r => ({
                                completedAt: new Date(r.timestamp).toISOString(),
                                placements: r.placements.map(x => ({
                                        placement: x.placement,
                                        playerId: x.playerId,
                                        resolvedName: x.resolvedName,
                                        ocrText: x.ocrText,
                                        ocrConfidence: x.ocrConfidence,
                                        dc: x.dc,
                                        score: x.score
                                }))
                        }))
                };
        }
}
