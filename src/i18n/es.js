export default {
        _meta: {
                name: 'Español',
                dir: 'ltr',
                code: 'es'
        },

        text: {
                title: "MKW Mogi Manager",
                loading: "Cargando…",
                processing: "Procesando…",
                save: "Guardar",
                confirm: "Confirmar",
                cancel: "Cancelar",
                blank: "—",

                landingPage: {
                        lead: "Captura, OCR, puntuación; directamente en tu navegador. Sin instalaciones, sin subidas.",
                        features: [
                                "OCR sin conexión",
                                "Gestión de desconexiones",
                                "Resolución manual + edición",
                                "Exportación Lounge"
                        ],
                        steps: [
                                "**1.** Haz clic en __Comenzar__ y pega la lista de 12 jugadores (`1. Nombre (12345 MMR)`).",
                                "**2.** Elige tu cámara virtual en el área de vista previa.",
                                "**3.** Después de cada carrera, la captura se tomará automáticamente o manualmente.",
                                "**4.** Corrige con __Editar__ → __Guardar__. Exporta las puntuaciones cuando termines.",
                                "**5.** Si no tienes capture card, puedes usar el modo manual con __No capture card__."
                        ],
                        getStartedButton: "🚀 Comenzar",
                        noCaptureCardButton: "🎮 Sin capture card",
                        forkFeaturesLabel: "🆕 Nuevas funciones del fork",
                        forkFeatures: [
                                "<strong>Autocaptura (fin de carrera):</strong> captura automática cuando los símbolos de carrera desaparecen — sin capturas manuales.",
                                "<strong>Modo sin capture card:</strong> registra puntuaciones manualmente eligiendo jugadores posición por posición.",
                                "<strong>Overlay de puntuaciones OBS:</strong> overlay transparente con puntuaciones de equipos para OBS Browser Source.",
                                "<strong>Iconos de rank de equipo:</strong> iconos personalizados según la posición en la clasificación (1°..6°).",
                                "<strong>Columnas de Diff y Posición</strong> en la tabla de puntuaciones.",
                                "<strong>Autocompletar inteligente</strong> con emparejamiento por tag y dropdown OCR para correcciones manuales.",
                                "<strong>Reanálisis automático</strong> de carreras pasadas al editar la lista.",
                                "<strong>Temporizador de carrera</strong> guiado por los símbolos en carrera (inicio/parada/reset automáticos).",
                                "<strong>Traducciones IT / ES</strong> añadidas (además de EN/FR/DE/JA).",
                                "<strong>Configuración de lista simplificada</strong>: room, MMR y tier ahora son opcionales."
                        ],
                        notesLabel: "Notas",
                        notes: [
                                "La carrera 1 debe incluir a los 12 jugadores.",
                                "Las carreras de 10 jugadores son válidas; 9 o menos se repiten.",
                                "Soporta los formatos FFA, 2v2, 3v3, 4v4 y 6v6 de Lounge Queue.",
                                "Todo se queda local en tu navegador.",
                                "Autocaptura: detecta cuando termina la carrera y hace la captura automáticamente."
                        ],
                        aboutLabel: "Acerca de",
                        about: [
                                "Creado por Bholt",
                                "Creado por [Niet](https://github.com/PFQNiet); colaborador: TechyAlex",
                                "[Ver código fuente en GitHub](https://github.com/PFQNiet/mkw-lounge-tracker)",
                                "[Reportar un bug](https://github.com/PFQNiet/mkw-lounge-tracker/issues)"
                        ]
                },

                rosterSetup: {
                        title: "Configuración de la lista",
                        instructions: "Pega {count} jugadores:",
                        wrongLength: "Se esperaban {count} jugadores, se encontraron {actual}.",
                        badLine: "Línea no válida: «{line}»",
                        rosterLoaded: "¡Lista cargada!"
                },

                capture: {
                        camera: "Cámara",
                        noCameras: "(No se encontraron cámaras)",
                        selectCamera: "— Selecciona una cámara —",
                        cameraFallbackLabel: "Cámara {deviceId}",
                        cameraStopped: "Cámara detenida",
                        cameraStarted: "Cámara iniciada: {label}",
                        cameraFailedToStart: "No se pudo iniciar la cámara seleccionada",
                        captureButton: "📸 Capturar y OCR",
                        localSaveReminder: "⚠️ ¡Recuerda hacer también una captura en la Switch!",
                        autoCaptureLabel: "Captura Nintendo",
                        autoCaptureRaceEndLabel: "Autocaptura",
                        raceEndStarted: "Autocaptura race-end activa. El bot captura cuando los símbolos de carrera desaparecen.",
                        raceEndNotConfigured: "Race-end: no se puede cargar img/race-end-reference.png. Asegúrate de que el archivo esté presente.",
                        raceEndCaptureSuccess: "Captura automática exitosa.",
                        raceEndMaxRetries: "Captura automática fallida tras el máximo de intentos. Captura manualmente.",
                        useOverlay: "Conectar overlay",
                        lastCapture: "Última captura",
                        ocrResult: "OCR: «{ocrText}»",
                        unresolved: "(no resuelto)",
                        maxRacesReached: "Número máximo de carreras alcanzado.",
                        captureCancelled: "Captura cancelada",
                        noScoreboardDetected: "No se detectó tabla de puntuaciones — captura la pantalla de resultados.",
                        noPauseScreenDetected: "No se encontraron nombres — abre el menú de Pausa.",
                        ocrFailed: "OCR fallido. Mira la consola para más detalles.",
                        raceSaved: "¡Carrera {number} guardada!"
                },

                overlay: {
                        connected: "Overlay conectado",
                        failed: "Error al conectar el overlay",
                        title: "Conexión del overlay",
                        about: "El overlay requiere un programa relay ejecutándose en tu computadora.",
                        firstTime: "Si es la primera vez, [sigue estas instrucciones](https://github.com/PFQNiet/mkw-lounge-tracker/blob/master/obs-companion/README.md) para empezar.",
                        instructions: "Si ya lo hiciste, asegúrate de que el relay esté en ejecución. Si denegaste el permiso del navegador, puede que necesites reactivarlo en la configuración del sitio.",
                        close: "Cerrar"
                },

                manualResolution: {
                        title: "Resolver jugadores no emparejados",
                        selectPlayer: "— Selecciona un jugador —"
                },

                editRace: {
                        title: "Editar carrera",
                        instructions: "Selecciona dos jugadores para intercambiar.",
                        deleteRaceButton: "Eliminar carrera",
                        confirmDelete: "¿Eliminar definitivamente esta carrera?",
                        disconnectedPlace: "DC",
                        uniquePlacementError: "Cada posición 1..12 solo puede elegirse una vez.",
                        raceUpdated: "¡Carrera {number} actualizada!",
                        raceDeleted: "¡Carrera {number} eliminada!"
                },

                editRoster: {
                        title: "Editar lista",
                        team: "Equipo {id}",
                        tag: "Tag",
                        loungeName: "Nombre Lounge",
                        ingameName: "Nombre en juego",
                        substitute: "Suplente",
                        autodetect: "(autodetección)",
                        noSubstitute: "(ninguno)",
                        editSubButton: "Editar",
                        autofill: "Autocompletar",
                        rosterUpdated: "¡Lista actualizada!",
                        racesRematched: "{count} carrera(s) reanalizada(s) con la nueva lista.",
                        resetNames: "↺ Reiniciar nombres",
                        confirmResetNames: "¿Borrar todos los nombres en juego y la caché OCR? No se puede deshacer.",
                        namesReset: "Se han borrado todos los nombres en juego."
                },

                substitutePlayer: {
                        title: "Sustituir jugador",
                        joinedAt: "Se unió en la carrera n°",
                        newSubstitute: "Nuevo suplente",
                        substituteUpdated: "¡Suplente actualizado!"
                },

                scoreboard: {
                        title: "Clasificación",
                        team: "Equipo",
                        player: "Jugador",
                        raceNumber: "C{number}",
                        total: "Total",
                        gap: "Diff",
                        gapTitle: "Ventaja sobre el jugador siguiente",
                        editRosterButton: "Editar lista",
                        newSessionButton: "🧹 Nueva sesión",
                        snapshotScoresButton: "🖼️ Captura",
                        obsOverlayButton: "📺 Overlay de puntuaciones OBS",
                        downloadZipButton: "📦 Descargar ZIP",
                        exportScoresButton: "📤 Exportar puntuaciones"
                },

                noCapturePage: {
                        lead: "Lleva las puntuaciones manualmente, sin capture card. Elige los jugadores posición por posición.",
                        steps: [
                                "<strong>1.</strong> Pega la lista de 12 jugadores, como en el modo principal.",
                                "<strong>2.</strong> Haz clic en <em>Guardar puntuaciones</em> bajo una columna de carrera.",
                                "<strong>3.</strong> Elige cada jugador uno a uno (1°, 2°, …). Usa <em>DC</em> para desconexiones en los dos últimos puestos.",
                                "<strong>4.</strong> Exporta las puntuaciones al final, como en el modo principal."
                        ]
                },

                noCapture: {
                        saveScoresButton: "Guardar puntuaciones",
                        wizardTitle: "Carrera {number} — Guardar puntuaciones",
                        selectPlace: "Selecciona el jugador en {place}° lugar",
                        selectPlace1: "Selecciona el jugador en 1° lugar",
                        selectPlace2: "Selecciona el jugador en 2° lugar",
                        selectPlace3: "Selecciona el jugador en 3° lugar",
                        progress: "{done}/{total} posiciones asignadas",
                        allAssigned: "Las 12 posiciones asignadas. Haz clic en Guardar para confirmar.",
                        undoButton: "↩ Deshacer",
                        dcButton: "⚠ DC (desconexión)",
                        confirmOverwrite: "La carrera {number} ya tiene puntuaciones. ¿Sobrescribir?",
                        noMorePlayers: "No hay más jugadores disponibles para marcar como DC.",
                        notAllAssigned: "Asigna las 12 posiciones antes de guardar.",
                        dc: "DC"
                },

                exportScores: {
                        title: "Exportar puntuaciones",
                        format: "Formato",
                        close: "Cerrar",
                        copy: "Copiar",
                        copiedToClipboard: "¡Copiado!",
                        failedToCopy: "Copia fallida, usa Ctrl/Cmd+C para copiar manualmente."
                },

                gallery: {
                        title: "Historial de carreras",
                        imageAltText: "Captura de la carrera {number}",
                        imageCaption: "Carrera {number} · {time}"
                }
        },

        format: {
                /** @param {number} n */
                ordinal(n) {
                        // ES ordinals: 1.er, 2.º, 3.º, … — usamos º simplificado
                        return 'º';
                },
                /** @param {number} n */
                place(n) {
                        return `${n < 10 ? '\u2007' : ''}${n}${this.ordinal(n)}`;
                },

                /** @param {number} n */
                number(n) { return n.toLocaleString('es'); },
                /** @param {Date} d */
                time(d) { return d.toLocaleTimeString('es', { timeStyle: 'short' }); }
        }
};
