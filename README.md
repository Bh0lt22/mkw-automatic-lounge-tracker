# MKW Mogi Manager (con auto-capture race-end)

Fork di [PFQNiet/mkw-lounge-tracker](https://github.com/PFQNiet/mkw-lounge-tracker)
con un nuovo sistema di auto-capture che scatta automaticamente la foto della
leaderboard quando i simboli di gara (moneta + bandierina del lap) spariscono
dallo schermo.

## Avvio rapido (localhost)

### Requisiti

- [Node.js](https://nodejs.org/) versione 14 o superiore
- Una capture card collegata alla Switch, con output configurato come webcam
  virtuale (OBS Virtual Camera o equivalente)

### Avviare il server

Apri il terminale nella cartella del progetto ed esegui:

```bash
node server.js
```

Oppure (equivalente):

```bash
npm start
```

Vedrai in console:

```
┌────────────────────────────────────────────────────────────┐
│  MKW Lounge Tracker — server locale                       │
├────────────────────────────────────────────────────────────┤
│  Apri nel browser:  http://localhost:8000                  │
│  Per fermare il server: Ctrl+C                            │
└────────────────────────────────────────────────────────────┘
```

Apri **http://localhost:8000** nel browser (Chrome o Firefox consigliati).

Per usare una porta diversa:

```bash
PORT=9000 node server.js
```

Non serve `npm install`: il server usa solo moduli nativi di Node.

### Fermare il server

Nel terminale: `Ctrl+C`

## Come usare il bot

### Setup iniziale (una volta sola per sessione)

1. Apri http://localhost:8000 nel browser.
2. **Incolla la lista partecipanti** fornita dal bot Lounge Discord nel campo
   in alto (es. `1. Name1, Name2 (12345 MMR)` per un 2v2).
3. Clicca **Start**.
4. **Seleziona la video device** (la webcam virtuale di OBS collegata alla
   capture card).
5. *(Opzionale)* Usa il **Pause Menu** in game e clicca **Auto-fill** per far
   imparare al bot i nomi dei giocatori in anticipo.

### Durante le gare — modalità automatica (NUOVA)

1. Attiva il toggle **"Auto-capture (race end)"** in alto.
2. Verifica in console (F12) che appaia:
   ```
   [race-end] Riferimento caricato: 2737 pixel non-trasparenti.
   [race-end] IDLE -> RACING
   ```
   quando inizia la prima gara.
3. Gioca normalmente. A fine gara, quando i simboli della moneta e della
   bandierina scompaiono:
   ```
   [race-end] RACING -> WAITING (countdown di 3000 ms)
   [race-end] WAITING -> CAPTURING (inizio loop di cattura)
   [race-end] CAPTURING tentativo 1/30
   ```
4. Il bot prova a catturare la scoreboard ogni 500 ms, massimo 30 tentativi
   (15 secondi). Quando la scoreboard viene rilevata correttamente:
   ```
   [race-end] CAPTURING -> COOLDOWN (cattura riuscita)
   ```

### Durante le gare — modalità manuale (originale)

1. Lascia disattivato il toggle "Auto-capture (race end)".
2. Quando la **race results screen** è visibile (prima che diventi session
   rankings), clicca **Capture** oppure usa il toggle **"Auto-capture"**
   (scatta quando rileva il simbolo Home della cattura Switch).

### Fine sessione

1. Dopo 12 gare, **Finish Session**.
2. Esporta con **Discord Export** (copia i punteggi per Lounge) oppure
   **Full Export** (ZIP con tutti i dati e screenshot).

## Come funziona l'auto-capture race-end

Il file `img/race-end-reference.png` è uno screenshot 1920×1080 RGBA dove solo
i pixel della moneta e della bandierina del lap counter sono colorati; il
resto è trasparente (alpha = 0).

Il bot:
1. Carica il PNG una volta sola all'avvio, estraendo i pixel non-trasparenti.
2. Ogni 200 ms cattura un frame dal `<video>` della capture card.
3. Confronta SOLO i pixel del reference con i pixel corrispondenti del frame.
4. Se ≥ 75% dei pixel combacia (distanza RGB ≤ 80) → simboli presenti.
5. State machine:
   - `IDLE` → `RACING` quando i simboli compaiono
   - `RACING` → `WAITING` quando spariscono (3 check consecutivi)
   - `WAITING` → countdown di 3 secondi, annulla se riappaiono
   - `CAPTURING` → loop di retry ogni 500 ms, max 30 tentativi
   - `COOLDOWN` → 5 secondi dopo una cattura, poi torna a `IDLE`

## Personalizzare il PNG di riferimento

Se cambi capture card, risoluzione, o vuoi aggiornare i simboli:

1. Fai uno screenshot 1920×1080 durante una gara (dal `<video>` del browser,
   non dalla Switch direttamente — vedi snippet in `RACE_END_GUIDE.md`).
2. Aprilo in Photoshop / GIMP.
3. Seleziona e ritaglia SOLO i pixel della moneta e della bandierina.
4. Mettili su un livello, rendi trasparente lo sfondo.
5. Salva come PNG RGBA 1920×1080 in `img/race-end-reference.png`.
6. Ricarica la pagina.

Per verificare visivamente dove si aspetta i simboli il bot, esegui in console
(F12) lo snippet in `RACE_END_GUIDE.md` → sezione "Risoluzione problemi".

## Parametri tarabili

In `src/ui/autocapture-toggle.js` (in cima al file):

```js
const RACE_END_CONFIG = {
    pollIntervalMs: 200,            // frequenza check
    racingConfirmHits: 2,           // conferme per "in gara"
    goneConfirmHits: 3,             // conferme per "simboli spariti"
    captureDelayMs: 3000,           // countdown prima di catturare
    cooldownMs: 5000,               // pausa dopo una cattura
    captureRetryIntervalMs: 500,    // attesa tra tentativi falliti
    maxCaptureRetries: 30,          // max tentativi (15s totali)
    matchTolerance: 80,             // distanza RGB max per pixel match
    matchRatio: 0.75,               // % di pixel che devono combaciare
};
```

## Struttura del progetto

```
mkw-lounge-tracker-master/
├── server.js                       # Server HTTP statico (Node nativo)
├── package.json                    # Script di avvio
├── index.html                      # Pagina principale
├── main.js                         # Entry point
├── style.css                       # Stili
├── favicon.ico
├── globals.d.ts
├── jsconfig.json
├── README.md                       # Questo file
├── RACE_END_GUIDE.md               # Guida dettagliata race-end
├── LICENSE
│
├── src/
│   ├── autocapture.js              # checkOverlay (originale) + checkRaceSymbols (nuovo)
│   ├── capture.js                  # Cattura frame + OCR
│   ├── ocr.js                      # OCR con Tesseract.js
│   ├── mogi.js, race.js, player.js, roster.js, team.js
│   ├── util.js, export-zip.js
│   ├── i18n/                       # Traduzioni (en, fr, de, ja)
│   └── ui/                         # Componenti UI
│       └── autocapture-toggle.js   # State machine race-end
│
├── img/
│   ├── race-end-reference.png      # ⭐ PNG di riferimento moneta+bandierina
│   ├── home-icon-reference.png     # Riferimento icona Home (originale)
│   └── docs/                       # Screenshot della documentazione
│
├── scripts/
│   └── generate_bitmask.py         # Utility legacy per bitmask (non più usata)
│
└── obs-companion/                  # Server OBS separato (opzionale)
```

## Limitazioni

- L'OCR può sbagliare con nomi molto simili tra giocatori.
- La qualità dell'OCR dipende dalla qualità della capture card.
- L'auto-capture race-end richiede che i simboli siano visibili a inizio gara
  (altrimenti resta in `IDLE`). Se la tua capture card ha risoluzione diversa
  da 1920×1080, devi rifare il PNG di riferimento con le coordinate giuste.

## Crediti

- Progetto originale: [PFQNiet/mkw-lounge-tracker](https://github.com/PFQNiet/mkw-lounge-tracker)
- Estensione race-end auto-capture: implementata in questa fork.

## Licenza

Vedi `LICENSE`.
