/**
 * race-timer.js — Cronometro PASSIVO di gara (v3.5 + debounce 1.5s v3.6).
 *
 * NON legge il video e NON chiama checkRaceSymbols: si limita ad ascoltare
 * lo stato della state machine race-end esistente (IDLE/RACING/WAITING/
 * CAPTURING/COOLDOWN) tramite callback onRaceState. Costo extra ~zero
 * (solo un requestAnimationFrame per il testo + un setTimeout da 1.5s).
 *
 * Comportamento:
 * - RACING → reset a 0 e parte a contare (classe is-running, verde)
 * - WAITING → NON si ferma subito: continua a contare per STOP_DELAY_MS
 *   (1500ms). Se entro 1.5s torna RACING (caduta dalla track / pochi frame
 *   senza icone), non si ferma mai. Se dopo 1.5s è ancora sparito, congela
 *   il tempo finale (classe is-stopped, rosso). È il tempo di gara.
 * - CAPTURING/COOLDOWN → stop immediato e congela (la gara è finita davvero,
 *   sta già scattando lo screenshot).
 * - IDLE → ferma il loop ma NON resetta il display (resta leggibile
 *   l'ultimo tempo finché non parte la prossima RACING).
 *
 * Prestazioni: nessun uso in più di CPU/GPU video. Solo setTimeout/clearTimeout
 * nel thread UI. RACE_END_CONFIG e la cattura automatica NON vengono toccati.
 *
 * Revert sicuro: basta non passare più onRaceState a
 * setupAutoCaptureRaceEnd + rimuovere il <div id="raceTimer"> e questo file.
 */

/**
 * Formatta millisecondi in m:ss.t (es. 92400 → "1:32.4").
 * @param {number} ms
 * @returns {string}
 */
export function formatRaceTime(ms) {
        if (!Number.isFinite(ms) || ms < 0) ms = 0;
        const totalTenths = Math.floor(ms / 100);
        const minutes = Math.floor(totalTenths / 600);
        const seconds = Math.floor((totalTenths % 600) / 10);
        const tenths = totalTenths % 10;
        return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

/**
 * Collega un elemento DOM come display del cronometro passivo.
 * @param {HTMLElement} timerEl Elemento dove scrivere il tempo (es. <span id="raceTimer">)
 * @returns {{ onRaceState: (state: string) => void, destroy: () => void }}
 */
export function setupPassiveRaceTimer(timerEl) {
        let rafId = 0;
        let running = false;
        /** performance.now() corrispondente allo 0 logico, tenendo conto di pause/riprese */
        let basePerf = 0;
        /** millisecondi congelati quando in pausa (WAITING) */
        let frozenMs = 0;

        function render(ms) {
                timerEl.textContent = formatRaceTime(ms);
        }

        function loop() {
                if (!running) return;
                render(performance.now() - basePerf);
                rafId = requestAnimationFrame(loop);
        }

        function startFresh() {
                basePerf = performance.now();
                frozenMs = 0;
                running = true;
                timerEl.classList.remove('is-stopped');
                timerEl.classList.add('is-running');
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(loop);
        }

        function freeze() {
                if (running) {
                        frozenMs = performance.now() - basePerf;
                        running = false;
                        cancelAnimationFrame(rafId);
                        render(frozenMs);
                } else {
                        render(frozenMs);
                }
                timerEl.classList.remove('is-running');
                timerEl.classList.add('is-stopped');
        }

        function resume() {
                // Riprende da dove si era congelato (falso allarme WAITING→RACING)
                basePerf = performance.now() - frozenMs;
                running = true;
                timerEl.classList.remove('is-stopped');
                timerEl.classList.add('is-running');
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(loop);
        }

        function stopKeepDisplay() {
                running = false;
                cancelAnimationFrame(rafId);
                // Non resetta il testo: resta l'ultimo tempo leggibile.
        }

        /** Ultimo stato ricevuto, per distinguere falsa partenza da nuova gara */
        let prevState = 'IDLE';
        /** Ritardo anti-flicker: il timer si ferma solo se le icone restano
         * sparite per più di questo tempo (cadute dalla track = pochi frame). */
        const STOP_DELAY_MS = 1500;
        /** Timeout pendente per il freeze ritardato da WAITING */
        let stopTimeout = 0;

        function clearPendingStop() {
                if (stopTimeout) {
                        clearTimeout(stopTimeout);
                        stopTimeout = 0;
                }
        }

        /**
         * Callback da passare come onStateChange a setupAutoCaptureRaceEnd.
         * @param {string} state
         */
        function onRaceState(state) {
                switch (state) {
                        case 'RACING':
                                // WAITING → RACING entro 1.5s = caduta/flicker:
                                // annulla il freeze pendente, il timer non si è
                                // mai fermato e continua senza buchi.
                                // WAITING → RACING dopo freeze (oltre 1.5s) = resume.
                                // Da IDLE/COOLDOWN = nuova gara: parti da 0.
                                if (prevState === 'WAITING') {
                                        if (stopTimeout) {
                                                clearPendingStop();
                                                // Era ancora in counting: niente da fare,
                                                // resta is-running senza salti.
                                        } else {
                                                resume();
                                        }
                                } else {
                                        clearPendingStop();
                                        startFresh();
                                }
                                break;
                        case 'WAITING':
                                // Non fermare subito: dai 1.5s alle icone per riapparire.
                                // Il loop RAF continua a contare nel frattempo.
                                clearPendingStop();
                                stopTimeout = setTimeout(() => {
                                        stopTimeout = 0;
                                        freeze();
                                }, STOP_DELAY_MS);
                                break;
                        case 'CAPTURING':
                        case 'COOLDOWN':
                                // Gara finita davvero (screenshot in corso): stop subito.
                                clearPendingStop();
                                freeze();
                                break;
                        case 'IDLE':
                        default:
                                clearPendingStop();
                                stopKeepDisplay();
                                break;
                }
                prevState = state;
        }

        render(0);

        function destroy() {
                running = false;
                cancelAnimationFrame(rafId);
                clearPendingStop();
        }

        return { onRaceState, destroy };
}
