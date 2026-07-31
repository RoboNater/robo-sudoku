import { BOARD_SIZE, GRID_SIZE, boxOf, colOf, rowOf, type Board } from './types';

type UnitKey = (index: number) => number;

const UNITS: UnitKey[] = [rowOf, colOf, boxOf];

/**
 * Indices of every filled cell whose value also appears in another filled
 * cell of the same row, column, or 3x3 box. Both members of a duplicate
 * pair are included, givens too.
 */
export function getConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  for (const unitOf of UNITS) {
    // seen[unit][digit] = index of first cell in this unit holding digit
    const seen = new Map<number, number>();
    for (let index = 0; index < BOARD_SIZE; index++) {
      const { value } = board[index];
      if (value === 0) continue;
      const key = unitOf(index) * (GRID_SIZE + 1) + value;
      const first = seen.get(key);
      if (first === undefined) {
        seen.set(key, index);
      } else {
        conflicts.add(first);
        conflicts.add(index);
      }
    }
  }
  return conflicts;
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell.value !== 0);
}

/** A full board with no conflicts is by definition a valid solution. */
export function isBoardSolved(board: Board): boolean {
  return isBoardFull(board) && getConflicts(board).size === 0;
}

/**
 * Bitmask of digits that could go in `index` without conflicting with any
 * current entry in its row, column, or box (bit d-1 = digit d). Basis for
 * future auto pencil notes and hints.
 */
export function getCandidates(board: Board, index: number): number {
  let candidates = 0b111111111;
  const row = rowOf(index);
  const col = colOf(index);
  const box = boxOf(index);
  for (let other = 0; other < BOARD_SIZE; other++) {
    if (other === index) continue;
    const { value } = board[other];
    if (value === 0) continue;
    if (rowOf(other) === row || colOf(other) === col || boxOf(other) === box) {
      candidates &= ~(1 << (value - 1));
    }
  }
  return candidates;
}
