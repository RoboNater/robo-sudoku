# M6 — Pencil Notes

## Context

RoboSudoku is playable through M5 (Classic + Zen UIs, skins, layouts, persistence). Pencil
notes were designed for from the start but never built: `Cell.notes` is already a 9-bit
bitmask (`src/engine/types.ts:6-12`), `UndoEntry` already carries `notes`
(`src/state/game-reducer.ts:18-22`), persistence already round-trips note masks
(`src/state/game-store.ts:27,55,117-127`), and `getCandidates()` exists, is tested, and is
called by nothing but its own test (`src/engine/rules.ts:47`). What is missing is every
verb: no action mutates notes, no UI renders or enters them.

This milestone adds:

1. A **notes mode** — while on, the digit pad/keyboard toggles pencil marks instead of values.
2. An **autofill notes** button that fills every empty cell's notes.
3. Three **auto-clear checkboxes** (row / column / box) that prune peer notes when a digit is
   entered, *and* prune retroactively across the whole board when switched on.
4. **Correct undo for all of it** — the load-bearing requirement, and the source of the two
   structural changes below.

### Structural change 1: undo entries become groups

Today `undoStack: UndoEntry[]` where `UndoEntry = { index, value, notes }` — exactly one cell
per user action. The requirement ("enter a 5 with all three checkboxes on, then undo, and every
5-note that was pruned comes back") means one user action can touch up to 21 cells; autofill and
a retroactive prune can touch 81. So an undo entry must hold a *list* of cell snapshots.

### Structural change 2: the auto-clear flags live in `GameState`, not settings

Switching a checkbox on mutates notes board-wide, and undoing it must restore both the notes and
the checkbox. Undo lives in the pure reducer, which cannot reach the settings store — so
anything that participates in the undo timeline has to live in `GameState`.

That creates one problem: the stored game is wiped when a puzzle is won (`game-context.tsx`
removes `GAME_KEY` on `status === 'won'`), which would silently reset a player's checkbox
preferences. Fix: keep a **mirror** in `SettingsState` that is the *seed for a fresh game* only.
Every user flip writes both. The live value always comes from `GameState`.

```ts
/** Cell state as it was BEFORE the recorded action, for restoring on undo. */
export interface CellSnapshot {
  index: number;
  value: CellValue;
  notes: number;
}

/** One user action = one entry, however many cells (and flags) it touched. */
export interface UndoEntry {
  cells: CellSnapshot[];
  /** Auto-clear flags as they were before, present only when the action changed them. */
  autoClear?: NoteUnits;
}
```

`UNDO_LIMIT = 1000` keeps meaning 1000 *actions*.

### What is and isn't undoable

| Action | Undo entry? |
|---|---|
| Toggle a note, enter/erase a digit, autofill notes | Yes |
| Peer auto-clear triggered by a digit entry | Yes — same entry as the digit |
| Checkbox → **on** (prunes board-wide) | Yes — flags + every pruned cell, one entry |
| Checkbox → **off** (changes no notes) | Yes — flags only, no cells |
| Toggle notes mode | **No** — changes no board state |

## Decisions (from discussion)

| Question | Decision |
|---|---|
| Notes entry | **Mode toggle only.** No long-press, no Shift modifier. Keyboard `n` toggles. |
| Autofill contents | **1–9 pruned by the enabled checkboxes.** All three off ⇒ literal 1–9 everywhere. All three on ⇒ classic valid-candidates fill. |
| Checkbox placement | **All three in-game in Classic**, plus the Settings screen. Zen: Settings screen only. |
| Digit entry vs. own notes | **Clears that cell's notes**, restored by undo. |
| Retroactive prune scope | **Only the unit just switched on.** Enabling "row" prunes row conflicts and nothing else; other enabled units are not re-swept. |
| Checkbox → off | **Still an undo step** (flags only), so undo replays the action sequence exactly. |

---

## Implementation

### 1. `src/engine/rules.ts` — generalize candidates, add peers

`getCandidates`'s existing signature and tests stay valid via the default.

```ts
/** Which units a notes rule considers. */
export interface NoteUnits { row: boolean; col: boolean; box: boolean }
export const ALL_UNITS: NoteUnits = { row: true, col: true, box: true };

/** Indices sharing an enabled unit with `index` (never includes `index`). */
export function peersOf(index: number, units: NoteUnits = ALL_UNITS): number[]

/** Existing signature plus optional units; a disabled unit is not consulted. */
export function getCandidates(board: Board, index: number, units: NoteUnits = ALL_UNITS): number
```

`getCandidates` keeps its current body, guarding each of the three `rowOf/colOf/boxOf`
comparisons with the matching `units.*` flag. With all units off it returns `0b111111111`.
Single-unit calls are exactly what the retroactive prune needs. Update the doc comment — it is
no longer "future".

(`src/components/game/board-grid.tsx:88-90` computes peer highlighting inline with the same
comparison. Leave it — it is always all-three and sits per-cell inside a render loop.)

### 2. `src/state/game-reducer.ts` — notes mode, flags, notes actions, grouped undo

```ts
export interface GameState {
  board: Board;
  meta: PuzzleMeta | null;
  selected: number | null;
  /** Digit input writes pencil notes instead of values while true. */
  notesMode: boolean;
  /** Live auto-clear flags. Undoable, so they live here rather than in settings. */
  autoClearNotes: NoteUnits;
  undoStack: UndoEntry[];
  status: GameStatus;
}

export interface NotePrefs { notesMode: boolean; autoClearNotes: NoteUnits }
export const DEFAULT_NOTE_PREFS: NotePrefs = {
  notesMode: false,
  autoClearNotes: { row: true, col: true, box: true },
};

export function createNewGame(difficulty: Difficulty, prefs?: NotePrefs): GameState
export function createEmptyGame(prefs?: NotePrefs): GameState
```

Both default to `DEFAULT_NOTE_PREFS`. **`NEW_GAME` carries the current live prefs forward** —
`createNewGame(action.difficulty, { notesMode: state.notesMode, autoClearNotes: state.autoClearNotes })`
— so dealing a new puzzle never silently changes how notes behave.

Actions:

```ts
| { type: 'INPUT'; digit: Digit }                                       // existing, behavior extended
| { type: 'CLEAR' }                                                     // existing, behavior extended
| { type: 'SET_NOTES_MODE'; on: boolean }                               // new
| { type: 'TOGGLE_NOTES_MODE' }                                         // new (keyboard `n`)
| { type: 'AUTOFILL_NOTES' }                                            // new
| { type: 'SET_AUTO_CLEAR'; unit: 'row' | 'col' | 'box'; on: boolean }  // new
```

The reducer now owns the flags, so **no action carries them as a payload** and every caller stays
dumb — `INPUT` and `CLEAR` branch internally on `state.notesMode`, and `INPUT` /
`AUTOFILL_NOTES` read `state.autoClearNotes` themselves.

Replace the private `setCellValue` with one shared writer, so every mutating path pushes exactly
one grouped entry:

```ts
type CellEdit = { index: number; value?: CellValue; notes?: number };

/**
 * Applies a batch of cell edits and an optional flag change as ONE undoable
 * action. Edits that change nothing are dropped; if nothing at all changed, the
 * same state object is returned (callers rely on identity for no-ops).
 */
function commit(state: GameState, edits: CellEdit[], autoClear?: NoteUnits): GameState
```

`commit` responsibilities: bail entirely when `status === 'won'`; skip `given` cells; snapshot
each genuinely-changing cell's prior `{ value, notes }`; record the *prior* flags when
`autoClear` is passed and differs; push one `UndoEntry`; `shift()` past `UNDO_LIMIT`; recompute
`statusOf(board)`.

Behavior per action:

- **`INPUT`, notes mode off** — one edit setting `value: digit` **and `notes: 0`** on the
  selected cell, plus one edit per `peersOf(selected, state.autoClearNotes)` whose notes contain
  that digit, clearing just that bit (`notes & ~(1 << (digit - 1))`). All flags off ⇒ no peer
  edits. Re-entering the digit a cell already holds remains a no-op.
- **`INPUT`, notes mode on** — no-op if the cell is given or holds a value; otherwise toggle bit
  `digit - 1` on that cell only. No peer pruning.
- **`CLEAR`, notes mode on** — clear the cell's notes; if it had none, fall through to clearing
  its value, so erase is never a dead button.
- **`CLEAR`, notes mode off** — unchanged (clear value only).
- **`SET_NOTES_MODE` / `TOGGLE_NOTES_MODE`** — flip `notesMode`; no undo entry, and return the
  same object when the value is unchanged.
- **`AUTOFILL_NOTES`** — for every non-given empty cell, one edit setting
  `notes: getCandidates(board, index, state.autoClearNotes)`. All 81 in a single entry. Cells
  already matching are dropped by `commit`, so a second press returns the same state.
- **`SET_AUTO_CLEAR`** — no-op returning the same object if the flag already has that value.
  Otherwise build the next flags, and:
  - turning **on**: prune retroactively using **only the newly enabled unit** — for each
    non-given empty cell, `notes & getCandidates(board, index, singleUnit)` where `singleUnit`
    has just that one flag true. Pass edits + prior flags to `commit`.
  - turning **off**: `commit(state, [], priorFlags)` — flags-only entry, no cell edits.
- **`UNDO`** — pop one entry, restore `value` and `notes` for every snapshot in `entry.cells`,
  and restore `autoClearNotes` from `entry.autoClear` when present.

### 3. `src/state/settings-store.ts` + `settings-context.tsx` — the seed mirror

Follow the `showErrors` pattern (interface field, `DEFAULT_SETTINGS`, per-field type-guarded
parse, context setter, `useMemo` value).

```ts
export interface SettingsState {
  activeUiId: string;
  showErrors: boolean;
  /**
   * Seed for a fresh game only — the live, undoable flags live in GameState.
   * Kept here so a preference survives winning a puzzle (which clears the game store).
   */
  autoClearNotes: { row: boolean; col: boolean; box: boolean };
  perUi: Record<string, PerUiSettings>;
}
```

All three default to `true`. Parse each sub-field independently with a `typeof === 'boolean'`
guard; a malformed or absent `autoClearNotes` must yield the full default object, never
`undefined`. `SETTINGS_KEY` stays `robosudoku.settings.v1` — the parser is already per-field
tolerant. Context adds `setAutoClearNotes: (unit: 'row' | 'col' | 'box', value: boolean) => void`.

### 4. `src/state/use-auto-clear.ts` (new) — keep the two stores in step

Two places render the checkboxes (Classic's game screen and the Settings screen) and both must
write the live flag *and* the seed. One tiny hook, rather than duplicating the pair:

```ts
/** Flips a live auto-clear flag (undoable) and mirrors it to the persisted seed. */
export function useSetAutoClear(): (unit: 'row' | 'col' | 'box', on: boolean) => void
```

Built on `useGameDispatch()` + `useSettings()`, memoized with `useCallback`. Nothing else needs
a settings-aware dispatch wrapper — because the flags moved into `GameState`, every other call
site keeps dispatching plain actions and `useKeyboardControls(dispatch)` keeps its one-arg
signature.

### 5. `src/state/game-context.tsx` — seed a fresh game from settings

`GameProvider` already mounts inside `SettingsProvider` (`src/app/_layout.tsx:16-21`), so it can
read `useSettings()`. `restoredOrNewGame()` becomes
`parseGame(getItem(GAME_KEY)) ?? createNewGame('easy', { notesMode: false, autoClearNotes: settings.autoClearNotes })`,
and `createEmptyGame()` takes the same seed. Only the *fresh game* path consults settings; a
restored game carries its own flags. Keep the existing pre-hydration guards intact — in
particular the `!state.meta` check that stops the blank web board from clobbering a real save.

### 6. `src/state/game-store.ts` — `v: 2`, reads `v: 1`

```ts
interface StoredGame {
  v: 2;
  difficulty: Difficulty;
  solution: string;
  givens: string;
  values: string;
  notes?: number[];
  selected: number | null;
  notesMode?: boolean;
  /** `[row, col, box]`; omitted when all three are on. */
  autoClear?: [boolean, boolean, boolean];
  /** One object per action: `c` = `[index, value, notes]` triples, `a` = prior flags. */
  undo: { c: [number, number, number][]; a?: [boolean, boolean, boolean] }[];
}
```

- `serializeGame` writes `v: 2`; emits `notesMode` only when `true` and `autoClear` only when
  not all-on.
- `parseGame` accepts `v === 1 || v === 2`. Rework `parseUndo(value, version)`: for `v: 1` wrap
  each flat triple as a one-cell group `{ cells: [snapshot] }`; for `v: 2` read the object form.
  Keep the strict per-triple validation and the `slice(-UNDO_LIMIT)` trim, and while you are in
  there **bound `notes` to `0..511`** — the current check only rejects negatives.
- Missing/malformed `notesMode` → `false`; missing/malformed `autoClear` → all `true`.
- `GAME_KEY` stays `'robosudoku.game.v1'`. The key names the storage slot, the `v` field names
  the schema; v1 payloads are still readable, so changing the key would needlessly discard every
  in-progress game on upgrade.

### 7. `src/skins/types.ts` + all 5 skins — notes color

Add next to `mutedText`, same optional-with-documented-fallback idiom:

```ts
/** Pencil-note glyphs; falls back to `mutedText`, then `gridLine`. */
notesText?: string;
```

Then give each skin a tuned light/dark value: `src/uis/classic/skins/{newspaper,
modern-minimal,high-contrast,dark-neon}.ts` and `src/uis/zen/skin.ts`. Aim for clearly
subordinate to `entryText` but comfortably legible — notes render at ~22% of cell size, so do
not go as faint as `gridLine`.

### 8. `src/components/game/board-cell.tsx` — render the 3×3 mini-grid

Currently a single `<Text>` gated on `cell.value !== 0` (lines 59-69). Add the else branch: when
`cell.value === 0 && cell.notes !== 0`, render a 3×3 grid of nine slots (digit `d` at row
`(d-1)/3`, col `(d-1)%3`), each showing the digit or an equally sized blank so positions stay
fixed.

- Wrap in an absolutely-positioned `View` filling the cell (`StyleSheet.absoluteFill` plus a
  little padding) — the `Pressable` is a centering flex box with no `overflow`, so absolute
  positioning is the safe way in.
- `fontSize: cellSize * 0.22`, `fontFamily: skin.fonts.cellFontFamily`,
  `color: palette.notesText ?? palette.mutedText ?? palette.gridLine`.
- Style exclusively from the palette, never from `Colors` (project convention).

Keep the `value === 0` guard even though valued cells now have their notes cleared — hydrated v1
saves can still carry both.

### 9. Pads — a notes-mode visual cue

`NumberPad` (`src/components/game/number-pad.tsx`) and `DigitStrip`
(`src/uis/zen/digit-strip.tsx`) each take an optional `notesMode?: boolean` used only to restyle
key labels while on (tint toward `notesText`, or shrink the digit slightly). **No new keys** —
the mode toggle lives in each UI's chrome, so `columns = variant === 'grid' ? 3 : 10` and Zen's
`keyWidth = (width - gap*9)/10` arithmetic are untouched. `remainingCounts` keeps counting
values only.

### 10. `src/uis/classic/classic-ui.tsx`

Reuse the local `Chip` (line 116) — it already has an `active` state.

- Bottom row gains `Chip` "✎ Notes" (`active={game.notesMode}`) and `Chip` "Autofill notes"
  (disabled when `status === 'won'`).
- A further row carries the three auto-clear checkboxes: a small "Auto-clear notes:" label plus
  three `Switch` + label groups ("row", "col", "box") in the existing `switchRow` style, wired to
  `useSetAutoClear()` and reading `game.autoClearNotes`. Give the container `flexWrap: 'wrap'`.
- Verify on a narrow window that this wraps rather than squeezing the board.

### 11. `src/uis/zen/zen-ui.tsx`

Zen stays minimal — checkboxes are Settings-only there. Footer left group gains two
`TextButton`s beside `undo`: `notes` (`active={game.notesMode}`, which already renders bold +
`entryText`) and `fill`. Watch `VERTICAL_CHROME` (lines 26-27) — the footer stays one row at
`FOOTER_HEIGHT = 34`, so board sizing is unaffected, but check it does not overflow at phone
width; if it does, let `styles.footer` wrap and add the extra row's height to `VERTICAL_CHROME`.

### 12. Keyboard — `use-keyboard-controls.web.ts`

Signature stays `useKeyboardControls(dispatch)` — that is why `TOGGLE_NOTES_MODE` exists
alongside `SET_NOTES_MODE` (the hook has no state access; the buttons, which do, use the explicit
form). Add `n` → `{ type: 'TOGGLE_NOTES_MODE' }`. Digits, `0`/`Delete`/`Backspace`, and arrows
are unchanged; leave the `metaKey || ctrlKey || altKey` bail at line 10 as is. The native `.ts`
stub needs no change.

### 13. Settings screen

Extract `src/components/settings/toggle-row.tsx` from the inline block at
`src/app/settings.tsx:76-84` (props `{ label, description?, value, onValueChange }`, reusing the
`ThemedView type="backgroundElement"` + `smallBold`/`small` + `Switch` markup and the local
`toggleRow`/`toggleText` styles). One boolean becoming four is the moment for it.

Rewrite "Show errors" to use it, then add a **"Notes"** `SettingSection` with three `ToggleRow`s
("Auto-clear notes in same row / column / box") reading `useGame().autoClearNotes` and writing
through `useSetAutoClear()`. Subtitle should say these apply to the current game, are undoable,
and also decide what Autofill fills in. Worth flagging in review: flipping one here pushes an
undo entry the player will later meet on the Game screen — intended, but unusual for a settings
screen.

### 14. Tests

- `src/engine/__tests__/rules-test.ts` — `peersOf` (20 for all units, 8 for row-only, never
  includes self); `getCandidates` with partial units, single units, and all-off returning
  `0b111111111`. Existing cases must pass untouched.
- `src/state/__tests__/game-reducer-test.ts`
  - notes-mode INPUT toggles a bit on and off; on a valued or given cell it is a no-op
    **returning the same object** (the suite asserts identity for no-ops, e.g. line 85).
  - value INPUT clears the cell's own notes; with flags on it prunes exactly the peers of the
    enabled units and nothing else; **one UNDO restores the cell and every pruned peer**.
  - `AUTOFILL_NOTES` respects the live flags, is idempotent, and undoes in one step.
  - `SET_AUTO_CLEAR` on: prunes by the newly enabled unit **only** (assert a note conflicting via
    a different, already-enabled unit survives — the exact case from the discussion); off: pushes
    a flags-only entry with no cell changes; same-value flip is a no-op returning the same object.
  - **The full round trip:** flip row on → notes pruned; UNDO → `autoClearNotes.row === false`
    *and* every note restored bit-for-bit.
  - `UNDO_LIMIT` still counts actions, not cells; `NEW_GAME` carries `notesMode` and
    `autoClearNotes` forward.
- `src/state/__tests__/game-store-test.ts` — v2 round-trip with grouped undo, notes, notesMode,
  and flags (including an entry carrying `a`); **a v1 payload parses into single-cell groups**;
  malformed grouped undo rejects; `notes` outside `0..511` rejects.
- `src/state/__tests__/settings-store-test.ts` — `autoClearNotes` defaults, partial object,
  malformed value.
- Extend `src/engine/test-utils/boards.ts` with an optional per-index notes argument on
  `boardFromString`. Helpers stay outside `__tests__/` (jest-expo treats every file there as a
  suite).

### 15. Docs

`dev-notes/development-plan.md`: add an **M6 — Pencil notes** bullet to the Milestones list and
trim the item from the "Future" line (leaving tiered hints). Tick the notes item in the
`README.md` roadmap.

---

## Files touched

**Engine/state:** `src/engine/rules.ts`, `src/state/game-reducer.ts`, `src/state/game-store.ts`,
`src/state/game-context.tsx`, `src/state/settings-store.ts`, `src/state/settings-context.tsx`,
`src/state/use-auto-clear.ts` *(new)*
**Board/skins:** `src/skins/types.ts`, `src/components/game/board-cell.tsx`,
`src/components/game/number-pad.tsx`, all 5 skin files
**UIs:** `src/uis/classic/classic-ui.tsx`, `src/uis/zen/zen-ui.tsx`,
`src/uis/zen/digit-strip.tsx`, `src/components/game/use-keyboard-controls.web.ts`
**Settings:** `src/app/settings.tsx`, `src/components/settings/toggle-row.tsx` *(new)*
**Tests/docs:** four test suites, `src/engine/test-utils/boards.ts`,
`dev-notes/development-plan.md`, `README.md`

Branch `m06-notes`, merged to `main` with `--no-ff` per AGENTS.md.

## Verification

1. `npm test` — all suites green, including the new notes cases.
2. `npx tsc --noEmit` — clean. (If it complains about CSS module imports, run `npx expo start`
   briefly once to regenerate the gitignored `expo-env.d.ts`.)
3. `npm run web`, driven in headless Chromium (the `run` skill), in Classic:
   - Notes on; tap 1, 5, 9 into an empty cell → three marks at the right mini-grid positions;
     tap 5 again → gone.
   - Notes off; enter a digit there → marks vanish, digit appears.
   - **Headline case A:** all three checkboxes on, Autofill, then enter a 5. Confirm 5-marks
     disappear from that row, column, and box. **One** Undo → the 5 goes and every pruned 5-mark
     returns. Compare screenshots before/after.
   - **Headline case B:** turn the row checkbox *off*, hand-add a note that conflicts by row,
     then switch row back *on* → that note disappears. One Undo → the checkbox shows unchecked
     again **and** the note is back. Verify a note conflicting only via an already-enabled unit
     was *not* touched by that flip.
   - Uncheck all three, Autofill → every empty cell shows all nine marks; one Undo restores the
     exact prior notes.
   - Undo a checkbox-off flip → checkbox returns to on, no notes change.
   - Keyboard: `n` flips the mode, `1`-`9` follow it, Backspace clears notes then value.
   - Reload mid-game → board, notes, notes mode, checkbox states, and undo depth restored; Undo
     after reload still restores a whole grouped entry.
   - Win a puzzle, then start a new one → checkbox preferences survived (the settings mirror).
   - Backward compat: save a v1 game before the change, load it after → board restores and undo
     still works one cell at a time.
4. Flip the same checkbox from the Settings screen, return to the Game screen, press Undo →
   the flip reverts there.
5. Switch to Zen mid-puzzle → notes render in the Zen skin, `notes`/`fill` work, board sizing
   unchanged.
6. Check all 5 skins in both light and dark for note legibility.
7. Native sanity pass in Expo Go: touch entry of notes, autofill, checkbox flips, undo, and
   persistence across restart.
