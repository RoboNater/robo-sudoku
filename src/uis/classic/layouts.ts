import type { UiLayout } from '@/uis/types';

/** Structural variants of the Classic screen. */
export const classicLayouts: Record<string, UiLayout> = {
  'pad-bottom': {
    id: 'pad-bottom',
    name: 'Pad below board',
    description: 'One row of digit keys under the board.',
  },
  'pad-side': {
    id: 'pad-side',
    name: 'Pad beside board',
    description: 'Digit keypad to the right of the board; falls back below on narrow screens.',
  },
};

export const defaultClassicLayoutId = 'pad-bottom';

/** Below this width there is no room for a side pad, so `pad-side` falls back. */
export const PAD_SIDE_MIN_WIDTH = 700;
