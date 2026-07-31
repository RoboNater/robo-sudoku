import { Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import type { BoardSkin } from '@/skins/types';

/** One 3x3 sample box: a given, an entry in a selected cell, a conflict, a peer. */
const SAMPLE: { value?: string; text?: 'given' | 'entry' | 'conflict'; fill?: 'selected' | 'peer' }[] =
  [
    { value: '5', text: 'given' },
    { fill: 'peer' },
    { value: '7', text: 'entry', fill: 'selected' },
    { fill: 'peer' },
    { value: '3', text: 'conflict' },
    {},
    { value: '9', text: 'given' },
    {},
    { fill: 'peer' },
  ];

interface SkinPreviewProps {
  skin: BoardSkin;
  size?: number;
}

/** Miniature board rendered straight from a skin, for the settings swatches. */
export function SkinPreview({ skin, size = 72 }: SkinPreviewProps) {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? skin.dark : skin.light;
  const { gridLineWidth, boxLineWidth, cellGap, cellCornerRadius, boardCornerRadius } = skin.metrics;

  const cellSize = Math.floor((size - 2 * boxLineWidth - 2 * gridLineWidth - 2 * cellGap) / 3);

  return (
    <View
      style={{
        backgroundColor: palette.boardBackground,
        borderWidth: boxLineWidth,
        borderColor: palette.boxLine,
        borderRadius: boardCornerRadius,
        overflow: 'hidden',
      }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {[0, 1, 2].map((col) => {
            const cell = SAMPLE[row * 3 + col];
            const background =
              cell.fill === 'selected'
                ? palette.selectedCell
                : cell.fill === 'peer'
                  ? palette.peerHighlight
                  : palette.cellBackground;
            const color =
              cell.text === 'conflict'
                ? palette.conflictText
                : cell.text === 'entry'
                  ? palette.entryText
                  : palette.givenText;
            return (
              <View
                key={col}
                style={{
                  width: cellSize,
                  height: cellSize,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: background,
                  borderRadius: cellCornerRadius,
                  borderRightWidth: col === 2 ? 0 : gridLineWidth,
                  borderBottomWidth: row === 2 ? 0 : gridLineWidth,
                  borderColor: palette.gridLine,
                  marginRight: col === 2 ? 0 : cellGap,
                  marginBottom: row === 2 ? 0 : cellGap,
                }}>
                {!!cell.value && (
                  <Text
                    style={{
                      fontSize: cellSize * 0.6,
                      fontFamily: skin.fonts.cellFontFamily,
                      fontWeight:
                        cell.text === 'given' ? skin.fonts.givenWeight : skin.fonts.entryWeight,
                      color,
                    }}>
                    {cell.value}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
