import { captureFrame, preprocessCrop } from "./capture.js";
import { ctx2d, popcount } from "./util.js";

// ----------------------------------------------------------------------------
// Lookup table: popcount (numero di bit a 1) per ogni byte 0..255.
// Serve per calcolare rapidamente l'errore di Hamming nel template matching.
// ----------------------------------------------------------------------------
const POP = (() => {
	const t = new Uint8Array(256);
	for (let i = 0; i < 256; i++) t[i] = popcount(i);
	return t;
})();

// ----------------------------------------------------------------------------
// ROI (Region Of Interest) — coordinate nel canvas 1920x1080.
// ----------------------------------------------------------------------------

// Icona Home (cattura screenshot Switch) — gia' presente nel progetto originale.
const HOME_ROI = { x: 506, y: 45, w: 40, h: 40 };

// ----------------------------------------------------------------------------
// Bitmask Home (originale del progetto, per checkOverlay).
// ----------------------------------------------------------------------------
const HOME_BITMASK = new Uint8Array([
	0x00, 0x01, 0xFF, 0x80, 0x00,
	0x00, 0x0F, 0xFF, 0xF0, 0x00,
	0x00, 0x3F, 0xFF, 0xFC, 0x00,
	0x00, 0xFF, 0xFF, 0xFF, 0x00,
	0x01, 0xFF, 0xFF, 0xFF, 0x80,
	0x03, 0xFF, 0xE7, 0xFF, 0xC0,
	0x07, 0xFF, 0xC3, 0xFF, 0xE0,
	0x0F, 0xFF, 0x81, 0xFF, 0xF0,
	0x1F, 0xFF, 0x00, 0xFF, 0xF8,
	0x1F, 0xFE, 0x00, 0x7F, 0xF8,
	0x3F, 0xF8, 0x00, 0x1F, 0xFC,
	0x3F, 0xF0, 0x00, 0x0F, 0xFC,
	0x7F, 0xE0, 0x00, 0x07, 0xFE,
	0x7F, 0xC0, 0x00, 0x03, 0xFE,
	0x7F, 0x80, 0x00, 0x01, 0xFE,
	0xFE, 0x00, 0x00, 0x00, 0x7F,
	0xFC, 0x00, 0x00, 0x00, 0x3F,
	0xFC, 0x00, 0x00, 0x00, 0x3F,
	0xFC, 0x00, 0x00, 0x00, 0x3F,
	0xFF, 0xC0, 0x7E, 0x03, 0xFF,
	0xFF, 0xC0, 0x7E, 0x03, 0xFF,
	0xFF, 0xC0, 0x7E, 0x03, 0xFF,
	0xFF, 0xC0, 0x7E, 0x03, 0xFF,
	0xFF, 0xC0, 0x7E, 0x03, 0xFF,
	0xFF, 0xC0, 0x7E, 0x03, 0xFF,
	0x7F, 0xC0, 0x00, 0x03, 0xFE,
	0x7F, 0xC0, 0x00, 0x03, 0xFE,
	0x7F, 0xC0, 0x00, 0x03, 0xFE,
	0x3F, 0xC0, 0x00, 0x03, 0xFC,
	0x3F, 0xC0, 0x00, 0x03, 0xFC,
	0x1F, 0xC0, 0x00, 0x03, 0xF8,
	0x1F, 0xFF, 0xFF, 0xFF, 0xF8,
	0x0F, 0xFF, 0xFF, 0xFF, 0xF0,
	0x07, 0xFF, 0xFF, 0xFF, 0xE0,
	0x03, 0xFF, 0xFF, 0xFF, 0xC0,
	0x01, 0xFF, 0xFF, 0xFF, 0x80,
	0x00, 0xFF, 0xFF, 0xFF, 0x00,
	0x00, 0x3F, 0xFF, 0xFC, 0x00,
	0x00, 0x0F, 0xFF, 0xF0, 0x00,
	0x00, 0x01, 0xFF, 0x80, 0x00,
]);

// ----------------------------------------------------------------------------
// Riferimento pixel-by-pixel per i simboli di gara (moneta + bandierina).
//
// Il file img/race-end-reference.png e' un PNG 1920x1080 RGBA dove solo i
// pixel dell'icona della moneta e della bandierina del lap counter sono
// colorati (alpha > 0); tutto il resto e' trasparente.
//
// La funzione checkRaceSymbols(video) confronta SOLO i pixel non-trasparenti
// del reference con i pixel corrispondenti del frame corrente. Se la maggior
// parte dei pixel coincide (entro una tolleranza), i simboli sono considerati
// presenti. Non serve binarizzazione ne' bitmask.
// ----------------------------------------------------------------------------

const REFERENCE_URL = new URL('../img/race-end-reference.png', import.meta.url).href;

/** @type {Promise<{x:number,y:number,r:number,g:number,b:number}[] | null>} */
let _referencePixelsPromise = null;

/**
 * Carica il PNG di riferimento una sola volta e ne estrae i pixel
 * non-trasparenti (alpha > 128).
 * @returns {Promise<{x:number,y:number,r:number,g:number,b:number}[] | null>}
 *   Array di pixel di riferimento, o null se il caricamento fallisce.
 */
