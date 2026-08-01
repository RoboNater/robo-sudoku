/**
 * Persisted shape of an in-progress game and its (de)serialization. Kept free of
 * React so it can be unit tested; anything malformed parses back to `null` and
 * the app simply deals a fresh puzzle.
 */

import type { NoteUnits } from '@/engine/rules';
import { BOARD_SIZE, type Board, type Cell, type CellValue, type Difficulty } from '@/engine/types';

import {
  DEFAULT_NOTE_PREFS,
  UNDO_LIMIT,
  statusOf,
  type CellSnapshot,
  type GameState,
  type UndoEntry,
} from './game-reducer';

export const GAME_KEY = 'robosudoku.game.v1';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const EMPTY_CHAR = '.';
const MAX_NOTES = 0b111111111;

/** `[index, value, notes]`, the state of one cell before an action. */
type StoredSnapshot = [number, number, number];

/** One user action: `c` = the cells it changed, `a` = the flags it changed. */
interface StoredUndoEntry {
  c: StoredSnapshot[];
  a?: [boolean, boolean, boolean];
}

/**
 * Version 2 — v1 payloads still parse. The board travels as two 81-char strings
 * (givens and current values) so a stored game stays small and human-readable;
 * notes are omitted entirely while every cell has none, as are the note
 * preferences while they hold their defaults.
 */
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
  undo: StoredUndoEntry[];
}

function cellsToString(board: Board, pick: (cell: Cell) => CellValue): string {
  return board
    .map((cell) => {
      const value = pick(cell);
      return value === 0 ? EMPTY_CHAR : String(value);
    })
    .join('');
}

function unitsToTuple(units: NoteUnits): [boolean, boolean, boolean] {
  return [units.row, units.col, units.box];
}

function snapshotsToStored(cells: CellSnapshot[]): StoredSnapshot[] {
  return cells.map((cell) => [cell.index, cell.value, cell.notes]);
}

export function serializeGame(state: GameState): string | null {
  if (!state.meta) return null;

  const notes = state.board.map((cell) => cell.notes);
  const { row, col, box } = state.autoClearNotes;
  const stored: StoredGame = {
    v: 2,
    difficulty: state.meta.difficulty,
    solution: state.meta.solution,
    givens: cellsToString(state.board, (cell) => (cell.given ? cell.value : 0)),
    values: cellsToString(state.board, (cell) => cell.value),
    selected: state.selected,
    undo: state.undoStack.map((entry) => {
      const out: StoredUndoEntry = { c: snapshotsToStored(entry.cells) };
      if (entry.autoClear) out.a = unitsToTuple(entry.autoClear);
      return out;
    }),
  };
  if (notes.some((mask) => mask !== 0)) stored.notes = notes;
  if (state.notesMode) stored.notesMode = true;
  if (!(row && col && box)) stored.autoClear = [row, col, box];

  return JSON.stringify(stored);
}

function isDigitString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === BOARD_SIZE &&
    /^[1-9.]+$/.test(value)
  );
}

function isSolutionString(value: unknown): value is string {
  return typeof value === 'string' && value.length === BOARD_SIZE && /^[1-9]+$/.test(value);
}

function charToValue(char: string): CellValue {
  return char === EMPTY_CHAR ? 0 : (Number(char) as CellValue);
}

function parseSnapshot(raw: unknown): CellSnapshot | null {
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const [index, cellValue, notes] = raw;
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE) return null;
  if (!Number.isInteger(cellValue) || cellValue < 0 || cellValue > 9) return null;
  if (!Number.isInteger(notes) || notes < 0 || notes > MAX_NOTES) return null;
  return { index, value: cellValue as CellValue, notes };
}

/** Reads the `[row, col, box]` tuple form, or null if it is not one. */
function parseUnits(value: unknown): NoteUnits | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  if (!value.every((flag) => typeof flag === 'boolean')) return null;
  const [row, col, box] = value as boolean[];
  return { row, col, box };
}

/**
 * v1 stored one flat `[index, value, notes]` triple per action; v2 stores a
 * group of them plus the flags the action changed. A v1 history therefore
 * restores as one single-cell group per entry.
 */
function parseUndo(value: unknown, version: 1 | 2): UndoEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries: UndoEntry[] = [];
  for (const raw of value) {
    if (version === 1) {
      const snapshot = parseSnapshot(raw);
      if (!snapshot) return null;
      entries.push({ cells: [snapshot] });
      continue;
    }
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const { c, a } = raw as Record<string, unknown>;
    if (!Array.isArray(c)) return null;
    const cells: CellSnapshot[] = [];
    for (const cellRaw of c) {
      const snapshot = parseSnapshot(cellRaw);
      if (!snapshot) return null;
      cells.push(snapshot);
    }
    const entry: UndoEntry = { cells };
    if (a !== undefined) {
      const units = parseUnits(a);
      if (!units) return null;
      entry.autoClear = units;
    }
    entries.push(entry);
  }
  // Older builds (or a hand-edited store) could exceed today's cap.
  return entries.slice(-UNDO_LIMIT);
}

/** Reads a stored game, returning null for anything missing or malformed. */
export function parseGame(raw: string | null): GameState | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const { v, difficulty, solution, givens, values, notes, selected, notesMode, autoClear, undo } =
    parsed as Record<string, unknown>;
  if (v !== 1 && v !== 2) return null;
  if (typeof difficulty !== 'string' || !DIFFICULTIES.includes(difficulty as Difficulty)) {
    return null;
  }
  if (!isSolutionString(solution)) return null;
  if (!isDigitString(givens) || !isDigitString(values)) return null;

  const undoStack = parseUndo(undo, v as 1 | 2);
  if (!undoStack) return null;

  const noteMasks =
    Array.isArray(notes) &&
    notes.length === BOARD_SIZE &&
    notes.every((mask) => Number.isInteger(mask) && mask >= 0 && mask <= MAX_NOTES)
      ? (notes as number[])
      : null;

  const board: Board = [];
  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const given = givens[index] !== EMPTY_CHAR;
    // A given must keep its clue: a store where the value was cleared is bogus.
    if (given && givens[index] !== values[index]) return null;
    board.push({ given, value: charToValue(values[index]), notes: noteMasks?.[index] ?? 0 });
  }

  return {
    board,
    meta: { difficulty: difficulty as Difficulty, solution },
    selected:
      Number.isInteger(selected) && (selected as number) >= 0 && (selected as number) < BOARD_SIZE
        ? (selected as number)
        : null,
    notesMode: notesMode === true,
    autoClearNotes: parseUnits(autoClear) ?? { ...DEFAULT_NOTE_PREFS.autoClearNotes },
    undoStack,
    // Derived rather than stored, so the rules always have the last word.
    status: statusOf(board),
  };
}
