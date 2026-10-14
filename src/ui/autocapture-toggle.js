/** @typedef {import("../mogi.js").Mogi} Mogi */

import { checkOverlay, checkRaceSymbols, isRaceEndAvailable } from "../autocapture.js";
import { captureResultsScreen } from "../capture.js";
import { Config } from "../util.js";
import { info, error } from "./toast.js";
import { t } from "../i18n/i18n.js";

const configKey = 'autoCapture';

// ----------------------------------------------------------------------------
// Parametri della state machine "race-end". Modificali se serve.
// ----------------------------------------------------------------------------
const RACE_END_CONFIG = {
        // Intervallo di polling (ms). 200 ms = 5 check al secondo.
        pollIntervalMs: 200,

        // Quanti check consecutivi devono tornare "simboli visibili" prima di
        // passare da IDLE a RACING. 1 = massima reattivita'.
        racingConfirmHits: 1,

        // Quanti check consecutivi devono tornare "simboli spariti" prima di
        // passare da RACING a WAITING. 1 = massima reattivita' (appena un
        // frame non combacia parte il countdown).
        goneConfirmHits: 1,

        // Quanti millisecondi aspettare dopo la sparizione dei simboli prima di
        // iniziare a catturare. 2300 ms (tarato su test reali: 3000 era troppo tardi,
        // la scoreboard stava gia' scomparendo).
        captureDelayMs: 2300,

        // Cooldown dopo una cattura riuscita, per evitare doppie catture.
        cooldownMs: 5000,

        // Quanti millisecondi aspettare tra un tentativo di cattura e quello
        // successivo nel stato CAPTURING. 500 ms = 2 tentativi al secondo.
        captureRetryIntervalMs: 500,

        // Numero massimo di tentativi di cattura consecutivi nello stato
        // CAPTURING prima di arrendersi. 30 tentativi * 500 ms = 15 secondi
        // di tentativi totali. Dopo, torna in IDLE con un errore.
        maxCaptureRetries: 30,

        // Tolleranza colore per il confronto pixel-by-pixel (distanza RGB).
        // 80 = tollerante per JPEG e capture card. Abbassa per essere piu' rigoroso.
        matchTolerance: 80,

        // Frazione minima di pixel che devono combaciare per considerare i
        // simboli "presenti". 0.75 = 75%.
        matchRatio: 0.75,
};

/**
 * Setup del toggle Auto-Capture originale (rileva l'icona Home dello screenshot
 * Switch). Mantiene la signature originale del progetto.
 *
 * @param {HTMLInputElement} toggle
 * @param {HTMLButtonElement} captureButton
 * @param {HTMLVideoElement} video
 * @param {Mogi} mogi
 */
export function setupAutoCapture(toggle, captureButton, video, mogi) {
        let interval = 0;
        let hits = 0;
        let cooldown = false;
        function startPoll() {
                interval = setInterval(() => {
                        if (mogi.ended) return;
                        if (cooldown) return;
                        if (checkOverlay(video)) hits += 1;
                        else hits = 0;
                        if (hits > 2) {
                                captureResultsScreen(video, mogi);
                                hits = 0;
                                cooldown = true;
                                setTimeout(() => cooldown = false, 5000);
                        }
                }, 200);
                captureButton.disabled = true;
                Config.set(configKey, 'on');
        }
        function stopPoll() {
                clearInterval(interval);
                interval = 0;
                captureButton.disabled = false;
                Config.set(configKey, 'off');
        }

        if (Config.get(configKey) === 'on') {
                toggle.checked = true;
                startPoll();
        }
        toggle.addEventListener('change', () => toggle.checked ? startPoll() : stopPoll());
}

// ----------------------------------------------------------------------------
// State machine "race-end": scatta automaticamente quando i simboli di gara
// (moneta + bandierina) spariscono dallo schermo.
//
//   IDLE  --(simboli visibili per N frame)-->  RACING
//   RACING --(simboli spariti per M frame)--> WAITING (countdown di captureDelayMs)
//   WAITING --(dopo captureDelayMs, e simboli ancora spariti)--> CAPTURING
//   WAITING --(simboli riapparsi)--> RACING (annulla countdown)
//   CAPTURING --(cattura riuscita)--> COOLDOWN
//   CAPTURING --(cattura fallita, retry < maxCaptureRetries)--> aspetta e riprova
//   CAPTURING --(maxCaptureRetries raggiunto)--> COOLDOWN + errore toast
//   COOLDOWN --(dopo cooldownMs)--> IDLE
// ----------------------------------------------------------------------------

