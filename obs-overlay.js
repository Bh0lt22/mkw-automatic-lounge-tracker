/**
 * obs-overlay.js
 *
 * Pagina overlay per OBS. Mostra i punteggi totali dei team in tempo reale,
 * sincronizzati con la pagina principale tramite localStorage.
 *
 * Funzionamento:
 * - La pagina principale salva lo stato del Mogi (teams + punteggi) in
 *   localStorage sotto la chiave 'mkw-obs-overlay-state' ogni volta che
 *   cambia qualcosa (vedi mogi.js: triggerUpdate() ora salva in localStorage).
 * - Questa pagina legge lo stato all'avvio e si iscrive all'evento 'storage'
 *   per aggiornarsi in tempo reale quando la pagina principale cambia.
 *
 * Per usarlo in OBS:
 *   1. Apri il bot nel browser, configura il roster
 *   2. Clicca "📺 OBS scores overlay" → si apre la pagina overlay
 *   3. In OBS: aggiungi una "Browser Source"
 *   4. URL: <indirizzo-del-tuo-sito>/obs-overlay.html
 *      (es. http://localhost:8000/obs-overlay.html in locale,
 *       oppure https://TUOUSER.github.io/TUOREPO/obs-overlay.html su GitHub Pages)
 *   5. Larghezza: 1280, Altezza: 720 (o qualsiasi dimensione)
 *   6. Spunta "Refresh browser when scene becomes active"
 *
 * Lo sfondo è trasparente: in OBS spunta "Use OBS Browser as transparency
 * source" o imposta un colore verde come chroma key se preferisci.
 */

const STORAGE_KEY = 'mkw-obs-overlay-state';

/**
 * @typedef {Object} TeamState
 * @prop {string} tag
 * @prop {number} score
 * @prop {number} rank 1-based
 * @prop {string} color CSS color
 * @prop {number} playerCount
 */

/**
 * @typedef {Object} OverlayState
 * @prop {number} playersPerTeam
 * @prop {TeamState[]} teams
 * @prop {number} raceCount
 * @prop {number} totalScore
 */

/** @returns {OverlayState|null} */
function loadState() {
        try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return null;
                return JSON.parse(raw);
        } catch (e) {
                console.warn('[obs-overlay] Impossibile leggere lo stato:', e);
                return null;
        }
}

/**
 * Legge il parametro 'orient' dall'URL. Valori ammessi:
 * - 'normal' (default): griglia 3x2 (2v2), 2x2 (3v3), ecc.
 * - 'horizontal': tutti i team in una riga orizzontale
 * - 'vertical': tutti i team in una colonna verticale
 * @returns {'normal'|'horizontal'|'vertical'}
 */
function getOrientation() {
        const params = new URLSearchParams(window.location.search);
        const o = (params.get('orient') || 'normal').toLowerCase();
        if (o === 'horizontal' || o === 'h') return 'horizontal';
        if (o === 'vertical' || o === 'v') return 'vertical';
        return 'normal';
}

/**
 * Renderizza l'overlay in base allo stato.
 * @param {OverlayState|null} state
 */
function render(state) {
        const overlay = document.getElementById('overlay');
        if (!overlay) return;

        const orient = getOrientation();

        if (!state || !state.teams || state.teams.length === 0) {
                overlay.className = '';
                overlay.style.removeProperty('--team-count');
                overlay.innerHTML = '<div id="empty">Apri MKW Mogi Manager e configura il roster per visualizzare i punteggi qui.</div>';
                return;
        }

        const teamCount = state.teams.length;

        // Imposta la classe CSS in base all'orientamento
        if (orient === 'horizontal') {
                overlay.className = 'orient-horizontal';
                overlay.style.setProperty('--team-count', String(teamCount));
        } else if (orient === 'vertical') {
                overlay.className = 'orient-vertical';
                overlay.style.setProperty('--team-count', String(teamCount));
        } else {
                // normal: calcola colonne come prima
                const cols = teamCount <= 2 ? teamCount : (teamCount <= 3 ? 3 : (teamCount <= 6 ? 3 : 4));
                overlay.className = `orient-normal cols-${Math.min(cols, 3)}`;
                overlay.style.removeProperty('--team-count');
        }

        // Ordina per rank (1° prima)
        const sorted = [...state.teams].sort((a, b) => a.rank - b.rank);

        overlay.innerHTML = sorted.map(t => `
                <div class="team-box rank-${t.rank || 4}" style="--team-color: ${t.color || '#888'}">
                        <span class="team-rank">#${t.rank}</span>
                        <span class="team-tag">${escapeHtml(t.tag || '???')}</span>
                        <span class="team-score">${t.score}</span>
                </div>
        `).join('');
}

/** @param {string} s */
function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
}

