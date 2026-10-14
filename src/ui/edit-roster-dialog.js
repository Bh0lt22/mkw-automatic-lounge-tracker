/**
 * @typedef {import("../mogi.js").Mogi} Mogi
 * @typedef {import("../player.js").Player} Player
 * @typedef {import("../team.js").Team} Team
 */

import { capturePauseScreen } from "../capture.js";
import { t } from "../i18n/i18n.js";
import { TEAM_COLOURS } from "../team.js";
import { openSubstitutePlayer } from "./substitute-player-dialog.js";
import { success } from "./toast.js";

/**
 * Levenshtein distance standard. Usato per il matching intelligente
 * dentro un team: combina il filtro per tag (l'OCR deve iniziare col
 * tag del team) con la distanza tra nome OCR e nome/IGN del player,
 * per trovare l'abbinamento ottimo (es. "B" → player "B",
 * "Bholt" → player "Bholt", invece di incrociarli a caso).
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
        if (a === b) return 0;
        if (!a) return b.length;
        if (!b) return a.length;
        const m = a.length, n = b.length;
        let v0 = new Array(n + 1);
        let v1 = new Array(n + 1);
        for (let j = 0; j <= n; j++) v0[j] = j;
        for (let i = 0; i < m; i++) {
                v1[0] = i + 1;
                const ca = a.charCodeAt(i);
                for (let j = 0; j < n; j++) {
                        const cost = ca === b.charCodeAt(j) ? 0 : 1;
                        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
                }
                [v0, v1] = [v1, v0];
        }
        return v0[n];
}

function makeDialog() {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
                <form method="dialog" class="modal">
                        <h3>${t('editRoster.title')}</h3>
                        <div class="editroster-container"></div>
                        <footer>
                                <button value="resetnames" type="button">${t('editRoster.resetNames')}</button>
                                <button value="autofill" type="button">${t('editRoster.autofill')}</button>
                                <button value="cancel" type="button">${t('cancel')}</button>
                                <button value="save" type="button" class="btn--primary">${t('save')}</button>
                        </footer>
                </form>
        `;
        const container = /** @type {HTMLDivElement} */(dialog.querySelector('div.editroster-container'));
        const save = /** @type {HTMLButtonElement} */(dialog.querySelector('button[value=save]'));
        const cancel = /** @type {HTMLButtonElement} */(dialog.querySelector('button[value=cancel]'));
        const autofill = /** @type {HTMLButtonElement} */(dialog.querySelector('button[value=autofill]'));
        const resetnames = /** @type {HTMLButtonElement} */(dialog.querySelector('button[value=resetnames]'));
        document.body.append(dialog);
        dialog.addEventListener('close', () => dialog.remove());
        return { dialog, container, save, cancel, autofill, resetnames };
}

/**
 * @param {HTMLElement} container
 */
function createGridHost(container) {
        const grid = document.createElement('div');
        grid.classList.add('grid');
        // 4 colonne: Lounge name | In-game name (input) | OCR dropdown | Substitute.
        // La dropdown OCR mostra i nomi rilevati dal game non ancora assegnati,
        // così l'utente può selezionarli manualmente se l'autofill non ha abbinato tutto.
        grid.style.gridTemplateColumns = '1fr 1fr 160px 160px';
        container.append(grid);
        return grid;
}

/**
 * @param {HTMLElement} grid
 * @param {Team} team
 */
function createTeamRow(grid, team) {
        const name = document.createElement('b');
        name.textContent = t('editRoster.team', { id: team.seed });
        const tag = document.createElement('input');
        tag.name = 'tag';
        tag.autocomplete = "off";
        tag.dataset.teamId = String(team.seed);
        tag.placeholder = t('editRoster.tag');
        tag.value = team.tag;
        // La select per cambiare colore/emoji del team e' stata rimossa:
        // le icone dei team ora sono immagini PNG assegnate automaticamente
        // in base alla posizione in classifica (vedi img/team-icons/).
        // Nella 3a colonna (OCR) c'è la dropdown con le INIZIALI rilevate
        // automaticamente dall'autofill: selezionandone una, il tag del team
        // si compila da solo senza riscriverlo a mano. La 4a colonna resta
        // uno spacer per mantenere l'allineamento con le righe player.
        const tagInitials = document.createElement('select');
        tagInitials.name = 'tagInitials';
        tagInitials.dataset.teamId = String(team.seed);
        tagInitials.classList.add('ocr-dropdown');
        tagInitials.add(new Option('A-Z', ''));
        const spacer2 = document.createElement('span');
        grid.append(name, tag, tagInitials, spacer2);
}

