import { Pressable, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface NumberPadProps {
  palette: SkinPalette;
  skin: BoardSkin;
  boardSize: number;
  onDigit: (digit: Digit) => void;
  onClear: () => void;
}

/** A single row: digits 1-9 plus an erase key, sized to match the board width. */
export function NumberPad({ palette, skin, boardSize, onDigit, onClear }: NumberPadProps) {
  const gap = Spacing.one;
  const keyWidth = Math.floor((boardSize - gap * 9) / 10);
  const keyHeight = Math.max(48, keyWidth);

  const key = (label: string, onPress: () => void, fontSize: number) => (
    <Pressable
      key={label}
      role="button"
      onPress={onPress}
      style={({ pressed }) => ({
        width: keyWidth,
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
          color: palette.padText,
        }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', gap, alignSelf: 'center' }}>
      {DIGITS.map((digit) => key(String(digit), () => onDigit(digit), keyWidth * 0.5))}
      {key('⌫', onClear, keyWidth * 0.4)}
    </View>
  );
}
