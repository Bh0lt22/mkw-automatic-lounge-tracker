export default {
        _meta: {
                name: 'English',
                dir: 'ltr',
                code: 'en'
        },

        text: {
                title: "MKW Mogi Manager",
                loading: "Loading…",
                processing: "Processing…",
                save: "Save",
                confirm: "Confirm",
                cancel: "Cancel",
                blank: "—",
                landingPage: {
                        lead: "Capture, OCR, score; right in your browser. No installs, no uploads.",
                        features: [
                                "Offline OCR",
                                "Disconnect handler",
                                "Manual resolve + edit",
                                "Lounge export"
                        ],
                        steps: [
                                "**1.** Click __Get started__ and paste the 12-player roster (`1. Name (12345 MMR)`).",
                                "**2.** Pick your virtual webcam in the preview area.",
                                "**3.** After each race, the screenshot will be taken automatically, or manually.",
                                "**4.** Fix anything via __Edit__ → __Save__. Export scores when done.",
                                "**5.** If you don't have a capture card, you can use the manual mode with __No capture card__."
                        ],
                        getStartedButton: "🚀 Get started",
                        noCaptureCardButton: "🎮 No capture card",
                        forkFeaturesLabel: "🆕 New fork's features",
                        forkFeatures: [
                                "<strong>Autocapture (race end):</strong> automatic capture when the in-race symbols disappear — no manual screenshot needed.",
                                "<strong>No capture card mode:</strong> track scores manually by picking players position by position.",
                                "<strong>OBS scores overlay:</strong> transparent browser-source overlay with team scores for OBS.",
                                "<strong>Team rank icons:</strong> custom team icons based on standings position (1st..6th).",
                                "<strong>Gap column + position column</strong> on the scoreboard.",
                                "<strong>Smart autofill</strong> with tag-based team matching and OCR dropdown for manual fixes.",
                                "<strong>Auto re-analyze</strong> past races when the roster is edited.",
                                "<strong>Race timer</strong> driven by the in-race symbols (start/stop/reset automatic).",
                                "<strong>IT / ES translations</strong> added (besides EN/FR/DE/JA).",
                                "<strong>Streamlined roster setup</strong>: room, MMR and tier are now optional."
                        ],
                        notesLabel: "Notes",
                        notes: [
                                "Race 1 must include all 12 players.",
                                "10-player races are valid; 9 or fewer are a redo.",
                                "Supports FFA, 2v2, 3v3, 4v4 and 6v6 Lounge Queue formats.",
                                "Everything stays local in your browser.",
                                "Autocapture: detects when the race is finished and takes the screenshot automatically."
                        ],
                        aboutLabel: "About",
                        about: [
                                "Made by Bholt",
                                "Made by [Niet](https://github.com/PFQNiet); Contributors: TechyAlex",
                                "[View source on GitHub](https://github.com/PFQNiet/mkw-lounge-tracker)",
                                "[Report a bug](https://github.com/PFQNiet/mkw-lounge-tracker/issues)"
                        ]
                },
                rosterSetup: {
                        title: "Roster setup",
                        instructions: "Paste {count} players:",
                        wrongLength: "Expected {count} players, got {actual}.",
                        badLine: "Bad line: “{line}”",
                        rosterLoaded: "Roster loaded!"
                },
                capture: {
                        camera: "Camera",
                        noCameras: "(No cameras found)",
                        selectCamera: "— Select camera —",
                        cameraFallbackLabel: "Camera {deviceId}",
                        cameraStopped: "Camera stopped",
                        cameraStarted: "Camera started: {label}",
                        cameraFailedToStart: "Could not start the selected camera",
                        captureButton: "📸 Capture & OCR",
                        localSaveReminder: "⚠️ Remember to always screenshot on Switch as well!",
                        autoCaptureLabel: "Nintendo screenshot",
                        autoCaptureRaceEndLabel: "Autocapture",
                        raceEndStarted: "Race-end auto-capture active. The bot will capture when the in-race symbols disappear.",
                        raceEndNotConfigured: "Race-end: cannot load img/race-end-reference.png. Make sure the file is present in the project.",
                        raceEndCaptureSuccess: "Auto-capture successful.",
                        raceEndMaxRetries: "Auto-capture failed after max retries. Please capture manually.",
                        useOverlay: "Connect overlay",
                        lastCapture: "Last capture",
                        ocrResult: "OCR: “{ocrText}”",
                        unresolved: "(unresolved)",
                        maxRacesReached: "You have reached the maximum number of races.",
                        captureCancelled: "Capture cancelled",
                        noScoreboardDetected: "No scoreboard detected — try capturing on the results screen.",
                        noPauseScreenDetected: "No names detected — ensure Pause screen is open.",
                        ocrFailed: "OCR failed. See console for details.",
                        raceSaved: "Race {number} saved!"
                },
                overlay: {
                        connected: "Overlay connected",
                        failed: "Overlay connection failed",
                        title: "Overlay connection",
                        about: "The Overlay requires a bridge running on your computer.",
                        firstTime: "If this is your first time using it, [follow these instructions](https://github.com/PFQNiet/mkw-lounge-tracker/blob/master/obs-companion/README.md) to get started.",
                        instructions: "If you've done that, make sure the bridge is running. If you denied the browser permission to connect, you may need to clear that in your browser's site settings.",
                        close: "Close"
                },
                manualResolution: {
                        title: "Resolve unmatched players",
                        selectPlayer: "— Select player —"
                },
                editRace: {
                        title: "Edit race",
                        instructions: "Select two players to swap them.",
                        deleteRaceButton: "Delete race",
                        confirmDelete: "Delete this race permanently?",
                        disconnectedPlace: "DC",
                        uniquePlacementError: "Each placement 1..12 can only be chosen once.",
                        raceUpdated: "Race {number} updated!",
                        raceDeleted: "Race {number} deleted!"
                },
                editRoster: {
                        title: "Edit roster",
                        team: "Team {id}",
                        tag: "Tag",
                        loungeName: "Lounge name",
                        ingameName: "In-game name",
                        substitute: "Substitute",
                        autodetect: "(autodetect)",
                        noSubstitute: "(none)",
                        editSubButton: "Edit",
                        autofill: "Auto-fill",
                        rosterUpdated: "Roster updated!",
                        racesRematched: "{count} race(s) re-analyzed with the new roster.",
                        resetNames: "↺ Reset names",
                        confirmResetNames: "Clear all in-game names and the OCR cache? This cannot be undone.",
                        namesReset: "All in-game names have been cleared."
                },
                substitutePlayer: {
                        title: "Substitute player",
                        joinedAt: "Joined race #",
                        newSubstitute: "New substitute",
                        substituteUpdated: "Substitute updated!"
                },
                scoreboard: {
                        title: "Scoreboard",
                        team: "Team",
                        player: "Player",
                        raceNumber: "R{number}",
                        total: "Total",
                        gap: "Gap",
                        gapTitle: "Lead over next player",
                        editRosterButton: "Edit roster",
                        newSessionButton: "🧹 New session",
                        snapshotScoresButton: "🖼️ Snapshot",
                        obsOverlayButton: "📺 OBS scores overlay",
                        downloadZipButton: "📦 Download ZIP",
                        exportScoresButton: "📤 Export scores"
                },

                noCapturePage: {
                        lead: "Track scores manually, without a capture card. Pick the players position by position.",
                        steps: [
                                "<strong>1.</strong> Paste the 12-player roster, just like in the main mode.",
                                "<strong>2.</strong> Click <em>Save scores</em> under any race column.",
                                "<strong>3.</strong> Pick each player one by one (1st place, 2nd place, …). Mark <em>DC</em> for disconnections on the last two spots.",
                                "<strong>4.</strong> Export scores when done, same as the main mode."
                        ]
                },

                noCapture: {
                        saveScoresButton: "Save scores",
                        wizardTitle: "Race {number} — Save scores",
                        selectPlace: "Select {place}th place player",
                        selectPlace1: "Select 1st place player",
                        selectPlace2: "Select 2nd place player",
                        selectPlace3: "Select 3rd place player",
                        progress: "{done}/{total} positions assigned",
                        allAssigned: "All 12 positions assigned. Click Save to confirm.",
                        undoButton: "↩ Undo",
                        dcButton: "⚠ DC (disconnect)",
                        confirmOverwrite: "Race {number} already has scores. Overwrite?",
                        noMorePlayers: "No more players available to mark as DC.",
                        notAllAssigned: "Please assign all 12 positions before saving.",
                        dc: "DC"
                },

                exportScores: {
                        title: "Export scores",
                        format: "Format",
                        qFormat: "Lounge Queue",
                        sqFormat: "Squad Queue",
                        close: "Close",
                        copy: "Copy",
                        copiedToClipboard: "Copied to clipboard!",
                        failedToCopy: "Failed to copy to clipboard, press Ctrl/Cmd+C to copy manually."
                },
                gallery: {
                        title: "Race history",
                        imageAltText: "Race {number} snapshot",
                        imageCaption: "Race {number} · {time}"
                }
        },

        format: {
                /** @param {number} n */
                ordinal(n) {
                        const ruleset = new Intl.PluralRules('en', { type: 'ordinal' });
                        switch (ruleset.select(n)) {
                                case 'one': return 'st';
                                case 'two': return 'nd';
                                case 'few': return 'rd';
                                default: return 'th';
                        }
                },
                /** @param {number} n */
                place(n) {
                        // Prepend a FIGURE SPACE for single-digit numbers so they align with 10+ in mono/tabular fonts.
                        return `${n < 10 ? '\u2007' : ''}${n}${this.ordinal(n)}`;
                },

                /** @param {number} n */
                number(n) { return n.toLocaleString('en'); },
                /** @param {Date} d */
                time(d) { return d.toLocaleTimeString('en', { timeStyle: 'short' }); }
        }
};
