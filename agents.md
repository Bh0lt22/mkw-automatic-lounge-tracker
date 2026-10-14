# MKW Lounge Tracker — Fork by Bholt

## Contesto per la nuova AI

Questo documento è una **handoff brief** per una nuova AI che continua il lavoro su un progetto esistente. Leggi tutto questo file PRIMA di fare qualsiasi modifica. NON dare nulla per scontato: chiedi conferma all'utente prima di cambiare file che non conosci.

L'utente si chiama **Bholt**. Discord: `bholt_22` (ID `594798722940928001`). Parla italiano. Il progetto è una fork personale di un tool open-source per Mario Kart World.

---

## Cos'è il progetto

**MKW Mogi Manager** è un tool web (HTML/CSS/JS puro, no build) che semplifica il tracciamento dei punteggi durante le "mogi" (sessioni competitive) di Mario Kart World. Invece di scrivere i risultati a mano, l'app cattura screenshot della scoreboard via capture card, fa OCR dei nomi e dei punteggi, e tiene traccia di tutto. Alla fine esporta i risultati nel formato usato dai bot Discord di Lounge.

**Progetto originale**: https://github.com/PFQNiet/mkw-lounge-tracker (autore: Niet)
**Fork di Bholt**: aggiunge molte funzionalità custom (vedi sezione "Modifiche apportate").

L'app gira **interamente nel browser**, niente server backend. L'unica cosa server-side è un piccolo HTTP server statico (`server.js`) per servire i file in localhost.

---

## Avvio rapido

```bash
# Windows
start.bat

# Mac/Linux
./start.sh

# Oppure manuale
node server.js
# → http://localhost:8000
```

Requisiti: Node.js 14+. Nessun `npm install` richiesto (il server usa solo moduli nativi).

---

## Struttura del progetto

```
mkw-lounge-tracker-master/
├── server.js                    # Server HTTP statico (Node nativo)
├── package.json                 # Script di avvio
├── start.bat                    # Avvio Windows (doppio click)
├── start.sh                     # Avvio Mac/Linux
├── index.html                   # Pagina principale (modalità capture card)
├── no-capture-card.html         # Pagina modalità manuale (no capture card)
├── obs-overlay.html             # Pagina overlay per OBS (background trasparente)
├── main.js                      # Entry point della pagina principale
├── no-capture-card.js           # Entry point della modalità manuale
├── obs-overlay.js               # Logica dell'overlay OBS
├── style.css                    # Stili (condiviso da tutte le pagine)
├── favicon.ico
├── globals.d.ts
├── jsconfig.json
├── CHANGELOG.txt                # Storico completo delle modifiche (LEGGILO)
├── README.md                    # README originale + istruzioni avvio
├── RACE_END_GUIDE.md            # Guida dettagliata autocapture race-end
├── LICENSE
│
├── src/
│   ├── autocapture.js           # checkOverlay (originale) + checkRaceSymbols (nuovo, race-end)
│   ├── capture.js               # Cattura frame + OCR + salvataggio nomi OCR in cache
│   ├── ocr.js                   # OCR con Tesseract.js + matching Levenshtein + iniziali
│   ├── mogi.js                  # Classe Mogi (state) + rematchAllRaces + OBS overlay state
│   ├── race.js                  # Classe Race + Placement + POINTS_BY_PLACEMENT
│   ├── player.js                # Classe Player + normalizeName
│   ├── roster.js                # Classe Roster + parse (flessibile: con o senza MMR/tier)
│   ├── team.js                  # Classe Team + TEAM_COLOURS + TEAM_ICONS
│   ├── util.js                  # Utility: popcount, ctx2d, rgb2hsv, Config, levenshteinWeighted, solveAssignmentDP
│   ├── export-zip.js            # Export ZIP con tutti i dati
│   ├── i18n/
│   │   ├── i18n.js              # Sistema i18n (merge con en come fallback)
│   │   ├── en.js                # Inglese (base)
│   │   ├── it.js                # Italiano (aggiunto nella fork)
│   │   ├── es.js                # Spagnolo (aggiunto nella fork)
│   │   ├── fr.js                # Francese (originale)
│   │   ├── de.js                # Tedesco (originale)
│   │   └── ja.js                # Giapponese (originale)
│   └── ui/
│       ├── autocapture-toggle.js  # setupAutoCapture (originale) + setupAutoCaptureRaceEnd (nuovo)
│       ├── capture-button.js      # Setup camera + capture button
│       ├── scoreboard.js          # Render scoreboard + icone team rank + dropdown OCR
│       ├── edit-roster-dialog.js  # Edit roster + autofill 4 livelli + reset names + dropdown OCR
│       ├── edit-race-dialog.js    # Edit singola race
│       ├── set-roster-dialog.js   # Dialog iniziale incolla roster
│       ├── substitute-player-dialog.js
│       ├── export-results-dialog.js
│       ├── gallery.js             # Race history con screenshot
│       ├── locale-switcher.js
│       ├── ocr-debug-dialog.js
│       ├── manual-resolution-dialog.js  # (legacy, non più usato dopo rimozione manualResolve)
│       └── toast.js
│
├── img/
│   ├── race-end-reference.png    # PNG 1920x1080 RGBA con moneta+bandierina (riferimento autocapture)
│   ├── home-icon-reference.png   # Riferimento icona Home (originale)
│   ├── discord-logo.svg          # Logo Discord (nuovo)
│   ├── github-logo.svg           # Logo GitHub (originale)
│   ├── team-icons/
│   │   ├── README.md             # Istruzioni per sostituire le immagini
│   │   ├── rank-1.png            # Icona 1° classificato (32x32, trasparente)
│   │   ├── rank-2.png            # 2°
│   │   ├── rank-3.png            # 3°
│   │   ├── rank-4.png            # 4°
│   │   ├── rank-5.png            # 5°
│   │   └── rank-6.png            # 6°
│   ├── docs/                     # Screenshot documentazione originale
│   └── process-demo.jpg
│
├── scripts/
│   └── generate_bitmask.py       # Utility legacy per bitmask (non più usata)
│
└── obs-companion/                # Server OBS separato (legacy, non più referenziato dalla UI)
```

