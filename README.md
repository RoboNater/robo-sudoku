# RoboSudoku 🤖

A free-to-play, ad-free sudoku game for web, iOS, and Android, built with [Expo](https://expo.dev) (SDK 57, expo-router).

## Features

- Puzzle generation at easy, medium, or hard difficulty (via the MIT-licensed [`sudoku-gen`](https://www.npmjs.com/package/sudoku-gen))
- Tap a cell, then tap a number to fill it — full keyboard support on web (1–9 to enter, 0/Delete/Backspace to clear, arrow keys to move)
- Conflict highlighting: an entry that collides with another in its row, column, or 3×3 box shows both cells in red, with a "Show errors" toggle (default on)
- Automatic completion detection — congratulations when solved, "There is at least 1 error." when not
- Undo with up to 1000 steps per puzzle
- Switchable UIs, each with optional skins and layout variants: **Classic** (difficulty toolbar, board, digit pad; 4 skins, pad-below/pad-beside layouts) and **Zen** (bare, board-first, one digit strip that counts down as you place digits)
- Your settings and the puzzle you are in the middle of are saved automatically and restored when you come back

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
  uis/            self-contained game UIs (classic/, zen/, ... each with its own skins)
  components/     shared board/number-pad primitives, tabs, themed components
```

Design and milestone details live in [dev-notes/development-plan.md](dev-notes/development-plan.md).

## Roadmap

- [x] M1 — Repurpose the Expo template (Game + Settings tabs)
- [x] M2 — Sudoku engine, game reducer, tests
- [x] M3 — First playable version: Classic UI with newspaper skin
- [x] M4 — UI registry, remaining Classic skins, settings screen, persistence
- [x] M5 — Zen UI (second full UI) + polish
- [x] M6 — Pencil notes: notes mode, autofill, auto-clear by row/column/box, grouped undo
- [ ] Future — tiered hints
