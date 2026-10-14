import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js';
import { preprocessCrop, snapshotBlobUrlFromCanvas } from './capture.js';
import { normalizeName } from './player.js';
import { Placement } from './race.js';
import { manualResolve } from './ui/manual-resolution-dialog.js';
import { isDebugMode, popcount } from './util.js';

/** @typedef {import("./roster.js").Roster} Roster */
/**
 * @typedef {Object} Rect
 * @prop {number} x
 * @prop {number} y
 * @prop {number} w
 * @prop {number} h
 */

/**
 * @typedef {Object} OCRDebugRow
 * @prop {number} idx
 * @prop {Rect} rect
 * @prop {number} whiteRatio
 * @prop {string|null} rectSnapshotUrl
 * @prop {string} ocrText
 * @prop {number} confidence
 * @prop {string} normalized
 * @prop {boolean} wasBlank
 * @prop {string|null} assignedTo row index assigned to this OCR row (-1 if none)
 * @prop {number} assignedDistance final distance/cost used for this row
 * @prop {boolean} disconnected marked as disconnected due to blank
 * @prop {boolean} revokedAssign assignment revoked for exceeding max edit distance
 */
/**
 * @typedef {Object} OCRDebugReport
 * @prop {'success'|'no_scoreboard'|'manual_cancelled'|'error'} outcome
 * @prop {string} timestampISO
 * @prop {boolean} teamMode
 * @prop {number} canvasWidth
 * @prop {number} canvasHeight
 * @prop {string|null} canvasSnapshotUrl
 * @prop {string} whitelist
 * @prop {{ins:number,del:number,sub:number}} levCosts
 * @prop {number} maxEditDistance
 * @prop {number} maxNonBlankCost
 * @prop {number} blankCost
 * @prop {number} ignMismatchPenalty
 * @prop {OCRDebugRow[]} rows
 * @prop {number[][]} costMatrix
 * @prop {number[]} assignment player i -> row j
 * @prop {{place:number, playerId:string|null, resolvedName:string|null}[]} finalPlacements
 * @prop {string|undefined} errorMessage
 */
let _lastDebug = /** @type {OCRDebugReport|null} */(null);
export function getLastDebugReport() { return _lastDebug; }
function startNewDebugReport() {
        if( _lastDebug ) {
                /** @param {string|null} url */
                function tryRevokeUrl(url) {
                        if( url && typeof url === 'string' && url.startsWith('blob:') ) {
                                try { URL.revokeObjectURL(url); } catch {}
                        }
                }
                tryRevokeUrl(_lastDebug.canvasSnapshotUrl);
                _lastDebug.rows.forEach(r => tryRevokeUrl(r.rectSnapshotUrl));
        }
        return _lastDebug = /** @type {OCRDebugReport} */({
                outcome: 'error',
                timestampISO: new Date().toISOString(),
                teamMode: false,
                canvasWidth: 0,
                canvasHeight: 0,
                canvasSnapshotUrl: null,
                whitelist: '',
                levCosts: { ins: 0, del: 0, sub: 0 },
                maxEditDistance: 0,
                maxNonBlankCost: 0,
                blankCost: 0,
                ignMismatchPenalty: 0,
                rows: [],
                costMatrix: [],
                assignment: [],
                finalPlacements: [],
                errorMessage: undefined
        });
}

/**
 * Build row rectangles from simple parameters
 * @param {{count:number,startY:number,rowHeight:number,vPad:number,x:number,w:number}} p
 * @returns {Rect[]}
 */
