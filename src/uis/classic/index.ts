import type { GameUI } from '@/uis/types';

import { ClassicUI } from './classic-ui';
import { classicLayouts, defaultClassicLayoutId } from './layouts';
import { classicSkins, defaultClassicSkinId } from './skins';

export const classicUI: GameUI = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional sudoku screen: difficulty toolbar, board, status line, and digit pad.',
  component: ClassicUI,
  skins: classicSkins,
  layouts: classicLayouts,
  defaultSkinId: defaultClassicSkinId,
  defaultLayoutId: defaultClassicLayoutId,
};
