#!/usr/bin/env bash
# ============================================================
#  MKW Lounge Tracker — avvio server locale (Mac/Linux)
#  Esegui da terminale:  ./start.sh
# ============================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "============================================================"
echo "  MKW Lounge Tracker - avvio server locale"
echo "============================================================"
echo ""
echo "  Il server sara' disponibile su:"
echo "     http://localhost:8000"
echo ""
echo "  Per fermare il server: Ctrl+C"
echo ""
echo "============================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "ERRORE: Node.js non e' installato o non e' nel PATH."
    echo ""
    echo "Scarica Node.js da: https://nodejs.org/"
    exit 1
fi

node server.js
