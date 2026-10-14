/** @typedef {import("./race.js").Placement} Placement */

import { t } from "./i18n/i18n.js";
import { normalizeName, Player } from "./player.js";

export const ROSTER_SIZE = 12;

export class Roster {
        /** @type {string} */
        #tier;
        get tier() { return this.#tier; }

        /** @type {boolean} */
        #isWar = false;
        get isWar() { return this.#isWar; }

        /** @type {string[]} */
        #warTags = [];
        get warTags() { return this.#warTags; }

        /** @param {string} tier */
        constructor(tier) {
                this.#tier = tier;
        }

        /** @type {Player[]} */
        #roster = [];

        /** @param {Player} player */
        add(player) {
                if (this.full) throw new Error('Roster is full');
                this.#roster.push(player);
        }

        get size() { return this.#roster.length; }
        get full() { return this.#roster.length === ROSTER_SIZE; }
        [Symbol.iterator]() { return this.#roster.toSorted((a, b) => a.seed - b.seed)[Symbol.iterator](); }

        /** @param {string} id */
        byId(id) { return this.#roster.find(p => p.id === id); }

        /** @param {Placement[]} placements */
        lockIGNsFromPlacements(placements) {
                for (const row of placements){
                        if( !row.playerId) continue;
                        const ply = this.byId(row.playerId);
                        if (!ply) continue;
                        const raw = row.ocrText.trim();
                        const norm = normalizeName(raw);
                        if (!norm) continue;
                        ply.activePlayer.ign = raw;
                }
        }

        /** @param {string} input */
        static parse(input) {
                const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                const first = lines.shift();

                const warHeader = first?.match(/^WAR\s*-\s*(.+?)\s+vs\s+(.+)$/i);
                if (warHeader) {
                        const tags = [warHeader[1].trim(), warHeader[2].trim()];
                        const roster = new Roster('WAR');
                        roster.#isWar = true;
                        const re = /^(\d+)\.\s+(.+)$/;
                        for (const line of lines) {
                                const m = re.exec(line);
                                if (!m) throw new Error(t('rosterSetup.badLine', { line }));
                                const seed = Number(m[1]);
                                if (seed < 1 || seed > 2) throw new Error(t('rosterSetup.badLine', { line }));
                                const names = String(m[2]).split(',').map(x => x.trim()).filter(Boolean);
                                if (names.length !== 6) throw new Error(t('rosterSetup.badLine', { line }));
                                for (let i = 0; i < names.length; i++) {
                                        const player = new Player(`seed-${seed}-${i}`, names[i], seed, 0);
                                        roster.add(player);
                                }
                        }
                        roster.#warTags = tags;
                        return roster;
                }

                // Prova prima il formato completo (Tier X + N. Names (NNN MMR)).
                // Se la prima riga matcha "Tier X", usa il parsing completo.
                const tier = first?.match(/(?:^|\s)Tier\s+(\w+)$/i);
                if (tier) {
                        const roster = new Roster(tier[1]);
                        // Regex flessibile: accetta con o senza MMR.
                        const re = /^(\d+)\.\s+(.*?)(?:\s+\((\d+)\s*MMR\))?$/i;
                        for (const line of lines) {
                                const m = re.exec(line);
                                if (!m) throw new Error(t('rosterSetup.badLine', { line }));
                                const seed = Number(m[1]);
                                const names = String(m[2]).split(',').map(x => x.trim()).filter(Boolean);
                                const mmr = m[3] ? Number(m[3]) : 0;
                                for (let i = 0; i < names.length; i++) {
                                        const player = new Player(`seed-${seed}-${i}`, names[i], seed, mmr);
                                        roster.add(player);
                                }
                        }
                        return roster;
                }

                // Formato semplice: solo righe "N. Name1, Name2" senza tier/MMR.
                // La prima riga DEVE essere "1. ...".
                if (first && /^\d+\.\s+/.test(first)) {
                        const roster = new Roster('?');
                        const allLines = [first, ...lines];
                        const re = /^(\d+)\.\s+(.*?)(?:\s+\((\d+)\s*MMR\))?$/i;
                        for (const line of allLines) {
                                const m = re.exec(line);
                                if (!m) throw new Error(t('rosterSetup.badLine', { line }));
                                const seed = Number(m[1]);
                                const names = String(m[2]).split(',').map(x => x.trim()).filter(Boolean);
                                const mmr = m[3] ? Number(m[3]) : 0;
                                for (let i = 0; i < names.length; i++) {
                                        const player = new Player(`seed-${seed}-${i}`, names[i], seed, mmr);
                                        roster.add(player);
                                }
                        }
                        return roster;
                }

                throw new Error(t('rosterSetup.badLine', { line: first || '' }));
        }
}