// === BroadcastChannel per aggiornamenti cross-tab più affidabili ===
// Se supportato, usiamo anche BroadcastChannel oltre a localStorage:
// funziona meglio quando la tab principale è in background.
const bc = (function() {
        try {
                const channel = new BroadcastChannel('mkw-obs-overlay');
                return channel;
        } catch (e) {
                console.warn('[obs-overlay] BroadcastChannel non supportato:', e);
                return null;
        }
})();

// === Document Picture-in-Picture ===
// Apre la pagina corrente in una finestra PiP separata che rimane
// sempre sopra le altre app, anche quando il browser principale è
// in background. Questo risolve il problema degli update dell'overlay
// che non arrivavano quando la pagina principale era inattiva.
//
// Compatibilità: Chrome 116+ (desktop). Firefox/Safari non supportano
// ancora Document PiP — il pulsante viene nascosto se non supportato.
const pipButton = document.getElementById('pipButton');
if (pipButton) {
        if (!('documentPictureInPicture' in window)) {
                // Browser non supportato: nascondi il pulsante
                pipButton.style.display = 'none';
        } else {
                pipButton.addEventListener('click', async () => {
                        try {
                                // Apre una finestra PiP con tutto il body della pagina.
                                // La finestra resta attiva e riceve i BroadcastChannel
                                // messages, quindi si aggiorna in tempo reale.
                                const pipWindow = await documentPictureInPicture.requestWindow({
                                        width: 480,
                                        height: 320,
                                });
                                // Copia gli stili nella nuova finestra
                                [...document.styleSheets].forEach(styleSheet => {
                                        try {
                                                const cssRules = [...styleSheet.cssRules].map(r => r.cssText).join('');
                                                const style = pipWindow.document.createElement('style');
                                                style.textContent = cssRules;
                                                pipWindow.document.head.appendChild(style);
                                        } catch (e) {
                                                // Cross-origin stylesheet: copia il link
                                                const link = pipWindow.document.createElement('link');
                                                link.rel = 'stylesheet';
                                                link.href = styleSheet.href;
                                                pipWindow.document.head.appendChild(link);
                                        }
                                });
                                // Sposta il body della pagina nella finestra PiP.
                                // Usiamo clone + observation così la finestra principale resta funzionale.
                                const overlayEl = document.getElementById('overlay');
                                const pipOverlay = pipWindow.document.createElement('div');
                                pipOverlay.id = 'overlay';
                                pipOverlay.className = overlayEl.className;
                                pipOverlay.style.cssText = overlayEl.style.cssText;
                                pipOverlay.innerHTML = overlayEl.innerHTML;
                                pipWindow.document.body.appendChild(pipOverlay);

                                // Ascolta gli update e ricopia il contenuto nella finestra PiP
                                function syncPip() {
                                        const sourceEl = document.getElementById('overlay');
                                        if (!sourceEl) return;
                                        pipOverlay.className = sourceEl.className;
                                        pipOverlay.style.cssText = sourceEl.style.cssText;
                                        pipOverlay.innerHTML = sourceEl.innerHTML;
                                }
                                // Ogni volta che il render() principale finisce, sincronizza.
                                // Usiamo un MutationObserver sull'overlay locale.
                                const observer = new MutationObserver(syncPip);
                                observer.observe(overlayEl, { childList: true, attributes: true, attributeFilter: ['class', 'style'] });
                                // Anche l'evento storage sync
                                window.addEventListener('storage', (e) => {
                                        if (e.key !== STORAGE_KEY) return;
                                        setTimeout(syncPip, 50);
                                });
                                if (bc) {
                                        bc.addEventListener('message', () => setTimeout(syncPip, 50));
                                }

                                console.log('[obs-overlay] Document PiP aperto.');
                        } catch (e) {
                                console.error('[obs-overlay] Impossibile aprire PiP:', e);
                                alert('Impossibile aprire Picture-in-Picture: ' + e.message);
                        }
                });
        }
}

// Render iniziale
render(loadState());

// Aggiornamento in tempo reale: l'evento 'storage' viene triggerato in
// TUTTE le tab tranne quella che ha fatto la modifica. Essendo questa una
// pagina separata, riceve l'evento quando la pagina principale cambia.
window.addEventListener('storage', (e) => {
        if (e.key !== STORAGE_KEY) return;
        render(loadState());
});

// Polling di fallback ogni 500ms (caso limite: localStorage non triggera
// l'evento se la pagina è in background su alcuni browser). Più frequente
// = più reattivo, ma leggermente più CPU. 500ms è un buon compromesso.
setInterval(() => render(loadState()), 500);

// Aggancia l'evento message del BroadcastChannel (creato sopra)
if (bc) {
        bc.onmessage = (e) => {
                if (e.data && e.data.type === 'state-update') {
                        render(loadState());
                }
        };
}

console.log('[obs-overlay] Pronto. In ascolto su localStorage "' + STORAGE_KEY + '"' + (bc ? ' + BroadcastChannel' : '') + '.');
