import type { TextStyle } from 'react-native';

/** Colors for one color-scheme variant of a skin. */
export interface SkinPalette {
  boardBackground: string;
  cellBackground: string;
  alternateBoxBackground?: string;
  gridLine: string;
  boxLine: string;
  givenText: string;
  entryText: string;
  conflictText: string;
  selectedCell: string;
  peerHighlight: string;
  sameValueHighlight?: string;
  padBackground: string;
  padText: string;
  padPressed: string;
}

/**
 * Visual definition a game UI renders its board and number pad from.
 * Each UI declares its own skin set; skins are orthogonal to the system
 * light/dark scheme (every skin provides both variants).
 */
export interface BoardSkin {
  id: string;
  name: string;
  light: SkinPalette;
  dark: SkinPalette;
  metrics: {
    gridLineWidth: number;
    boxLineWidth: number;
    cellGap: number;
    cellCornerRadius: number;
    boardCornerRadius: number;
  };
  fonts: {
    cellFontFamily: string | undefined;
    givenWeight: TextStyle['fontWeight'];
    entryWeight: TextStyle['fontWeight'];
  };
}
