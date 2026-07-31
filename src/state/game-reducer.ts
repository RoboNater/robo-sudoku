import { generatePuzzle } from '@/engine/generate';
import { getConflicts, isBoardFull } from '@/engine/rules';
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
export interface UndoEntry {
  index: number;
  value: CellValue;
  notes: number;
}

export type GameStatus = 'playing' | 'won' | 'wrong';

export interface GameState {
  board: Board;
  meta: PuzzleMeta | null;
  /** Selected cell index 0..80, or null. */
  selected: number | null;
  undoStack: UndoEntry[];
  status: GameStatus;
}

export type GameAction =
  | { type: 'NEW_GAME'; difficulty: Difficulty }
  | { type: 'SELECT'; index: number | null }
  | { type: 'MOVE_SELECTION'; dRow: -1 | 0 | 1; dCol: -1 | 0 | 1 }
  | { type: 'INPUT'; digit: Digit }
  | { type: 'CLEAR' }
  | { type: 'UNDO' }
  | { type: 'HYDRATE'; state: GameState };

export function createNewGame(difficulty: Difficulty): GameState {
  const { board, meta } = generatePuzzle(difficulty);
  return { board, meta, selected: null, undoStack: [], status: 'playing' };
}

/**
 * A blank, puzzle-less board. Web renders statically before storage can be read,
 * so it starts from this and dispatches `HYDRATE` once the client has mounted —
 * generating a puzzle during the static render would only be thrown away (and
 * would not match the one the client generates).
 */
export function createEmptyGame(): GameState {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => ({
    given: false,
    value: 0 as CellValue,
    notes: 0,
  }));
  return { board, meta: null, selected: null, undoStack: [], status: 'playing' };
}

export function statusOf(board: Board): GameStatus {
  if (!isBoardFull(board)) return 'playing';
  return getConflicts(board).size === 0 ? 'won' : 'wrong';
}

function setCellValue(state: GameState, index: number, value: CellValue): GameState {
  const cell = state.board[index];
  if (cell.given || state.status === 'won') return state;
  if (cell.value === value) return state;

  const undoStack = [...state.undoStack, { index, value: cell.value, notes: cell.notes }];
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();

  const board = state.board.slice();
  board[index] = { ...cell, value };
  return { ...state, board, undoStack, status: statusOf(board) };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createNewGame(action.difficulty);

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
      return setCellValue(state, state.selected, action.digit);

    case 'CLEAR':
      if (state.selected === null) return state;
      return setCellValue(state, state.selected, 0);

    case 'UNDO': {
      const entry = state.undoStack[state.undoStack.length - 1];
      if (!entry) return state;
      const board = state.board.slice();
      board[entry.index] = { ...board[entry.index], value: entry.value, notes: entry.notes };
      return {
        ...state,
        board,
        undoStack: state.undoStack.slice(0, -1),
        status: statusOf(board),
      };
    }
  }
}
