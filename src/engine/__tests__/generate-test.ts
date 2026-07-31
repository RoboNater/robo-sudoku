import { boardFromPuzzleString, generatePuzzle } from '@/engine/generate';
import { getConflicts, isBoardSolved } from '@/engine/rules';
import { BOARD_SIZE, type Difficulty } from '@/engine/types';

describe('boardFromPuzzleString', () => {
  it('parses digits as givens and dashes as empty cells', () => {
    const board = boardFromPuzzleString('5-'.repeat(40) + '5');
    expect(board).toHaveLength(BOARD_SIZE);
    expect(board[0]).toEqual({ given: true, value: 5, notes: 0 });
    expect(board[1]).toEqual({ given: false, value: 0, notes: 0 });
  });

  it('rejects strings of the wrong length', () => {
    expect(() => boardFromPuzzleString('123')).toThrow();
  });
});

describe.each<Difficulty>(['easy', 'medium', 'hard'])('generatePuzzle(%s)', (difficulty) => {
  it('produces a consistent puzzle whose solution matches the clues', () => {
    const { board, meta } = generatePuzzle(difficulty);

    expect(board).toHaveLength(BOARD_SIZE);
    expect(meta.difficulty).toBe(difficulty);
    expect(getConflicts(board).size).toBe(0);

    // The solution string must be a valid solved board...
    const solutionBoard = boardFromPuzzleString(meta.solution);
    expect(isBoardSolved(solutionBoard)).toBe(true);

    // ...and agree with every given clue.
    board.forEach((cell, index) => {
      expect(cell.given).toBe(cell.value !== 0);
      if (cell.given) {
        expect(cell.value).toBe(Number(meta.solution[index]));
      }
    });
  });
});
