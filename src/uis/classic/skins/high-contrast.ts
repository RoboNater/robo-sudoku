import { Fonts } from '@/constants/theme';
import type { BoardSkin } from '@/skins/types';

/** Maximum legibility: thick lines, saturated highlights, bold digits. */
export const highContrastSkin: BoardSkin = {
  id: 'high-contrast',
  name: 'High Contrast',
  light: {
    boardBackground: '#ffffff',
    cellBackground: '#ffffff',
    gridLine: '#000000',
    boxLine: '#000000',
    givenText: '#000000',
    entryText: '#0033cc',
    conflictText: '#e00000',
    selectedCell: '#ffe600',
    peerHighlight: '#e6e6e6',
    sameValueHighlight: '#b7f0c1',
    padBackground: '#000000',
    padText: '#ffffff',
    padPressed: '#3d3d3d',
  },
  dark: {
    boardBackground: '#000000',
    cellBackground: '#000000',
    gridLine: '#ffffff',
    boxLine: '#ffffff',
    givenText: '#ffffff',
    entryText: '#66b0ff',
    conflictText: '#ff4040',
    selectedCell: '#7a6a00',
    peerHighlight: '#2b2b2b',
    sameValueHighlight: '#134a24',
    padBackground: '#ffffff',
    padText: '#000000',
    padPressed: '#c4c4c4',
  },
  metrics: {
    gridLineWidth: 2,
    boxLineWidth: 5,
    cellGap: 0,
    cellCornerRadius: 0,
    boardCornerRadius: 0,
  },
  fonts: {
    cellFontFamily: Fonts?.sans,
    givenWeight: '800',
    entryWeight: '700',
  },
};
