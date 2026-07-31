# RoboSudoku — Development Plan

## Context

Build **RoboSudoku**, a free, ad-free sudoku game for web + iOS/Android in the existing Expo SDK 57 project (expo-router template, source under `src/`). Core requirements: open-source puzzle generation (easy/medium/hard), tap-to-select + tap-number entry, web keyboard input, red conflict highlighting with a show-errors toggle (default on), auto completion-detection ("congrats" vs exactly "There is at least 1 error."), Undo with ~1000-step history. We will trial **fully separate UIs**, switchable in a settings menu, where **each UI can additionally offer its own skins and layout variants**. Future features to design for (not build yet): pencil notes (manual + auto), tiered hints.

Per AGENTS.md: consult https://docs.expo.dev/versions/v57.0.0/ before writing code touching Expo APIs.

## Architecture: three levels of UI choice

1. **UI** — a complete, self-contained game-screen implementation (own components and structure). Registered in a manifest; the Game route just renders the active UI's component.
2. **Skin** (per-UI, optional) — colors/fonts/line metrics consumed by that UI. Each UI declares its own skin set (they may share palette definitions from a common library).
3. **Layout variant** (per-UI, optional) — structural options within a UI (e.g., number pad bottom vs. side on wide screens).

All UIs sit on one shared engine + game state, so switching UIs mid-puzzle preserves the game.

```ts
// src/uis/types.ts
export interface GameUI {
  id: string; name: string; description: string;
  component: React.ComponentType;              // full game screen; reads game/settings via context
  skins?: Record<string, BoardSkin>;           // this UI's skin registry (empty = not skinnable)
  layouts?: Record<string, { name: string }>;  // this UI's layout variants
  defaultSkinId?: string; defaultLayoutId?: string;
}
// src/uis/index.ts — registry: export const UIs = { classic: classicUI, zen: zenUI } as const
```

```ts
// src/skins/types.ts — shared skin contract (UIs may ignore fields they don't use)
export interface SkinPalette {
  boardBackground: string; cellBackground: string; alternateBoxBackground?: string;
  gridLine: string; boxLine: string;
  givenText: string; entryText: string; conflictText: string;
  selectedCell: string; peerHighlight: string; sameValueHighlight?: string;
  padBackground: string; padText: string; padPressed: string;
}
export interface BoardSkin {
  id: string; name: string;
  light: SkinPalette; dark: SkinPalette;       // orthogonal to system light/dark mode
  metrics: { gridLineWidth: number; boxLineWidth: number; cellGap: number;
             cellCornerRadius: number; boardCornerRadius: number };
  fonts: { cellFontFamily: string; givenWeight: FontWeight; entryWeight: FontWeight };
}
```

**Initial UIs:**
- **Classic UI** (`src/uis/classic/`) — traditional: toolbar (New Game + difficulty, Undo), board, status banner, number pad. **4 skins**: Classic Newspaper (serif, hairline grid, heavy box borders), Modern Minimal (sans, cell gaps, rounded, blue selection), High Contrast (thick lines, saturated highlights), Dark Neon (dark-first glowing accents). **2 layouts**: `pad-bottom`, `pad-side` (pad right of board when width allows; falls back to bottom on narrow screens).
- **Zen UI** (`src/uis/zen/`) — a genuinely different implementation proving the abstraction: minimal chrome, board-dominant, compact inline digit strip, subdued single palette pair (1 skin, no layout variants). Small by design.

Later UIs = new folder + one registry line; the settings screen adapts automatically.

## Core engine & state (shared by all UIs)

**Generator: `sudoku-gen` npm package** (^1.0.2, MIT, zero deps, TS types) — returns `{ puzzle, solution, difficulty }` as 81-char strings with easy/medium/hard. Wrapped in `src/engine/generate.ts` so a homegrown solver can replace it later for technique-based hints. Keeping the solution string enables future reveal-style hints; completion checking doesn't need it (full board + zero conflicts = solved).

```ts
// src/engine/types.ts
type Digit = 1|2|3|4|5|6|7|8|9;  type CellValue = 0 | Digit;
interface Cell { given: boolean; value: CellValue; notes: number /* bitmask, future pencil notes */ }
type Board = Cell[];  // 81, index = row*9+col
```

