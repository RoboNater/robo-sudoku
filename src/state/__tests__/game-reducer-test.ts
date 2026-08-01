import type { NoteUnits } from '@/engine/rules';
import { EMPTY, SOLVED, boardFromString, notesOf } from '@/engine/test-utils/boards';
import { BOARD_SIZE, type Digit } from '@/engine/types';
import {
  UNDO_LIMIT,
  createEmptyGame,
  createNewGame,
  gameReducer,
  type GameState,
  type NoteUnit,
} from '@/state/game-reducer';

const ALL_ON: NoteUnits = { row: true, col: true, box: true };
const ALL_OFF: NoteUnits = { row: false, col: false, box: false };

function stateWith(
  values: string,
  givens: number[] = [],
  notes: Record<number, number> = {},
): GameState {
  return {
    board: boardFromString(values, givens, notes),
    meta: null,
    selected: null,
    notesMode: false,
    autoClearNotes: { ...ALL_ON },
    undoStack: [],
    status: 'playing',
  };
}

const select = (state: GameState, index: number | null) =>
  gameReducer(state, { type: 'SELECT', index });
const input = (state: GameState, digit: Digit) => gameReducer(state, { type: 'INPUT', digit });
const clear = (state: GameState) => gameReducer(state, { type: 'CLEAR' });
const undo = (state: GameState) => gameReducer(state, { type: 'UNDO' });
const autofill = (state: GameState) => gameReducer(state, { type: 'AUTOFILL_NOTES' });
const setAutoClear = (state: GameState, unit: NoteUnit, on: boolean) =>
  gameReducer(state, { type: 'SET_AUTO_CLEAR', unit, on });

describe('NEW_GAME', () => {
  it('creates a playable game with empty history', () => {
    const state = createNewGame('easy');
    expect(state.status).toBe('playing');
    expect(state.undoStack).toHaveLength(0);
    expect(state.meta?.difficulty).toBe('easy');
    expect(state.board.some((cell) => cell.value === 0)).toBe(true);
  });

  it('defaults to values off, auto-clear all on', () => {
    const state = createNewGame('easy');
    expect(state.notesMode).toBe(false);
    expect(state.autoClearNotes).toEqual(ALL_ON);
  });

  it('carries the current note preferences forward', () => {
    const played: GameState = {
      ...stateWith(EMPTY),
      notesMode: true,
      autoClearNotes: { row: false, col: true, box: false },
    };
    const next = gameReducer(played, { type: 'NEW_GAME', difficulty: 'medium' });
    expect(next.notesMode).toBe(true);
    expect(next.autoClearNotes).toEqual({ row: false, col: true, box: false });
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
    expect(state.undoStack).toEqual([{ cells: [{ index: 5, value: 0, notes: 0 }] }]);
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
    expect(state.undoStack).toEqual([{ cells: [{ index: 0, value: 9, notes: 0 }] }]);
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
    expect(state.undoStack[0].cells[0].value).not.toBe(0);
  });

  it('counts actions rather than cells, however many an action touched', () => {
    let state = autofill(stateWith(EMPTY));
    state = input(select(state, 0), 5);
    expect(state.undoStack).toHaveLength(2);
    expect(state.undoStack[0].cells).toHaveLength(BOARD_SIZE); // autofill
    expect(state.undoStack[1].cells).toHaveLength(21); // the digit plus its 20 peers
  });
});

describe('notes mode', () => {
  const inNotesMode = (state: GameState) =>
    gameReducer(state, { type: 'SET_NOTES_MODE', on: true });

  it('toggles pencil marks on and off, one undo entry each', () => {
    let state = select(inNotesMode(stateWith(EMPTY)), 40);
    state = input(state, 3);
    expect(state.board[40].notes).toBe(notesOf(3));
    state = input(state, 7);
    expect(state.board[40].notes).toBe(notesOf(3, 7));
    state = input(state, 3);
    expect(state.board[40].notes).toBe(notesOf(7));
    expect(state.undoStack).toHaveLength(3);
    expect(state.board[40].value).toBe(0);
  });

  it('is a no-op on a given or already-answered cell', () => {
    const given = select(inNotesMode(stateWith('5' + EMPTY.slice(1), [0])), 0);
    expect(input(given, 3)).toBe(given);

    const answered = select(inNotesMode(stateWith('5' + EMPTY.slice(1))), 0);
    expect(input(answered, 3)).toBe(answered);
  });

  it('leaves peers alone — only entering a value prunes', () => {
    const state = input(select(inNotesMode(stateWith(EMPTY, [], { 1: notesOf(5) })), 0), 5);
    expect(state.board[1].notes).toBe(notesOf(5));
  });

  it('erases notes first, then falls through to the value', () => {
    let state = select(inNotesMode(stateWith(EMPTY, [], { 40: notesOf(1, 2) })), 40);
    state = clear(state);
    expect(state.board[40].notes).toBe(0);

    const answered = select(inNotesMode(stateWith(EMPTY.slice(1) + '9')), 80);
    expect(clear(answered).board[80].value).toBe(0);
  });

  it('toggling the mode is not an undo step', () => {
    const state = stateWith(EMPTY);
    const on = gameReducer(state, { type: 'TOGGLE_NOTES_MODE' });
    expect(on.notesMode).toBe(true);
    expect(on.undoStack).toHaveLength(0);
    expect(gameReducer(on, { type: 'TOGGLE_NOTES_MODE' }).notesMode).toBe(false);
    // Setting it to the value it already has changes nothing at all.
    expect(gameReducer(on, { type: 'SET_NOTES_MODE', on: true })).toBe(on);
  });
});

