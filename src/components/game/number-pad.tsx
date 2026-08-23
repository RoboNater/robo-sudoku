import { Pressable, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { remainingCounts } from '@/engine/rules';
import type { Board, Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface NumberPadProps {
  board: Board;
  palette: SkinPalette;
  skin: BoardSkin;
  /** Total width the pad may occupy. */
  width: number;
  /** `row`: 1-9 plus erase on one line. `grid`: 3x3 block with erase beneath. */
  variant?: 'row' | 'grid';
  /** Restyles the digits as a reminder that they will write pencil marks. */
  notesMode?: boolean;
  onDigit: (digit: Digit) => void;
  onClear: () => void;
}

export function NumberPad({
  board,
  palette,
  skin,
  width,
  variant = 'row',
  notesMode = false,
  onDigit,
  onClear,
}: NumberPadProps) {
  const gap = Spacing.one;
  const columns = variant === 'grid' ? 3 : 10;
  const keyWidth = Math.floor((width - gap * (columns - 1)) / columns);
  const keyHeight = Math.max(48, keyWidth);

  // Same story as the board: reserve the row's height until the window has been
  // measured rather than paint a strip of zero-width keys.
  if (width <= 0) return <View style={{ height: keyHeight }} />;

  const notesColor = palette.notesText ?? palette.mutedText ?? palette.gridLine;
  const remaining = remainingCounts(board);

  const key = (label: string, onPress: () => void, fontSize: number, keyStyleWidth = keyWidth) => (
    <Pressable
      key={label}
      role="button"
      onPress={onPress}
      style={({ pressed }) => ({
        width: keyStyleWidth,
        height: keyHeight,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Spacing.two,
        backgroundColor: pressed ? palette.padPressed : palette.padBackground,
      })}>
      <Text
        style={{
          fontSize,
          fontFamily: skin.fonts.cellFontFamily,
          fontWeight: skin.fonts.givenWeight,
          color: notesMode ? notesColor : palette.padText,
        }}>
        {label}
      </Text>
    </Pressable>
  );

  const digitKeys = DIGITS.map((digit) => {
    const left = remaining[digit];
    return (
      <Pressable
        key={digit}
        role="button"
        accessibilityLabel={`Enter ${digit}, ${left} remaining`}
        onPress={() => onDigit(digit)}
        style={({ pressed }) => ({
          width: keyWidth,
          height: keyHeight,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: Spacing.two,
          backgroundColor: pressed ? palette.padPressed : palette.padBackground,
          opacity: left <= 0 ? 0.25 : 1,
        })}>
        <Text
          style={{
            fontSize: keyWidth * (notesMode ? 0.38 : 0.5),
            fontFamily: skin.fonts.cellFontFamily,
            fontWeight: skin.fonts.givenWeight,
            color: notesMode ? notesColor : palette.padText,
          }}>
          {digit}
        </Text>
        <Text style={{ fontSize: Math.min(12, keyWidth * 0.22), color: palette.mutedText ?? palette.gridLine }}>
          {Math.max(0, left)}
        </Text>
      </Pressable>
    );
  });

  if (variant === 'grid') {
    return (
      <View style={{ gap, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, width: keyWidth * 3 + gap * 2 }}>
          {digitKeys}
        </View>
        {key('⌫', onClear, keyWidth * 0.4, keyWidth * 3 + gap * 2)}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap, alignSelf: 'center' }}>
      {digitKeys}
      {key('⌫', onClear, keyWidth * 0.4)}
    </View>
  );
}
