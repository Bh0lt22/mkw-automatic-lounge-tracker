# MKW Automatic Lounge Tracker

**Use it live: https://bh0lt22.github.io/mkw-automatic-lounge-tracker/** — no install, everything runs in your browser.

Fork of [PFQNiet/mkw-lounge-tracker](https://github.com/PFQNiet/mkw-lounge-tracker) that tracks scores during Mario Kart World "mogi" sessions (competitive Lounge events). It reads player names and placements from your capture card with OCR, keeps cumulative scores across 12 races, and exports results in the format used by Lounge Discord bots.

## Features

- **Autocapture (race end):** automatically screenshots the leaderboard when the in-race symbols (coin + lap flag) disappear — no manual capture needed, with retry loop.
- **Passive race timer:** starts when the race symbols appear, stops ~1.5s after they disappear (ignores short dropouts like falling off track). Display only, zero capture overhead.
- **Smart roster autofill:** pause the game, hit Auto-fill and player names are matched automatically (team-tag + fuzzy + initials matching), with strict rules — never cross-team, never duplicated.
- **Team-tag shortcuts:** detected initials can be picked from a dropdown to fill team tags quickly.
- **No capture card mode:** track scores manually, position by position, with DC support.
- **OBS scores overlay:** transparent browser-source overlay with live team scores (+ optional always-on-top PiP).
- **Team rank icons, position + gap columns, auto re-analysis** of past races when the roster is edited.
- **Themes:** Glass (default), Clean (pitch-dark, zero animations — best during mogis), Fluid with 6 color variants.
- **6 languages:** English, Italiano, Español, Français, Deutsch, 日本語.

## How to use

1. Open the live site above in Chrome (recommended).
2. In OBS, set your canvas to **1920×1080 (16:9)** and enable the Virtual Camera fed by your capture card.
3. Click **Get started** and paste the 12-player roster from the Lounge bot.
4. Select your virtual camera in the preview area.
5. *(Recommended)* Open the in-game pause menu showing all players and click **Auto-fill** in Edit roster so the bot learns the names upfront.
6. Enable **Autocapture** and play. Screenshots, OCR and scores happen automatically.
7. When done, **Export scores** for Discord.

No capture card? Use **No capture card** mode and enter placements manually.

## How it works

100% client-side — this site only serves static files, all the work happens in your browser:

- Each video frame is normalized to a 1920×1080 canvas, so **any 16:9 capture resolution** (720p, 1080p, 4K) works the same. Non-16:9 sources get center-cropped and may misalign — keep OBS at 16:9.
- Race-end detection compares the live frame against `img/race-end-reference.png` (coin + lap flag pixels only, 75% match ratio).
- Names are read with Tesseract.js (offline, in-browser) and matched to the roster with weighted Levenshtein + tag + initials logic.
- Scores follow Lounge rules (`15,12,10,9,8,7,6,5,4,3,2,1`, DC = 1).

## For developers

```bash
# Local preview (optional — the live site needs nothing)
node server.js
# → http://localhost:8000
```

No `npm install` needed: the static server uses Node built-ins only. See `CHANGELOG.txt` for the full change history and `agents.md` for the project handoff notes.

## Credits

- Original project: [PFQNiet/mkw-lounge-tracker](https://github.com/PFQNiet/mkw-lounge-tracker)
- This fork: Bholt (`bholt_22` on Discord)

## License

See `LICENSE`.
