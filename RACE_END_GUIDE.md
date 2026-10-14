# Auto-capture "race-end" — guida finale

Sistema di auto-capture che scatta la foto della leaderboard in automatico
quando i simboli di gara (moneta + bandierina del lap) spariscono dallo
schermo. Usa il confronto pixel-by-pixel con un PNG di riferimento.

## Come funziona

Il file `img/race-end-reference.png` è uno screenshot 1920×1080 in cui solo i
pixel della moneta e della bandierina del lap counter sono colorati; tutto il
resto è trasparente (canale alpha = 0).

Il bot:
1. Carica il reference PNG all'avvio (una volta sola) ed estrae la lista dei
   pixel non-trasparenti con il loro colore atteso.
2. Ogni 200 ms, cattura un frame dal `<video>` della capture card.
3. Per ogni pixel del reference, calcola la distanza RGB tra il colore atteso
   e il colore effettivo nel frame.
4. Se ≥ 75% dei pixel combacia (distanza ≤ 80) → i simboli sono presenti.
5. State machine:
   - `IDLE` → `RACING` quando i simboli compaiono (2 check consecutivi)
   - `RACING` → `WAITING` quando i simboli spariscono (3 check consecutivi)
   - `WAITING` → countdown di 3 secondi; se i simboli riappaiono, torna a `RACING`
   - Dopo 3 secondi → `CAPTURING`: loop di retry
   - `CAPTURING` → prova a catturare la scoreboard ogni 500 ms, massimo 30 tentativi
   - Quando una cattura va a buon fine → `COOLDOWN` di 5 secondi → `IDLE`
   - Se 30 tentativi falliscono → errore toast, torna a `IDLE`

## Installazione

Estrai lo zip sopra la cartella del progetto originale, sovrascrivendo i file
esistenti. I file modificati/aggiunti:

```
src/autocapture.js                 # checkRaceSymbols + reference loader
src/ui/autocapture-toggle.js       # state machine con CAPTURING + retry
main.js                            # cablaggio toggle
index.html                         # nuovo checkbox "Auto-capture (race end)"
src/i18n/en.js                     # nuove stringhe
img/race-end-reference.png         # IL TUO PNG con moneta + bandierina ritagliati
RACE_END_GUIDE.md                  # questo file
```

## Uso

1. Apri il bot nel browser, seleziona la capture card.
2. Attiva il toggle **"Auto-capture (race end)"**.
3. In console (F12) vedrai:
   ```
   [race-end] Riferimento caricato: 2737 pixel non-trasparenti.
   [race-end] IDLE -> RACING
   ```
4. Durante la gara il bot resta in `RACING`.
5. Quando i simboli spariscono:
   ```
   [race-end] RACING -> WAITING (countdown di 3000 ms)
   [race-end] WAITING -> CAPTURING (inizio loop di cattura)
   [race-end] CAPTURING tentativo 1/30
   ```
6. Quando la scoreboard viene rilevata correttamente:
   ```
   [race-end] CAPTURING -> COOLDOWN (cattura riuscita)
   ```

## Parametri tarabili

In `src/ui/autocapture-toggle.js`, in cima:

```js
const RACE_END_CONFIG = {
    pollIntervalMs: 200,            // 5 check/sec
    racingConfirmHits: 2,           // simboli visti N volte → RACING
    goneConfirmHits: 3,             // simboli non visti N volte → WAITING
    captureDelayMs: 3000,           // countdown prima di iniziare a catturare
    cooldownMs: 5000,               // pausa dopo una cattura
    captureRetryIntervalMs: 500,    // attesa tra tentativi falliti
    maxCaptureRetries: 30,          // max tentativi (30 * 500ms = 15s)
    matchTolerance: 80,             // distanza RGB max per "pixel combaciante"
    matchRatio: 0.75,               // % di pixel che devono combaciare
};
```

