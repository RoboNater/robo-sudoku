import { Pressable, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { type Board, type Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const STRIP_HEIGHT = 56;

interface DigitStripProps {
  board: Board;
  palette: SkinPalette;
  skin: BoardSkin;
  /** Total width the strip may occupy — matched to the board. */
  width: number;
  onDigit: (digit: Digit) => void;
  onClear: () => void;
}

/** How many of each digit are still missing from the board. */
function remainingCounts(board: Board): Record<Digit, number> {
  const counts = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 } as Record<Digit, number>;
  for (const cell of board) {
    if (cell.value !== 0) counts[cell.value] -= 1;
  }
  return counts;
}

/**
 * Zen's answer to the number pad: one borderless line of digits that fades each
 * one out as it gets used up, so the strip doubles as a progress read-out.
 */
export function DigitStrip({ board, palette, skin, width, onDigit, onClear }: DigitStripProps) {
  if (width <= 0) return <View style={{ height: STRIP_HEIGHT }} />;

  const gap = Spacing.one;
  const keyWidth = Math.floor((width - gap * 9) / 10);
  const remaining = remainingCounts(board);

  return (
    <View style={{ flexDirection: 'row', gap, alignSelf: 'center', height: STRIP_HEIGHT }}>
      {DIGITS.map((digit) => {
        const left = remaining[digit];
        return (
          <Pressable
            key={digit}
            role="button"
            accessibilityLabel={`Enter ${digit}, ${left} remaining`}
            onPress={() => onDigit(digit)}
            style={({ pressed }) => ({
              width: keyWidth,
              height: STRIP_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: left <= 0 ? 0.25 : pressed ? 0.5 : 1,
            })}>
            <Text
              style={{
                fontSize: Math.min(28, keyWidth * 0.62),
                fontFamily: skin.fonts.cellFontFamily,
                fontWeight: skin.fonts.givenWeight,
                color: palette.padText,
              }}>
              {digit}
            </Text>
            <Text style={{ fontSize: 10, color: palette.mutedText ?? palette.gridLine }}>
              {Math.max(0, left)}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        role="button"
        accessibilityLabel="Erase"
        onPress={onClear}
        style={({ pressed }) => ({
          width: keyWidth,
          height: STRIP_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.5 : 1,
        })}>
        <Text style={{ fontSize: Math.min(20, keyWidth * 0.5), color: palette.padText }}>⌫</Text>
      </Pressable>
    </View>
  );
}