function generateRowRects(p) {
        const rects = [];
        for (let i = 0; i < p.count; i++) {
                rects.push({
                        x: p.x,
                        y: Math.round(p.startY + i * p.rowHeight) + p.vPad,
                        w: p.w,
                        h: p.rowHeight - 2 * p.vPad
                });
        }
        return rects;
}
/**
 * Pause screen (edit roster autofill) — fix post-update Mario Kart.
 * Su canvas 1920x1080, misure utente + JSON debug 2026-09-25:
 * - riga 0 (#1/#7): y=25 -> 92 (h=67) — OK (Steez 91, Takumi 94)
 * - riga 1 (#2/#8): y=102 -> 167 (h=65) — OK (Nolanimati 89, xxkyla 89)
 * - riga 2 (#3/#9): y=178 -> 242 (h=64) — OK (YoshiNoyes 90, Magdalena 96)
 * - riga 3 (#4/#10): y=260 -> 315 (h=55, misura utente) — prima a y=338
 *   leggeva la 5a riga (manmaru/ombra) saltando shrezwick/Bholt, che
 *   finivano assegnati ai blank (seed-1-0/seed-3-0 dist 27). Ora copre
 *   la 4a riga vera.
 * - riga 4 (#5/#11): y=338 h=46 — era la posizione che leggeva bene
 *   manmaru 87 / ombra 90, ora dedicata alla 5a riga.
 * - riga 5 (#6/#12): y=414 h=46 — era la posizione che leggeva bene
 *   Alina 95 / JuankalGM 93, ora dedicata alla 6a riga.
 *   y=490 era vuoto (whiteRatio 0, blank) e causava misassignment:
 *   rimosso, le 6 box coprono i 6 nomi per colonna.
 * Stesse x/w (sx x=260, dx x=670, w=240).
 * @returns {Rect[]}
 */
function buildPauseRects() {
        const left = [
                { x: 260, y: 25, w: 240, h: 67 },   // 25-92
                { x: 260, y: 102, w: 240, h: 65 },  // 102-167
                { x: 260, y: 178, w: 240, h: 64 },  // 178-242
                { x: 260, y: 260, w: 240, h: 55 },  // 260-315 (4a linea utente)
                { x: 260, y: 338, w: 240, h: 46 },  // 5a linea (leggeva manmaru)
                { x: 260, y: 414, w: 240, h: 46 },  // 6a linea (leggeva Alina)
        ];
        const right = [
                { x: 670, y: 25, w: 240, h: 67 },
                { x: 670, y: 102, w: 240, h: 65 },
                { x: 670, y: 178, w: 240, h: 64 },
                { x: 670, y: 260, w: 240, h: 55 },
                { x: 670, y: 338, w: 240, h: 46 },
                { x: 670, y: 414, w: 240, h: 46 },
        ];
        return [...left, ...right];
}
export const OCR_GRID = {
        canvasWidth: 1920,
        canvasHeight: 1080,
        nameRects: generateRowRects({ count: 12, startY: 40, rowHeight: 77, vPad: 15, x: 1270, w: 340 }),
        pauseRects: buildPauseRects()
};

/**
 * Directional, weighted edit distance from a -> b.
 * Costs are integers (keeps the assignment DP happy).
 * @param {string} a
 * @param {string} b
 * @param {{ins:number, del:number, sub:number}} w
 */
function levenshteinWeighted(a, b, w = { ins: 1, del: 1, sub: 1 }) {
        if (a === b) return 0;
        const al = a.length, bl = b.length;
        if (!al) return bl * w.ins;
        if (!bl) return al * w.del;

        const v0 = new Array(bl + 1);
        const v1 = new Array(bl + 1);
        for (let j = 0; j <= bl; j++) v0[j] = j * w.ins;

        for (let i = 0; i < al; i++) {
                v1[0] = (i + 1) * w.del;
                const ca = a.charCodeAt(i);
                for (let j = 0; j < bl; j++) {
                        const cb = b.charCodeAt(j);
                        const costSub = ca === cb ? 0 : w.sub;
                        v1[j + 1] = Math.min(
                                v1[j] + w.ins,        // insert into a (extra char in b)
                                v0[j + 1] + w.del,    // delete from a
                                v0[j] + costSub       // substitute / match
                        );
                }
                for (let j = 0; j <= bl; j++) v0[j] = v1[j];
        }
        return v1[bl];
}

/**
 * Solve the assignment (player i -> row j) minimizing total integer costs.
 * @param {number[][]} cost - NxN matrix where cost[i][j] is the cost to map player i to row j
 * @returns {number[]} assignment array A of length N where A[i] = j (row index for player i)
 */
