/**
 * no-capture-card.js
 *
 * Pagina alternativa per tenere conto dei punteggi senza capture card.
 * L'utente incolla il roster, poi per ogni gara clicca "Save scores" e
 * seleziona i player posizione per posizione (1st, 2nd, ..., 12th).
 * Gli ultimi due posti (11th, 12th) possono essere marcati come "DC"
 * (disconnesso).
 *
 * Riutilizza i moduli esistenti (Mogi, Roster, scoreboard, export) per
 * massima coerenza con la modalità principale.
 */

import { initI18n } from "./src/i18n/i18n.js";
import { t, fmt } from "./src/i18n/i18n.js";
import { Mogi } from "./src/mogi.js";
import { RACE_COUNT } from "./src/mogi.js";
import { Placement, Race } from "./src/race.js";
import { requestRoster } from "./src/ui/set-roster-dialog.js";
import { setupLocaleSwitcher } from "./src/ui/locale-switcher.js";
import { initTheme, setupThemeSwitcher } from "./src/ui/theme-switcher.js";
import { connectExportButton } from "./src/ui/export-results-dialog.js";
import { openEditRoster } from "./src/ui/edit-roster-dialog.js";
import { openEditRace } from "./src/ui/edit-race-dialog.js";
import { success, info, warning } from "./src/ui/toast.js";
import { toLetter, ctx2d } from "./src/util.js";

async function main() {
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        initTheme();
        const localeSelect = document.getElementById('locale');
        const themeSelect = document.getElementById('theme');

        setupLocaleSwitcher(localeSelect);
        setupThemeSwitcher(themeSelect);
        initI18n();

        const startButton = document.getElementById('start');
        const scoreTable = document.getElementById('scoreTable');
        const exportBtn = document.getElementById('exportScores');
        const downloadBtn = document.getElementById('downloadMogi');
        const wizardMount = document.getElementById('wizardMount');

        const roster = await requestRoster(startButton);

        step1.style.display = 'none';
        step2.style.display = 'block';

        const mogi = new Mogi(roster);

        // Setup scoreboard rendering (custom version with "Save scores" button
        // instead of edit pencil). Lo scriviamo qui per non toccare il file
        // scoreboard.js condiviso con la pagina principale.
        setupScoreboardNoCapture(scoreTable, mogi, wizardMount);

        // Export buttons (stesso modulo della pagina principale)
        connectExportButton(exportBtn, downloadBtn, mogi);

        console.log('[no-capture-card] Pronto. Mogi inizializzato con', mogi.roster.size, 'player.');
}

/**
 * Scoreboard personalizzata per la modalità "no capture card".
 * È una versione semplificata di connectScoreboard in src/ui/scoreboard.js:
 * - Stessa struttura della tabella (colonne posizione, team, player, race, total, gap)
 * - Stile identico
 * - MA: il footer ha un pulsante "Save scores" per ogni colonna race,
 *   che apre il wizard di selezione posizioni invece di un dialog di edit
 *
 * @param {HTMLTableElement} scoreTable
 * @param {Mogi} mogi
 * @param {HTMLElement} wizardMount dove montare il dialog del wizard
 */
