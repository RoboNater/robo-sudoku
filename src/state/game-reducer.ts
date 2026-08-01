import { generatePuzzle } from '@/engine/generate';
import { getCandidates, getConflicts, isBoardFull, peersOf, type NoteUnits } from '@/engine/rules';
import {
  BOARD_SIZE,
  GRID_SIZE,
  colOf,
  rowOf,
  type Board,
  type CellValue,
  type Difficulty,
  type Digit,
  type PuzzleMeta,
} from '@/engine/types';

export const UNDO_LIMIT = 1000;

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

export type GameStatus = 'playing' | 'won' | 'wrong';

export interface GameState {
  board: Board;
  meta: PuzzleMeta | null;
  /** Selected cell index 0..80, or null. */
  selected: number | null;
  /** Digit input writes pencil notes instead of values while true. */
  notesMode: boolean;
  /** Live auto-clear flags. Undoable, so they live here rather than in settings. */
  autoClearNotes: NoteUnits;
  undoStack: UndoEntry[];
  status: GameStatus;
}

/** How a fresh game should start out behaving; seeded from persisted settings. */
export interface NotePrefs {
  notesMode: boolean;
  autoClearNotes: NoteUnits;
}

export const DEFAULT_NOTE_PREFS: NotePrefs = {
  notesMode: false,
  autoClearNotes: { row: true, col: true, box: true },
};

export type NoteUnit = keyof NoteUnits;

export type GameAction =
  | { type: 'NEW_GAME'; difficulty: Difficulty }
  | { type: 'SELECT'; index: number | null }
  | { type: 'MOVE_SELECTION'; dRow: -1 | 0 | 1; dCol: -1 | 0 | 1 }
  | { type: 'INPUT'; digit: Digit }
  | { type: 'CLEAR' }
  | { type: 'SET_NOTES_MODE'; on: boolean }
  | { type: 'TOGGLE_NOTES_MODE' }
  | { type: 'AUTOFILL_NOTES' }
  | { type: 'SET_AUTO_CLEAR'; unit: NoteUnit; on: boolean }
  | { type: 'UNDO' }
  | { type: 'HYDRATE'; state: GameState };

export function createNewGame(difficulty: Difficulty, prefs: NotePrefs = DEFAULT_NOTE_PREFS): GameState {
  const { board, meta } = generatePuzzle(difficulty);
  return {
    board,
    meta,
    selected: null,
    notesMode: prefs.notesMode,
    autoClearNotes: { ...prefs.autoClearNotes },
    undoStack: [],
    status: 'playing',
  };
}

/**
 * A blank, puzzle-less board. Web renders statically before storage can be read,
 * so it starts from this and dispatches `HYDRATE` once the client has mounted —
 * generating a puzzle during the static render would only be thrown away (and
 * would not match the one the client generates).
 */
export function createEmptyGame(prefs: NotePrefs = DEFAULT_NOTE_PREFS): GameState {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => ({
    given: false,
    value: 0 as CellValue,
    notes: 0,
  }));
  return {
    board,
    meta: null,
    selected: null,
    notesMode: prefs.notesMode,
    autoClearNotes: { ...prefs.autoClearNotes },
    undoStack: [],
    status: 'playing',
  };
}

export function statusOf(board: Board): GameStatus {
  if (!isBoardFull(board)) return 'playing';
  return getConflicts(board).size === 0 ? 'won' : 'wrong';
}

function sameUnits(a: NoteUnits, b: NoteUnits): boolean {
  return a.row === b.row && a.col === b.col && a.box === b.box;
}

/** A change to one cell; an omitted field keeps whatever the cell already has. */
type CellEdit = { index: number; value?: CellValue; notes?: number };

/**
 * Applies a batch of cell edits and an optional flag change as ONE undoable
 * action. Edits that change nothing are dropped; if nothing at all changed, the
 * same state object is returned (callers rely on identity for no-ops).
 *
 * `autoClear` is the flag set to switch *to* — the entry records the prior one.
 */
function commit(state: GameState, edits: CellEdit[], autoClear?: NoteUnits): GameState {
  if (state.status === 'won') return state;

  const cells: CellSnapshot[] = [];
  let board: Board | null = null;
  for (const edit of edits) {
    const cell = state.board[edit.index];
    if (cell.given) continue;
    const value = edit.value ?? cell.value;
    const notes = edit.notes ?? cell.notes;
    if (value === cell.value && notes === cell.notes) continue;
    if (!board) board = state.board.slice();
    cells.push({ index: edit.index, value: cell.value, notes: cell.notes });
    board[edit.index] = { ...cell, value, notes };
  }

  const flagsChanged = autoClear !== undefined && !sameUnits(autoClear, state.autoClearNotes);
  if (!board && !flagsChanged) return state;

  const entry: UndoEntry = { cells };
  if (flagsChanged) entry.autoClear = state.autoClearNotes;
  const undoStack = [...state.undoStack, entry];
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();

  const nextBoard = board ?? state.board;
  return {
    ...state,
    board: nextBoard,
    autoClearNotes: flagsChanged ? autoClear : state.autoClearNotes,
    undoStack,
    status: statusOf(nextBoard),
  };
}

