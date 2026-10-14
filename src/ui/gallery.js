/** @typedef {import("../mogi.js").Mogi} Mogi */

import { fmt, t } from "../i18n/i18n.js";
import { RACE_COUNT } from "../mogi.js";

/**
 * @param {HTMLDivElement} raceGallery
 * @param {Mogi} mogi
 */
export function connectGallery(raceGallery, mogi) {
        console.log('[gallery] connectGallery chiamata. raceGallery=', raceGallery, 'mogi=', mogi);
        if (!raceGallery) {
                console.error('[gallery] raceGallery è NULL! Impossibile popolare la gallery.');
                return;
        }
        mogi.addEventListener('update', () => {
                console.log('[gallery] evento update ricevuto. races.length=', mogi.races.length);
                try {
                        raceGallery.innerHTML = '';
                        const races = mogi.races;
                        for( let i=0; i<RACE_COUNT; i++) {
                                const race = i < races.length ? races[i] : null;
                                const a = document.createElement('a');
                                if( race) {
                                        a.href = race.snapshotUrl; a.target = '_blank'; a.rel = 'noreferrer';
                                }
                                const img = document.createElement('img');
                                img.alt = t('gallery.imageAltText', { number: i + 1 });
                                img.src = race ? race.snapshotUrl : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';
                                const cap = document.createElement('div');
                                cap.className = 'cap';
                                cap.textContent = t('gallery.imageCaption', { number: i + 1, time: race ? fmt.time(new Date(race.timestamp)) : t('blank') });
                                a.append(img, cap);
                                raceGallery.appendChild(a);
                        }
                        console.log('[gallery] popolata con', RACE_COUNT, 'thumbnail.');
                } catch (e) {
                        console.error('[gallery] ERRORE durante il popolamento:', e);
                }
        });
}