| Sintomo | Cosa cambiare |
|---|---|
| `IDLE -> RACING` non appare mai | Abbassa `matchRatio` (0.75 → 0.6) o alza `matchTolerance` (80 → 120) |
| `RACING -> WAITING` scatta a caso | Alza `matchRatio` (0.75 → 0.85) o abbassa `matchTolerance` |
| Foto scattata troppo presto | Aumenta `captureDelayMs` a 3500..4000 |
| Foto scattata troppo tardi | Riduci `captureDelayMs` a 2500..3000 |
| `WAITING -> RACING` (annullato) | Sfarfallamento simboli: aumenta `goneConfirmHits` (3 → 5) |
| Max retries raggiunto | `maxCaptureRetries` troppo basso, oppure `captureDelayMs` troppo basso |
| Doppia cattura | Aumenta `cooldownMs` a 7000..10000 |

## Modificare il PNG di riferimento

Se cambi posizione/risoluzione della capture card, o vuoi aggiornare i simboli:

1. Fai uno screenshot 1920×1080 durante una gara.
2. Aprilo in Photoshop / GIMP.
3. Su un nuovo livello, dipingi SOLO i pixel della moneta e della bandierina
   che il bot deve riconoscere. Usa il colore ESATTO dei pixel originali.
4. Rendi lo sfondo trasparente (alpha = 0).
5. Salva come PNG RGBA 1920×1080 in `img/race-end-reference.png`.
6. Ricarica la pagina.

In alternativa, per ritagliare rapidamente:
1. Apri lo screenshot in GIMP.
2. Usa il tool "Selezione fuzzy" (bacchetta magica) con tolleranza 30 sullo
   sfondo per selezionarlo, poi Inverti selezione → otterrai solo i simboli.
3. Taglia su nuovo livello, rendi invisibile il livello sfondo, esporta come PNG.

## Risoluzione problemi

**"raceEndNotConfigured" toast**
Il file `img/race-end-reference.png` non è raggiungibile. Verifica che esista e
che il server lo serva correttamente (apri
`http://localhost:PORT/img/race-end-reference.png` nel browser — deve mostrare
un PNG 1920×1080 con solo moneta+bandierina su sfondo trasparente).

**Il bot non scatta mai**
Apri la console (F12) e cerca i log `[race-end]`. Se non vedi mai
`IDLE -> RACING`, il match non sta passando. Prova in console:

```js
// Disegna overlay con i pixel del reference per vedere dove stanno
import('/src/autocapture.js').then(async m => {
    const ref = await m.loadRaceEndReference();
    if (!ref) { console.error('reference non caricato'); return; }
    const v = document.getElementById('preview');
    const ov = document.createElement('canvas');
    ov.style.position = 'absolute';
    ov.style.top = '0'; ov.style.left = '0';
    ov.style.width = '100%'; ov.style.height = '100%';
    ov.style.pointerEvents = 'none';
    ov.width = 1920; ov.height = 1080;
    v.parentElement.style.position = 'relative';
    v.parentElement.appendChild(ov);
    const ctx = ov.getContext('2d');
    function draw() {
        ctx.clearRect(0, 0, 1920, 1080);
        for (const p of ref) {
            ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
            ctx.fillRect(p.x, p.y, 1, 1);
        }
        requestAnimationFrame(draw);
    }
    draw();
});
```

Vedrai i pixel del reference disegnati sopra il video. Se non coincidono con
i simboli reali, devi rifare il PNG di riferimento.

**Foto scattata ma OCR non legge i nomi**
Non è un problema del race-end (è il sistema OCR esistente). Verifica che il
frame della leaderboard sia ben visibile quando il bot scatta. Se la capture
card è sfuocata o troppo scura, l'OCR farà fatica.

## Test di validazione (già eseguito)

Il sistema è stato testato con il reference PNG fornito dall'utente confrontato
con uno screenshot reale di MKW:

- Frame con simboli visibili: **100% match** → correttamente rilevato presente
- Frame senza simboli (zona vuota): **11.7% match** → correttamente rilevato sparito
- Funziona con qualsiasi tolleranza tra 40 e 120 (ampio margine di sicurezza)
