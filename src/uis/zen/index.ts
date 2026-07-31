import type { GameUI } from '@/uis/types';

import { zenSkin, zenSkins } from './skin';
import { ZenUI } from './zen-ui';

export const zenUI: GameUI = {
  id: 'zen',
  name: 'Zen',
  description: 'Bare, board-first screen: a single digit strip and nothing else in the way.',
  component: ZenUI,
  skins: zenSkins,
  defaultSkinId: zenSkin.id,
};
