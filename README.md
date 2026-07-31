# RoboSudoku 🤖

A free-to-play, ad-free sudoku game for web, iOS, and Android, built with [Expo](https://expo.dev) (SDK 57, expo-router).

## Features

- Puzzle generation at easy, medium, or hard difficulty (via the MIT-licensed [`sudoku-gen`](https://www.npmjs.com/package/sudoku-gen))
- Tap a cell, then tap a number to fill it — full keyboard support on web (1–9 to enter, 0/Delete/Backspace to clear, arrow keys to move)
- Conflict highlighting: an entry that collides with another in its row, column, or 3×3 box shows both cells in red, with a "Show errors" toggle (default on)
- Automatic completion detection — congratulations when solved, "There is at least 1 error." when not
- Undo with up to 1000 steps per puzzle
- Switchable UIs, each with optional skins and layout variants (in progress — see the roadmap)

## Get started

```bash
npm install
npx expo start
```

From the dev server you can open the app on web, in [Expo Go](https://expo.dev/go), or in an Android emulator / iOS simulator. `npm run web` starts the web target directly.

## Development

```bash
npm test            # jest (engine + reducer suites)
npx tsc --noEmit    # typecheck (run `npx expo start` once first to generate expo-env.d.ts)
npm run lint        # expo lint
```

### Project layout

```
src/
  app/            expo-router routes: index (Game), settings, _layout
  engine/         pure sudoku logic: generation, conflict/completion rules
  state/          game reducer (undo, status) + settings context
  skins/          shared BoardSkin contract
  uis/            self-contained game UIs (classic/, ... each with its own skins)
  components/     shared board/number-pad primitives, tabs, themed components
```

Design and milestone details live in [dev-notes/development-plan.md](dev-notes/development-plan.md).

## Roadmap

- [x] M1 — Repurpose the Expo template (Game + Settings tabs)
- [x] M2 — Sudoku engine, game reducer, tests
- [x] M3 — First playable version: Classic UI with newspaper skin
- [ ] M4 — UI registry, remaining Classic skins, settings screen, persistence
- [ ] M5 — Zen UI (second full UI) + polish
- [ ] Future — pencil notes (manual + auto), tiered hints