describe('auto-clear on digit entry', () => {
  /** Note 5 pencilled into a row peer, a column peer, a box peer, and a stranger. */
  const withNotedPeers = () =>
    stateWith(EMPTY, [], {
      0: notesOf(1, 2),
      1: notesOf(5),
      9: notesOf(5),
      10: notesOf(5),
      80: notesOf(5),
    });

  it('clears the digit from peers in the enabled units, and the cell’s own notes', () => {
    const state = input(select(withNotedPeers(), 0), 5);
    expect(state.board[0]).toEqual({ given: false, value: 5, notes: 0 });
    expect(state.board[1].notes).toBe(0);
    expect(state.board[9].notes).toBe(0);
    expect(state.board[10].notes).toBe(0);
    expect(state.board[80].notes).toBe(notesOf(5)); // shares no unit
    expect(state.undoStack).toHaveLength(1);
  });

  it('restores the digit and every pruned peer in a single undo', () => {
    const before = select(withNotedPeers(), 0);
    const after = input(before, 5);
    expect(undo(after).board).toEqual(before.board);
    expect(undo(after).undoStack).toHaveLength(0);
  });

  it('prunes nothing with every unit off', () => {
    const state = { ...withNotedPeers(), autoClearNotes: { ...ALL_OFF } };
    const entered = input(select(state, 0), 5);
    expect(entered.board[1].notes).toBe(notesOf(5));
    expect(entered.board[9].notes).toBe(notesOf(5));
    expect(entered.board[10].notes).toBe(notesOf(5));
    expect(entered.undoStack[0].cells).toHaveLength(1); // just the cell itself
  });

  it('prunes only the units that are enabled', () => {
    const state = {
      ...withNotedPeers(),
      autoClearNotes: { row: true, col: false, box: false },
    };
    const entered = input(select(state, 0), 5);
    expect(entered.board[1].notes).toBe(0); // same row
    expect(entered.board[9].notes).toBe(notesOf(5)); // same column, not enabled
    expect(entered.board[10].notes).toBe(notesOf(5)); // same box, not enabled
  });
});

describe('AUTOFILL_NOTES', () => {
  it('fills every empty cell with the candidates the flags allow', () => {
    const state = autofill(stateWith('-1' + EMPTY.slice(2), [1]));
    expect(state.board[0].notes).toBe(0b111111110); // 1 ruled out by the row
    expect(state.board[1].notes).toBe(0); // answered cells stay noteless
    expect(state.undoStack).toHaveLength(1);
  });

  it('fills a literal 1-9 when no unit is enabled', () => {
    const state = autofill({ ...stateWith(SOLVED.slice(0, 80) + '-'), autoClearNotes: ALL_OFF });
    expect(state.board[80].notes).toBe(0b111111111);
  });

  it('is idempotent', () => {
    const filled = autofill(stateWith(EMPTY));
    expect(autofill(filled)).toBe(filled);
  });

  it('undoes all 81 cells in one step', () => {
    const before = stateWith(EMPTY, [], { 40: notesOf(4) });
    expect(undo(autofill(before)).board).toEqual(before.board);
  });
});

describe('SET_AUTO_CLEAR', () => {
  /**
   * Column auto-clear is already on and row is off, with a 7 answered at index 0
   * and a stray 7 pencilled into one row peer and one column peer.
   */
  const beforeFlip = () => ({
    ...stateWith('7' + EMPTY.slice(1), [], { 8: notesOf(7, 4), 9: notesOf(7) }),
    autoClearNotes: { row: false, col: true, box: false },
  });

  it('is a no-op when the flag already holds that value', () => {
    const state = beforeFlip();
    expect(setAutoClear(state, 'col', true)).toBe(state);
    expect(setAutoClear(state, 'row', false)).toBe(state);
  });

  it('switching on prunes conflicts in that unit and no other', () => {
    const state = setAutoClear(beforeFlip(), 'row', true);
    expect(state.autoClearNotes).toEqual({ row: true, col: true, box: false });
    expect(state.board[8].notes).toBe(notesOf(4)); // the row conflict went
    // Conflicts by an already-enabled unit are not re-swept.
    expect(state.board[9].notes).toBe(notesOf(7));
    expect(state.undoStack).toHaveLength(1);
  });

  it('switching off records a flags-only entry', () => {
    const before = beforeFlip();
    const state = setAutoClear(before, 'col', false);
    expect(state.autoClearNotes).toEqual({ row: false, col: false, box: false });
    expect(state.board).toBe(before.board);
    expect(state.undoStack).toEqual([{ cells: [], autoClear: before.autoClearNotes }]);
  });

  it('undo restores the flags and every note the flip pruned', () => {
    const before = beforeFlip();
    const flipped = setAutoClear(before, 'row', true);
    const back = undo(flipped);
    expect(back.autoClearNotes).toEqual(before.autoClearNotes);
    expect(back.board).toEqual(before.board);
    expect(back.undoStack).toHaveLength(0);
  });

  it('undo restores a switch-off with no note changes', () => {
    const before = beforeFlip();
    const back = undo(setAutoClear(before, 'col', false));
    expect(back.autoClearNotes).toEqual(before.autoClearNotes);
    expect(back.board).toEqual(before.board);
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
