import { Config } from "../util.js";

const THEMES = ["glass", "clean", "fluid"];
const KEY = "theme";

const FLUID_HUES = ["ocean", "rose", "ember", "sun", "lime", "violet"];
const FLUID_KEY = "fluidHue";

/** Applica il tema al <html> (solo cambio attributo → solo CSS, zero costo JS). */
export function applyTheme(theme) {
        // Migrazione: chi aveva "gelato" (rimosso in v4.1) torna a glass.
        let t = THEMES.includes(theme) ? theme : "glass";
        if (theme === "gelato") t = "glass";
        document.documentElement.dataset.theme = t;
        syncFluidHueVisibility();
        return t;
}

/** Applica la variante colore del Fluid (solo data-attribute → solo CSS). */
export function applyFluidHue(hue) {
        const h = FLUID_HUES.includes(hue) ? hue : "ocean";
        document.documentElement.dataset.fluid = h;
        return h;
}

/** Legge tema + hue salvati (default glass/ocean) e li applica subito (anti-flash). */
export function initTheme() {
        applyFluidHue(Config.get(FLUID_KEY, "ocean"));
        return applyTheme(Config.get(KEY, "glass"));
}

/** Mostra il selettore hue solo quando il tema è fluid. */
function syncFluidHueVisibility() {
        const sel = document.getElementById("fluidHue");
        if (!sel) return;
        const isFluid = document.documentElement.dataset.theme === "fluid";
        sel.style.display = isFluid ? "" : "none";
}

/**
 * Collega il <select id="theme">: cambio → applica + salva.
 * @param {HTMLSelectElement|null} themeSelect
 */
export function setupThemeSwitcher(themeSelect) {
        if (themeSelect) {
                const current = Config.get(KEY, "glass");
                themeSelect.value = THEMES.includes(current) ? current : "glass";
                themeSelect.addEventListener("change", () => {
                        const t = applyTheme(themeSelect.value);
                        Config.set(KEY, t);
                });
        }
        const hueSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById("fluidHue"));
        if (hueSelect) {
                const hue = Config.get(FLUID_KEY, "ocean");
                hueSelect.value = FLUID_HUES.includes(hue) ? hue : "ocean";
                hueSelect.addEventListener("change", () => {
                        Config.set(FLUID_KEY, applyFluidHue(hueSelect.value));
                });
        }
        syncFluidHueVisibility();
}