/**
 * @param {HTMLElement} grid
 */
function createHeaderRow(grid) {
        const name = document.createElement('b');
        name.textContent = t('editRoster.loungeName');
        const ingame = document.createElement('b');
        ingame.textContent = t('editRoster.ingameName');
        const ocr = document.createElement('b');
        ocr.textContent = 'OCR';
        ocr.title = 'Nomi OCR rilevati dal game ma non abbinati automaticamente. Selezionane uno per assegnarlo a questo player.';
        const sub = document.createElement('b');
        sub.textContent = t('editRoster.substitute');
        grid.append(name, ingame, ocr, sub);
}

/**
 * @param {HTMLElement} grid
 * @param {Player} player
 */
function createPlayerRow(grid, player) {
        const name = document.createElement('div');
        name.textContent = player.name;

        const input = document.createElement('input');
        input.name = 'ign';
        input.autocomplete = "off";
        input.dataset.playerId = player.id;
        input.placeholder = t('editRoster.autodetect');
        input.value = player.rawIgn;

        // Dropdown OCR: mostra i nomi OCR non assegnati nella cache del mogi.
        // L'utente può selezionarne uno per assegnarlo a questo player.
        // I nomi già usati da altri player (presenti nel loro input) vengono
        // sbarrati in rosso e disabilitati.
        const ocrSelect = document.createElement('select');
        ocrSelect.name = 'ocrAssign';
        ocrSelect.dataset.playerId = player.id;
        ocrSelect.classList.add('ocr-dropdown');
        const placeholderOpt = new Option('— OCR —', '');
        ocrSelect.add(placeholderOpt);

        const subcontainer = document.createElement('div');
        const sub = player.substitutes.at(-1);
        const subname = document.createElement('span');
        if (sub) subname.textContent = sub.name;
        else {
                subname.textContent = t('editRoster.noSubstitute');
                subname.classList.add('muted');
        }
        const subbutton = document.createElement('button');
        subbutton.dataset.subPlayerId = player.id;
        subbutton.textContent = t('editRoster.editSubButton');
        subcontainer.append(subname, ' ', subbutton);

        grid.append(name, input, ocrSelect, subcontainer);
}

/**
 * Popola tutte le dropdown OCR della grid con i nomi OCR non assegnati
 * presenti nella cache del mogi. Le option già usate da qualsiasi player
 * (presenti nel loro input IGN, INCLUSO il player corrente) vengono
 * sbarrate in rosso e disabilitate.
 *
 * @param {HTMLElement} container Il container della edit-roster dialog
 * @param {import("../mogi.js").Mogi} mogi
 */
function refreshOCRDropdowns(container, mogi) {
        /** @type {HTMLSelectElement[]} */
        const dropdowns = [...container.querySelectorAll('select[name=ocrAssign]')];
        /** @type {HTMLInputElement[]} */
        const inputs = [...container.querySelectorAll('input[name=ign]')];

        // Set dei nomi già assegnati (presenti in QUALSIASI input, trimmati, non vuoti).
        // Includiamo anche il player corrente: se il suo input ha un valore,
        // quel valore è considerato "usato" e appare rosso nella sua stessa dropdown.
        // Per riassegnarlo, l'utente deve prima cancellare il valore dall'input.
        const usedNames = new Set(
                inputs.map(i => i.value.trim()).filter(v => v)
        );

        const ocrNames = mogi.unassignedOCRNames;

        for (const sel of dropdowns) {
                const playerId = sel.dataset.playerId;
                const currentInput = inputs.find(i => i.dataset.playerId === playerId);
                const currentValue = currentInput?.value.trim() || '';

                // Salva la selezione corrente
                const prevValue = sel.value;

                // Ricrea le option
                sel.innerHTML = '';
                const placeholderOpt = new Option('— OCR —', '');
                sel.add(placeholderOpt);

                for (const name of ocrNames) {
                        // Un nome è "usato" se compare in qualsiasi input IGN (incluso questo player)
                        const isUsed = usedNames.has(name);
                        const opt = new Option(name, name);
                        if (isUsed) {
                                opt.disabled = true;
                                opt.classList.add('ocr-option-used');
                                // Testo pulito, senza "(usato)": il rosso e lo sbarrato bastano
                                opt.textContent = name;
                        }
                        sel.add(opt);
                }

                // Ripristina la selezione se ancora valida (l'option non è disabled)
                if (prevValue && [...sel.options].some(o => o.value === prevValue && !o.disabled)) {
                        sel.value = prevValue;
                } else {
                        sel.value = '';
                }
        }
}

