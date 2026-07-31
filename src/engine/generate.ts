import { getSudoku } from 'sudoku-gen';

import { BOARD_SIZE, type Board, type CellValue, type Difficulty, type PuzzleMeta } from './types';

export interface GeneratedPuzzle {
  board: Board;
  meta: PuzzleMeta;
}

/** Parse an 81-char puzzle string ('-' or '0' = empty) into a Board. */
export function boardFromPuzzleString(puzzle: string): Board {
  if (puzzle.length !== BOARD_SIZE) {
    throw new Error(`Puzzle string must be ${BOARD_SIZE} chars, got ${puzzle.length}`);
  }
  return Array.from(puzzle, (char) => {
    const digit = char >= '1' && char <= '9' ? (Number(char) as CellValue) : 0;
    return { given: digit !== 0, value: digit, notes: 0 };
  });
}

export function generatePuzzle(difficulty: Difficulty): GeneratedPuzzle {
  const { puzzle, solution } = getSudoku(difficulty);
  return {
    board: boardFromPuzzleString(puzzle),
    meta: { difficulty, solution },
  };
}
