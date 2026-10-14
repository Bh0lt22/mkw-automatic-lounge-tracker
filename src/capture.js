/** @typedef {import("./mogi.js").Mogi} Mogi */

import { t } from "./i18n/i18n.js";
import { OCR_GRID, processResultsScreen } from "./ocr.js";
import { Race } from "./race.js";
import { error, info } from "./ui/toast.js";
import { ctx2d, rgb2hsv } from "./util.js";

/**
 * Capture a single frame from a video element into a canvas.
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLCanvasElement} [canvas]
 * @returns {HTMLCanvasElement} The given canvas, or a new one
 */
export function captureFrame(videoEl, canvas=document.createElement('canvas')) {
        const { canvasWidth: w, canvasHeight: h } = OCR_GRID;
        canvas.width = w; canvas.height = h;
        const ctx = ctx2d(canvas, { willReadFrequently: true });
        const vidW = videoEl.videoWidth, vidH = videoEl.videoHeight;
        if (!vidW || !vidH) return canvas; // video not loaded, return empty frame
        const scale = Math.min(vidW / w, vidH / h);
        const sx = Math.floor((vidW - w * scale) / 2), sy = Math.floor((vidH - h * scale) / 2);
        const sW = Math.floor(w * scale), sH = Math.floor(h * scale);
        ctx.drawImage(videoEl, sx, sy, sW, sH, 0, 0, w, h);
        return canvas;
}

/**
 * Lightweight pre-processing (scale, grayscale + threshold).
 * @param {HTMLCanvasElement} src
 * @param {{x:number,y:number,w:number,h:number}} r
 * @param {number} [scale]
 * @param {HTMLCanvasElement} [scratch]
 * @param {boolean} [useHueBasedThreshold] Use hue to determine threshold
 */
export function preprocessCrop(src, r, scale=1, scratch=document.createElement('canvas'), useHueBasedThreshold=false) {
        scratch.width = r.w * scale; scratch.height = r.h * scale;
        const pctx = ctx2d(scratch, { willReadFrequently: true });
        pctx.imageSmoothingEnabled = false;
        pctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, r.w * scale, r.h * scale);

        const img = pctx.getImageData(0, 0, scratch.width, scratch.height);
        const [hue] = rgb2hsv(img.data[0], img.data[1], img.data[2]);
        const lowerThreshold = useHueBasedThreshold ? (
                hue < 25 ? 70 : // red team
                hue < 50 ? 120 : // yellow team
                hue < 200 ? 80 : // green team
                hue < 300 ? 50 : // blue team
                70 // red team again
        ) : 0;
        const upperThreshold = 240; // aggressive threshold for white
        let whitePixels = 0;
        for (let i = 0; i < img.data.length; i += 4) {
                const r0 = img.data[i] ?? 0, g0 = img.data[i + 1] ?? 0, b0 = img.data[i + 2] ?? 0;
                const y0 = (r0 * 299 + g0 * 587 + b0 * 114) / 1000;
                const v = y0 < lowerThreshold || y0 > upperThreshold ? 255 : 0;
                img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
                if (v === 255) whitePixels++;
        }
        const whiteRatio = whitePixels / (scratch.width * scratch.height);
        pctx.putImageData(img, 0, 0);
        return { canvas: scratch, whiteRatio };
}

/**
 * Turn a pre-captured canvas into a Blob URL.
 * @param {HTMLCanvasElement} base
 * @returns {Promise<string>}
 */
export function snapshotBlobUrlFromCanvas(base) {
        return new Promise((resolve, reject) => {
                base.toBlob(b => {
                        b ? resolve(URL.createObjectURL(b)) : reject(new Error('toBlob failed'));
                }, 'image/jpeg', 0.85);
        });
}

/**
 * Estrae le INIZIALI candidate (tag dei team) dall'inizio di ogni nome OCR:
 * SOLO il primo carattere alfanumerico, con maiuscole/minuscole preservate
 * (es. "l" da "lorem", "B" da "Bholt"). Parentesi iniziali saltate.
 * In un team event sono tipicamente 6 caratteri diversi da distribuire
 * sui tag dei team. Il matching L1 resta case-insensitive, qui conta solo
 * che a video il tag sia quello vero.
 * @param {string[]} ocrNames
 * @returns {string[]} iniziali distinte (1 carattere l'una, caso preservato)
 */
