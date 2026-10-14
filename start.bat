@echo off
REM ============================================================
REM  MKW Lounge Tracker — avvio server locale
REM  Doppio click su questo file per avviare il bot.
REM ============================================================

REM Cambia directory nella cartella dove si trova questo .bat
cd /d "%~dp0"

echo.
echo ============================================================
echo   MKW Lounge Tracker - avvio server locale
echo ============================================================
echo.
echo   Il server sara' disponibile su:
echo      http://localhost:8000
echo.
echo   Per fermare il server: chiudi questa finestra oppure
echo   premi Ctrl+C.
echo.
echo ============================================================
echo.

REM Verifica che Node sia installato
where node >nul 2>nul
if errorlevel 1 (
    echo ERRORE: Node.js non e' installato o non e' nel PATH.
    echo.
    echo Scarica Node.js da: https://nodejs.org/
    echo Dopo l'installazione, riesegui questo file.
    echo.
    pause
    exit /b 1
)

REM Avvia il server
node server.js

REM Se il server si ferma, mantieni la finestra aperta per leggere gli errori
echo.
echo Server fermato. Premi un tasto per chiudere.
pause >nul
