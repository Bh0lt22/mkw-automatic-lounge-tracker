/**
 * If the URL query string includes `debug=1`, we're in debug mode.
 */
export function isDebugMode() {
        return new URLSearchParams(window.location.search).get('debug') === '1';
}

/**
 * Popcount for 32-bit masks
 * @param {number} x
 * @see https://graphics.stanford.edu/~seander/bithacks.html
 */
export function popcount(x) { let c = 0; for (; x; x &= x - 1) c++; return c; }

/**
 * @param {HTMLCanvasElement} el
 * @param {CanvasRenderingContext2DSettings} [options]
 * @returns {CanvasRenderingContext2D}
 */
export function ctx2d(el, options = {}) {
        const ctx = el.getContext('2d', options);
        if (!ctx) throw new Error('2D context unavailable');
        return ctx;
}

/**
 * @param {number} n
 */
export function toLetter(n) {
        return String.fromCharCode('A'.charCodeAt(0) + n - 1);
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
export function rgb2hsv(r, g, b) {
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const h = (max === min ? 0 : max === r ? (g - b) / (max - min) : max === g ? 2 + (b - r) / (max - min) : 4 + (r - g) / (max - min)) * 60;
        const s = max === 0 ? 0 : (max - min) / max;
        const v = max / 255;
        return [h, s, v];
}

export const Config = {
        /**
         * @param {string} key
         * @param {string} [def]
         */
        get: (key, def='') => localStorage.getItem(key) ?? def,
        /**
         * @param {string} key
         * @param {string} value
         */
        set: (key, value) => localStorage.setItem(key, value),
};

/**
 * Directional, weighted edit distance from a -> b. Costs are integers.
 * Copia dell'algoritmo in src/ocr.js (esposta per riutilizzo in mogi.js
 * per rematchAllRaces).
 *
 * @param {string} a
 * @param {string} b
 * @param {{ins:number, del:number, sub:number}} w
 * @returns {number}
 */
export function levenshteinWeighted(a, b, w = { ins: 1, del: 1, sub: 1 }) {
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
                                v1[j] + w.ins,
                                v0[j + 1] + w.del,
                                v0[j] + costSub
                        );
                }
                for (let j = 0; j <= bl; j++) v0[j] = v1[j];
        }
        return v1[bl];
}

/**
 * Solve assignment problem: given N×N cost matrix, find assignment of
 * rows → cols minimizing total cost. Returns array A where A[i] = col
 * assigned to row i. Same algorithm as in src/ocr.js.
 *
 * @param {number[][]} cost N×N matrix
 * @param {number} n size
 * @returns {number[]}
 */
export function solveAssignmentDP(cost, n) {
        const SIZE = 1 << n;
        /** @type {number[]} */ const dp = new Array(SIZE).fill(Infinity);
        /** @type {number[]} */ const parent = new Array(SIZE).fill(-1);
        /** @type {number[]} */ const choice = new Array(SIZE).fill(-1);
        dp[0] = 0;

        for (let mask = 0; mask < SIZE; mask++) {
                const i = popcount(mask);
                if (i >= n) continue;
                const base = dp[mask] ?? NaN;
                for (let j = 0; j < n; j++) {
                        if (mask & (1 << j)) continue;
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

        const assign = new Array(n).fill(-1);
        let mask = SIZE - 1;
        for (let i = n - 1; i >= 0; i--) {
                const j = choice[mask];
                assign[i] = j;
                mask = parent[mask] ?? NaN;
        }
        return assign;
}
