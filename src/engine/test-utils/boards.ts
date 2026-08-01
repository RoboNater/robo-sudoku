import type { Board, CellValue } from '@/engine/types';

/**
 * Build a board from an 81-char string ('-' or '0' = empty). Cells listed in
 * `givens` (indices) are marked as given clues; `notes` maps an index to its
 * pencil-note bitmask, with any cell left out having none.
 */
export function boardFromString(
  values: string,
  givens: number[] = [],
  notes: Record<number, number> = {},
): Board {
  const givenSet = new Set(givens);
  return Array.from(values, (char, index) => {
    const digit = char >= '1' && char <= '9' ? (Number(char) as CellValue) : 0;
    return { given: givenSet.has(index), value: digit, notes: notes[index] ?? 0 };
  });
}

/** Bitmask of the given digits, the form `Cell.notes` takes. */
export function notesOf(...digits: number[]): number {
  return digits.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);
}

/** A valid completed sudoku (Wikipedia's example solution). */
export const SOLVED =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

export const EMPTY = '-'.repeat(81);
