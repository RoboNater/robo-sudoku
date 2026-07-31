import { Fonts } from '@/constants/theme';
import type { BoardSkin } from '@/skins/types';

/**
 * Zen's single palette pair: warm paper and ink by day, near-black and sage by
 * night. Deliberately low-contrast — the UI has no other chrome to compete with.
 */
export const zenSkin: BoardSkin = {
  id: 'zen',
  name: 'Zen',
  light: {
    boardBackground: '#f6f4ee',
    cellBackground: '#fffdf8',
    gridLine: '#ded9cd',
    boxLine: '#b8b1a1',
    givenText: '#3a3733',
    entryText: '#5f7d6b',
    conflictText: '#b4534b',
    mutedText: '#8d867a',
    selectedCell: '#e8e3d3',
    peerHighlight: '#f4f1e8',
    sameValueHighlight: '#efeadb',
    padBackground: '#f0ede4',
    padText: '#3a3733',
    padPressed: '#e2ddd0',
  },
  dark: {
    boardBackground: '#16181a',
    cellBackground: '#1c1f21',
    gridLine: '#2a2e31',
    boxLine: '#3d4347',
    givenText: '#dfe3e0',
    entryText: '#8fb69c',
    conflictText: '#d97a72',
    mutedText: '#7a847f',
    selectedCell: '#28322e',
    peerHighlight: '#202426',
    sameValueHighlight: '#242b28',
    padBackground: '#1c1f21',
    padText: '#dfe3e0',
    padPressed: '#262b2e',
  },
  metrics: {
    gridLineWidth: 1,
    boxLineWidth: 2,
    cellGap: 0,
    cellCornerRadius: 0,
    boardCornerRadius: 4,
  },
  fonts: {
    cellFontFamily: Fonts?.rounded,
    givenWeight: '500',
    entryWeight: '400',
  },
};

export const zenSkins = { [zenSkin.id]: zenSkin };