- `src/engine/rules.ts`: `getConflicts(board): Set<number>` (both members of any row/col/box duplicate pair flagged — givens includable when a user entry collides), `isBoardFull`, `getCandidates` (future auto-notes). Pure, derived via `useMemo`, never stored. When show-errors is off, conflicts are *hidden*, not skipped — completion detection still works.
- `src/state/game-reducer.ts` — React context + `useReducer` (no zustand; React Compiler is already enabled and memoizes cells). State: `{ board, meta: {difficulty, solution}, selected, undoStack, status: 'playing'|'won'|'wrong' }`. Actions: `NEW_GAME`, `SELECT`, `MOVE_SELECTION` (arrows), `INPUT`, `CLEAR`, `UNDO`, `HYDRATE`. `INPUT`/`CLEAR` no-op on given cells and push prior cell state `{index, value, notes}` onto `undoStack` (capped at 1000, oldest dropped). Reducer recomputes `status` when the 81st cell fills: no conflicts → `won` (congratulate), else `wrong` → show exactly **"There is at least 1 error."**
- `src/state/settings-context.tsx` — `{ activeUiId, showErrors, perUi: { [uiId]: { skinId?, layoutId? } } }`, defaults `classic`/`true`. Write-through persisted as JSON under `robosudoku.settings.v1`.
- **Persistence**: `expo-sqlite/kv-store` sync API on native (`src/state/storage.ts`) + `localStorage` on web (`storage.web.ts`) — expo-sqlite's web/wasm support won't work with `web.output: "static"`, and Metro platform-split keeps it out of the web bundle. Web defers reads until hydration (copy pattern from `src/hooks/use-color-scheme.web.ts`). Also persist the in-progress game (`robosudoku.game.v1`, debounced write; `HYDRATE` on launch; cleared on win).
- **Web keyboard**: `src/components/game/use-keyboard-controls.web.ts` (`document` keydown → 1-9 INPUT, 0/Del/Backspace CLEAR, arrows MOVE_SELECTION with `preventDefault`) + no-op `.ts` for native. Shared by any UI that wants it.
- **Shared primitives** in `src/components/game/` (UIs may use or replace): `board-grid.tsx`, `board-cell.tsx`, `number-pad.tsx`, `status-banner.tsx`. Responsive sizing via `useWindowDimensions` (board ≈ `min(width − padding, 520)`), respecting existing `MaxContentWidth`/`Spacing` from `src/constants/theme.ts`.

## Navigation & screens

Keep the template's AppTabs native/web split pattern, renamed to **Game** + **Settings**:
- `src/app/index.tsx` → Game screen: renders `UIs[settings.activeUiId].component`.
- `src/app/settings.tsx` (replaces `explore.tsx`): UI picker (cards from the `UIs` registry) → per-UI section driven by the selected UI's manifest (skin swatch row with mini previews, layout radio) → show-errors toggle. Components in `src/components/settings/`.
- `src/components/app-tabs.tsx` / `app-tabs.web.tsx`: rename triggers, brand text → "RoboSudoku"; providers (`GameProvider`, `SettingsProvider`) mount in `src/app/_layout.tsx` above `<AppTabs />` so game state survives tab switches.

## Milestones (playable early)

Work happens on milestone branches (`m01-template-updates`, `m02-engine`, …), merged to `main` on completion.

- **M1 — Repurpose template** (branch `m01-template-updates`): delete `explore.tsx`, `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`; stub `settings.tsx`; rename tabs in both `app-tabs` files. Verify two tabs on web.
- **M2 — Engine + tests** (branch `m02-engine`): `npx expo install sudoku-gen`; dev-install `jest-expo jest @types/jest` (SDK 57's recommended test setup), add `"test": "jest"` + `jest-expo` preset. Write and test `engine/` + `game-reducer` (conflict row/col/box cases, full-board valid/invalid, undo push/pop/1000-cap, given immutability).
- **M3 — First playable UI** (branch `m03-playable-ui`): providers in `_layout.tsx`; Classic UI with one hardcoded skin, selection + peer highlight, conflict reds, number pad, undo, status banner, web keyboard, responsive sizing. **Fully playable at end of M3 — first user trial here.**
- **M4 — UI framework + settings** (branch `m04-ui-framework`): `GameUI` manifest/registry, `useActiveSkin()`/`useActiveLayout()` hooks; all 4 Classic skins + `pad-side` layout; settings screen (UI/skin/layout pickers, show-errors); `expo-sqlite` + storage split; settings persistence.
- **M5 — Zen UI + polish** (branch `m05-zen-polish`): second UI proving the abstraction; in-progress-game persistence + hydration; win-state flourish (Reanimated available); scaffold eslint via `npx expo lint` and fix findings.
- **Future** (designed-for): pencil notes (bitmask already in `Cell`), auto-notes via `getCandidates`, tiered hints (solution string retained; solver swap-in behind `generate.ts`).

## Packages to add

| Package | Why |
|---|---|
| `sudoku-gen` ^1.0.2 | puzzle generation (MIT, zero deps) |
| `expo-sqlite` (via `npx expo install`) | kv-store persistence, native only |
| `jest-expo`, `jest`, `@types/jest` (dev) | engine/reducer tests |

## Verification

1. `npm test` — engine + reducer suites green.
2. `npx tsc --noEmit` — strict TS, typed routes.
3. `npm run web`: play a full easy puzzle keyboard-only; toggle show-errors; finish a puzzle wrong → exact error string; finish correct → congratulation; switch UI (Classic ↔ Zen), skins, and layout in Settings; reload page → settings + in-progress board restored.
4. Native (Expo Go / dev build): touch play, native tabs, persistence across restart.
