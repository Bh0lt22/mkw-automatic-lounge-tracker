import { t } from "../i18n/i18n.js";
import { Roster, ROSTER_SIZE } from "../roster.js";
import { error, success } from "./toast.js";

function makeDialog() {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
                <form method="dialog" class="modal">
                        <h3>${t('rosterSetup.title')}</h3>
                        <p class="muted">${t('rosterSetup.instructions', { count: ROSTER_SIZE })}</p>
                        <textarea rows="${ROSTER_SIZE}" placeholder="1. Player1, Player2&#xA;2. Player3, Player4&#xA;...&#xA;&#xA;-- or with MMR/tier --&#xA;&#xA;Tier A&#xA;1. Player1, Player2 (9999 MMR)&#xA;...&#xA;&#xA;-- or for a war --&#xA;&#xA;WAR - Tag1 vs Tag2&#xA;1. P1, P2, P3, P4, P5, P6&#xA;2. P7, P8, P9, P10, P11, P12"></textarea>
                        <footer>
                                <button type="button" data-act="close">${t('cancel')}</button>
                                <button type="button" data-act="confirm" class="btn--primary">${t('confirm')}</button>
                        </footer>
                </form>
        `;
        const input = /** @type {HTMLTextAreaElement} */(dialog.querySelector('textarea'));
        const confirm = /** @type {HTMLButtonElement} */(dialog.querySelector('button[data-act=confirm]'));
        const close = /** @type {HTMLButtonElement} */(dialog.querySelector('button[data-act=close]'));
        document.body.append(dialog);
        dialog.addEventListener('close', () => dialog.remove());
        close.addEventListener('click', () => dialog.close());
        return { dialog, input, confirm };
}

/**
 * @param {HTMLButtonElement} btn
 * @returns {Promise<Roster>}
 */
export function requestRoster(btn) {
        return new Promise(resolve => {
                btn.addEventListener('click', () => {
                        const { dialog, input, confirm } = makeDialog();
                        dialog.showModal();
                        input.focus();
                        confirm.addEventListener('click', () => {
                                try {
                                        const roster = Roster.parse(input.value);
                                        if( !roster.full ) throw new Error(t('rosterSetup.wrongLength', { count: ROSTER_SIZE, actual: roster.size }));
                                        dialog.close();
                                        success(t('rosterSetup.rosterLoaded'));
                                        resolve(roster);
                                } catch(err) {
                                        error(/** @type {any} */(err).message || err);
                                }
                        });
                });
        });
}
