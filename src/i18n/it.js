export default {
        _meta: {
                name: 'Italiano',
                dir: 'ltr',
                code: 'it'
        },

        text: {
                title: "MKW Mogi Manager",
                loading: "Caricamento…",
                processing: "Elaborazione…",
                save: "Salva",
                confirm: "Conferma",
                cancel: "Annulla",
                blank: "—",

                landingPage: {
                        lead: "Cattura, OCR, punteggi; direttamente nel tuo browser. Niente installazioni, niente upload.",
                        features: [
                                "OCR offline",
                                "Gestione disconnessioni",
                                "Risoluzione manuale + modifica",
                                "Export per Lounge"
                        ],
                        steps: [
                                "**1.** Clicca __Inizia__ e incolla la lista dei 12 giocatori (`1. Nome (12345 MMR)`).",
                                "**2.** Scegli la tua webcam virtuale nell'area di anteprima.",
                                "**3.** Dopo ogni gara, lo screenshot verrà preso in modo automatico, oppure manualmente.",
                                "**4.** Correggi con __Modifica__ → __Salva__. Esporta i punteggi quando hai finito.",
                                "**5.** Se non hai una capture card, puoi usare la funzione manuale con __No capture card__."
                        ],
                        getStartedButton: "🚀 Inizia",
                        noCaptureCardButton: "🎮 Senza capture card",
                        forkFeaturesLabel: "🆕 Nuove funzionalità della fork",
                        forkFeatures: [
                                "<strong>Autocattura (fine gara):</strong> cattura automatica quando i simboli di gara spariscono — niente più screenshot manuali.",
                                "<strong>Modalità senza capture card:</strong> tieni i punteggi manualmente scegliendo i giocatori posizione per posizione.",
                                "<strong>Overlay punteggi OBS:</strong> overlay trasparente con i punteggi dei team, pronto per OBS Browser Source.",
                                "<strong>Icone rank team:</strong> icone personalizzate per i team in base alla posizione in classifica (1°..6°).",
                                "<strong>Colonne Div e Posizione</strong> nella scoreboard.",
                                "<strong>Autofill intelligente</strong> con abbinamento per tag e dropdown OCR per correggere a mano.",
                                "<strong>Rianalisi automatica</strong> delle gare precedenti quando modifichi il roster.",
                                "<strong>Timer gara</strong> guidato dai simboli in gara (start/stop/reset automatici).",
                                "<strong>Traduzioni IT / ES</strong> aggiunte (oltre EN/FR/DE/JA).",
                                "<strong>Setup roster semplificato</strong>: room, MMR e tier ora sono opzionali."
                        ],
                        notesLabel: "Note",
                        notes: [
                                "La gara 1 deve includere tutti i 12 giocatori.",
                                "Le gare da 10 giocatori sono valide; 9 o meno vanno rifatte.",
                                "Supporta i formati FFA, 2v2, 3v3, 4v4 e 6v6 di Lounge Queue.",
                                "Tutto resta locale nel tuo browser.",
                                "Autocapture: rileva quando la gara è finita e fa lo screenshot in automatico."
                        ],
                        aboutLabel: "Info",
                        about: [
                                "Creato da [Bholt](https://github.com/Bh0lt22)",
                                "Creato da [Niet](https://github.com/PFQNiet); contributor: TechyAlex",
                                "[Codice sorgente su GitHub](https://github.com/Bh0lt22/mkw-automatic-lounge-tracker)",
                                "[Segnala un bug](https://github.com/Bh0lt22/mkw-automatic-lounge-tracker/issues)"
                        ]
                },

                rosterSetup: {
                        title: "Configurazione lista",
                        instructions: "Incolla {count} giocatori:",
                        wrongLength: "Attesi {count} giocatori, trovati {actual}.",
                        badLine: "Riga non valida: «{line}»",
                        rosterLoaded: "Lista caricata!"
                },

                capture: {
                        camera: "Camera",
                        noCameras: "(Nessuna camera trovata)",
                        selectCamera: "— Seleziona una camera —",
                        cameraFallbackLabel: "Camera {deviceId}",
                        cameraStopped: "Camera fermata",
                        cameraStarted: "Camera avviata: {label}",
                        cameraFailedToStart: "Impossibile avviare la camera selezionata",
                        captureButton: "📸 Cattura & OCR",
                        localSaveReminder: "⚠️ Ricorda di fare sempre uno screenshot anche sulla Switch!",
                        autoCaptureLabel: "Screenshot Nintendo",
                        autoCaptureRaceEndLabel: "Autocattura",
                        raceEndStarted: "Autocattura race-end attiva. Il bot cattura quando i simboli di gara spariscono.",
                        raceEndNotConfigured: "Race-end: impossibile caricare img/race-end-reference.png. Assicurati che il file sia presente.",
                        raceEndCaptureSuccess: "Cattura automatica riuscita.",
                        raceEndMaxRetries: "Cattura automatica fallita dopo il numero massimo di tentativi. Cattura manualmente.",
                        useOverlay: "Connetti overlay",
                        lastCapture: "Ultima cattura",
                        ocrResult: "OCR: «{ocrText}»",
                        unresolved: "(non risolto)",
                        maxRacesReached: "Numero massimo di gare raggiunto.",
                        captureCancelled: "Cattura annullata",
                        noScoreboardDetected: "Nessuna scoreboard rilevata — cattura la schermata dei risultati.",
                        noPauseScreenDetected: "Nessun nome trovato — apri il menu Pausa.",
                        ocrFailed: "OCR fallito. Vedi la console per i dettagli.",
                        raceSaved: "Gara {number} salvata!"
                },

                overlay: {
                        connected: "Overlay connesso",
                        failed: "Connessione all'overlay fallita",
                        title: "Connessione overlay",
                        about: "L'overlay richiede un programma relay in esecuzione sul tuo computer.",
                        firstTime: "Se è la prima volta, [segui queste istruzioni](https://github.com/PFQNiet/mkw-lounge-tracker/blob/master/obs-companion/README.md) per iniziare.",
                        instructions: "Se l'hai già fatto, assicurati che il relay sia in esecuzione. Se hai negato l'autorizzazione del browser, potresti doverla riattivare nelle impostazioni del sito.",
                        close: "Chiudi"
                },

                manualResolution: {
                        title: "Risolvi giocatori non abbinati",
                        selectPlayer: "— Seleziona un giocatore —"
                },

                editRace: {
                        title: "Modifica gara",
                        instructions: "Seleziona due giocatori da scambiare.",
                        deleteRaceButton: "Elimina gara",
                        confirmDelete: "Eliminare definitivamente questa gara?",
                        disconnectedPlace: "DC",
                        uniquePlacementError: "Ogni posizione 1..12 può essere scelta una sola volta.",
                        raceUpdated: "Gara {number} aggiornata!",
                        raceDeleted: "Gara {number} eliminata!"
                },

                editRoster: {
                        title: "Modifica lista",
                        team: "Team {id}",
                        tag: "Tag",
                        loungeName: "Nome Lounge",
                        ingameName: "Nome in gioco",
                        substitute: "Riserva",
                        autodetect: "(auto-rilevamento)",
                        noSubstitute: "(nessuno)",
                        editSubButton: "Modifica",
                        autofill: "Auto-compila",
                        rosterUpdated: "Lista aggiornata!",
                        racesRematched: "{count} gara(e) rianalizzate col nuovo roster.",
                        resetNames: "↺ Reset nomi",
                        confirmResetNames: "Cancellare tutti i nomi in gioco e la cache OCR? Non si può annullare.",
                        namesReset: "Tutti i nomi in gioco sono stati cancellati."
                },

                substitutePlayer: {
                        title: "Sostituisci giocatore",
                        joinedAt: "Entrato alla gara n°",
                        newSubstitute: "Nuova riserva",
                        substituteUpdated: "Riserva aggiornata!"
                },

                scoreboard: {
                        title: "Classifica",
                        team: "Team",
                        player: "Giocatore",
                        raceNumber: "G{number}",
                        total: "Totale",
                        gap: "Div",
                        gapTitle: "Vantaggio sul giocatore successivo",
                        editRosterButton: "Modifica lista",
                        newSessionButton: "🧹 Nuova sessione",
                        snapshotScoresButton: "🖼️ Snapshot",
                        obsOverlayButton: "📺 Overlay punteggi OBS",
                        downloadZipButton: "📦 Scarica ZIP",
                        exportScoresButton: "📤 Esporta punteggi"
                },

                noCapturePage: {
                        lead: "Tieni i punteggi manualmente, senza capture card. Scegli i giocatori posizione per posizione.",
                        steps: [
                                "<strong>1.</strong> Incolla la lista dei 12 giocatori, come nella modalità principale.",
                                "<strong>2.</strong> Clicca <em>Salva punteggi</em> sotto una colonna gara.",
                                "<strong>3.</strong> Scegli ogni giocatore uno ad uno (1°, 2°, …). Usa <em>DC</em> per le disconnessioni negli ultimi due posti.",
                                "<strong>4.</strong> Esporta i punteggi alla fine, come nella modalità principale."
                        ]
                },

                noCapture: {
                        saveScoresButton: "Salva punteggi",
                        wizardTitle: "Gara {number} — Salva punteggi",
                        selectPlace: "Seleziona il giocatore al {place}° posto",
                        selectPlace1: "Seleziona il giocatore al 1° posto",
                        selectPlace2: "Seleziona il giocatore al 2° posto",
                        selectPlace3: "Seleziona il giocatore al 3° posto",
                        progress: "{done}/{total} posizioni assegnate",
                        allAssigned: "Tutte le 12 posizioni assegnate. Clicca Salva per confermare.",
                        undoButton: "↩ Annulla",
                        dcButton: "⚠ DC (disconnesso)",
                        confirmOverwrite: "La gara {number} ha già dei punteggi. Sovrascrivere?",
                        noMorePlayers: "Nessun altro giocatore disponibile da marcare come DC.",
                        notAllAssigned: "Assegna tutte le 12 posizioni prima di salvare.",
                        dc: "DC"
                },

                exportScores: {
                        title: "Esporta punteggi",
                        format: "Formato",
                        close: "Chiudi",
                        copy: "Copia",
                        copiedToClipboard: "Copiato!",
                        failedToCopy: "Copia fallita, usa Ctrl/Cmd+C per copiare manualmente."
                },

                gallery: {
                        title: "Cronologia gare",
                        imageAltText: "Screenshot gara {number}",
                        imageCaption: "Gara {number} · {time}"
                }
        },

        format: {
                /** @param {number} n */
                ordinal(n) {
                        // IT ordinals: 1°, 2°, 3°, …
                        return '°';
                },
                /** @param {number} n */
                place(n) {
                        return `${n < 10 ? '\u2007' : ''}${n}${this.ordinal(n)}`;
                },

                /** @param {number} n */
                number(n) { return n.toLocaleString('it'); },
                /** @param {Date} d */
                time(d) { return d.toLocaleTimeString('it', { timeStyle: 'short' }); }
        }
};