---

## Architettura tecnica

### Modalità principale (index.html + main.js)
- L'utente incolla il roster (12 player) → si apre la pagina con video preview + scoreboard
- Seleziona la webcam virtuale (OBS Virtual Camera collegato alla capture card)
- Per ogni gara: cattura manuale (tasto "Capture & OCR") o automaticamente (autocapture)
- OCR con Tesseract.js legge i nomi dalla scoreboard
- Matching fuzzy (Levenshtein pesato) abbinia i nomi OCR ai player del roster
- La scoreboard si aggiorna con i punteggi cumulativi
- Export finale: formato Lounge Discord + ZIP con screenshot

### Modalità "No capture card" (no-capture-card.html + no-capture-card.js)
- Per chi non ha capture card
- Stessa identica scoreboard della modalità principale
- Invece della cattura OCR, l'utente clicca "Save scores" sotto ogni colonna race
- Si apre un wizard: "Select 1st place player", l'utente clicca il player, poi "Select 2nd place player", ecc.
- Per le posizioni 11 e 12: pulsante "DC" per marcare disconnessioni
- Stesso calcolo punteggi della modalità principale

### OBS overlay (obs-overlay.html + obs-overlay.js)
- Pagina separata con background trasparente
- Mostra solo i punteggi totali dei team in rettangoli (gap=0, allineati)
- 3 orientamenti: normal (3x2 per 2v2), horizontal (1 riga), vertical (1 colonna)
- Sincronizzazione real-time con la pagina principale via:
  1. `localStorage` (chiave `mkw-obs-overlay-state`) + evento `storage`
  2. `BroadcastChannel` ('mkw-obs-overlay') per update cross-tab più affidabili
  3. Polling di fallback ogni 500ms
- Pulsante "📺 PiP" per Document Picture-in-Picture (Chrome 116+): finestra sempre sopra le altre app

### Sistema i18n
- `src/i18n/i18n.js`: sistema con merge. `en.js` è la base, le altre lingue sovrascrivono solo le chiavi che traducono.
- 6 lingue: en, it, es, fr, de, ja
- Le chiavi si usano con `t('chiave.path', { variabile: valore })`
- Negli HTML: `data-i18n="chiave.path"` (auto-aggiornato su cambio lingua)

---

## Modifiche apportate (fork di Bholt)

Questa è la lista delle funzionalità aggiunte/modificate rispetto al progetto originale. **Il CHANGELOG.txt ha la versione completa e dettagliata — questo è un riassunto.**