/**
 * Setup del toggle Auto-Capture "race-end".
 *
 * @param {HTMLInputElement} toggle
 * @param {HTMLButtonElement} captureButton
 * @param {HTMLVideoElement} video
 * @param {Mogi} mogi
 * @param {(state: 'IDLE'|'RACING'|'WAITING'|'CAPTURING'|'COOLDOWN') => void} [onStateChange]
 *   Callback opzionale per il cronometro PASSIVO (v3.5): viene chiamata a ogni
 *   cambio di stato, senza alcun costo extra (nessun checkRaceSymbols in più).
 *   Se omessa, nessun comportamento cambia (revert sicuro).
 */
export function setupAutoCaptureRaceEnd(toggle, captureButton, video, mogi, onStateChange) {
        const cfg = RACE_END_CONFIG;
        let interval = 0;
        let cooldown = false;

        /** @type {'IDLE'|'RACING'|'WAITING'|'CAPTURING'|'COOLDOWN'} */
        let state = 'IDLE';
        let visibleHits = 0;
        let goneHits = 0;
        let waitStartedAt = 0;
        let captureRetries = 0;
        let capturing = false; // evita tentativi concorrenti

        /** Notifica il cambio stato al timer passivo (mai await, mai try pesanti) */
        function emit(next) {
                if (next !== state) {
                        state = next;
                }
                if (typeof onStateChange === 'function') {
                        try { onStateChange(state); } catch (e) { console.debug('[race-end] onStateChange error:', e); }
                }
        }

        function reset(reason) {
                // Reset silenzioso dei contatori + notifica IDLE al timer passivo
                state = 'IDLE';
                visibleHits = 0;
                goneHits = 0;
                waitStartedAt = 0;
                captureRetries = 0;
                capturing = false;
                if (typeof onStateChange === 'function') {
                        try { onStateChange('IDLE'); } catch (e) { console.debug('[race-end] onStateChange error:', e); }
                }
                if (reason) console.debug('[race-end] reset:', reason);
        }

        async function tick() {
                if (mogi.ended) return;
                if (cooldown) return;
                if (capturing) return;

                // Per tutti gli stati tranne CAPTURING, controlla i simboli.
                // In CAPTURING non serve (stiamo gia' cercando di catturare).
                if (state !== 'CAPTURING') {
                        const present = await checkRaceSymbols(video, {
                                tolerance: cfg.matchTolerance,
                                matchRatio: cfg.matchRatio,
                        });

                        switch (state) {
                                case 'IDLE': {
                                        if (present) {
                                                visibleHits += 1;
                                                if (visibleHits >= cfg.racingConfirmHits) {
                                                        goneHits = 0;
                                                        console.debug('[race-end] IDLE -> RACING');
                                                        emit('RACING');
                                                }
                                        } else {
                                                visibleHits = 0;
                                        }
                                        return;
                                }
                                case 'RACING': {
                                        if (!present) {
                                                goneHits += 1;
                                                if (goneHits >= cfg.goneConfirmHits) {
                                                        waitStartedAt = Date.now();
                                                        console.debug('[race-end] RACING -> WAITING (countdown di', cfg.captureDelayMs, 'ms)');
                                                        emit('WAITING');
                                                }
                                        } else {
                                                goneHits = 0;
                                        }
                                        return;
                                }
                                case 'WAITING': {
                                        if (present) {
                                                // Falso allarme: i simboli sono riapparsi prima del delay.
                                                console.debug('[race-end] WAITING -> RACING (simboli riapparsi, countdown annullato)');
                                                goneHits = 0;
                                                emit('RACING');
                                                return;
                                        }
                                        if (Date.now() - waitStartedAt >= cfg.captureDelayMs) {
                                                console.debug('[race-end] WAITING -> CAPTURING (inizio loop di cattura)');
                                                captureRetries = 0;
                                                emit('CAPTURING');
                                        }
                                        return;
                                }
                        }
                        return;
                }

                // --- Stato CAPTURING: loop di retry ---
                if (state === 'CAPTURING') {
                        capturing = true;
                        captureRetries++;
                        console.debug(`[race-end] CAPTURING tentativo ${captureRetries}/${cfg.maxCaptureRetries}`);

                        try {
                                // captureResultsScreen non solleva eccezioni per NO_SCOREBOARD:
                                // gestisce tutto internamente con toast. Per sapere se e'
                                // andata bene, intercettiamo la console.
                                // Trucco: wrap di mogi.addRace per verificare il successo.
                                const addedRaceBefore = mogi.races.length;
                                await captureResultsScreen(video, mogi);
                                const addedRaceAfter = mogi.races.length;

                                if (addedRaceAfter > addedRaceBefore) {
                                        // Successo! Race aggiunta.
                                        console.debug('[race-end] CAPTURING -> COOLDOWN (cattura riuscita)');
                                        info(t('capture.raceEndCaptureSuccess') || 'Cattura automatica riuscita.');
                                        emit('COOLDOWN');
                                        capturing = false;
                                        cooldown = true;
                                        setTimeout(() => {
                                                cooldown = false;
                                                reset('cooldown scaduto');
                                        }, cfg.cooldownMs);
                                        return;
                                }

                                // Race non aggiunta → scoreboard non trovata (o errore OCR).
                                // Riprova se non abbiamo esaurito i tentativi.
                                if (captureRetries >= cfg.maxCaptureRetries) {
                                        console.debug('[race-end] CAPTURING -> COOLDOWN (max tentativi raggiunto, cattura fallita)');
                                        error(t('capture.raceEndMaxRetries') || `Cattura automatica fallita dopo ${cfg.maxCaptureRetries} tentativi.`);
                                        emit('COOLDOWN');
                                        capturing = false;
                                        cooldown = true;
                                        setTimeout(() => {
                                                cooldown = false;
                                                reset('cooldown scaduto');
                                        }, cfg.cooldownMs);
                                        return;
                                }

                                // Aspetta captureRetryIntervalMs prima del prossimo tentativo.
                                // (lo fa naturalmente il prossimo tick, ma impostiamo capturing=false
                                // per non bloccare)
                                capturing = false;
                                // Piccola attesa esplicita per non sparare tentativi troppo ravvicinati.
                                setTimeout(() => { /* il prossimo tick riprovera' */ }, cfg.captureRetryIntervalMs);
                        } catch (e) {
                                console.error('[race-end] errore inatteso durante la cattura:', e);
                                capturing = false;
                                if (captureRetries >= cfg.maxCaptureRetries) {
                                        emit('COOLDOWN');
                                        cooldown = true;
                                        setTimeout(() => {
                                                cooldown = false;
                                                reset('cooldown scaduto');
                                        }, cfg.cooldownMs);
                                }
                        }
                }
        }

        async function startPoll() {
                const ok = await isRaceEndAvailable();
                if (!ok) {
                        error(t('capture.raceEndNotConfigured') || 'Race-end: impossibile caricare img/race-end-reference.png. Assicurati che il file sia presente.');
                        toggle.checked = false;
                        return;
                }
                reset('start');
                interval = setInterval(tick, cfg.pollIntervalMs);
                captureButton.disabled = true;
                Config.set('autoCaptureRaceEnd', 'on');
                info(t('capture.raceEndStarted') || 'Auto-capture race-end attivo. Il bot scatta quando i simboli di gara spariscono.');
        }
        function stopPoll() {
                clearInterval(interval);
                interval = 0;
                captureButton.disabled = false;
                Config.set('autoCaptureRaceEnd', 'off');
                reset('stop');
        }

        if (Config.get('autoCaptureRaceEnd') === 'on') {
                toggle.checked = true;
                startPoll();
        }
        toggle.addEventListener('change', () => toggle.checked ? startPoll() : stopPoll());
}