/** Entering a digit wipes it from the notes of every peer in an enabled unit. */
function peerNoteEdits(state: GameState, index: number, digit: Digit): CellEdit[] {
  const bit = 1 << (digit - 1);
  const edits: CellEdit[] = [];
  for (const peer of peersOf(index, state.autoClearNotes)) {
    const { notes } = state.board[peer];
    if (notes & bit) edits.push({ index: peer, notes: notes & ~bit });
  }
  return edits;
}

function inputDigit(state: GameState, index: number, digit: Digit): GameState {
  const cell = state.board[index];

  if (state.notesMode) {
    // Notes only make sense on a cell still waiting for an answer.
    if (cell.given || cell.value !== 0) return state;
    return commit(state, [{ index, notes: cell.notes ^ (1 << (digit - 1)) }]);
  }

  return commit(state, [
    { index, value: digit, notes: 0 },
    ...peerNoteEdits(state, index, digit),
  ]);
}

function clearCell(state: GameState, index: number): GameState {
  const cell = state.board[index];
  // In notes mode erase takes the notes first, but never sits there dead: with
  // no notes to remove it falls through to clearing the value.
  if (state.notesMode && cell.notes !== 0) return commit(state, [{ index, notes: 0 }]);
  return commit(state, [{ index, value: 0 }]);
}

function autofillNotes(state: GameState): GameState {
  const edits: CellEdit[] = [];
  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const cell = state.board[index];
    if (cell.given || cell.value !== 0) continue;
    edits.push({ index, notes: getCandidates(state.board, index, state.autoClearNotes) });
  }
  return commit(state, edits);
}

function setAutoClear(state: GameState, unit: NoteUnit, on: boolean): GameState {
  if (state.autoClearNotes[unit] === on) return state;
  const next: NoteUnits = { ...state.autoClearNotes, [unit]: on };

  // Switching off changes no notes, but still records an entry so undo replays
  // the player's actions in exactly the order they made them.
  if (!on) return commit(state, [], next);

  // Switching on sweeps the board, but only for conflicts in the unit just
  // enabled — the other units are left exactly as the player left them.
  const single: NoteUnits = { row: false, col: false, box: false, [unit]: true };
  const edits: CellEdit[] = [];
  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const cell = state.board[index];
    if (cell.given || cell.value !== 0 || cell.notes === 0) continue;
    edits.push({ index, notes: cell.notes & getCandidates(state.board, index, single) });
  }
  return commit(state, edits, next);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      // Dealing a new puzzle must not silently change how notes behave.
      return createNewGame(action.difficulty, {
        notesMode: state.notesMode,
        autoClearNotes: state.autoClearNotes,
      });

    case 'HYDRATE':
      return action.state;

    case 'SELECT':
      return { ...state, selected: action.index };

    case 'MOVE_SELECTION': {
      if (state.selected === null) return { ...state, selected: 0 };
      const row = Math.min(GRID_SIZE - 1, Math.max(0, rowOf(state.selected) + action.dRow));
      const col = Math.min(GRID_SIZE - 1, Math.max(0, colOf(state.selected) + action.dCol));
      return { ...state, selected: row * GRID_SIZE + col };
    }

    case 'INPUT':
      if (state.selected === null) return state;
      return inputDigit(state, state.selected, action.digit);

    case 'CLEAR':
      if (state.selected === null) return state;
      return clearCell(state, state.selected);

    case 'SET_NOTES_MODE':
      // Touches no board state, so deliberately not an undo step.
      if (state.notesMode === action.on) return state;
      return { ...state, notesMode: action.on };

    case 'TOGGLE_NOTES_MODE':
      return { ...state, notesMode: !state.notesMode };

    case 'AUTOFILL_NOTES':
      return autofillNotes(state);

    case 'SET_AUTO_CLEAR':
      return setAutoClear(state, action.unit, action.on);

    case 'UNDO': {
      const entry = state.undoStack[state.undoStack.length - 1];
      if (!entry) return state;
      const board = state.board.slice();
      for (const snapshot of entry.cells) {
        board[snapshot.index] = {
          ...board[snapshot.index],
          value: snapshot.value,
          notes: snapshot.notes,
        };
      }
      return {
        ...state,
        board,
        autoClearNotes: entry.autoClear ?? state.autoClearNotes,
        undoStack: state.undoStack.slice(0, -1),
        status: statusOf(board),
      };
    }
  }
}