export function loadRaceEndReference() {
	if (_referencePixelsPromise) return _referencePixelsPromise;
	_referencePixelsPromise = (async () => {
		try {
			const resp = await fetch(REFERENCE_URL);
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const blob = await resp.blob();
			const bmp = await createImageBitmap(blob);
			// Disegna su canvas 1920x1080 per leggere i pixel
			const cnv = document.createElement('canvas');
			cnv.width = bmp.width;
			cnv.height = bmp.height;
			const c = ctx2d(cnv, { willReadFrequently: true });
			c.drawImage(bmp, 0, 0);
			const data = c.getImageData(0, 0, cnv.width, cnv.height).data;
			const pixels = [];
			for (let y = 0; y < cnv.height; y++) {
				for (let x = 0; x < cnv.width; x++) {
					const idx = (y * cnv.width + x) * 4;
					const a = data[idx + 3];
					if (a > 128) {
						pixels.push({
							x, y,
							r: data[idx],
							g: data[idx + 1],
							b: data[idx + 2],
						});
					}
				}
			}
			console.log(`[race-end] Riferimento caricato: ${pixels.length} pixel non-trasparenti.`);
			if (pixels.length === 0) return null;
			return pixels;
		} catch (e) {
			console.error('[race-end] Impossibile caricare il riferimento:', e);
			return null;
		}
	})();
	return _referencePixelsPromise;
}

/**
 * Verifica se il riferimento e' stato caricato con successo.
 * @returns {Promise<boolean>}
 */
export async function isRaceEndAvailable() {
	const px = await loadRaceEndReference();
	return px !== null && px.length > 0;
}

// ----------------------------------------------------------------------------
// Frame buffer riutilizzati.
// ----------------------------------------------------------------------------
const frameBuffer = document.createElement('canvas');
const scratch = document.createElement('canvas');

/**
 * Template matching binario per l'icona Home (codice originale).
 * @param {HTMLVideoElement} video
 */
export function checkOverlay(video) {
	const frame = captureFrame(video, frameBuffer);
	const { canvas, whiteRatio } = preprocessCrop(frame, HOME_ROI, 1, scratch);
	if (whiteRatio < 0.4 || whiteRatio > 0.6) return false;

	const pctx = ctx2d(canvas, { willReadFrequently: true });
	const img = pctx.getImageData(0, 0, canvas.width, canvas.height);
	let error = 0;
	const maxErrorTolerance = (HOME_BITMASK.length * 8) * 0.2;
	for (let i = 0; i < HOME_BITMASK.length; i++) {
		const region =
			  (img.data[(i * 8 + 0) * 4] === 255 ? 0x80 : 0)
			| (img.data[(i * 8 + 1) * 4] === 255 ? 0x40 : 0)
			| (img.data[(i * 8 + 2) * 4] === 255 ? 0x20 : 0)
			| (img.data[(i * 8 + 3) * 4] === 255 ? 0x10 : 0)
			| (img.data[(i * 8 + 4) * 4] === 255 ? 0x08 : 0)
			| (img.data[(i * 8 + 5) * 4] === 255 ? 0x04 : 0)
			| (img.data[(i * 8 + 6) * 4] === 255 ? 0x02 : 0)
			| (img.data[(i * 8 + 7) * 4] === 255 ? 0x01 : 0);
		error += POP[region ^ HOME_BITMASK[i]];
		if (error > maxErrorTolerance) return false;
	}
	return true;
}

// ----------------------------------------------------------------------------
// Confronto pixel-by-pixel del reference con il frame del video.
// ----------------------------------------------------------------------------

/**
 * Confronta il frame corrente del video con il PNG di riferimento.
 *
 * Per ogni pixel non-trasparente del reference, calcola la distanza euclidea
 * RGB tra il colore atteso e il colore effettivo nel frame. Se la frazione di
 * pixel che combaciano (distanza < tolerance) e' >= matchRatio, i simboli sono
 * considerati presenti.
 *
 * @param {HTMLVideoElement} video
 * @param {object} [opts]
 * @param {number} [opts.tolerance=80] Distanza RGB massima per considerare
 *   un pixel "combaciante". 80 = abbastanza tollerante per JPEG e capture card.
 *   Es. se il pixel atteso e' (255, 220, 50) e quello reale e' (240, 200, 70),
 *   distanza = sqrt(15^2 + 20^2 + 20^2) = ~32 → combacia.
 * @param {number} [opts.matchRatio=0.75] Frazione minima di pixel che devono
 *   combaciare per considerare i simboli presenti. 0.75 = 75%.
 * @returns {Promise<boolean>} true se i simboli sono presenti nel frame.
 *   Torna false anche se il riferimento non e' caricato.
 */
export async function checkRaceSymbols(video, opts = {}) {
	const tolerance = opts.tolerance ?? 80;
	const matchRatio = opts.matchRatio ?? 0.75;

	const reference = await loadRaceEndReference();
	if (!reference || reference.length === 0) return false;

	const frame = captureFrame(video, frameBuffer);
	const fctx = ctx2d(frame, { willReadFrequently: true });
	const W = frame.width, H = frame.height;
	const imgData = fctx.getImageData(0, 0, W, H).data;

	let matched = 0;
	const toleranceSq = tolerance * tolerance;
	for (let i = 0; i < reference.length; i++) {
		const p = reference[i];
		if (p.x >= W || p.y >= H) continue;
		const idx = (p.y * W + p.x) * 4;
		const dr = imgData[idx]     - p.r;
		const dg = imgData[idx + 1] - p.g;
		const db = imgData[idx + 2] - p.b;
		const distSq = dr * dr + dg * dg + db * db;
		if (distSq <= toleranceSq) matched++;
	}

	const ratio = matched / reference.length;
	return ratio >= matchRatio;
}
