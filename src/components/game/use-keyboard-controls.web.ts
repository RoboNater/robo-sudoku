import { useEffect, type Dispatch } from 'react';

import type { Digit } from '@/engine/types';
import type { GameAction } from '@/state/game-reducer';

/**
 * Digits 1-9 enter a value (or a pencil mark in notes mode); 0/Delete/Backspace
 * clear; `n` toggles notes mode; arrow keys move the selection.
 */
export function useKeyboardControls(dispatch: Dispatch<GameAction>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key >= '1' && event.key <= '9') {
        dispatch({ type: 'INPUT', digit: Number(event.key) as Digit });
        return;
      }
      if (event.key === 'n' || event.key === 'N') {
        dispatch({ type: 'TOGGLE_NOTES_MODE' });
        return;
      }
      if (event.key === '0' || event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'CLEAR' });
        return;
      }
      const move: Record<string, { dRow: -1 | 0 | 1; dCol: -1 | 0 | 1 }> = {
        ArrowUp: { dRow: -1, dCol: 0 },
        ArrowDown: { dRow: 1, dCol: 0 },
        ArrowLeft: { dRow: 0, dCol: -1 },
        ArrowRight: { dRow: 0, dCol: 1 },
      };
      const delta = move[event.key];
      if (delta) {
        event.preventDefault();
        dispatch({ type: 'MOVE_SELECTION', ...delta });
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);
}
