#!/usr/bin/env python3
"""
generate_bitmask.py
===================

Genera il bitmask JS per src/autocapture.js a partire da un PNG ritagliato del
simbolo di riferimento.

Il PNG deve essere gia' ritagliato alle dimensioni esatte della ROI che
verra' usata nel codice JS. La larghezza DEVE essere multipla di 8 (permette
di impacchettare 8 pixel in un byte senza padding).

Esempio d'uso
--------------

1. Fai uno screenshot 1920x1080 della capture card durante una gara.
2. Aprilo in un editor (GIMP, Paint, Photoshop...).
3. Ritaglia SOLO il simbolo delle monete (comprese le cifre del numero,
   es. "x5"). Salva come coins.png. Annota le coordinate del rettangolo
   (x, y, w, h) rispetto all'immagine 1920x1080 originale.
4. Esegui:

       python3 generate_bitmask.py coins.png

5. Lo script stampa:
   - L'array di byte JS pronto da copiare in COIN_BITMASK.
   - L'istruzione per la ROI, con le coordinate che hai annotato.

Binarizzazione
--------------

Per essere coerente con src/capture.js (preprocessCrop), lo script usa la
stessa identica soglia: pixel con luminanza Y > 240 = bianco (1), altrimenti
nero (0). Y = (R*299 + G*587 + B*114) / 1000.

Opzioni
-------

  --ascii         Stampa anche l'ASCII art del bitmask (utile per debug).
  --invert        Inverte bianco/nero (casi rari in cui il simbolo e' scuro
                  su sfondo chiaro).
  --threshold T   Soglia di luminanza (default 240, come nel JS).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.stderr.write(
        "Errore: serve Pillow. Installala con:\n"
        "  pip install pillow\n"
    )
    sys.exit(1)


def to_binary_bits(image: Image.Image, threshold: int = 240, invert: bool = False) -> list[list[int]]:
    """Converte un'immagine in matrice 0/1 con la stessa regola di preprocessCrop()."""
    gray = image.convert("RGB")
    w, h = gray.size
    px = gray.load()
    bits = []
    for y in range(h):
        row = []
        for x in range(w):
            r, g, b = px[x, y]
            y_lum = (r * 299 + g * 587 + b * 114) / 1000
            v = 1 if y_lum > threshold else 0
            if invert:
                v = 1 - v
            row.append(v)
        bits.append(row)
    return bits


def pack_bytes(bits: list[list[int]]) -> bytes:
    """Pacca 8 bit in un byte, MSB prima, riga per riga. Larghezza multipla di 8."""
    packed = bytearray()
    for row in bits:
        if len(row) % 8 != 0:
            raise ValueError(
                f"Larghezza {len(row)} non multipla di 8. "
                "Ritaglia il PNG in modo che la larghezza sia multipla di 8."
            )
        for i in range(0, len(row), 8):
            byte = 0
            for j in range(8):
                if row[i + j]:
                    byte |= 0x80 >> j
            packed.append(byte)
    return bytes(packed)


def format_js_array(data: bytes, per_line: int = 5) -> str:
    """Formatta i byte come array JS pronto per src/autocapture.js."""
    lines = []
    for i in range(0, len(data), per_line):
        chunk = data[i:i + per_line]
        lines.append("\t" + ", ".join(f"0x{b:02X}" for b in chunk) + ",")
    body = "\n".join(lines)
    return f"new Uint8Array([\n{body}\n]);"


def ascii_art(bits: list[list[int]]) -> str:
    """ASCII art del bitmask (1 = '#', 0 = '.')."""
    return "\n".join(
        "".join("#" if v else "." for v in row) for row in bits
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("png", type=Path, help="PNG ritagliato del simbolo")
    ap.add_argument("--threshold", type=int, default=240, help="Soglia luminanza (default 240, come nel JS)")
    ap.add_argument("--invert", action="store_true", help="Inverte bianco/nero")
    ap.add_argument("--ascii", action="store_true", help="Stampa anche l'ASCII art")
    ap.add_argument("--var", default="BITMASK", help="Nome variabile JS (es. COIN_BITMASK)")
    args = ap.parse_args()

    if not args.png.is_file():
        sys.stderr.write(f"File non trovato: {args.png}\n")
        return 1

    img = Image.open(args.png)
    w, h = img.size
    print(f"# Immagine: {args.png.name}  ({w}x{h} px)", file=sys.stderr)
    print(f"# Larghezza multipla di 8: {w % 8 == 0}", file=sys.stderr)
    if w % 8 != 0:
        sys.stderr.write(
            f"\nERRORE: larghezza {w} non multipla di 8.\n"
            "Ritaglia il PNG aggiungendo/togliendo colonne nere ai lati fino a\n"
            "ottenere una larghezza multipla di 8 (es. 40, 48, 56, 64...).\n"
        )
        return 2

    bits = to_binary_bits(img, threshold=args.threshold, invert=args.invert)
    packed = pack_bytes(bits)

    white_ratio = sum(sum(r) for r in bits) / (w * h)
    print(f"# Rapporto bianco/nero: {white_ratio:.3f}", file=sys.stderr)
    if not (0.1 <= white_ratio <= 0.7):
        print(
            "# ATTENZIONE: rapporto bianco/nero fuori dal range tipico 0.1..0.7.\n"
            "# Verifica che la soglia --threshold sia corretta o prova --invert.",
            file=sys.stderr,
        )

    print(f"# Totale byte: {len(packed)} (atteso: {w * h // 8})", file=sys.stderr)
    print(file=sys.stderr)

    var = args.var
    print(f"// Generato da {args.png.name} ({w}x{h}, soglia {args.threshold})")
    print(f"// Incolla questo in src/autocapture.js:")
    print(f"export const {var} = {format_js_array(packed)}")
    print()
    print(f"// E ricorda di aggiornare la ROI corrispondente con le stesse dimensioni:")
    print(f"//   {{ x: <misura>, y: <misura>, w: {w}, h: {h} }}")
    print(f"// dove x, y sono le coordinate del rettangolo rispetto a un canvas 1920x1080.")

    if args.ascii:
        print()
        print("# ASCII art (1 = '#', 0 = '.'):")
        print(ascii_art(bits))

    return 0


if __name__ == "__main__":
    sys.exit(main())
