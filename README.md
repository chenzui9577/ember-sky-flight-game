# Ember Sky Post — Dusk Valley Mail Run

[![Competition](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/chenzui9577/ember-sky-flight-game/rank.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/chenzui9577/ember-sky-flight-game/reward.svg)](https://make.fun/c/best-flight-game-20261126-0057)

An original cockpit flight game for [make.fun's best flight game bounty](https://make.fun/c/best-flight-game-20261126-0057).
You are Mara Venn, last pilot of the Dusk Valley air mail run: thread six glowing
ember rings, drop the mail pouch over Lantern Farm, and land gently on the
Ember Field strip before dark.

## Play

Open `game/index.html` from any static server — or run `node serve.ts` and visit
http://localhost:8080. Keyboard and mouse, fully offline, no build step.

- Arrow keys pitch and bank, `W`/`S` throttle, `Space` drops the mail, `P` pauses.
- Live cockpit instruments: attitude, altitude, speed, heading, fuel and climb.
- Ring combos, a timed sortie, fuel and hull pressure, a three-star pilot's log.

## Layout

- `main.ts` — hands the entry in (copies `game/` and `screenshots/`, writes the dossier).
- `game/` — the playable game: `index.html`, `style.css`, and ES modules under `src/`
  (flight model, course world, scene and cockpit renderers, scoring, particles, audio, input).
- `screenshots/` — four real renders of the game in a browser.
- `vendor/makefun-game.ts` — the make.fun dossier library, vendored unchanged.

MIT licensed — see `LICENSE`.
