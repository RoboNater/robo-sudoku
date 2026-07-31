import type { BoardSkin } from '@/skins/types';

import { darkNeonSkin } from './dark-neon';
import { highContrastSkin } from './high-contrast';
import { modernMinimalSkin } from './modern-minimal';
import { newspaperSkin } from './newspaper';

/** Skins offered by the Classic UI, in picker order. */
export const classicSkins: Record<string, BoardSkin> = {
  [newspaperSkin.id]: newspaperSkin,
  [modernMinimalSkin.id]: modernMinimalSkin,
  [highContrastSkin.id]: highContrastSkin,
  [darkNeonSkin.id]: darkNeonSkin,
};

export const defaultClassicSkinId = newspaperSkin.id;