/**
 * Popola tutte le dropdown INIZIALI delle righe team con le iniziali
 * rilevate automaticamente dall'autofill e salvate nel mogi.
 * Chiamata all'apertura del dialog e dopo ogni autofill (che può
 * aggiungere nuove iniziali).
 *
 * @param {HTMLElement} container Il container della edit-roster dialog
 * @param {import("../mogi.js").Mogi} mogi
 */
function refreshTagInitials(container, mogi) {
        /** @type {HTMLSelectElement[]} */
        const selects = [...container.querySelectorAll('select[name=tagInitials]')];
        if (selects.length === 0) return;
        // Tag già usati in QUALSIASI input tag (incluso il team corrente,
        // come per i player: per riassegnarlo bisogna prima cancellarlo).
        /** @type {HTMLInputElement[]} */
        const tagInputs = [...container.querySelectorAll('input[name=tag]')];
        const usedTags = new Set(tagInputs.map(i => i.value.trim()).filter(v => v));
        const initials = mogi.detectedInitials;
        for (const sel of selects) {
                const prevValue = sel.value;
                sel.innerHTML = '';
                sel.add(new Option('A-Z', ''));
                for (const init of initials) {
                        const opt = new Option(init, init);
                        if (usedTags.has(init)) {
                                opt.disabled = true;
                                opt.classList.add('ocr-option-used');
                        }
                        sel.add(opt);
                }
                if (prevValue && [...sel.options].some(o => o.value === prevValue && !o.disabled)) {
                        sel.value = prevValue;
                } else {
                        sel.value = '';
                }
        }
}

/**
 * @param {Mogi} mogi
 * @param {HTMLVideoElement} video
 */
