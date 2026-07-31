import type { Dispatch } from 'react';

import type { GameAction } from '@/state/game-reducer';

/** Keyboard entry is web-only; no-op on native. See use-keyboard-controls.web.ts. */
export function useKeyboardControls(_dispatch: Dispatch<GameAction>) {}
