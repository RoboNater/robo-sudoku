/**
 * Persisted shape of an in-progress game and its (de)serialization. Kept free of
 * React so it can be unit tested; anything malformed parses back to `null` and
 * the app simply deals a fresh puzzle.
 */

import { BOARD_SIZE, type Board, type Cell, type CellValue, type Difficulty } from '@/engine/types';

import { UNDO_LIMIT, statusOf, type GameState, type UndoEntry } from './game-reducer';

export const GAME_KEY = 'robosudoku.game.v1';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const EMPTY_CHAR = '.';

/**
 * Version 1. The board travels as two 81-char strings (givens and current
 * values) so a stored game stays small and human-readable; notes are omitted
 * entirely while every cell has none.
 */
interface StoredGame {
  v: 1;
  difficulty: Difficulty;
  solution: string;
  givens: string;
  values: string;
  notes?: number[];
  selected: number | null;
  /** `[index, value, notes]` triples, oldest first. */
  undo: [number, number, number][];
}

function cellsToString(board: Board, pick: (cell: Cell) => CellValue): string {
  return board
    .map((cell) => {
      const value = pick(cell);
      return value === 0 ? EMPTY_CHAR : String(value);
    })
    .join('');
}

export function serializeGame(state: GameState): string | null {
  if (!state.meta) return null;

  const notes = state.board.map((cell) => cell.notes);
  const stored: StoredGame = {
    v: 1,
    difficulty: state.meta.difficulty,
    solution: state.meta.solution,
    givens: cellsToString(state.board, (cell) => (cell.given ? cell.value : 0)),
    values: cellsToString(state.board, (cell) => cell.value),
    selected: state.selected,
    undo: state.undoStack.map((entry) => [entry.index, entry.value, entry.notes]),
  };
  if (notes.some((mask) => mask !== 0)) stored.notes = notes;

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

function parseUndo(value: unknown): UndoEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries: UndoEntry[] = [];
  for (const raw of value) {
    if (!Array.isArray(raw) || raw.length !== 3) return null;
    const [index, cellValue, notes] = raw;
    if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE) return null;
    if (!Number.isInteger(cellValue) || cellValue < 0 || cellValue > 9) return null;
    if (!Number.isInteger(notes) || notes < 0) return null;
    entries.push({ index, value: cellValue as CellValue, notes });
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

  const { v, difficulty, solution, givens, values, notes, selected, undo } = parsed as Record<
    string,
    unknown
  >;
  if (v !== 1) return null;
  if (typeof difficulty !== 'string' || !DIFFICULTIES.includes(difficulty as Difficulty)) {
    return null;
  }
  if (!isSolutionString(solution)) return null;
  if (!isDigitString(givens) || !isDigitString(values)) return null;

  const undoStack = parseUndo(undo);
  if (!undoStack) return null;

  const noteMasks =
    Array.isArray(notes) && notes.length === BOARD_SIZE && notes.every(Number.isInteger)
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
    undoStack,
    // Derived rather than stored, so the rules always have the last word.
    status: statusOf(board),
  };
}
