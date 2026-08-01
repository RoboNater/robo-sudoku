import { EMPTY, SOLVED, boardFromString, notesOf } from '@/engine/test-utils/boards';
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
    notesMode: false,
    autoClearNotes: { row: true, col: true, box: true },
    undoStack: [{ cells: [{ index: 80, value: 0, notes: 0 }] }],
    status: 'playing',
  };
}

/** The v1 payload the same game would have been stored as before M6. */
function v1Stored(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    v: 1,
    difficulty: 'medium',
    solution: SOLVED,
    givens: SOLVED.slice(0, 3) + '.'.repeat(78),
    values: SOLVED.slice(0, 3) + '.'.repeat(77) + SOLVED[80],
    selected: 80,
    undo: [
      [80, 0, 0],
      [40, 3, notesOf(1, 9)],
    ],
    ...overrides,
  });
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

  it('round-trips grouped undo entries, including one that changed the flags', () => {
    const state: GameState = {
      ...playedGame(),
      autoClearNotes: { row: false, col: true, box: true },
      undoStack: [
        {
          cells: [
            { index: 4, value: 0, notes: notesOf(2, 5) },
            { index: 5, value: 7, notes: 0 },
          ],
        },
        { cells: [], autoClear: { row: true, col: true, box: true } },
      ],
    };
    expect(parseGame(serializeGame(state))).toEqual(state);
  });

  it('round-trips notes mode and the auto-clear flags', () => {
    const state: GameState = {
      ...playedGame(),
      notesMode: true,
      autoClearNotes: { row: false, col: false, box: true },
    };
    const restored = parseGame(serializeGame(state));
    expect(restored?.notesMode).toBe(true);
    expect(restored?.autoClearNotes).toEqual({ row: false, col: false, box: true });
  });

  it('omits the note preferences while they hold their defaults', () => {
    const serialized = serializeGame(playedGame())!;
    expect(serialized).not.toContain('notesMode');
    expect(serialized).not.toContain('autoClear');
  });

  it('derives status from the board rather than trusting the store', () => {
    const solved: GameState = {
      ...playedGame(),
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
    expect(parseGame(stored({ v: 3 }))).toBeNull();
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
    expect(parseGame(stored({ undo: [{ c: [[81, 0, 0]] }] }))).toBeNull();
    expect(parseGame(stored({ undo: [{ c: [[0, 10, 0]] }] }))).toBeNull();
    expect(parseGame(stored({ undo: [{ c: [[0, 1]] }] }))).toBeNull();
    expect(parseGame(stored({ undo: [{ c: 'nope' }] }))).toBeNull();
    expect(parseGame(stored({ undo: [[0, 1, 0]] }))).toBeNull(); // v1's flat form
    expect(parseGame(stored({ undo: [{ c: [], a: [true, false] }] }))).toBeNull();
    expect(parseGame(stored({ undo: [{ c: [], a: 'row' }] }))).toBeNull();
  });

  it('rejects a note mask outside 0..511', () => {
    expect(parseGame(stored({ undo: [{ c: [[0, 0, 512]] }] }))).toBeNull();
    expect(parseGame(stored({ undo: [{ c: [[0, 0, -1]] }] }))).toBeNull();
  });

  it(`trims a history longer than the ${UNDO_LIMIT}-entry cap, keeping the newest`, () => {
    const undo = Array.from({ length: UNDO_LIMIT + 3 }, (_, i) => ({
      c: [[i % BOARD_SIZE, 0, 0]],
    }));
    const restored = parseGame(stored({ undo }));
    expect(restored?.undoStack).toHaveLength(UNDO_LIMIT);
    expect(restored?.undoStack[UNDO_LIMIT - 1].cells[0].index).toBe((UNDO_LIMIT + 2) % BOARD_SIZE);
  });

  it('drops an out-of-range selection instead of failing', () => {
    expect(parseGame(stored({ selected: 99 }))?.selected).toBeNull();
    expect(parseGame(stored({ selected: 'x' }))?.selected).toBeNull();
    expect(parseGame(stored({ selected: null }))?.selected).toBeNull();
  });

  it('ignores a notes array of the wrong shape or range', () => {
    expect(parseGame(stored({ notes: [1, 2, 3] }))?.board.every((c) => c.notes === 0)).toBe(true);
    const outOfRange = Array.from({ length: BOARD_SIZE }, () => 512);
    expect(parseGame(stored({ notes: outOfRange }))?.board.every((c) => c.notes === 0)).toBe(true);
  });

  it('defaults the note preferences when they are absent or malformed', () => {
    const allOn = { row: true, col: true, box: true };
    expect(parseGame(stored({}))?.autoClearNotes).toEqual(allOn);
    expect(parseGame(stored({ autoClear: 'nope' }))?.autoClearNotes).toEqual(allOn);
    expect(parseGame(stored({ autoClear: [true, false] }))?.autoClearNotes).toEqual(allOn);
    expect(parseGame(stored({ notesMode: 'yes' }))?.notesMode).toBe(false);
  });
});

describe('parseGame of a v1 store', () => {
  it('restores the board and unpacks the undo history into single-cell groups', () => {
    const restored = parseGame(v1Stored());
    expect(restored?.board[0]).toEqual({ given: true, value: Number(SOLVED[0]), notes: 0 });
    expect(restored?.selected).toBe(80);
    expect(restored?.undoStack).toEqual([
      { cells: [{ index: 80, value: 0, notes: 0 }] },
      { cells: [{ index: 40, value: 3, notes: notesOf(1, 9) }] },
    ]);
  });

  it('gets the M6 defaults for everything v1 never stored', () => {
    const restored = parseGame(v1Stored());
    expect(restored?.notesMode).toBe(false);
    expect(restored?.autoClearNotes).toEqual({ row: true, col: true, box: true });
  });

  it('still rejects a malformed v1 history', () => {
    expect(parseGame(v1Stored({ undo: [[0, 1]] }))).toBeNull();
    expect(parseGame(v1Stored({ undo: [{ c: [[0, 1, 0]] }] }))).toBeNull(); // v2's form
  });
});
