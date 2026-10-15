export default {
        _meta: {
                name: 'Français',
                dir: 'ltr',
                code: 'fr'
        },

        text: {
                title: "Mogi Manager MKW",
                loading: "Chargement…",
                processing: "Traitement…",
                save: "Enregistrer",
                confirm: "Confirmer",
                cancel: "Annuler",
                blank: "—",

                landingPage: {
                        lead: "Capture, OCR, score ; directement dans votre navigateur. Aucun logiciel à installer, aucun envoi.",
                        features: [
                                "OCR hors ligne",
                                "Gestion des déconnexions",
                                "Résolution manuelle + édition",
                                "Export Lounge"
                        ],
                        steps: [
                                "**1.** Cliquez sur __Commencer__ et collez la liste des 12 joueurs (`1. Nom (12345 MMR)`).",
                                "**2.** Choisissez votre webcam virtuelle dans l'aperçu.",
                                "**3.** Après chaque course, la capture sera prise automatiquement, ou manuellement.",
                                "**4.** Corrigez via __Modifier__ → __Enregistrer__. Exportez les scores quand c'est fini.",
                                "**5.** Si vous n'avez pas de capture card, utilisez le mode manuel avec __No capture card__."
                        ],
                        getStartedButton: "🚀 Commencer",
                        noCaptureCardButton: "🎮 Sans capture card",
                        forkFeaturesLabel: "🆕 Nouvelles fonctionnalités du fork",
                        forkFeatures: [
                                "<strong>Autocapture (fin de course) :</strong> capture automatique quand les symboles de course disparaissent — plus de capture manuelle.",
                                "<strong>Mode sans capture card :</strong> suivez les scores manuellement en choisissant les joueurs position par position.",
                                "<strong>Overlay scores OBS :</strong> overlay transparent avec les scores des équipes pour OBS Browser Source.",
                                "<strong>Icônes de rang d'équipe :</strong> icônes personnalisées selon la position au classement (1er..6e).",
                                "<strong>Colonnes Écart et Position</strong> dans le classement.",
                                "<strong>Auto-remplissage intelligent</strong> avec appariement par tag et dropdown OCR pour corrections manuelles.",
                                "<strong>Réanalyse automatique</strong> des courses passées quand la liste est modifiée.",
                                "<strong>Minuteur de course</strong> piloté par les symboles en course (démarrage/arrêt/reset automatiques).",
                                "<strong>Traductions IT / ES</strong> ajoutées (en plus de EN/FR/DE/JA).",
                                "<strong>Configuration de liste simplifiée</strong> : room, MMR et tier sont désormais optionnels."
                        ],
                        notesLabel: "Notes",
                        notes: [
                                "La course 1 doit inclure les 12 joueurs.",
                                "Les courses à 10 joueurs sont valides ; 9 ou moins ⇒ à refaire.",
                                "Prend en charge les formats FFA, 2v2, 3v3, 4v4 et 6v6 de la file Lounge.",
                                "Tout reste local dans votre navigateur.",
                                "Autocapture : détecte la fin de la course et prend la capture automatiquement."
                        ],
                        aboutLabel: "À propos",
                        about: [
                                "Créé par [Bholt](https://github.com/Bh0lt22)",
                                "Créé par [Niet](https://github.com/PFQNiet) ; contributeurs : TechyAlex",
                                "[Voir le code source sur GitHub](https://github.com/Bh0lt22/mkw-automatic-lounge-tracker)",
                                "[Signaler un bug](https://github.com/Bh0lt22/mkw-automatic-lounge-tracker/issues)"
                        ]
                },

                rosterSetup: {
                        title: "Configuration de la liste",
                        instructions: "Collez {count} joueurs :",
                        wrongLength: "{count} joueurs attendus, {actual} trouvés.",
                        badLine: "Ligne invalide : « {line} »",
                        rosterLoaded: "Liste chargée !"
                },

                capture: {
                        camera: "Caméra",
                        noCameras: "(Aucune caméra trouvée)",
                        selectCamera: "— Sélectionner une caméra —",
                        cameraFallbackLabel: "Caméra {deviceId}",
                        cameraStopped: "Caméra arrêtée",
                        cameraStarted: "Caméra démarrée : {label}",
                        cameraFailedToStart: "Impossible de démarrer la caméra sélectionnée",
                        captureButton: "📸 Capturer & OCR",
                        localSaveReminder: "⚠️ Pensez aussi à faire une capture d'écran sur la Switch !",
                        autoCaptureLabel: "Auto-capture",
                        useOverlay: "Connecter l'overlay",
                        lastCapture: "Dernière capture",
                        ocrResult: "OCR : « {ocrText} »",
                        unresolved: "(non résolu)",
                        maxRacesReached: "Nombre maximal de courses atteint.",
                        captureCancelled: "Capture annulée",
                        noScoreboardDetected: "Aucun tableau de scores détecté — capturez l'écran des résultats.",
                        noPauseScreenDetected: "Aucun nom trouvé — ouvrez l'écran Pause.",
                        ocrFailed: "Échec de l'OCR. Voir la console pour plus de détails.",
                        raceSaved: "Course {number} enregistrée !"
                },

                overlay: {
                        connected: "Overlay connecté",
                        failed: "Échec de la connexion à l'overlay",
                        title: "Connexion de l'overlay",
                        about: "L'overlay nécessite un programme relais en cours d'exécution sur votre ordinateur.",
                        firstTime: "Si c'est votre première utilisation, [suivez ces instructions](https://github.com/PFQNiet/mkw-lounge-tracker/blob/master/obs-companion/README.md) pour commencer.",
                        instructions: "Si c'est déjà fait, assurez-vous que le relais est en cours d'exécution. Si vous avez refusé l'autorisation du navigateur, vous devrez peut-être la réactiver dans les paramètres du site.",
                        close: "Fermer"
                },

                manualResolution: {
                        title: "Résoudre les joueurs non appariés",
                        selectPlayer: "— Sélectionner un joueur —"
                },

                editRace: {
                        title: "Modifier la course",
                        instructions: "Sélectionnez deux joueurs à permuter.",
                        deleteRaceButton: "Supprimer la course",
                        confirmDelete: "Supprimer définitivement cette course ?",
                        disconnectedPlace: "DC",
                        uniquePlacementError: "Chaque place 1..12 ne peut être choisie qu'une seule fois.",
                        raceUpdated: "Course {number} mise à jour !",
                        raceDeleted: "Course {number} supprimée !"
                },

                editRoster: {
                        title: "Modifier la liste",
                        team: "Équipe {id}",
                        tag: "Tag",
                        loungeName: "Nom Lounge",
                        ingameName: "Nom en jeu",
                        substitute: "Remplaçant",
                        autodetect: "(détection auto)",
                        noSubstitute: "(aucun)",
                        editSubButton: "Modifier",
                        autofill: "Remplir auto.",
                        rosterUpdated: "Liste mise à jour !",
                        racesRematched: "{count} course(s) réanalysée(s) avec la nouvelle liste.",
                        resetNames: "↺ Réinitialiser les noms",
                        confirmResetNames: "Effacer tous les noms en jeu et le cache OCR ? Action irréversible.",
                        namesReset: "Tous les noms en jeu ont été effacés."
                },

                substitutePlayer: {
                        title: "Remplacer un joueur",
                        joinedAt: "A rejoint à la course n°",
                        newSubstitute: "Nouveau remplaçant",
                        substituteUpdated: "Remplaçant mis à jour !"
                },

                scoreboard: {
                        title: "Classement",
                        team: "Équipe",
                        player: "Joueur",
                        raceNumber: "C{number}",
                        total: "Total",
                        editRosterButton: "Modifier la liste",
                        newSessionButton: "🧹 Nouvelle session",
                        snapshotScoresButton: "🖼️ Capture",
                        obsOverlayButton: "📺 Overlay scores OBS",
                        downloadZipButton: "📦 Télécharger le ZIP",
                        exportScoresButton: "📤 Exporter les scores"
                },

                noCapturePage: {
                        lead: "Suivez les scores manuellement, sans capture card. Choisissez les joueurs position par position.",
                        steps: [
                                "<strong>1.</strong> Collez la liste des 12 joueurs, comme dans le mode principal.",
                                "<strong>2.</strong> Cliquez sur <em>Enregistrer les scores</em> sous une colonne de course.",
                                "<strong>3.</strong> Choisissez chaque joueur un par un (1er, 2e, …). Utilisez <em>DC</em> pour les déconnexions sur les deux dernières places.",
                                "<strong>4.</strong> Exportez les scores à la fin, comme dans le mode principal."
                        ]
                },

                noCapture: {
                        saveScoresButton: "Enregistrer les scores",
                        wizardTitle: "Course {number} — Enregistrer les scores",
                        selectPlace: "Sélectionnez le joueur à la {place}e place",
                        selectPlace1: "Sélectionnez le joueur à la 1re place",
                        selectPlace2: "Sélectionnez le joueur à la 2e place",
                        selectPlace3: "Sélectionnez le joueur à la 3e place",
                        progress: "{done}/{total} positions assignées",
                        allAssigned: "Les 12 positions sont assignées. Cliquez sur Enregistrer pour confirmer.",
                        undoButton: "↩ Annuler",
                        dcButton: "⚠ DC (déconnexion)",
                        confirmOverwrite: "La course {number} a déjà des scores. Écraser ?",
                        noMorePlayers: "Plus aucun joueur disponible à marquer comme DC.",
                        notAllAssigned: "Veuillez assigner les 12 positions avant d'enregistrer.",
                        dc: "DC"
                },

                exportScores: {
                        title: "Exporter les scores",
                        format: "Format",
                        close: "Fermer",
                        copy: "Copier",
                        copiedToClipboard: "Copié !",
                        failedToCopy: "Échec de la copie, utilisez Ctrl/Cmd+C pour copier manuellement."
                },

                gallery: {
                        title: "Historique des courses",
                        imageAltText: "Capture de la course {number}",
                        imageCaption: "Course {number} · {time}"
                }
        },

        format: {
                /** @param {number} n */
                ordinal(n) {
                        // FR ordinals: 1er, then 2e, 3e, …; we'll add a FIGURE SPACE for mono alignment on other places.
                        return `e${n === 1 ? 'r' : '\u2007'}`;
                },
                /** @param {number} n */
                place(n) {
                        // Prepend a FIGURE SPACE for single-digit numbers so they align with 10+ in mono/tabular fonts.
                        return `${n < 10 ? '\u2007' : ''}${n}${this.ordinal(n)}`;
                },

                /** @param {number} n */
                number(n) { return n.toLocaleString('fr'); },
                /** @param {Date} d */
                time(d) { return d.toLocaleTimeString('fr', { timeStyle: 'short' }); }
        }
};