function setupScoreboardNoCapture(scoreTable, mogi, wizardMount) {
        function render() {
                const roster = [...mogi.roster];
                const totals = mogi.calculatePlayerScores();
                /** @type {Map<number, number>} */
                const totalsPerTeam = new Map();
                totals.forEach((score, playerId) => {
                        const teamId = roster.find(p => p.id === playerId)?.seed || 0;
                        totalsPerTeam.set(teamId, (totalsPerTeam.get(teamId) || 0) + score);
                });
                roster.sort((p1, p2) => (totalsPerTeam.get(p2.seed)||0) - (totalsPerTeam.get(p1.seed)||0)
                        || p1.seed - p2.seed
                        || (totals.get(p2.id)||0) - (totals.get(p1.id)||0)
                        || p1.id.localeCompare(p2.id)
                );

                const races = mogi.races;
                let totalScore = 0;

                // === <thead> ===
                const thead = document.createElement('thead');
                const hr = document.createElement('tr');
                if (mogi.playersPerTeam > 1) {
                        const hTeam = document.createElement('th'); hTeam.textContent = t('scoreboard.team'); hr.appendChild(hTeam);
                }
                const hPos = document.createElement('th'); hPos.textContent = '#'; hPos.classList.add('pos-col'); hr.appendChild(hPos);
                const hPlayer = document.createElement('th'); hPlayer.textContent = t('scoreboard.player'); hr.appendChild(hPlayer);
                for (let i = 0; i < RACE_COUNT; i++) {
                        const th = document.createElement('th'); th.textContent = t('scoreboard.raceNumber', { number: i + 1 }); hr.appendChild(th);
                }
                const hTot = document.createElement('th'); hTot.textContent = t('scoreboard.total'); hr.appendChild(hTot);
                if (mogi.playersPerTeam > 1) {
                        hTot.colSpan = 2;
                } else {
                        const hGap = document.createElement('th'); hGap.textContent = t('scoreboard.gap'); hGap.classList.add('gap-col'); hGap.title = t('scoreboard.gapTitle'); hr.appendChild(hGap);
                }
                thead.appendChild(hr);

                // === <tbody> ===
                const tbody = document.createElement('tbody');
                tbody.classList.toggle('team-mode', mogi.playersPerTeam > 1);
                let team = null;
                /** @type {number[]} */
                const orderedFFAScores = mogi.playersPerTeam === 1 ? roster.map(p => totals.get(p.id) || 0) : [];

                for (const p of roster) {
                        const tr = document.createElement('tr');
                        const teamScore = totalsPerTeam.get(p.seed) || 0;
                        const playerScore = totals.get(p.id) || 0;
                        const teamRank = teamScore > 0 ? Array.from(totalsPerTeam.values()).filter(x => x > teamScore).length + 1 : 0;
                        const playerRank = playerScore > 0 ? Array.from(totals.values()).filter(x => x > playerScore).length + 1 : 0;

                        if (mogi.playersPerTeam > 1 && team !== null && team !== p.seed) {
                                const prevScore = totalsPerTeam.get(team) || 0;
                                const nextScore = totalsPerTeam.get(p.seed) || 0;
                                const diff = prevScore - nextScore;
                                const dividerRow = document.createElement('tr');
                                dividerRow.className = 'team-diff-row';
                                const tdSpacer = document.createElement('td');
                                tdSpacer.colSpan = RACE_COUNT + 4;
                                const tdDiff = document.createElement('td');
                                tdDiff.textContent = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : `=`;
                                tdDiff.className = diff > 0 ? 'team-diff team-diff--ahead' : diff < 0 ? 'team-diff team-diff--behind' : 'team-diff team-diff--tied';
                                dividerRow.append(tdSpacer, tdDiff);
                                tbody.appendChild(dividerRow);
                        }

                        if (mogi.playersPerTeam > 1 && team !== p.seed) {
                                const teamData = mogi.teamBySeed(p.seed);
                                const tdTeam = document.createElement('td');
                                tdTeam.rowSpan = mogi.playersPerTeam;
                                const icon = document.createElement('span');
                                icon.textContent = teamData?.icon || '👥';
                                icon.classList.add('team-icon');
                                tdTeam.append(icon, document.createElement('br'), `${teamData?.tag || toLetter(p.seed)}`);
                                tr.appendChild(tdTeam);
                                tdTeam.style.background = `${teamData?.colour || '#000000'}20`;
                        }

                        const tdPos = document.createElement('td');
                        tdPos.classList.add('pos-col', `rank-${playerRank}`);
                        tdPos.textContent = playerRank > 0 ? String(playerRank) : '';
                        tr.appendChild(tdPos);

                        const tdName = document.createElement('td');
                        tdName.textContent = p.activePlayer.name;
                        tdName.classList.add('player', `rank-${playerRank}`);
                        tr.appendChild(tdName);

                        for (const r of mogi.races) {
                                const td = document.createElement('td');
                                const row = r.placements.find(x => x.playerId === p.id);
                                const placement = row && !row.dc ? row.placement : null;
                                td.classList.add('place', `place-${placement ?? 0}`, `rank-${playerRank}`);
                                td.textContent = placement ? fmt.place(placement) : (row && row.dc ? t('noCapture.dc') : t('blank'));
                                tr.appendChild(td);
                        }
                        for (let i = races.length; i < RACE_COUNT; i++) {
                                const td = document.createElement('td');
                                td.classList.add('muted', `rank-${playerRank}`);
                                td.textContent = t('blank');
                                tr.appendChild(td);
                        }

                        const tdTotal = document.createElement('td');
                        tdTotal.classList.add(`rank-${playerRank}`);
                        tdTotal.textContent = String(playerScore).padStart(3, '\u2007');
                        tr.appendChild(tdTotal);

                        if (mogi.playersPerTeam === 1) {
                                const tdGap = document.createElement('td');
                                tdGap.classList.add('gap-col');
                                const playerIdx = roster.indexOf(p);
                                const nextScore = (playerIdx >= 0 && playerIdx + 1 < orderedFFAScores.length) ? orderedFFAScores[playerIdx + 1] : null;
                                if (nextScore !== null && playerScore > 0 && nextScore > 0) {
                                        const gap = playerScore - nextScore;
                                        if (gap > 0) { tdGap.textContent = `+${gap}`; tdGap.classList.add('team-diff--ahead'); }
                                        else if (gap < 0) { tdGap.textContent = `${gap}`; tdGap.classList.add('team-diff--behind'); }
                                        else { tdGap.textContent = `=`; tdGap.classList.add('team-diff--tied'); }
                                } else {
                                        tdGap.textContent = '—'; tdGap.classList.add('muted');
                                }
                                tr.appendChild(tdGap);
                        }

                        if (mogi.playersPerTeam > 1 && team !== p.seed) {
                                team = p.seed;
                                const tdTeam = document.createElement('td');
                                tdTeam.classList.add(`rank-${teamRank}`);
                                tdTeam.rowSpan = mogi.playersPerTeam;
                                tdTeam.textContent = String(teamScore).padStart(3, '\u2007');
                                tr.appendChild(tdTeam);
                        }

                        tbody.appendChild(tr);
                        totalScore += playerScore;
                }

                // === <tfoot> con pulsanti "Save scores" ===
                const tfoot = document.createElement('tfoot');
                const fr = document.createElement('tr');
                const rosterButton = document.createElement('button');
                rosterButton.textContent = t('scoreboard.editRosterButton');
                rosterButton.addEventListener('click', () => {
                        // In modalità no-capture, non c'è il video per l'autofill.
                        // Passiamo un oggetto fittizio che fa fallire capturePauseScreen
                        // gracefully (verrà mostrato l'errore "noPauseScreenDetected").
                        // L'utente può comunque modificare i tag e assegnare i nomi
                        // manualmente tramite la dropdown OCR (vuota in questa modalità).
                        const fakeVideo = /** @type {HTMLVideoElement} */ (/** @type {unknown} */ ({ videoWidth: 0, videoHeight: 0 }));
                        openEditRoster(mogi, fakeVideo);
                });
                const fEditRoster = document.createElement('td');
                fEditRoster.append(rosterButton);
                if (mogi.playersPerTeam > 1) fEditRoster.colSpan = 3; else fEditRoster.colSpan = 2;
                fr.appendChild(fEditRoster);

                for (let i = 0; i < RACE_COUNT; i++) {
                        const td = document.createElement('td');
                        const btn = document.createElement('button');
                        btn.textContent = t('noCapture.saveScoresButton');
                        btn.classList.add('btn--primary');
                        btn.style.fontSize = '11px';
                        btn.style.padding = '4px 6px';
                        btn.addEventListener('click', () => {
                                openSaveScoresWizard(mogi, i, wizardMount, () => render());
                        });
                        td.appendChild(btn);
                        fr.appendChild(td);
                }
                const fTotal = document.createElement('td');
                fTotal.append(`${totalScore}`, document.createElement('br'), `/ ${mogi.maxScore}`);
                if (mogi.playersPerTeam > 1) {
                        fTotal.colSpan = 2;
                        fr.appendChild(fTotal);
                } else {
                        fTotal.colSpan = 1;
                        fr.appendChild(fTotal);
                        const fGap = document.createElement('td');
                        fGap.classList.add('gap-col');
                        fr.appendChild(fGap);
                }
                tfoot.appendChild(fr);

                scoreTable.replaceChildren(thead, tbody, tfoot);
        }

        mogi.addEventListener('update', render);
        // Iniziale
        render();
}

