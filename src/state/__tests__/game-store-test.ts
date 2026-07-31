import { EMPTY, SOLVED, boardFromString } from '@/engine/test-utils/boards';
import { BOARD_SIZE } from '@/engine/types';
import { UNDO_LIMIT, createNewGame, type GameState } from '@/state/game-reducer';
import { parseGame, serializeGame } from '@/state/game-store';

/** A partly played easy game: three givens, one user entry, one undo entry. */
function playedGame(): GameState {
  const values = SOLVED.slice(0, 3) + EMPTY.slice(3, 80) + SOLVED[80];
  return {
    board: boardFromString(values, [0, 1, 2]),
    meta: { difficulty: 'medium', solution: SOLVED },
    selected: 80,
    undoStack: [{ index: 80, value: 0, notes: 0 }],
    status: 'playing',
  };
}

describe('serializeGame', () => {
  it('round-trips a played game', () => {
    const state = playedGame();
    const restored = parseGame(serializeGame(state));
    expect(restored).toEqual(state);
  });

  it('round-trips a generated puzzle', () => {
    const state = createNewGame('hard');
    expect(parseGame(serializeGame(state))).toEqual(state);
  });

  it('round-trips pencil notes when any are set', () => {
    const state = playedGame();
    state.board[40] = { ...state.board[40], notes: 0b101 };
    const restored = parseGame(serializeGame(state));
    expect(restored?.board[40].notes).toBe(0b101);
    expect(restored?.board[41].notes).toBe(0);
  });

  it('omits the notes array while every cell is noteless', () => {
    const serialized = serializeGame(playedGame());
    expect(serialized).not.toContain('notes');
  });

  it('returns null for a game with no puzzle to save', () => {
    expect(serializeGame({ ...playedGame(), meta: null })).toBeNull();
  });

  it('derives status from the board rather than trusting the store', () => {
    const solved: GameState = {
      board: boardFromString(SOLVED, [0]),
      meta: { difficulty: 'easy', solution: SOLVED },
      selected: null,
      undoStack: [],
      // Deliberately stale — parsing must recompute it.
      status: 'playing',
    };
    expect(parseGame(serializeGame(solved))?.status).toBe('won');
  });
});

describe('parseGame', () => {
  const stored = (overrides: Record<string, unknown>) =>
    JSON.stringify({ ...JSON.parse(serializeGame(playedGame())!), ...overrides });

  it('returns null when nothing is stored or the JSON is broken', () => {
    expect(parseGame(null)).toBeNull();
    expect(parseGame('')).toBeNull();
    expect(parseGame('{not json')).toBeNull();
    expect(parseGame('"a string"')).toBeNull();
  });

  it('rejects a version it does not understand', () => {
    expect(parseGame(stored({ v: 2 }))).toBeNull();
    expect(parseGame(stored({ v: undefined }))).toBeNull();
  });

  it('rejects malformed boards', () => {
    expect(parseGame(stored({ values: 'abc' }))).toBeNull();
    expect(parseGame(stored({ values: '.'.repeat(BOARD_SIZE - 1) }))).toBeNull();
    expect(parseGame(stored({ givens: 42 }))).toBeNull();
    expect(parseGame(stored({ solution: SOLVED.slice(1) }))).toBeNull();
    expect(parseGame(stored({ difficulty: 'impossible' }))).toBeNull();
  });

  it('rejects a store whose givens disagree with the board', () => {
    const game = playedGame();
    const values = '9' + SOLVED.slice(1, 3) + EMPTY.slice(3, 80) + SOLVED[80];
    expect(parseGame(stored({ values: values.replace(/-/g, '.') }))).toBeNull();
    expect(game.board[0].given).toBe(true);
  });

  it('rejects malformed undo history', () => {
    expect(parseGame(stored({ undo: 'nope' }))).toBeNull();
    expect(parseGame(stored({ undo: [[81, 0, 0]] }))).toBeNull();
    expect(parseGame(stored({ undo: [[0, 10, 0]] }))).toBeNull();
    expect(parseGame(stored({ undo: [[0, 1]] }))).toBeNull();
  });

  it(`trims a history longer than the ${UNDO_LIMIT}-entry cap, keeping the newest`, () => {
    const undo = Array.from({ length: UNDO_LIMIT + 3 }, (_, i) => [i % BOARD_SIZE, 0, 0]);
    const restored = parseGame(stored({ undo }));
    expect(restored?.undoStack).toHaveLength(UNDO_LIMIT);
    expect(restored?.undoStack[UNDO_LIMIT - 1].index).toBe((UNDO_LIMIT + 2) % BOARD_SIZE);
  });

  it('drops an out-of-range selection instead of failing', () => {
    expect(parseGame(stored({ selected: 99 }))?.selected).toBeNull();
    expect(parseGame(stored({ selected: 'x' }))?.selected).toBeNull();
    expect(parseGame(stored({ selected: null }))?.selected).toBeNull();
  });

  it('ignores a notes array of the wrong shape', () => {
    const restored = parseGame(stored({ notes: [1, 2, 3] }));
    expect(restored?.board.every((cell) => cell.notes === 0)).toBe(true);
  });
});
