import { Fonts } from '@/constants/theme';
import type { BoardSkin } from '@/skins/types';

/**
 * Dark-first arcade look: glowing cyan/magenta accents on near-black.
 * The light variant keeps the same accents on a dim slate board so the skin
 * still reads as itself when the system is in light mode.
 */
export const darkNeonSkin: BoardSkin = {
  id: 'dark-neon',
  name: 'Dark Neon',
  light: {
    boardBackground: '#2a2f45',
    cellBackground: '#333a54',
    gridLine: '#4a5273',
    boxLine: '#00e5ff',
    givenText: '#eaf6ff',
    entryText: '#00e5ff',
    conflictText: '#ff3d8b',
    mutedText: '#8f9cc9',
    notesText: '#7e8cbb',
    selectedCell: '#4a5a8f',
    peerHighlight: '#3b4364',
    sameValueHighlight: '#41537f',
    padBackground: '#333a54',
    padText: '#00e5ff',
    padPressed: '#455076',
  },
  dark: {
    boardBackground: '#07080f',
    cellBackground: '#0e1120',
    gridLine: '#232a4a',
    boxLine: '#00e5ff',
    givenText: '#c9d8ff',
    entryText: '#3dffd6',
    conflictText: '#ff2d78',
    mutedText: '#6b78ad',
    notesText: '#7d8ac0',
    selectedCell: '#243a6b',
    peerHighlight: '#151a2e',
    sameValueHighlight: '#1c2f4d',
    padBackground: '#131731',
    padText: '#3dffd6',
    padPressed: '#222a52',
  },
  metrics: {
    gridLineWidth: 1,
    boxLineWidth: 2,
    cellGap: 1,
    cellCornerRadius: 3,
    boardCornerRadius: 10,
  },
  fonts: {
    cellFontFamily: Fonts?.mono,
    givenWeight: '700',
    entryWeight: '500',
  },
};
