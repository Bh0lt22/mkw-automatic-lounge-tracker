export default {
        _meta: {
                name: 'Deutsch',
                dir: 'ltr',
                code: 'de'
        },

        text: {
                title: "MKW Mogi Manager",
                loading: "Wird geladen…",
                processing: "Wird verarbeitet…",
                save: "Speichern",
                confirm: "Bestätigen",
                cancel: "Abbrechen",
                blank: "—",

                landingPage: {
                        lead: "Capture, OCR, Punkte ; direkt im Browser. Keine Installation, kein Upload.",
                        features: [
                                "Offline-OCR",
                                "DC-Handling",
                                "Manuelle Zuordnung & Bearbeitung",
                                "Lounge-Export"
                        ],
                        steps: [
                                "**1.** Klicke **Los geht's** und füge die 12-Spieler-Liste ein (`1. Name (12345 MMR)`)",
                                "**2.** Wähle deine virtuelle Webcam in der Vorschau.",
                                "**3.** Nach jedem Rennen wird der Screenshot automatisch oder manuell aufgenommen.",
                                "**4.** Korrigiere über **Bearbeiten** → **Speichern**. Am Ende Punkte exportieren.",
                                "**5.** Ohne Capture Card kannst du den manuellen Modus mit **No capture card** nutzen."
                        ],
                        getStartedButton: "🚀 Los geht's",
                        noCaptureCardButton: "🎮 Ohne Capture Card",
                        forkFeaturesLabel: "🆕 Neue Fork-Funktionen",
                        forkFeatures: [
                                "<strong>Autocapture (Rennende):</strong> automatische Erfassung, wenn die In-Race-Symbole verschwinden — kein manuelles Screenshot nötig.",
                                "<strong>Modus ohne Capture Card:</strong> Punkte manuell verfolgen, indem Spieler position für position ausgewählt werden.",
                                "<strong>OBS Punkte-Overlay:</strong> transparentes Overlay mit Team-Punkten für OBS Browser Source.",
                                "<strong>Team-Rang-Icons:</strong> eigene Icons je nach Tabellenplatz (1.–6.).",
                                "<strong>Diff- und Positionsspalten</strong> in der Rangliste.",
                                "<strong>Intelligentes Auto-Füllen</strong> mit Tag-basiertem Team-Matching und OCR-Dropdown für manuelle Korrekturen.",
                                "<strong>Automatische Neu-Analyse</strong> vergangener Rennen beim Bearbeiten der Liste.",
                                "<strong>Renn-Timer</strong> gesteuert durch die In-Race-Symbole (Start/Stopp/Reset automatisch).",
                                "<strong>IT / ES Übersetzungen</strong> hinzugefügt (neben EN/FR/DE/JA).",
                                "<strong>Vereinfachte Listen-Einrichtung</strong>: Room, MMR und Tier sind jetzt optional."
                        ],
                        notesLabel: "Hinweise",
                        notes: [
                                "Rennen 1 muss alle 12 Spieler enthalten.",
                                "10-Spieler-Rennen sind gültig; 9 oder weniger ⇒ Neustart.",
                                "Unterstützt FFA-, 2v2-, 3v3-, 4v4- und 6v6-Lounge-Queue-Formate.",
                                "Alles bleibt lokal in deinem Browser.",
                                "Autocapture: erkennt das Rennende und macht automatisch den Screenshot."
                        ],
                        aboutLabel: "Über",
                        about: [
                                "Erstellt von Bholt",
                                "Erstellt von [Niet](https://github.com/PFQNiet) ; Mitwirkende: TechyAlex",
                                "[Quellcode auf GitHub ansehen](https://github.com/PFQNiet/mkw-lounge-tracker)",
                                "[Bug melden](https://github.com/PFQNiet/mkw-lounge-tracker/issues)"
                        ]
                },

                rosterSetup: {
                        title: "Spielerliste einrichten",
                        instructions: "Füge {count} Spieler ein:",
                        wrongLength: "Erwartet: {count} Spieler, erhalten: {actual}.",
                        badLine: "Ungültige Zeile: „{line}“",
                        rosterLoaded: "Liste geladen!"
                },

                capture: {
                        camera: "Kamera",
                        noCameras: "(Keine Kamera gefunden)",
                        selectCamera: "— Kamera auswählen —",
                        cameraFallbackLabel: "Kamera {deviceId}",
                        cameraStopped: "Kamera gestoppt",
                        cameraStarted: "Kamera gestartet: {label}",
                        cameraFailedToStart: "Ausgewählte Kamera konnte nicht gestartet werden",
                        captureButton: "📸 Aufnehmen & OCR",
                        localSaveReminder: "⚠️ Mache zusätzlich einen Screenshot auf der Switch!",
                        autoCaptureLabel: "Auto-Capture",
                        useOverlay: "Overlay verbinden",
                        lastCapture: "Letzte Aufnahme",
                        ocrResult: "OCR: „{ocrText}“",
                        unresolved: "(nicht zugeordnet)",
                        maxRacesReached: "Maximale Anzahl Rennen erreicht.",
                        captureCancelled: "Aufnahme abgebrochen",
                        noScoreboardDetected: "Kein Ergebnisscreen erkannt — bitte den Ergebnisscreen erfassen.",
                        noPauseScreenDetected: "Keine Namen gefunden — bitte den Pausebildschirm öffnen.",
                        ocrFailed: "OCR fehlgeschlagen. Details in der Konsole.",
                        raceSaved: "Rennen {number} gespeichert!"
                },

                overlay: {
                        connected: "Overlay verbunden",
                        failed: "Overlay-Verbindung fehlgeschlagen",
                        title: "Overlay-Verbindung",
                        about: "Das Overlay benötigt eine Bridge, die auf deinem Computer läuft.",
                        firstTime: "Wenn du es zum ersten Mal benutzt, [folge diesen Anweisungen](https://github.com/PFQNiet/mkw-lounge-tracker/blob/master/obs-companion/README.md), um zu beginnen.",
                        instructions: "Wenn du das bereits getan hast, stelle sicher, dass die Bridge läuft. Falls du dem Browser die Verbindung zu localhost verweigert hast, musst du diese Berechtigung möglicherweise in den Website-Einstellungen zurücksetzen.",
                        close: "Schließen"
                },

                manualResolution: {
                        title: "Nicht zugeordnete Spieler auflösen",
                        selectPlayer: "— Spieler auswählen —"
                },

                editRace: {
                        title: "Rennen bearbeiten",
                        instructions: "Wähle zwei Spieler zum Tauschen aus.",
                        deleteRaceButton: "Rennen löschen",
                        confirmDelete: "Dieses Rennen endgültig löschen?",
                        disconnectedPlace: "DC",
                        uniquePlacementError: "Jede Platzierung 1..12 darf nur einmal gewählt werden.",
                        raceUpdated: "Rennen {number} aktualisiert!",
                        raceDeleted: "Rennen {number} gelöscht!"
                },

                editRoster: {
                        title: "Liste bearbeiten",
                        team: "Team {id}",
                        tag: "Tag",
                        loungeName: "Lounge-Name",
                        ingameName: "In-Game-Name",
                        substitute: "Ersatzspieler",
                        autodetect: "(automatisch erkannt)",
                        noSubstitute: "(kein)",
                        editSubButton: "Bearbeiten",
                        autofill: "Auto-füllen",
                        rosterUpdated: "Liste aktualisiert!",
                        racesRematched: "{count} Rennen mit der neuen Liste neu analysiert.",
                        resetNames: "↺ Namen zurücksetzen",
                        confirmResetNames: "Alle In-Game-Namen und den OCR-Cache löschen? Das kann nicht rückgängig gemacht werden.",
                        namesReset: "Alle In-Game-Namen wurden gelöscht."
                },

                substitutePlayer: {
                        title: "Spieler ersetzen",
                        joinedAt: "Eingestiegen ab Rennen Nr.",
                        newSubstitute: "Neuer Ersatzspieler",
                        substituteUpdated: "Ersatzspieler aktualisiert!"
                },

                scoreboard: {
                        title: "Rangliste",
                        team: "Team",
                        player: "Spieler",
                        raceNumber: "R{number}",
                        total: "Gesamt",
                        editRosterButton: "Liste bearbeiten",
                        newSessionButton: "🧹 Neue Session",
                        snapshotScoresButton: "🖼️ Schnappschuss",
                        obsOverlayButton: "📺 OBS Punkte-Overlay",
                        downloadZipButton: "📦 ZIP herunterladen",
                        exportScoresButton: "📤 Punkte exportieren"
                },

                noCapturePage: {
                        lead: "Punkte manuell verfolgen, ohne Capture Card. Wähle die Spieler Position für Position.",
                        steps: [
                                "<strong>1.</strong> Füge die 12-Spieler-Liste ein, wie im Hauptmodus.",
                                "<strong>2.</strong> Klicke unter einer Renn-Spalte auf <em>Punkte speichern</em>.",
                                "<strong>3.</strong> Wähle jeden Spieler nacheinander (1., 2., …). Verwende <em>DC</em> für Verbindungsabbrüche auf den letzten beiden Plätzen.",
                                "<strong>4.</strong> Exportiere die Punkte am Ende, wie im Hauptmodus."
                        ]
                },

                noCapture: {
                        saveScoresButton: "Punkte speichern",
                        wizardTitle: "Rennen {number} — Punkte speichern",
                        selectPlace: "Wähle den Spieler auf Platz {place}",
                        selectPlace1: "Wähle den Spieler auf Platz 1",
                        selectPlace2: "Wähle den Spieler auf Platz 2",
                        selectPlace3: "Wähle den Spieler auf Platz 3",
                        progress: "{done}/{total} Positionen zugewiesen",
                        allAssigned: "Alle 12 Positionen zugewiesen. Klicke auf Speichern zum Bestätigen.",
                        undoButton: "↩ Rückgängig",
                        dcButton: "⚠ DC (Verbindungsabbruch)",
                        confirmOverwrite: "Rennen {number} hat bereits Punkte. Überschreiben?",
                        noMorePlayers: "Keine weiteren Spieler verfügbar, um als DC zu markieren.",
                        notAllAssigned: "Bitte weise alle 12 Positionen vor dem Speichern zu.",
                        dc: "DC"
                },

                exportScores: {
                        title: "Punkte exportieren",
                        format: "Format",
                        close: "Schließen",
                        copy: "Kopieren",
                        copiedToClipboard: "Kopiert!",
                        failedToCopy: "Kopieren fehlgeschlagen — mit Strg/Cmd+C manuell kopieren."
                },

                gallery: {
                        title: "Rennhistorie",
                        imageAltText: "Screenshot Rennen {number}",
                        imageCaption: "Rennen {number} · {time}"
                }
        },

        format: {
                ordinal() {
                        // Deutsche Ordinale: „1.“ „2.“ „3.“ …
                        return '.';
                },
                /** @param {number} n */
                place(n) {
                        // Pad single digits with FIGURE SPACE so „2.“ aligns with „10.“ in Mono/Tabular
                        return `${n < 10 ? '\u2007' : ''}${n}.`;
                },
                /** @param {number} n */
                number(n) { return n.toLocaleString('de'); },
                /** @param {Date} d */
                time(d) { return d.toLocaleTimeString('de', { timeStyle: 'short' }); }
        }
};