/**
 * Apre il wizard di selezione posizioni per una race.
 *
 * Funzionamento:
 * - Mostra in alto "Select Nth place player" (con N crescente da 1 a 12)
 * - Sotto, una griglia con tutti i player NON ancora selezionati
 * - Per le posizioni 11 e 12, mostra anche un pulsante "DC" (disconnesso)
 * - L'utente clicca su un player → viene assegnato a quella posizione
 * - Quando tutte le 12 posizioni sono assegnate, salva la race nel mogi
 *
 * @param {Mogi} mogi
 * @param {number} raceIdx indice della race (0-based)
 * @param {HTMLElement} mount dove montare il dialog
 * @param {() => void} onComplete callback chiamato dopo il salvataggio
 */
function openSaveScoresWizard(mogi, raceIdx, mount, onComplete) {
        if (mogi.ended) {
                warning(t('capture.maxRacesReached'));
                return;
        }

        // Se la race esiste già, chiedi conferma di sovrascrittura
        const existingRace = mogi.races[raceIdx];
        if (existingRace) {
                if (!confirm(t('noCapture.confirmOverwrite', { number: raceIdx + 1 }))) {
                        return;
                }
        }

        /** @type {(Placement|null)[]} posizioni [0..11], null = non ancora assegnato */
        const positions = new Array(12).fill(null);
        /** @type {Set<string>} playerId già assegnati */
        const assignedIds = new Set();
        let currentPos = 1; // 1-based

        // Crea il dialog
        const dialog = document.createElement('dialog');
        dialog.classList.add('wizard-dialog');
        mount.appendChild(dialog);

        const form = document.createElement('form');
        form.method = 'dialog';
        form.classList.add('modal');
        form.style.minWidth = '720px';
        form.style.maxWidth = '90vw';

        const title = document.createElement('h3');
        title.textContent = t('noCapture.wizardTitle', { number: raceIdx + 1 });
        form.appendChild(title);

        const prompt = document.createElement('div');
        prompt.style.fontSize = '16px';
        prompt.style.fontWeight = '600';
        prompt.style.marginBottom = '8px';
        form.appendChild(prompt);

        const progress = document.createElement('div');
        progress.style.fontSize = '12px';
        progress.style.color = '#9aa0a6';
        progress.style.marginBottom = '12px';
        form.appendChild(progress);

        // Lista posizioni già assegnate (per visualizzazione)
        const assignedList = document.createElement('div');
        assignedList.style.fontSize = '12px';
        assignedList.style.color = '#9aa0a6';
        assignedList.style.marginBottom = '12px';
        assignedList.style.maxHeight = '120px';
        assignedList.style.overflowY = 'auto';
        form.appendChild(assignedList);

        // Griglia player
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(160px, 1fr))';
        grid.style.gap = '8px';
        grid.style.marginBottom = '12px';
        form.appendChild(grid);

        // Footer con pulsanti
        const footer = document.createElement('footer');
        footer.style.display = 'flex';
        footer.style.justifyContent = 'space-between';
        footer.style.gap = '8px';
        footer.style.marginTop = '12px';

        const leftButtons = document.createElement('div');
        leftButtons.style.display = 'flex';
        leftButtons.style.gap = '8px';

        const undoBtn = document.createElement('button');
        undoBtn.type = 'button';
        undoBtn.textContent = t('noCapture.undoButton');
        undoBtn.disabled = true;
        leftButtons.appendChild(undoBtn);

        const dcBtn = document.createElement('button');
        dcBtn.type = 'button';
        dcBtn.textContent = t('noCapture.dcButton');
        dcBtn.classList.add('btn--danger');
        dcBtn.style.display = 'none'; // solo per pos 11 e 12
        leftButtons.appendChild(dcBtn);

        footer.appendChild(leftButtons);

        const rightButtons = document.createElement('div');
        rightButtons.style.display = 'flex';
        rightButtons.style.gap = '8px';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = t('cancel');
        rightButtons.appendChild(cancelBtn);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = t('save');
        saveBtn.classList.add('btn--primary');
        saveBtn.disabled = true;
        rightButtons.appendChild(saveBtn);

        footer.appendChild(rightButtons);
        form.appendChild(footer);

        dialog.appendChild(form);

        // === Funzioni di aggiornamento UI ===

        function updatePrompt() {
                if (currentPos > 12) {
                        prompt.textContent = t('noCapture.allAssigned');
                        prompt.style.color = '#4ade80';
                } else {
                        prompt.textContent = t('noCapture.selectPlace', { place: currentPos });
                        prompt.style.color = '';
                }
                progress.textContent = t('noCapture.progress', { done: positions.filter(p => p).length, total: 12 });

                // DC visibile solo per pos 11 e 12
                const isLastTwo = currentPos === 11 || currentPos === 12;
                dcBtn.style.display = isLastTwo ? '' : 'none';
                dcBtn.disabled = currentPos > 12;

                // Undo abilitato se c'è qualcosa da annullare
                undoBtn.disabled = currentPos <= 1 && !positions[0];

                // Save abilitato solo quando tutte le 12 posizioni sono assegnate
                saveBtn.disabled = positions.some(p => p === null);
        }

        function updateAssignedList() {
                assignedList.innerHTML = '';
                positions.forEach((p, idx) => {
                        if (!p) return;
                        const row = document.createElement('div');
                        const place = idx + 1;
                        const player = mogi.roster.byId(p.playerId || '');
                        const name = player ? player.activePlayer.name : '?';
                        if (p.dc) {
                                row.textContent = `${place}. ${name} — DC`;
                                row.style.color = '#f87171';
                        } else {
                                row.textContent = `${place}. ${name}`;
                        }
                        assignedList.appendChild(row);
                });
        }

        function updateGrid() {
                grid.innerHTML = '';
                const rosterArr = [...mogi.roster];
                // Ordina per team seed poi per nome
                rosterArr.sort((a, b) => a.seed - b.seed || a.activePlayer.name.localeCompare(b.activePlayer.name));

                for (const player of rosterArr) {
                        const isAssigned = assignedIds.has(player.id);
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.style.textAlign = 'left';
                        btn.style.padding = '8px 10px';
                        btn.style.cursor = isAssigned ? 'not-allowed' : 'pointer';
                        btn.style.opacity = isAssigned ? '0.4' : '1';

                        const teamData = mogi.playersPerTeam > 1 ? mogi.teamBySeed(player.seed) : null;
                        const tag = teamData?.tag || '';
                        const playerName = player.activePlayer.name;
                        btn.textContent = tag ? `[${tag}] ${playerName}` : playerName;

                        if (isAssigned) {
                                btn.disabled = true;
                                // Mostra in che posizione è stato messo
                                const pos = positions.findIndex(p => p && p.playerId === player.id);
                                if (pos >= 0) {
                                        const place = pos + 1;
                                        btn.textContent += ` → ${place}${place === 11 || place === 12 && positions[pos]?.dc ? ' DC' : ''}`;
                                }
                        } else {
                                btn.addEventListener('click', () => assignPlayer(player.id, false));
                        }

                        // Colora il bordo col colore del team
                        if (teamData?.colour) {
                                btn.style.borderLeft = `4px solid ${teamData.colour}`;
                        }

                        grid.appendChild(btn);
                }
        }

        /**
         * Assegna un player alla posizione corrente.
         * @param {string} playerId
         * @param {boolean} dc
         */
        function assignPlayer(playerId, dc) {
                if (currentPos > 12) return;
                if (assignedIds.has(playerId)) return;

                const player = mogi.roster.byId(playerId);
                if (!player) return;

                const placement = new Placement(
                        currentPos,
                        playerId,
                        player.activePlayer.name,
                        player.activePlayer.name,
                        100, // confidence fittizia
                        dc
                );
                positions[currentPos - 1] = placement;
                assignedIds.add(playerId);
                currentPos++;

                updatePrompt();
                updateAssignedList();
                updateGrid();
        }

        /**
         * Annulla l'ultima assegnazione.
         */
        function undo() {
                if (currentPos <= 1) return;
                currentPos--;
                const p = positions[currentPos - 1];
                if (p) {
                        assignedIds.delete(p.playerId || '');
                        positions[currentPos - 1] = null;
                }
                updatePrompt();
                updateAssignedList();
                updateGrid();
        }

        /**
         * Marca DC l'ultimo posto (11 o 12). Trova un player non ancora
         * assegnato e lo marca come DC.
         */
        function markDC() {
                if (currentPos > 12) return;
                if (currentPos !== 11 && currentPos !== 12) return;

                // Trova primo player non assegnato
                const rosterArr = [...mogi.roster];
                const unassigned = rosterArr.find(p => !assignedIds.has(p.id));
                if (!unassigned) {
                        warning(t('noCapture.noMorePlayers'));
                        return;
                }
                assignPlayer(unassigned.id, true);
        }

        /**
         * Salva la race nel mogi.
         */
        function save() {
                if (positions.some(p => p === null)) {
                        warning(t('noCapture.notAllAssigned'));
                        return;
                }
                const placements = positions.filter((p) => p !== null);
                const newRace = new Race(Date.now(), placements, '');
                if (mogi.races[raceIdx]) {
                        // Sostituisci race esistente
                        mogi.updateRace(raceIdx, placements);
                } else {
                        // Aggiungi nuova race (deve essere in ordine: se ci sono race
                        // successive già salvate non dovrebbe succedere, ma gestiamo)
                        mogi.addRace(newRace);
                }
                success(t('capture.raceSaved', { number: raceIdx + 1 }));
                dialog.close();
                onComplete();
        }

        // === Listeners ===
        undoBtn.addEventListener('click', undo);
        dcBtn.addEventListener('click', markDC);
        cancelBtn.addEventListener('click', () => dialog.close());
        saveBtn.addEventListener('click', save);

        dialog.addEventListener('close', () => {
                dialog.remove();
        });

        // === Init UI ===
        updatePrompt();
        updateAssignedList();
        updateGrid();

        dialog.showModal();
}

main();