### 1. Autocapture race-end (la funzione più importante)
- **File**: `src/autocapture.js` (funzione `checkRaceSymbols`), `src/ui/autocapture-toggle.js` (state machine `setupAutoCaptureRaceEnd`), `img/race-end-reference.png`
- **Cosa fa**: riconosce automaticamente quando la gara finisce confrontando il frame video con un PNG di riferimento (moneta + bandierina del lap counter). Quando i simboli spariscono, dopo 2.3 secondi scatta la foto della leaderboard automaticamente, con retry loop (max 30 tentativi ogni 500ms).
- **Come funziona il riconoscimento**: confronto pixel-by-pixel dei soli pixel non-trasparenti del reference PNG. Tolleranza RGB 80, match ratio 75%.
- **State machine**: `IDLE → RACING → WAITING (2.3s) → CAPTURING (retry loop) → COOLDOWN (5s) → IDLE`
- **Parametri** (in `RACE_END_CONFIG` in `autocapture-toggle.js`):
  - `pollIntervalMs: 200`
  - `racingConfirmHits: 1`, `goneConfirmHits: 1` (massima reattività)
  - `captureDelayMs: 2300`
  - `maxCaptureRetries: 30`
  - `matchTolerance: 80`, `matchRatio: 0.75`
- **⚠️ NON TOCCARE** questi parametri senza testare. Sono stati tarati su molte sessioni reali.
- **⚠️ NON aggiungere** altri polling che chiamano `checkRaceSymbols` — causava interferenza con l'autocapture (bug rimosso in v2.8, vedi "Race timer rimosso" sotto).

