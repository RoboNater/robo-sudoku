export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 0 means the cell is empty. */
export type CellValue = 0 | Digit;

export interface Cell {
  /** Prefilled clue; immutable during play. */
  given: boolean;
  value: CellValue;
  /** Pencil-note bitmask: bit (d - 1) set means digit d is noted. */
  notes: number;
}

/** 81 cells, index = row * 9 + col. */
export type Board = Cell[];

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PuzzleMeta {
  difficulty: Difficulty;
  /** 81-char digit string of the intended solution, for future hints. */
  solution: string;
}

export const BOARD_SIZE = 81;
export const GRID_SIZE = 9;

export const rowOf = (index: number) => Math.floor(index / GRID_SIZE);
export const colOf = (index: number) => index % GRID_SIZE;
export const boxOf = (index: number) =>
  Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3);
