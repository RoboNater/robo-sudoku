import { EMPTY, SOLVED, boardFromString } from '@/engine/test-utils/boards';
import { BOARD_SIZE, type Digit } from '@/engine/types';
import {
  UNDO_LIMIT,
  createEmptyGame,
  createNewGame,
  gameReducer,
  type GameState,
} from '@/state/game-reducer';

function stateWith(values: string, givens: number[] = []): GameState {
  return {
    board: boardFromString(values, givens),
    meta: null,
    selected: null,
    undoStack: [],
    status: 'playing',
  };
}

const select = (state: GameState, index: number | null) =>
  gameReducer(state, { type: 'SELECT', index });
const input = (state: GameState, digit: Digit) => gameReducer(state, { type: 'INPUT', digit });

describe('NEW_GAME', () => {
  it('creates a playable game with empty history', () => {
    const state = createNewGame('easy');
    expect(state.status).toBe('playing');
    expect(state.undoStack).toHaveLength(0);
    expect(state.meta?.difficulty).toBe('easy');
    expect(state.board.some((cell) => cell.value === 0)).toBe(true);
  });
});

describe('createEmptyGame', () => {
  it('is a blank, puzzle-less board that is still playing', () => {
    const state = createEmptyGame();
    expect(state.board).toHaveLength(BOARD_SIZE);
    expect(state.board.every((cell) => cell.value === 0 && !cell.given)).toBe(true);
    expect(state.meta).toBeNull();
    expect(state.status).toBe('playing');
  });
});

describe('HYDRATE', () => {
  it('replaces the whole state with the restored one', () => {
    const restored = createNewGame('hard');
    expect(gameReducer(createEmptyGame(), { type: 'HYDRATE', state: restored })).toBe(restored);
  });
});

describe('SELECT / MOVE_SELECTION', () => {
  it('selects and deselects cells', () => {
    let state = stateWith(EMPTY);
    state = select(state, 12);
    expect(state.selected).toBe(12);
    state = select(state, null);
    expect(state.selected).toBeNull();
  });

  it('moves the selection and clamps at edges', () => {
    let state = select(stateWith(EMPTY), 0);
    state = gameReducer(state, { type: 'MOVE_SELECTION', dRow: -1, dCol: -1 });
    expect(state.selected).toBe(0); // clamped at top-left
    state = gameReducer(state, { type: 'MOVE_SELECTION', dRow: 1, dCol: 1 });
    expect(state.selected).toBe(10);
  });

  it('selects the first cell when moving with no selection', () => {
    const state = gameReducer(stateWith(EMPTY), { type: 'MOVE_SELECTION', dRow: 1, dCol: 0 });
    expect(state.selected).toBe(0);
  });
});

describe('INPUT / CLEAR', () => {
  it('sets the selected cell and records undo history', () => {
    let state = select(stateWith(EMPTY), 5);
    state = input(state, 7);
    expect(state.board[5].value).toBe(7);
    expect(state.undoStack).toEqual([{ index: 5, value: 0, notes: 0 }]);
  });

  it('ignores input with no selection', () => {
    const state = stateWith(EMPTY);
    expect(input(state, 3)).toBe(state);
  });

  it('never modifies a given cell', () => {
    let state = stateWith('5' + EMPTY.slice(1), [0]);
    state = select(state, 0);
    expect(input(state, 3).board[0].value).toBe(5);
    expect(gameReducer(input(state, 3), { type: 'CLEAR' }).board[0].value).toBe(5);
  });

  it('clears the selected cell', () => {
    let state = select(stateWith('9' + EMPTY.slice(1)), 0);
    state = gameReducer(state, { type: 'CLEAR' });
    expect(state.board[0].value).toBe(0);
    expect(state.undoStack).toEqual([{ index: 0, value: 9, notes: 0 }]);
  });
});

describe('UNDO', () => {
  it('restores the most recent change, most recent first', () => {
    let state = select(stateWith(EMPTY), 0);
    state = input(state, 1);
    state = select(state, 1);
    state = input(state, 2);
    state = gameReducer(state, { type: 'UNDO' });
    expect(state.board[1].value).toBe(0);
    expect(state.board[0].value).toBe(1);
    state = gameReducer(state, { type: 'UNDO' });
    expect(state.board[0].value).toBe(0);
    expect(state.undoStack).toHaveLength(0);
  });

  it('is a no-op with empty history', () => {
    const state = stateWith(EMPTY);
    expect(gameReducer(state, { type: 'UNDO' })).toBe(state);
  });

  it(`caps history at ${UNDO_LIMIT} entries, dropping the oldest`, () => {
    let state = select(stateWith(EMPTY), 0);
    for (let i = 0; i < UNDO_LIMIT + 5; i++) {
      state = input(state, ((i % 9) + 1) as Digit);
    }
    expect(state.undoStack).toHaveLength(UNDO_LIMIT);
    // The oldest surviving entry is no longer the initial empty cell.
    expect(state.undoStack[0].value).not.toBe(0);
  });
});

describe('completion detection', () => {
  it('flags a correctly finished board as won', () => {
    let state = stateWith(SOLVED.slice(0, 80) + '-');
    state = select(state, 80);
    state = input(state, Number(SOLVED[80]) as Digit);
    expect(state.status).toBe('won');
  });

  it('flags a full board containing a duplicate as wrong', () => {
    let state = stateWith(SOLVED.slice(0, 80) + '-');
    state = select(state, 80);
    state = input(state, Number(SOLVED[0]) as Digit); // wrong digit -> duplicate somewhere
    expect(state.status).toBe('wrong');
  });

  it('returns to playing when the offending cell is cleared', () => {
    let state = stateWith(SOLVED.slice(0, 80) + '-');
    state = select(state, 80);
    state = input(state, Number(SOLVED[0]) as Digit);
    state = gameReducer(state, { type: 'CLEAR' });
    expect(state.status).toBe('playing');
  });

  it('freezes the board after a win', () => {
    let state = stateWith(SOLVED.slice(0, 80) + '-');
    state = select(state, 80);
    state = input(state, Number(SOLVED[80]) as Digit);
    expect(state.status).toBe('won');
    const frozen = input(select(state, 0), 9);
    expect(frozen.board[0].value).toBe(Number(SOLVED[0]));
  });
});