### 2. Toggle rinominati
- `index.html`: "Auto-capture" → **"Nintendo screenshot"** (rileva l'icona Home della cattura Switch)
- "Auto-capture (race end)" → **"Autocapture"** (la nuova funzione race-end)

### 3. Scoreboard: colonne aggiuntive
- **Colonna "#" (posizione)**: in entrambe le modalità (FFA e team event). Nei team event è tra team e player; in FFA è a sinistra.
- **Colonna "Gap" (solo FFA)**: a destra del totale. Mostra il vantaggio del player sul player SOTTO di lui (es. 1° mostra "+15" = 15 punti sopra il 2°). L'ultimo mostra "—". Colorata: verde se in vantaggio, rossa se in svantaggio.
- **Colorazione rank**: rank-1 oro, rank-2 argento, rank-3 bronzo (classi CSS `rank-1/2/3`).

### 4. Icone team personalizzate
- **File**: `img/team-icons/rank-1.png` ... `rank-6.png` (32×32 px, sfondo trasparente)
- Sostituiscono le emoji originali (🍄🐢🦍🌌💰🦖)
- L'immagine assegnata dipende SOLO dalla posizione in classifica del team (1° = rank-1.png, ecc.), non dal colore
- **Gestione parità**: se due team hanno lo stesso punteggio, entrambi mostrano l'icona della posizione più alta (es. 3° e 4° a pari punti → entrambi rank-3.png)
- Caricate async con fallback all'emoji se l'immagine non esiste
- `loadTeamIcon(rank)` in `scoreboard.js` con cache in `_teamIconCache`

### 5. Edit roster: autofill intelligente a 4 livelli
- **File**: `src/ui/edit-roster-dialog.js`, funzione `autofill.addEventListener('click', ...)`
- Quando l'utente clicca "Auto-fill" nell'edit roster (dopo aver catturato la pause screen), il bot abbinia i nomi OCR ai player con questa logica a 4 livelli:
  1. **L1 - Tag + Levenshtein** (priorità massima): per ogni team, raccoglie gli OCR text che iniziano col tag del team + i player liberi del team, calcola Levenshtein per ogni coppia, assegna greedy partendo dalla coppia con distanza minore. Es. "B" → player "B", "Bholt" → player "Bholt".
  2. **L2 - Levenshtein globale**: usa il playerId già abbinato dal sistema OCR, ma SOLO se l'OCR non inizia col tag di un ALTRO team (controllo conflitto).
  3. **L3 - Iniziali**: match per 3 lettere iniziali (case-insensitive) con nome Lounge o IGN, SOLO se non c'è conflitto tag e match univoco.
  4. **L4 - Manuale**: dropdown OCR.
- **No IGN duplicati**: set `usedOCRTexts` (case-insensitive) traccia gli OCR text già assegnati. Se l'OCR riconosce "Marcosky" due volte, la seconda viene ignorata. Applicato a tutti i livelli + FFA.
- Log in console: cerca `[autofill] L1/L2/L3/L4`.

### 6. Edit roster: tasto "Reset names"
- Pulsante a sinistra di "Auto-fill"
- Dopo conferma: svuota tutti gli input IGN + svuota la cache OCR del mogi (`mogi.clearUnassignedOCRNames()`)
- Utile per ripartire da zero con l'autofill

### 7. Edit roster: dropdown OCR
- Nuova colonna "OCR" nell'edit roster (4 colonne totali: Lounge name | In-game name | OCR | Substitute)
- Per ogni player c'è una `<select>` che mostra tutti i nomi OCR rilevati (anche quelli già abbinati)
- L'utente può selezionare un nome per assegnarlo al player
- I nomi già usati in qualsiasi input IGN sono **sbarrati in rosso e disabilitati** (incluso il nome del player corrente)
- Cache dei nomi OCR nel mogi: `#unassignedOCRNames` (salva TUTTI i nomi OCR, non solo i non assegnati)
- Aggiornamento real-time quando l'utente modifica un input o seleziona un nome

### 8. Rimozione "unmatched player" dialog
- **File**: `src/ocr.js`
- Rimosso completamente il dialog `manualResolve` che forzava l'utente a selezionare un player per ogni nome non riconosciuto
- Ora, se un nome OCR non viene abbinato, resta con `playerId = null` ma `resolvedName = ocrText` preservato
- L'utente può assegnarlo manualmente dalla dropdown OCR nell'edit roster

### 9. Matching per iniziali in ocr.js
- **File**: `src/ocr.js`, prima del blocco "If anything is STILL unresolved"
- Quando Levenshtein non riesce ad assegnare tutti i player, per ogni riga OCR non assegnata cerca un player non assegnato il cui nome Lounge o IGN inizia con le stesse 3 lettere (case-insensitive)
- Se match univoco → assegna. Se ambiguo → lascia al manuale.
- Log: `[ocr] Matching per iniziali:`

### 10. Rianalisi race dopo edit roster
- **File**: `src/mogi.js`, funzione `rematchAllRaces()`
- Quando l'utente salva modifiche nell'edit roster, TUTTE le race salvate vengono rianalizzate con il nuovo roster
- La POSIZIONE (placement) di ogni player è preservata, ma l'abbinamento `playerId`/`resolvedName` viene ricalcolato usando l'`ocrText` già salvato + il nuovo roster + Levenshtein pesato (stesso algoritmo del sistema OCR originale)
- ~10ms per race, niente re-OCR
- Chiama `mogi.rematchAllRaces()` dal save handler in `edit-roster-dialog.js`
- Toast di conferma: "{count} race(s) re-analyzed with the new roster."

### 11. Modalità "No capture card"
- **File**: `no-capture-card.html`, `no-capture-card.js`
- Pagina separata accessibile dal tasto "🎮 No capture card" nella home page
- Stessa identica grafica della pagina principale
- Rimossi: rettangolo capture card, rettangolo "last capture", sezione "race history"
- Rimane solo la Scoreboard
- Il tasto "✏️" nell'ultima riga di ogni colonna race è sostituito da "Save scores"
- Al click si apre un wizard (dialog) che guida l'utente:
  - "Select 1st place player" → griglia con tutti i player non assegnati
  - L'utente clicca → assegnato a quella posizione
  - "Select 2nd place player", ecc.
  - Per posizioni 11 e 12: pulsante "⚠ DC (disconnect)" per marcare disconnessioni
  - Pulsante "↩ Undo" per annullare l'ultima assegnazione
  - "Save" abilitato solo quando tutte le 12 posizioni sono assegnate
- Stesso calcolo punteggi della modalità principale (POINTS_BY_PLACEMENT)

### 12. OBS scores overlay
- **File**: `obs-overlay.html`, `obs-overlay.js`, `main.js` (tasto + prompt)
- Tasto "📺 OBS scores overlay" in fondo alla scoreboard
- Apre una pagina con background trasparente che mostra solo i punteggi totali dei team
- 3 orientamenti (scelti al click via prompt): normal (3x2 per 2v2, 2x2 per 3v3, ecc.), horizontal (1 riga), vertical (1 colonna)
- Rettangoli attaccati (gap=0, border-radius=0)
- 1° classificato con bordo oro + glow
- Sincronizzazione real-time via localStorage + BroadcastChannel + polling 500ms
- Pulsante "📺 PiP" per Document Picture-in-Picture (Chrome 116+): finestra sempre sopra le altre app
- Istruzioni OBS nel prompt del tasto

### 13. Rimosso "Connect overlay"
- Rimosso completamente il toggle "Connect overlay" dalla UI (era obsoleto con il nuovo OBS overlay)
- Rimossi: `<label>` con checkbox in index.html, import e chiamata `setupOverlay` in main.js, file `src/ui/overlay-toggle.js` (eliminato)
- L'`obs-companion/` (cartella) resta intatto ma non è più referenziato

### 14. Branding
- **"Fork by Bholt"** in alto accanto al titolo "MKW Mogi Manager" (grigio italic)
- **Icona Discord** accanto a "Fork by Bholt": link a `https://discordapp.com/users/594798722940928001` (ID numerico di Bholt). Tooltip: "Discord: Bholt".
- **Icona GitHub** ripristinata in alto a destra: link al progetto originale `https://github.com/PFQNiet/mkw-lounge-tracker`
- Crediti originali a Niet mantenuti nel footer della landing page (sezione "About")

### 15. Roster setup semplificato
- **File**: `src/roster.js`, funzione `Roster.parse`
- Ora accetta anche formato semplice con solo righe "N. Name1, Name2" senza Room, MMR o Tier
- Se la prima riga inizia con "N. ", usa modalità semplice con tier="?"
- Se c'è "Tier X", usa formato completo (MMR diventa opzionale)
- Placeholder del dialog aggiornato con esempi di entrambi i formati

### 16. Landing page: sezione "New fork's features"
- Nuova sezione in alto a destra della landing page (sopra Notes/About)
- Elenca tutte le 10 funzioni uniche della fork
- Style identico agli altri aside (niente bordo rosso, era stato rimosso in v2.7)
- "About" e "Notes" sulla stessa riga sotto, usando grid `.aside-row` a 2 colonne

### 17. Traduzioni italiano + spagnolo
- Aggiunti `src/i18n/it.js` e `src/i18n/es.js` completi
- Selezionabili dal menu in alto a destra

### 18. Allineamento landing page
- `<main class="row" style="align-items: stretch;">` per allineare "Last capture" col rettangolo video a sinistra (stessa altezza, lati top/bottom allineati)
- `.aside-row` grid a 2 colonne per Notes + About

### 19. Race timer (RIMOSSO in v2.8)
- ⚠️ **NON riaggiungere il race timer**. Era stato introdotto in v2.6 e rimosso in v2.8 perché il suo polling interferiva con l'autocapture race-end (causava screenshot in ritardo: 3 su 6 segnalati).
- Il timer faceva polling ogni 200ms chiamando `checkRaceSymbols`, la stessa funzione dell'autocapture. Avere due checkRaceSymbols concorrenti caricava la CPU.
- Se l'utente chiede di riaggiungerlo, **AVVISALO** del problema e proponi alternative che non usino checkRaceSymbols (es. un timer manuale con tasto start/stop, oppure basato su un evento diverso).

---

## File chiave da NON rompere

Questi file sono sensibili e sono stati tarati su test reali. Modificali solo se strettamente necessario e con consapevolezza:

1. **`src/ui/autocapture-toggle.js`** — la state machine dell'autocapture race-end. I parametri `RACE_END_CONFIG` sono tarati. Non aggiungere polling concorrenti.

2. **`src/autocapture.js`** — `checkRaceSymbols` è usata solo dall'autocapture race-end ora (dopo rimozione timer). Non chiamarla da altri posti.

3. **`src/ocr.js`** — il matching Levenshtein + matching per iniziali. L'algoritmo di assignment DP (`solveAssignmentDP`) è lo stesso replicato in `util.js` per `rematchAllRaces`.

4. **`src/mogi.js`** — `rematchAllRaces` usa `levenshteinWeighted` e `solveAssignmentDP` da `util.js` (import). C'è una dipendenza circolare con `player.js` (mogi importa `normalizeName` da player, player importa `RACE_COUNT` da mogi) — funziona grazie agli ES module live bindings, ma NON spostare `normalizeName` senza testare.

5. **`img/race-end-reference.png`** — il PNG di riferimento per l'autocapture. 1920×1080 RGBA con solo moneta + bandierina visibili, resto trasparente. Se l'utente cambia capture card o risoluzione, va rifatto (vedi `RACE_END_GUIDE.md`).

6. **`img/team-icons/rank-1.png` ... `rank-6.png`** — icone team fornite dall'utente. 32×32 px, sfondo trasparente. L'utente può sostituirle sovrascrivendo i file.

---

## Bug noti e decisioni di design

### Bug noto: player con stesso nome nello stesso team
- Se due player dello stesso team hanno lo stesso nome (es. due "Bholt" nel team B), l'algoritmo di matching OCR ha un bias sistematico verso il primo player (gli assegna sempre la posizione migliore).
- **Soluzione tentata e scartata** (v2.3 → rimossa in v2.3-beta): ribilanciamento per punteggio cumulativo. L'utente ha detto "non ha senso, non toccare niente". Quindi il comportamento attuale è: lascia il bias, l'utente corregge manualmente in Edit Race.
- **NON riaggiungere** la logica di ribilanciamento senza esplicita richiesta dell'utente.

### OBS overlay update quando pagina principale in background
- L'overlay dovrebbe aggiornarsi via BroadcastChannel anche quando la pagina principale è in background, ma alcuni browser limitano i timer nelle tab non attive.
- Soluzione attuale: polling 500ms + BroadcastChannel + Document PiP (Chrome 116+).
- Se l'utente segnala problemi, suggerisci di usare il PiP o di tenere la pagina overlay aperta in foreground.

### Race timer rimosso
- Vedi sezione 19 sopra. NON riaggiungere senza discuterne.

---

## Come fare modifiche sicure

1. **Prima di modificare**: leggi il `CHANGELOG.txt` per capire cosa è stato fatto e perché.
2. **Dopo aver modificato**: aggiorna il `CHANGELOG.txt` con una nuova sezione in cima (formato `[X.Y] — Titolo`).
3. **Traduzioni**: quando aggiungi stringhe, aggiungile in TUTTE le 6 lingue (en, it, es, fr, de, ja). La base è en.js, le altre sovrascrivono.
4. **Sintassi**: verifica sempre con `node --check <file.js>` prima di consegnare.
5. **Smoke test**: avvia il server (`node server.js`) e verifica che le pagine servano (HTTP 200).
6. **Zip finale**: salva in `/home/z/my-project/download/mkw-lounge-tracker-raceend.zip` con `zip -r ... -x "*/node_modules/*" "*/.git/*" "*/package-lock.json"`.
7. **Non toccare** i file elencati in "File chiave da NON rompere" senza esplicita autorizzazione dell'utente.

---

## Parametri tarati (NON cambiare senza testare)

In `src/ui/autocapture-toggle.js`:
```js
const RACE_END_CONFIG = {
    pollIntervalMs: 200,
    racingConfirmHits: 1,
    goneConfirmHits: 1,
    captureDelayMs: 2300,
    cooldownMs: 5000,
    captureRetryIntervalMs: 500,
    maxCaptureRetries: 30,
    matchTolerance: 80,
    matchRatio: 0.75,
};
```

In `src/race.js`:
```js
export const POINTS_BY_PLACEMENT = [15,12,10,9,8,7,6,5,4,3,2,1];
// DC = 1 punto
```

In `src/ocr.js` (Levenshtein pesato per il matching):
```js
const levCosts = { ins: 3, del: 1, sub: 2 };
const maxEditDistance = 10;
```

---

## Contatti e crediti

- **Fork by**: Bholt (Discord: `bholt_22`, ID `594798722940928001`)
- **Progetto originale**: Niet (https://github.com/PFQNiet)
- **License**: vedi `LICENSE`

---

## TODO futuri (idee dell'utente, non ancora implementate)

- (Aggiungi qui eventuali richieste future dell'utente che non sono state ancora implementate)

---

**Fine del documento. Leggi il CHANGELOG.txt per lo storico completo delle modifiche versione per versione.**
