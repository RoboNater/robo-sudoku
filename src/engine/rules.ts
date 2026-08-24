import {
  BOARD_SIZE,
  GRID_SIZE,
  boxOf,
  colOf,
  rowOf,
  type Board,
  type Digit,
} from './types';

type UnitKey = (index: number) => number;

const UNITS: UnitKey[] = [rowOf, colOf, boxOf];
const ALL_DIGITS_MASK = 0b111111111;

export interface UnusedDigitsByUnit {
  row: number[];
  col: number[];
  box: number[];
}

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

/** Number of times each digit still needs to be entered to complete a board. */
export function remainingCounts(board: Board): Record<Digit, number> {
  const counts = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 } as Record<
    Digit,
    number
  >;
  for (const cell of board) {
    if (cell.value !== 0) counts[cell.value] = Math.max(0, counts[cell.value] - 1);
  }
  return counts;
}

/**
 * Bitmasks of digits absent from each row, column, and box (bit d-1 = digit d).
 * A duplicate value still counts as used; this describes what is visibly absent,
 * not whether the unit is currently valid.
 */
export function getUnusedDigitsByUnit(board: Board): UnusedDigitsByUnit {
  const unused: UnusedDigitsByUnit = {
    row: Array<number>(GRID_SIZE).fill(ALL_DIGITS_MASK),
    col: Array<number>(GRID_SIZE).fill(ALL_DIGITS_MASK),
    box: Array<number>(GRID_SIZE).fill(ALL_DIGITS_MASK),
  };

  for (let index = 0; index < BOARD_SIZE; index++) {
    const { value } = board[index];
    if (value === 0) continue;
    const digitBit = 1 << (value - 1);
    unused.row[rowOf(index)] &= ~digitBit;
    unused.col[colOf(index)] &= ~digitBit;
    unused.box[boxOf(index)] &= ~digitBit;
  }

  return unused;
}

/** A full board with no conflicts is by definition a valid solution. */
export function isBoardSolved(board: Board): boolean {
  return isBoardFull(board) && getConflicts(board).size === 0;
}

/** Which units a notes rule considers. */
export interface NoteUnits {
  row: boolean;
  col: boolean;
  box: boolean;
}

export const ALL_UNITS: NoteUnits = { row: true, col: true, box: true };

/** Indices sharing an enabled unit with `index` (never includes `index`). */
export function peersOf(index: number, units: NoteUnits = ALL_UNITS): number[] {
  const row = rowOf(index);
  const col = colOf(index);
  const box = boxOf(index);
  const peers: number[] = [];
  for (let other = 0; other < BOARD_SIZE; other++) {
    if (other === index) continue;
    if (
      (units.row && rowOf(other) === row) ||
      (units.col && colOf(other) === col) ||
      (units.box && boxOf(other) === box)
    ) {
      peers.push(other);
    }
  }
  return peers;
}

/**
 * Bitmask of digits that could go in `index` without conflicting with any
 * current entry in its row, column, or box (bit d-1 = digit d). Drives pencil
 * notes — autofill and the auto-clear sweeps — and, later, hints.
 *
 * A unit disabled in `units` is not consulted, so with all three off every
 * digit stays a candidate.
 */
export function getCandidates(board: Board, index: number, units: NoteUnits = ALL_UNITS): number {
  let candidates = ALL_DIGITS_MASK;
  const row = rowOf(index);
  const col = colOf(index);
  const box = boxOf(index);
  for (let other = 0; other < BOARD_SIZE; other++) {
    if (other === index) continue;
    const { value } = board[other];
    if (value === 0) continue;
    if (
      (units.row && rowOf(other) === row) ||
      (units.col && colOf(other) === col) ||
      (units.box && boxOf(other) === box)
    ) {
      candidates &= ~(1 << (value - 1));
    }
  }
  return candidates;
}