function solveAssignmentDP(cost) {
        const n = cost.length, SIZE = 1 << n;
        /** @type {number[]} */ const dp = new Array(SIZE).fill(Infinity);
        /** @type {number[]} */ const parent = new Array(SIZE).fill(-1);
        /** @type {number[]} */ const choice = new Array(SIZE).fill(-1);
        dp[0] = 0;

        for (let mask = 0; mask < SIZE; mask++) {
                const i = popcount(mask);                 // next player index
                if (i >= n) continue;
                const base = dp[mask] ?? NaN;
                for (let j = 0; j < n; j++) {
                        if (mask & (1 << j)) continue;          // row j already used
                        const cell = cost[i]?.[j] ?? NaN;
                        const m2 = mask | (1 << j);
                        const val = base + cell;
                        if (val < (dp[m2] ?? NaN)) {
                                dp[m2] = val;
                                parent[m2] = mask;
                                choice[m2] = j;
                        }
                }
        }

        // reconstruct
        const assign = new Array(n).fill(-1);
        let mask = SIZE - 1;
        for (let i = n - 1; i >= 0; i--) {
                const j = choice[mask];
                assign[i] = j;
                mask = parent[mask] ?? NaN;
        }
        return assign;
}

let _worker = /** @type {any} */(null);
async function getWorker() {
        if (_worker) return _worker;
        _worker = await Tesseract.createWorker('eng', 1, { logger: () => { } }, { load_system_dawg: 'F', load_freq_dawg: 'F' });
        return _worker;
}

const scratch = document.createElement('canvas');

/**
 * Core API — kicks off capture, OCR, fuzzy match, optional manual resolve, then resolves placements.
 * @param {HTMLCanvasElement} canvas
 * @param {Rect[]} nameRects
 * @param {Roster} roster
 * @param {boolean} teamMode
 * @returns {Promise<Placement[]>}
 */