export function extractInitials(ocrNames) {
        /** @type {Set<string>} */
        const out = new Set();
        for (const raw of ocrNames) {
                const text = (raw || '').trim().replace(/^[[(<{]+/, '');
                if (!text) continue;
                const first = [...text][0] || '';
                if (/[A-Za-z0-9]/.test(first)) {
                        out.add(first);
                }
        }
        return [...out];
}

/**
 * Capture a frame and OCR the results screen.
 * @param {HTMLVideoElement} video
 * @param {Mogi} mogi
 */
export async function captureResultsScreen(video, mogi) {
        try {
                const base = captureFrame(video);
                // processResultsScreen ora non lancia più MANUAL_CANCELLED:
                // restituisce placement parziali con playerId=null per i nomi
                // non abbinati.
                const placements = await processResultsScreen(base, OCR_GRID.nameRects, mogi.roster, mogi.playersPerTeam >= 3);
                // Salviamo TUTTI i nomi OCR rilevati nella cache del mogi
                // (anche quelli già abbinati), così l'Edit Roster può mostrarli
                // nella dropdown e l'utente può riassegnarli se l'OCR ha sbagliato.
                const allOCRNames = placements
                        .filter(p => p.ocrText && p.ocrText.trim())
                        .map(p => p.ocrText.trim());
                if (allOCRNames.length > 0) {
                        mogi.addUnassignedOCRNames(allOCRNames);
                        mogi.addDetectedInitials(extractInitials(allOCRNames));
                        const unassignedCount = placements.filter(p => !p.playerId).length;
                        console.log(`[capture] ${allOCRNames.length} nomi OCR salvati nella cache (${unassignedCount} non assegnati automaticamente).`);
                }
                // Only if successful, make the snapshot and push the race
                const snapshotUrl = await snapshotBlobUrlFromCanvas(base);
                const race = new Race(Date.now(), placements, snapshotUrl);
                mogi.roster.lockIGNsFromPlacements(placements);
                mogi.addRace(race);
        } catch (e) {
                // If no scoreboard found, warn the user
                if (/** @type {any} */(e)?.code === 'NO_SCOREBOARD') {
                        console.log('No scoreboard detected in frame.');
                        error(t('capture.noScoreboardDetected'));
                        return;
                }
                // Otherwise, surface the error
                console.error(e);
                error(t('capture.ocrFailed'));
                return;
        }
}

/**
 * Capture pause menu player list.
 * @param {HTMLVideoElement} video
 * @param {Mogi} mogi
 */
export async function capturePauseScreen(video, mogi) {
        try {
                const base = captureFrame(video);
                // processResultsScreen ora non lancia più MANUAL_CANCELLED:
                // restituisce placement parziali con playerId=null per i nomi
                // non abbinati. Salviamo TUTTI i nomi OCR rilevati nel mogi
                // (anche quelli già abbinati) così l'utente può riassegnarli
                // tramite la dropdown nell'Edit Roster se l'autofill ha sbagliato.
                const placements = await processResultsScreen(base, OCR_GRID.pauseRects, mogi.roster);
                if (placements) {
                        const allOCRNames = placements
                                .filter(p => p.ocrText && p.ocrText.trim())
                                .map(p => p.ocrText.trim());
                        if (allOCRNames.length > 0) {
                                mogi.addUnassignedOCRNames(allOCRNames);
                                mogi.addDetectedInitials(extractInitials(allOCRNames));
                                const unassignedCount = placements.filter(p => !p.playerId).length;
                                console.log(`[capture] ${allOCRNames.length} nomi OCR salvati nella cache (${unassignedCount} non assegnati automaticamente).`);
                        }
                }
                return placements;
        } catch (e) {
                // If no scoreboard found, warn the user
                if (/** @type {any} */(e)?.code === 'NO_SCOREBOARD') {
                        console.log('No scoreboard detected in frame.');
                        error(t('capture.noPauseScreenDetected'));
                        return;
                }
                // Otherwise, surface the error
                console.error(e);
                error(t('capture.ocrFailed'));
                return;
        }
}
