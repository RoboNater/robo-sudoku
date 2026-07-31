import type { ComponentType } from 'react';

import type { BoardSkin } from '@/skins/types';

/** A structural variant within one UI (e.g. number pad below vs. beside the board). */
export interface UiLayout {
  id: string;
  name: string;
  description: string;
}

/**
 * A complete, self-contained game screen. Every UI renders the same shared game
 * state, so switching UIs mid-puzzle keeps the board. Skins and layouts are
 * optional per UI: a UI with neither is simply not skinnable or variable.
 */
export interface GameUI {
  id: string;
  name: string;
  description: string;
  component: ComponentType;
  skins?: Record<string, BoardSkin>;
  layouts?: Record<string, UiLayout>;
  defaultSkinId?: string;
  defaultLayoutId?: string;
}
