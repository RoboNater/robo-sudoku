import { Fonts } from '@/constants/theme';
import type { BoardSkin } from '@/skins/types';

/** Traditional print look: serif digits, hairline grid, heavy box borders. */
export const newspaperSkin: BoardSkin = {
  id: 'newspaper',
  name: 'Classic Newspaper',
  light: {
    boardBackground: '#ffffff',
    cellBackground: '#ffffff',
    gridLine: '#9a9a9a',
    boxLine: '#000000',
    givenText: '#000000',
    entryText: '#1855c4',
    conflictText: '#d0021b',
    mutedText: '#5a5a5a',
    selectedCell: '#cfe0fb',
    peerHighlight: '#f0f0f0',
    sameValueHighlight: '#e3ecfa',
    padBackground: '#f0f0f3',
    padText: '#000000',
    padPressed: '#d8d9de',
  },
  dark: {
    boardBackground: '#000000',
    cellBackground: '#0c0d0f',
    gridLine: '#4a4d52',
    boxLine: '#c8cdd4',
    givenText: '#ffffff',
    entryText: '#7aa5f8',
    conflictText: '#ff5a5a',
    mutedText: '#a8adb5',
    selectedCell: '#2b3a55',
    peerHighlight: '#1a1c20',
    sameValueHighlight: '#203047',
    padBackground: '#212225',
    padText: '#ffffff',
    padPressed: '#2e3135',
  },
  metrics: {
    gridLineWidth: 1,
    boxLineWidth: 2,
    cellGap: 0,
    cellCornerRadius: 0,
    boardCornerRadius: 0,
  },
  fonts: {
    cellFontFamily: Fonts?.serif,
    givenWeight: '700',
    entryWeight: '400',
  },
};
