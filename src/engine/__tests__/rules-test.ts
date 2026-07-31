import { getCandidates, getConflicts, isBoardFull, isBoardSolved } from '@/engine/rules';

import { EMPTY, SOLVED, boardFromString } from '../test-utils/boards';

const edit = (base: string, index: number, char: string) =>
  base.slice(0, index) + char + base.slice(index + 1);

describe('getConflicts', () => {
  it('returns empty for an empty board', () => {
    expect(getConflicts(boardFromString(EMPTY)).size).toBe(0);
  });

  it('returns empty for a valid solved board', () => {
    expect(getConflicts(boardFromString(SOLVED)).size).toBe(0);
  });

  it('flags both cells of a row duplicate', () => {
    const board = boardFromString(edit(edit(EMPTY, 0, '5'), 8, '5')); // row 0, cols 0 and 8
    expect(getConflicts(board)).toEqual(new Set([0, 8]));
  });

  it('flags both cells of a column duplicate', () => {
    const board = boardFromString(edit(edit(EMPTY, 3, '7'), 3 + 8 * 9, '7')); // col 3, rows 0 and 8
    expect(getConflicts(board)).toEqual(new Set([3, 75]));
  });

  it('flags both cells of a box duplicate in different row and column', () => {
    const board = boardFromString(edit(edit(EMPTY, 0, '9'), 10, '9')); // box 0: (0,0) and (1,1)
    expect(getConflicts(board)).toEqual(new Set([0, 10]));
  });

  it('does not flag equal values in different row, column, and box', () => {
    const board = boardFromString(edit(edit(EMPTY, 0, '4'), 40, '4')); // (0,0) and (4,4)
    expect(getConflicts(board).size).toBe(0);
  });

  it('flags all members when a value appears three times in a unit', () => {
    const board = boardFromString(
      edit(edit(edit(EMPTY, 0, '2'), 4, '2'), 8, '2'), // row 0, cols 0/4/8
    );
    expect(getConflicts(board)).toEqual(new Set([0, 4, 8]));
  });

  it('includes given cells when a user entry collides with them', () => {
    const board = boardFromString(edit(edit(EMPTY, 0, '5'), 1, '5'), [0]); // index 0 is a given
    expect(getConflicts(board)).toEqual(new Set([0, 1]));
  });
});

describe('isBoardFull / isBoardSolved', () => {
  it('detects a full valid board as solved', () => {
    const board = boardFromString(SOLVED);
    expect(isBoardFull(board)).toBe(true);
    expect(isBoardSolved(board)).toBe(true);
  });

  it('detects a full board with a duplicate as not solved', () => {
    // Overwrite one cell with its row-neighbor's value.
    const broken = edit(SOLVED, 1, SOLVED[0]);
    const board = boardFromString(broken);
    expect(isBoardFull(board)).toBe(true);
    expect(isBoardSolved(board)).toBe(false);
  });

  it('detects an incomplete board as not full', () => {
    const board = boardFromString(edit(SOLVED, 40, '-'));
    expect(isBoardFull(board)).toBe(false);
    expect(isBoardSolved(board)).toBe(false);
  });
});

describe('getCandidates', () => {
  it('returns all nine digits for a cell on an empty board', () => {
    expect(getCandidates(boardFromString(EMPTY), 40)).toBe(0b111111111);
  });

  it('excludes digits present in the row, column, and box', () => {
    let s = EMPTY;
    s = edit(s, 1, '1'); // same row as index 0
    s = edit(s, 9, '2'); // same column
    s = edit(s, 10, '3'); // same box
    s = edit(s, 80, '4'); // unrelated
    const candidates = getCandidates(boardFromString(s), 0);
    expect(candidates & 0b111).toBe(0); // 1, 2, 3 excluded
    expect(candidates & (1 << 3)).not.toBe(0); // 4 still allowed
  });

  it('returns exactly the missing digit for a solved board cell emptied', () => {
    const board = boardFromString(edit(SOLVED, 40, '-'));
    const missing = Number(SOLVED[40]);
    expect(getCandidates(board, 40)).toBe(1 << (missing - 1));
  });
});
