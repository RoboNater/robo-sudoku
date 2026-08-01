import { useCallback } from 'react';

import type { NoteUnit } from './game-reducer';
import { useGameDispatch } from './game-context';
import { useSettings } from './settings-context';

/**
 * Flips a live auto-clear flag (undoable, so it lives in the game state) and
 * mirrors it to the persisted seed, which is all that survives a finished game.
 * Both places that render the checkboxes go through this.
 */
export function useSetAutoClear(): (unit: NoteUnit, on: boolean) => void {
  const dispatch = useGameDispatch();
  const { setAutoClearNotes } = useSettings();

  return useCallback(
    (unit: NoteUnit, on: boolean) => {
      dispatch({ type: 'SET_AUTO_CLEAR', unit, on });
      setAutoClearNotes(unit, on);
    },
    [dispatch, setAutoClearNotes],
  );
}
