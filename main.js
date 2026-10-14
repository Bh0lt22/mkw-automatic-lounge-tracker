import { initI18n } from "./src/i18n/i18n.js";
import { Mogi } from "./src/mogi.js";
import { setupAutoCapture, setupAutoCaptureRaceEnd } from "./src/ui/autocapture-toggle.js";
import { setupPassiveRaceTimer } from "./src/ui/race-timer.js";
import { setupCameraList, setupCaptureButton } from "./src/ui/capture-button.js";
import { connectExportButton } from "./src/ui/export-results-dialog.js";
import { connectGallery } from "./src/ui/gallery.js";
import { setupLocaleSwitcher } from "./src/ui/locale-switcher.js";
import { initTheme, setupThemeSwitcher } from "./src/ui/theme-switcher.js";
import { setupDebugOcrButton } from "./src/ui/ocr-debug-dialog.js";
import { connectScoreboard, connectScoreboardScreenshotter } from "./src/ui/scoreboard.js";
import { requestRoster } from "./src/ui/set-roster-dialog.js";
import { isDebugMode } from "./src/util.js";

async function main() {
        initTheme();
        const step1 = /** @type {HTMLDivElement} */(document.getElementById('step1'));
        const step2 = /** @type {HTMLDivElement} */(document.getElementById('step2'));

        const localeSelect = /** @type {HTMLSelectElement} */(document.getElementById('locale'));
        const themeSelect = /** @type {HTMLSelectElement} */(document.getElementById('theme'));

        setupLocaleSwitcher(localeSelect);
        setupThemeSwitcher(themeSelect);
        initI18n();

        const startButton = /** @type {HTMLButtonElement} */(document.getElementById('start'));

        const video = /** @type {HTMLVideoElement} */(document.getElementById('preview'));
        const cameraSelect = /** @type {HTMLSelectElement} */(document.getElementById('camera'));
        const captureBtn = /** @type {HTMLButtonElement} */(document.getElementById('capture'));
        const autoCaptureToggle = /** @type {HTMLInputElement} */(document.getElementById('autoCapture'));
        const autoCaptureRaceEndToggle = /** @type {HTMLInputElement} */(document.getElementById('autoCaptureRaceEnd'));
        // Sezione "Last capture" rimossa (v4.8): outputOl resta null e
        // setupCaptureButton salta il render della lista (scoreboard invariata).
        const outputOl = /** @type {HTMLOListElement|null} */(document.getElementById('output'));
        const scoreTable = /** @type {HTMLTableElement} */(document.getElementById('scoreTable'));
        const raceGallery = /** @type {HTMLDivElement} */(document.getElementById('raceGallery'));
        const snapshotButton = /** @type {HTMLButtonElement} */(document.getElementById('snapshotScores'));
        const obsOverlayButton = /** @type {HTMLButtonElement|null} */(document.getElementById('obsOverlay'));
        const exportBtn = /** @type {HTMLButtonElement} */(document.getElementById('exportScores'));
        const downloadBtn = /** @type {HTMLButtonElement} */(document.getElementById('downloadMogi'));

        const roster = await requestRoster(startButton);

        step1.style.display = 'none';
        step2.style.display = 'block';

        const mogi = new Mogi(roster);
        setupCameraList(cameraSelect, video);
        setupCaptureButton(captureBtn, video, outputOl, mogi);
        setupAutoCapture(autoCaptureToggle, captureBtn, video, mogi);
        // Timer PASSIVO v3.5: ascolta gli stati race-end, zero letture video in più.
        // Revert: basta rimuovere queste 3 righe e il div #raceTimer.
        const raceTimerEl = document.getElementById('raceTimer');
        const passiveTimer = raceTimerEl ? setupPassiveRaceTimer(raceTimerEl) : null;
        if (autoCaptureRaceEndToggle) setupAutoCaptureRaceEnd(autoCaptureRaceEndToggle, captureBtn, video, mogi, passiveTimer?.onRaceState);
        connectScoreboard(scoreTable, video, mogi);
        // Snapshot button: copia un'immagine PNG della scoreboard negli appunti.
        if (snapshotButton) connectScoreboardScreenshotter(snapshotButton, scoreTable);
        // OBS overlay button: apre una nuova pagina con background trasparente
        // che mostra solo i punteggi totali dei team. Da aggiungere a OBS come
        // Browser Source per visualizzare i punteggi in diretta.
        if (obsOverlayButton) {
                obsOverlayButton.addEventListener('click', () => {
                        // Prima chiedi all'utente l'orientamento desiderato.
                        const choice = prompt(
                                'OBS scores overlay — choose orientation:\n\n' +
                                '1) Normal (3x2 grid for 2v2, 2x2 for 3v3, etc.)\n' +
                                '2) Horizontal (all teams in one row)\n' +
                                '3) Vertical (all teams in one column)\n\n' +
                                'Type 1, 2 or 3 (default: 1):\n\n' +
                                '--- OBS instructions ---\n' +
                                'Add this page that will pop up as "Window capture" source.\n' +
                                'Resize the browser window that opens to your liking.\n' +
                                'Use "Alt + Left-Click-and-Drag" in OBS to crop out the top part of the\n' +
                                'browser window or however else you prefer to adjust it.\n\n' +
                                '--- Picture-in-Picture (Chrome 116+ only) ---\n' +
                                'Click the "PiP" button in the overlay page to keep it always on top,\n' +
                                'even when the main browser window is minimized. Updates keep flowing.',
                                '1'
                        );
                        let orient = 'normal';
                        if (choice === '2' || choice === 'horizontal' || choice === 'h') orient = 'horizontal';
                        else if (choice === '3' || choice === 'vertical' || choice === 'v') orient = 'vertical';
                        // Annulla → non aprire nulla
                        if (choice === null) return;

                        const url = `./obs-overlay.html?orient=${orient}`;
                        window.open(url, 'mkw-obs-overlay', 'width=1280,height=720');
                });
        }
        connectExportButton(exportBtn, downloadBtn, mogi);
        connectGallery(raceGallery, mogi);

        if( isDebugMode() ) setupDebugOcrButton();
}

main();
