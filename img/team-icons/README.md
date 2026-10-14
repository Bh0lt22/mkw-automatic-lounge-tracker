# Immagini dei team

Questa cartella contiene le 6 immagini PNG che sostituiscono le emoji dei
team nella scoreboard. Le immagini sono già state fornite dall'utente.

## Come funziona

In MKW ci sono 6 emoji per i team (🍄🐢🦍🌌💰🦖) perché in 2v2 si arriva a
6 team. L'immagine assegnata a un team dipende SOLO dalla sua posizione
in classifica, non dal colore del team:

| File              | Posizione in classifica |
|-------------------|------------------------|
| `rank-1.png`      | 1°                     |
| `rank-2.png`      | 2°                     |
| `rank-3.png`      | 3°                     |
| `rank-4.png`      | 4°                     |
| `rank-5.png`      | 5°                     |
| `rank-6.png`      | 6°                     |

Specifiche:
- **Dimensioni**: 32 × 32 pixel
- **Formato**: PNG con sfondo trasparente (RGBA)

## Come sostituire le immagini

1. Crea le nuove immagini con Photoshop (32×32 px, sfondo trasparente).
2. Salvale qui con i nomi `rank-1.png` … `rank-6.png` (sovrascrivi quelle
   esistenti).
3. Ricarica la pagina del browser. La cache interna del browser potrebbe
   richiedere un hard refresh (Ctrl+Shift+R).

## Fallback

Se una immagine manca o non si carica, il codice fa fallback all'emoji
originale del team (🍄🐢🦍🌌💰🦖) per quella riga.