export async function processResultsScreen(canvas, nameRects, roster, teamMode=false) {
        const dbg = isDebugMode() ? startNewDebugReport() : null;
        const whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -',
                levCosts = { ins: 3, del: 1, sub: 2 },
                maxEditDistance = 10;
        if( dbg ) {
                dbg.teamMode = teamMode;
                dbg.canvasWidth = canvas.width;
                dbg.canvasHeight = canvas.height;
                dbg.canvasSnapshotUrl = await snapshotBlobUrlFromCanvas(canvas);
                dbg.whitelist = whitelist;
                dbg.levCosts = levCosts;
                dbg.maxEditDistance = maxEditDistance;
        }

        const worker = await getWorker();
        await worker.setParameters({
                tessedit_char_whitelist: whitelist,
                preserve_interword_spaces: '1',
                tessedit_do_invert: '1',
                textord_heavy_nr: '0',
                tessedit_pageseg_mode: '6' // SINGLE_BLOCK
        });

        /** @type {{ text:string, confidence:number }[]} */
        const rawRows = [];
        for ( let idx = 0; idx < nameRects.length; idx++ ) {
                const rect = nameRects[idx];
                const { canvas: img, whiteRatio } = preprocessCrop(canvas, rect, 1, scratch, teamMode);
                if (whiteRatio < 0.01 || whiteRatio > 0.3) {
                        // nothing found, skip
                        rawRows.push({ text: '', confidence: 0 });
                        if( dbg ) dbg.rows.push({
                                idx, rect, whiteRatio,
                                rectSnapshotUrl: await snapshotBlobUrlFromCanvas(img),
                                ocrText: '', confidence: 0,
                                normalized: '', wasBlank: true,
                                assignedTo: null, assignedDistance: 0,
                                disconnected: true, revokedAssign: false
                        });
                        continue;
                }
                const { data } = await worker.recognize(img);
                const best = (data?.text ?? '').replace(/\s+/g, ' ').trim();
                const conf = (data && Number.isFinite(data.confidence)) ? data.confidence : 0;
                rawRows.push({ text: best, confidence: conf });
                if( dbg ) dbg.rows.push({
                        idx, rect, whiteRatio,
                        rectSnapshotUrl: await snapshotBlobUrlFromCanvas(img),
                        ocrText: best, confidence: Math.round(conf),
                        normalized: normalizeName(best), wasBlank: false,
                        assignedTo: null, assignedDistance: 0,
                        disconnected: false, revokedAssign: false
                });
        }

        // Prepare normalized data
        const rosterArray = [...roster];
        const placements = rawRows.map((row, i) => new Placement(i + 1, null, row.text, row.text, Math.round(row.confidence), false));
        const normRows = rawRows.map(r => normalizeName(r.text));

        // Early exit if 2+ blanks
        if (normRows.filter(s => !s).length > 2) {
                if( dbg ) dbg.outcome = 'no_scoreboard';
                const err = new Error('No scoreboard detected');
                // @ts-ignore add a code for easy identification
                err.code = 'NO_SCOREBOARD';
                throw err;
        }

        // Build an integer cost matrix: players (rows) × OCR rows (cols)
        const N = rosterArray.length; // expect 12
        const isBlankCol = normRows.map(s => !s);

        // Use IGN if available, else roster name, for each player
        const targetNorm = rosterArray.map(p => normalizeName(p.activePlayer.ign));

        /** @type {number[][]} */
        const cost = Array.from({ length: N }, () => Array(N).fill(0));

        let maxNonBlankCost = 0;
        // Pass 1: fill non-blank base costs and track the maximum seen
        for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                        if (isBlankCol[j]) continue;
                        const d = levenshteinWeighted(targetNorm[i], normRows[j], levCosts);
                        cost[i][j] = d;
                        if (d > maxNonBlankCost) maxNonBlankCost = d;
                }
        }
        if( dbg ) dbg.maxNonBlankCost = maxNonBlankCost;

        // Choose penalties
        const BLANK_COST = maxNonBlankCost + 2;        // blanks are strictly worse than any non-blank match
        const IGN_MISMATCH_PENALTY = maxNonBlankCost + 50; // big stick for stealing someone else's IGN
        if( dbg ) {
                dbg.blankCost = BLANK_COST;
                dbg.ignMismatchPenalty = IGN_MISMATCH_PENALTY;
        }

        // Pass 2: assign blank costs
        for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                        if (isBlankCol[j]) cost[i][j] = BLANK_COST;
                }
        }

        // Pass 3: if a row exactly matches a known IGN, heavily penalize assigning it to anyone else.
        for (let j = 0; j < N; j++) {
                if (isBlankCol[j]) continue;
                const owner = targetNorm.indexOf(normRows[j]);
                if (owner < 0) continue;
                for (let i = 0; i < N; i++) {
                        if (i === owner) continue;
                        cost[i][j] += IGN_MISMATCH_PENALTY;
                }
        }
        if( dbg ) dbg.costMatrix = cost.map(row=>[...row]); // deep copy to preserve original state

        // Solve globally: which OCR row should each player map to?
        const assign = solveAssignmentDP(cost);
        if( dbg ) dbg.assignment = [...assign];

        // Apply assignment (invert to fill per-row placements) and record distances
        /** @type {number[]} */ const assignedDist = new Array(N).fill(0);
        for (let i = 0; i < N; i++) {
                const j = assign[i];
                placements[j] = placements[j].withPlayerIdAndResolvedName(rosterArray[i].id, rosterArray[i].activePlayer.name);
                assignedDist[j] = cost[i][j];
                if( dbg && dbg.rows[j] ) {
                        dbg.rows[j].assignedTo = rosterArray[i].id;
                        dbg.rows[j].assignedDistance = assignedDist[j];
                }
        }

        // Ambiguity handling:
        //  - Mark blank rows as disconnected
        //  - If a row has *non-blank* OCR and its assigned distance exceeds maxEditDistance, revoke assignment
        for (let j = 0; j < N; j++) {
                const isBlank = !normRows[j];
                if (isBlank) {
                        placements[j] = placements[j].withPlacement(placements[j].placement, true);
                        if( dbg && dbg.rows[j] ) dbg.rows[j].disconnected = true;
                }
                else if (assignedDist[j] > maxEditDistance) {
                        placements[j] = placements[j].withPlayerIdAndResolvedName(null, placements[j].ocrText);
                        if( dbg && dbg.rows[j] ) dbg.rows[j].revokedAssign = true;
                }
        }

        // If anything is unresolved, try matching by initials/prefix before
        // resorting to the manual resolver.
        if (placements.some(p => !p.playerId)) {
                // --- LIVELLO EXTRA: matching per iniziali/prefissi ---
                // Per ogni riga non assegnata (con OCR text non blank), cerchiamo
                // un player non assegnato il cui nome Lounge o IGN inizia con le
                // stesse lettere del nome OCR (case-insensitive). Richiediamo
                // almeno 3 caratteri comuni all'inizio (o il nome intero se più
                // corto). Evita match ambigui: se più player matchano, salta.
                const unassignedRows = placements
                        .map((p, idx) => ({ p, idx }))
                        .filter(x => !x.p.playerId && x.p.ocrText && x.p.ocrText.trim());

                for (const { idx } of unassignedRows) {
                        const ocrNorm = normalizeName(placements[idx].ocrText);
                        if (!ocrNorm) continue;
                        const ocrLower = ocrNorm.toLowerCase();

                        // Trova tutti i player non assegnati che matchano per prefisso
                        const candidates = rosterArray.filter(p =>
                                !placements.some(r => r.playerId === p.id)
                        ).filter(p => {
                                // Prova IGN normalizzato e nome Lounge normalizzato
                                const ignNorm = normalizeName(p.activePlayer.ign).toLowerCase();
                                const nameNorm = normalizeName(p.activePlayer.name).toLowerCase();
                                const minLen = 3;
                                // Match se uno dei due nomi è un prefisso dell'altro
                                // (almeno minLen caratteri condivisi all'inizio).
                                const matches = (a, b) => {
                                        if (!a || !b) return false;
                                        const len = Math.min(a.length, b.length, minLen);
                                        if (len < 1) return false;
                                        return a.slice(0, len) === b.slice(0, len);
                                };
                                return matches(ocrLower, ignNorm) || matches(ocrLower, nameNorm);
                        });

                        if (candidates.length === 1) {
                                // Match univoco: assegna
                                const player = candidates[0];
                                placements[idx] = placements[idx].withPlayerIdAndResolvedName(player.id, player.activePlayer.name);
                                if (dbg && dbg.rows[idx]) {
                                        dbg.rows[idx].assignedTo = player.id;
                                        dbg.rows[idx].assignedDistance = -1; // segnala matching per iniziali
                                }
                                console.debug(`[ocr] Matching per iniziali: "${placements[idx].ocrText}" → ${player.activePlayer.name}`);
                        } else if (candidates.length > 1) {
                                // Match ambiguo: non assegnare, lascia al manualResolve
                                console.debug(`[ocr] Matching per iniziali ambiguo per "${placements[idx].ocrText}": ${candidates.length} candidati, salto.`);
                        }
                }
        }

        // If anything is STILL unresolved after Levenshtein + matching per iniziali,
        // NON apriamo piu' il manualResolve dialog (l'utente lo ha richiesto:
        // non vuole essere forzato a selezionare). Lasciamo i placement con
        // playerId = null ma resolvedName = ocrText (preservato). L'utente potra'
        // assegnare i nomi manualmente dall'Edit Roster tramite la dropdown
        // dedicata (vedi edit-roster-dialog.js).
        if (placements.some(p => !p.playerId)) {
                const remaining = rosterArray.filter(p => !placements.some(r => r.playerId === p.id));
                if (remaining.length === 1) {
                        // One mismatch: just auto-assign it
                        const missingIndex = placements.findIndex(p => !p.playerId);
                        placements[missingIndex] = placements[missingIndex].withPlayerIdAndResolvedName(remaining[0].id, remaining[0].activePlayer.name);
                }
                // Altrimenti: restituiamo i placement parziali. L'Edit Roster
                // mostra una dropdown per ogni player non assegnato, dove
                // l'utente puo' selezionare manualmente il nome OCR corretto.
                // Niente piu' dialog "unmatched player" forzato.
        }

        if( dbg ) {
                dbg.outcome = 'success';
                dbg.finalPlacements = placements.map((p,row) => ({place: row+1, playerId: p.playerId, resolvedName: p.resolvedName}));
        }

        return placements;
}