export function openEditRoster(mogi, video) {
        const { dialog, container, save, cancel, autofill, resetnames } = makeDialog();
        
        if (mogi.playersPerTeam === 1) {
                const grid = createGridHost(container);
                createHeaderRow(grid);
                // Build player rows
                for (const player of mogi.roster) {
                        createPlayerRow(grid, player);
                }
        }
        else {
                // Build team rows
                for (const team of mogi.teams) {
                        const grid = createGridHost(container);
                        createTeamRow(grid, team);
                        createHeaderRow(grid);
                        for (const player of team.players) {
                                createPlayerRow(grid, player);
                        }
                        grid.style.background = `linear-gradient(to bottom, ${TEAM_COLOURS[team.index]}80 16px, ${TEAM_COLOURS[team.index]}40 48px)`;
                }
                // Nota: il listener per il cambio colore/emoji del team e' stato
                // rimosso insieme alla select (le icone ora sono immagini PNG
                // in img/team-icons/, assegnate per posizione in classifica).
        }

        container.addEventListener('click', e => {
                const button = /** @type {HTMLElement} */(e.target).closest("button");
                if (button && button.dataset.subPlayerId) {
                        const p = mogi.roster.byId(button.dataset.subPlayerId);
                        if (p) {
                                dialog.close();
                                openSubstitutePlayer(mogi, p);
                        }
                }
        });

        // Listener per la dropdown OCR: quando l'utente seleziona un nome,
        // lo copia nel campo input IGN corrispondente e aggiorna tutte le
        // dropdown (per sbarrare il nome appena usato).
        // Listener per la dropdown INIZIALI (riga team): copia l'iniziale
        // scelta nel campo tag del team, così il tag si scrive velocemente.
        container.addEventListener('change', e => {
                const sel = /** @type {HTMLElement} */(e.target).closest("select[name=ocrAssign]");
                if (sel instanceof HTMLSelectElement) {
                        const playerId = sel.dataset.playerId;
                        const input = /** @type {HTMLInputElement|null} */ (container.querySelector(`input[name=ign][data-player-id="${playerId}"]`));
                        if (input && sel.value) {
                                input.value = sel.value;
                                refreshOCRDropdowns(container, mogi);
                        } else if (input && !sel.value) {
                                // Selezione vuota: non cambiare l'input (l'utente potrebbe
                                // voler mantenere un valore inserito a mano).
                        }
                        return;
                }
                const tagSel = /** @type {HTMLElement} */(e.target).closest("select[name=tagInitials]");
                if (tagSel instanceof HTMLSelectElement) {
                        const teamId = tagSel.dataset.teamId || '';
                        const tagInput = /** @type {HTMLInputElement|null} */ (container.querySelector(`input[name=tag][data-team-id="${teamId}"]`));
                        if (tagInput && tagSel.value) {
                                tagInput.value = tagSel.value;
                                refreshTagInitials(container, mogi);
                        }
                }
        });

        // Listener per l'input IGN: quando l'utente modifica manualmente un
        // campo, aggiorna le dropdown per riflettere i nomi ora usati.
        // Stessa cosa per i tag scritti a mano: sbarra i tag già usati.
        container.addEventListener('input', e => {
                const inp = /** @type {HTMLElement} */(e.target).closest("input[name=ign]");
                if (inp) {
                        refreshOCRDropdowns(container, mogi);
                        return;
                }
                const tagInp = /** @type {HTMLElement} */(e.target).closest("input[name=tag]");
                if (tagInp) {
                        refreshTagInitials(container, mogi);
                }
        });

        // Popola le dropdown all'apertura del dialog
        refreshOCRDropdowns(container, mogi);
        refreshTagInitials(container, mogi);

        save.addEventListener('click', () => {
                const formFields = [...container.querySelectorAll('input'), ...container.querySelectorAll('select')];

                // Edit roster
                formFields.forEach(input => {
                        const pid = input.dataset.playerId || '';
                        const player = mogi.roster.byId(pid);
                        if( player) {
                                switch( input.name) {
                                        case 'ign': player.rawIgn = input.value; break;
                                }
                        }
                });

                if( mogi.playersPerTeam > 1) {
                        // Edit teams (solo il tag; l'indice team non e' piu'
                        // modificabile dall'utente perche' le icone ora sono
                        // immagini PNG assegnate per posizione in classifica).
                        formFields.forEach(input => {
                                const tid = Number(input.dataset.teamId || 0);
                                const team = mogi.teamBySeed(tid);
                                if( team) {
                                        switch( input.name) {
                                                case 'tag': team.tag = input.value; break;
                                        }
                                }
                        });
                }

                dialog.close();
                success(t('editRoster.rosterUpdated'));

                // Ricalcola l'abbinamento playerId/resolvedName di TUTTE le race
                // salvate usando il nuovo roster. Questo permette di correggere
                // errori precedenti (es. se prima alcuni nomi non erano stati
                // abbinati, o se alcuni erano stati abbinati al player sbagliato
                // perché il roster era incompleto/sbagliato).
                if (mogi.races.length > 0) {
                        console.log('[edit-roster] Ricalcolo abbinamenti per', mogi.races.length, 'race salvate...');
                        mogi.rematchAllRaces();
                        success(t('editRoster.racesRematched', { count: mogi.races.length }));
                } else {
                        mogi.triggerUpdate();
                }
        });

        autofill.addEventListener('click', async () => {
                /** @type {HTMLInputElement[]} */
                const targets = [...container.querySelectorAll('input[name=ign]')];
                const placements = await capturePauseScreen(video, mogi);
                if (!placements) return;

                if (mogi.playersPerTeam === 1) {
                        // FFA: assegna in base al playerId già matchato dal sistema OCR
                        // (Levenshtein), MA evitando duplicati: se lo stesso ocrText
                        // è già stato assegnato a un altro player, salta.
                        // Seed con i valori già presenti negli input: ricliccando
                        // Auto-fill non si duplicano i nomi già assegnati.
                        /** @type {Set<string>} */
                        const ffaUsed = new Set(
                                targets.map(t => (t.value || '').trim().toLowerCase()).filter(v => v)
                        );
                        placements.forEach(p => {
                                const ocrText = (p.ocrText || '').trim();
                                if (!ocrText) return;
                                const lower = ocrText.toLowerCase();
                                if (ffaUsed.has(lower)) {
                                        console.debug(`[autofill] FFA skip: "${ocrText}" già assegnato a un altro player`);
                                        return;
                                }
                                const t = targets.find(t => t.dataset.playerId === p.playerId);
                                if (t && t.value === '') {
                                        t.value = ocrText;
                                        ffaUsed.add(lower);
                                }
                        });
                        refreshOCRDropdowns(container, mogi);
                        refreshTagInitials(container, mogi);
                        return;
                }

                // === TEAM EVENT: logica a 4 livelli, REGOLE FERREE ===
                //
                // REGOLA 1 - MAI FUORI TEAM: nessun livello assegna un nome a un
                //   player se il nome NON inizia col tag del team del player.
                //   I nomi senza tag corrispondente restano vuoti (manuale).
                //
                // REGOLA 2 - MAI DUPLICATI: lo stesso OCR text non va mai a due
                //   player. Se lo stesso testo è letto 2+ volte (doppia lettura
                //   OCR) non viene assegnato a NESSUNO (manuale). I valori già
                //   presenti negli input sono seedati come "usati", così
                //   ricliccare Auto-fill non duplica niente.
                //
                // LIVELLO 1 - TAG + LEVENSHTEIN (combinati, dentro il team):
                //   Per ogni team T con tag configurato:
                //     - Raccoglie tutti gli OCR text che iniziano col tag di T
                //       (es. "Bholt", "B mate" iniziano con "B" se il tag è "B")
                //     - Raccoglie tutti i player liberi di T
                //     - Calcola la distanza Levenshtein tra ogni OCR text e il
                //       nome/IGN di ogni player
                //     - Assegna greedy partendo dalla coppia con distanza minore
                //   Così "B" va al player "B" e "Bholt" va al player "Bholt",
                //   anche se entrambi iniziano con "B" e OCR potrebbe leggerli
                //   in qualsiasi ordine.
                //
                // LIVELLO 2 - LEVENSHTEIN GLOBALE (solo dentro il proprio team):
                //   Usa il playerId già abbinato dal sistema OCR, ma SOLO se
                //   l'OCR inizia col tag del team del player (tag letti dal form,
                //   non quelli salvati che potrebbero essere vecchi).
                //
                // LIVELLO 3 - INIZIALI (solo dentro il team del tag):
                //   Per i nomi ancora non assegnati che iniziano col tag di un
                //   team T: match per iniziali (3 caratteri) SOLO tra i player
                //   liberi di T. Se non inizia con nessun tag → manuale.
                //
                // LIVELLO 4 - MANUALE:
                //   I player rimasti senza assegnazione vengono lasciati vuoti.
                //   L'utente può assegnarli tramite la dropdown OCR.

                // Costruisci mappa team: tag -> array di player (in ordine di seed)
                // Usa i tag dal form (l'utente potrebbe averli modificati senza salvare).
                /** @type {{tag: string, tagOriginal: string, seed: number, players: any[]}[]} */
                const teamsData = [];
                const tagInputs = /** @type {HTMLInputElement[]} */([...container.querySelectorAll('input[name=tag]')]);
                for (const team of mogi.teams) {
                        const tagInput = tagInputs.find(ti => Number(ti.dataset.teamId || 0) === team.seed);
                        const tag = (tagInput?.value || team.tag || '').trim();
                        teamsData.push({
                                tag: tag.toUpperCase(),
                                tagOriginal: tag,
                                seed: team.seed,
                                players: team.players,
                        });
                }

                /** @type {Set<string>} playerId già assegnati (per evitare doppi) */
                const assigned = new Set();
                /** @type {Set<number>} placement index già processati */
                const processed = new Set();
                /**
                 * OCR text già assegnati a qualche player (case-insensitive).
                 * Previene l'errore di assegnare lo stesso IGN a due player
                 * diversi (es. se l'autofill riconosce "Marcosky" due volte
                 * per OCR errori, non lo assegna a due lounge name diversi).
                 */
                const usedOCRTexts = new Set();
                /** @param {string} text */
                const ocrUsed = (text) => usedOCRTexts.has(text.trim().toLowerCase());
                /** @param {string} text */
                const markOCRUsed = (text) => usedOCRTexts.add(text.trim().toLowerCase());

                // SEED: i valori già presenti negli input (da un Auto-fill
                // precedente) contano come assegnati+usati. Così ricliccare
                // Auto-fill non sposta/duplica niente di ciò che c'è già.
                for (const t of targets) {
                        const v = (t.value || '').trim();
                        if (!v) continue;
                        markOCRUsed(v);
                        if (t.dataset.playerId) assigned.add(t.dataset.playerId);
                }

                // DOPPIE LETTURE OCR: se lo stesso testo è stato letto 2+ volte
                // (es. "BIRBO" e "BIRBO"), è ambiguo: NON va a nessuno,
                // l'utente lo mette a mano. Vale per L1/L2/L3.
                /** @type {Map<string, number>} */
                const ocrCounts = new Map();
                placements.forEach(p => {
                        const key = (p.ocrText || '').trim().toLowerCase();
                        if (!key) return;
                        ocrCounts.set(key, (ocrCounts.get(key) ?? 0) + 1);
                });
                /** @param {string} text @param {string} level */
                const skipIfDuplicateRead = (text, level) => {
                        const key = (text || '').trim().toLowerCase();
                        if ((ocrCounts.get(key) ?? 0) > 1) {
                                console.debug(`[autofill] ${level} skip: "${text}" letto 2+ volte, non assegnato a nessuno (manuale).`);
                                return true;
                        }
                        return false;
                };

                /**
                 * Dato un OCR text, restituisce il team il cui tag è il prefisso
                 * più lungo matching (per gestire "AB" vs "ABC"), o null se nessun
                 * tag matcha.
                 * @param {string} ocrStripped OCR uppercased senza bracket
                 * @returns {{tag: string, tagOriginal: string, seed: number, players: any[]} | null}
                 */
                function findTeamByTag(ocrStripped) {
                        const candidates = teamsData
                                .filter(td => td.tag && ocrStripped.startsWith(td.tag))
                                .sort((a, b) => b.tag.length - a.tag.length);
                        return candidates.length > 0 ? candidates[0] : null;
                }

                // --- LIVELLO 1: TAG + LEVENSHTEIN (matching ottimo dentro il team) ---
                let level1Count = 0;
                for (const teamData of teamsData) {
                        if (!teamData.tag) continue;

                        // Raccogli gli OCR text che appartengono a questo team
                        // (iniziano col tag di questo team, e non con tag più lungo di un altro team)
                        /** @type {{idx: number, ocrText: string}[]} */
                        const teamOCR = [];
                        placements.forEach((p, idx) => {
                                if (processed.has(idx)) return;
                                const ocrText = p.ocrText?.trim();
                                if (!ocrText) return;
                                // Salta OCR text già assegnati a un altro player (no duplicati)
                                if (ocrUsed(ocrText)) return;
                                // Salta doppie letture (REGOLA 2: a nessuno, manuale)
                                if (skipIfDuplicateRead(ocrText, 'L1')) return;
                                const ocrUpper = ocrText.toUpperCase();
                                const ocrStripped = ocrUpper.replace(/^[[(<{]+/, '').replace(/[\])>}-]+$/, '');
                                const matchedTeam = findTeamByTag(ocrStripped);
                                if (!matchedTeam || matchedTeam.seed !== teamData.seed) return;
                                teamOCR.push({ idx, ocrText });
                        });

                        // Player liberi di questo team
                        const teamPlayers = teamData.players.filter(p => !assigned.has(p.id));

                        if (teamOCR.length === 0 || teamPlayers.length === 0) continue;

                        // Calcola tutte le coppie (ocr, player) con distanza Levenshtein
                        /** @type {{ocrEntry: {idx: number, ocrText: string}, player: any, dist: number}[]} */
                        const pairs = [];
                        for (const ocrEntry of teamOCR) {
                                const ocrLower = ocrEntry.ocrText.toLowerCase();
                                for (const player of teamPlayers) {
                                        const playerName = (player.activePlayer.name || '').toLowerCase();
                                        const playerIGN = (player.activePlayer.ign || '').toLowerCase();
                                        const distName = levenshtein(ocrLower, playerName);
                                        const distIGN = playerIGN ? levenshtein(ocrLower, playerIGN) : Infinity;
                                        const dist = Math.min(distName, distIGN);
                                        pairs.push({ ocrEntry, player, dist });
                                }
                        }

                        // Ordina per distanza crescente (matching greedy ottimo)
                        pairs.sort((a, b) => a.dist - b.dist);

                        // Assegna greedy: prendi la coppia con distanza minore, assegna,
                        // rimuovi entrambi dal pool, continua
                        const usedOCRIdx = new Set();
                        const usedPlayerIds = new Set();
                        for (const pair of pairs) {
                                if (usedOCRIdx.has(pair.ocrEntry.idx)) continue;
                                if (usedPlayerIds.has(pair.player.id)) continue;
                                const target = targets.find(t => t.dataset.playerId === pair.player.id);
                                if (!target || target.value !== '') continue;
                                target.value = pair.ocrEntry.ocrText;
                                assigned.add(pair.player.id);
                                processed.add(pair.ocrEntry.idx);
                                usedOCRIdx.add(pair.ocrEntry.idx);
                                usedPlayerIds.add(pair.player.id);
                                markOCRUsed(pair.ocrEntry.ocrText);
                                level1Count++;
                                console.debug(`[autofill] L1 (tag+Lev team "${teamData.tagOriginal}"): "${pair.ocrEntry.ocrText}" → ${pair.player.id} (dist=${pair.dist})`);
                        }
                }
                console.debug(`[autofill] Livello 1 (tag+Levenshtein): ${level1Count} assegnati`);

                // --- LIVELLO 2: SOMIGLIANZA NOME (Levenshtein), SOLO DENTRO IL TEAM ---
                // Usa il playerId già abbinato dal sistema OCR, ma SOLO se l'OCR
                // inizia col tag del team del player (REGOLA 1, tag letti dal form
                // appena compilato, non quelli salvati che potrebbero essere vecchi).
                // Es. "Birdo" non va mai al team con tag "Y", resta manuale.
                let level2Count = 0;
                placements.forEach((p, idx) => {
                        if (processed.has(idx)) return;
                        if (!p.playerId) return;
                        if (assigned.has(p.playerId)) return;

                        const ocrText = p.ocrText?.trim() || '';
                        if (!ocrText) return;
                        // Salta OCR text già assegnati a un altro player (no duplicati)
                        if (ocrUsed(ocrText)) return;
                        // Salta doppie letture (REGOLA 2: a nessuno, manuale)
                        if (skipIfDuplicateRead(ocrText, 'L2')) return;

                        const ocrUpper = ocrText.toUpperCase();
                        const ocrStripped = ocrUpper.replace(/^[[(<{]+/, '').replace(/[\])>}-]+$/, '');
                        const playerObj = mogi.roster.byId(p.playerId);
                        const ownTeam = playerObj ? teamsData.find(td => td.seed === playerObj.seed) : null;
                        const ownTag = ownTeam?.tag || '';
                        if (!ownTag || !ocrStripped.startsWith(ownTag)) {
                                console.debug(`[autofill] L2 skip: "${ocrText}" non inizia col tag "${ownTag || '(vuoto)'}" del suo team, non assegnato a ${p.playerId} (manuale).`);
                                return;
                        }

                        const target = targets.find(t => t.dataset.playerId === p.playerId);
                        if (!target || target.value !== '') return;
                        target.value = ocrText;
                        assigned.add(p.playerId);
                        processed.add(idx);
                        markOCRUsed(ocrText);
                        level2Count++;
                        console.debug(`[autofill] L2 (Levenshtein): "${ocrText}" → ${p.playerId}`);
                });
                console.debug(`[autofill] Livello 2 (Levenshtein): ${level2Count} assegnati`);

                // --- LIVELLO 3: matching per INIZIALI, SOLO DENTRO IL TEAM DEL TAG ---
                // REGOLA 1: se l'OCR non inizia col tag di nessun team → manuale.
                // Se inizia col tag di T → cerca tra i soli player liberi di T.
                let level3Count = 0;
                placements.forEach((p, idx) => {
                        if (processed.has(idx)) return;
                        const ocrText = p.ocrText?.trim();
                        if (!ocrText) return;
                        // Salta OCR text già assegnati a un altro player (no duplicati)
                        if (ocrUsed(ocrText)) return;
                        // Salta doppie letture (REGOLA 2: a nessuno, manuale)
                        if (skipIfDuplicateRead(ocrText, 'L3')) return;
                        const ocrLower = ocrText.toLowerCase();

                        const ocrUpper = ocrText.toUpperCase();
                        const ocrStripped = ocrUpper.replace(/^[[(<{]+/, '').replace(/[\])>}-]+$/, '');
                        const matchedTeam = findTeamByTag(ocrStripped);
                        if (!matchedTeam) {
                                console.debug(`[autofill] L3 skip: "${ocrText}" non inizia con nessun tag (manuale).`);
                                return;
                        }

                        // Trova player liberi DEL TEAM DEL TAG il cui nome Lounge o
                        // IGN inizia con le stesse 3 lettere (case-insensitive)
                        const candidates = matchedTeam.players.filter(pl => {
                                if (assigned.has(pl.id)) return false;
                                const ignNorm = (pl.activePlayer.ign || '').toLowerCase();
                                const nameNorm = (pl.activePlayer.name || '').toLowerCase();
                                const minLen = 3;
                                const matches = (a, b) => {
                                        if (!a || !b) return false;
                                        const len = Math.min(a.length, b.length, minLen);
                                        if (len < 1) return false;
                                        return a.slice(0, len) === b.slice(0, len);
                                };
                                return matches(ocrLower, ignNorm) || matches(ocrLower, nameNorm);
                        });

                        if (candidates.length === 1) {
                                const player = candidates[0];
                                const target = targets.find(t => t.dataset.playerId === player.id);
                                if (target && target.value === '') {
                                        target.value = ocrText;
                                        assigned.add(player.id);
                                        processed.add(idx);
                                        markOCRUsed(ocrText);
                                        level3Count++;
                                        console.debug(`[autofill] L3 (iniziali team "${matchedTeam.tagOriginal}"): "${ocrText}" → ${player.id}`);
                                }
                        } else if (candidates.length > 1) {
                                console.debug(`[autofill] L3 skip: "${ocrText}" match ambiguo (${candidates.length} candidati nel team).`);
                        }
                });
                console.debug(`[autofill] Livello 3 (iniziali): ${level3Count} assegnati`);

                // --- LIVELLO 4: MANUALE ---
                const unassigned = targets.filter(t => t.value === '').length;
                if (unassigned > 0) {
                        console.debug(`[autofill] Livello 4 (manuale): ${unassigned} player rimasti senza assegnazione. Usabili dalla dropdown OCR.`);
                }

                // Aggiorna le dropdown OCR per riflettere i nuovi valori assegnati
                // e le dropdown iniziali (l'autofill può aver salvato nuove iniziali)
                refreshOCRDropdowns(container, mogi);
                refreshTagInitials(container, mogi);
        });

        cancel.addEventListener('click', () => {
                dialog.close();
        });

        // Reset names: cancella tutti gli IGN assegnati (input nel form)
        // E svuota la cache dei nomi OCR salvati nel mogi (così l'autofill
        // riparte da zero, senza nomi "usati" nella dropdown).
        if (resetnames) {
                resetnames.addEventListener('click', () => {
                        if (!confirm(t('editRoster.confirmResetNames'))) return;
                        // Svuota tutti gli input IGN nel form
                        /** @type {HTMLInputElement[]} */
                        const ignInputs = [...container.querySelectorAll('input[name=ign]')];
                        ignInputs.forEach(i => { i.value = ''; });
                        // Svuota la cache OCR del mogi (nomi + iniziali)
                        mogi.clearUnassignedOCRNames();
                        // Aggiorna le dropdown (ora vuote)
                        refreshOCRDropdowns(container, mogi);
                        refreshTagInitials(container, mogi);
                        console.log('[edit-roster] Tutti gli IGN e la cache OCR sono stati resettati.');
                        success(t('editRoster.namesReset'));
                });
        }

        dialog.showModal();
}
