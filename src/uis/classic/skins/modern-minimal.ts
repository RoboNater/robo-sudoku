import { Fonts } from '@/constants/theme';
import type { BoardSkin } from '@/skins/types';

/** Soft, spacious take: sans digits, gapped rounded cells, blue selection. */
export const modernMinimalSkin: BoardSkin = {
  id: 'modern-minimal',
  name: 'Modern Minimal',
  light: {
    boardBackground: '#eef1f6',
    cellBackground: '#ffffff',
    gridLine: '#dfe3ea',
    boxLine: '#a7b1c1',
    givenText: '#1b1f27',
    entryText: '#2f6fed',
    conflictText: '#e5484d',
    mutedText: '#60646c',
    selectedCell: '#c9dcff',
    peerHighlight: '#f2f5fa',
    sameValueHighlight: '#e2ecff',
    padBackground: '#e7ecf4',
    padText: '#1b1f27',
    padPressed: '#ccd5e2',
  },
  dark: {
    boardBackground: '#15171c',
    cellBackground: '#1e2128',
    gridLine: '#282c34',
    boxLine: '#3a3f4a',
    givenText: '#f2f4f8',
    entryText: '#6f9dff',
    conflictText: '#ff6369',
    mutedText: '#9aa1ad',
    selectedCell: '#2c4372',
    peerHighlight: '#262a32',
    sameValueHighlight: '#2a3550',
    padBackground: '#1e2128',
    padText: '#f2f4f8',
    padPressed: '#2c313a',
  },
  metrics: {
    gridLineWidth: 0,
    boxLineWidth: 2,
    cellGap: 3,
    cellCornerRadius: 6,
    boardCornerRadius: 14,
  },
  fonts: {
    cellFontFamily: Fonts?.sans,
    givenWeight: '600',
    entryWeight: '400',
  },
};
