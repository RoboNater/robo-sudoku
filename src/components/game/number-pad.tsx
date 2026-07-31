import { Pressable, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface NumberPadProps {
  palette: SkinPalette;
  skin: BoardSkin;
  /** Total width the pad may occupy. */
  width: number;
  /** `row`: 1-9 plus erase on one line. `grid`: 3x3 block with erase beneath. */
  variant?: 'row' | 'grid';
  onDigit: (digit: Digit) => void;
  onClear: () => void;
}

export function NumberPad({
  palette,
  skin,
  width,
  variant = 'row',
  onDigit,
  onClear,
}: NumberPadProps) {
  const gap = Spacing.one;
  const columns = variant === 'grid' ? 3 : 10;
  const keyWidth = Math.floor((width - gap * (columns - 1)) / columns);
  const keyHeight = Math.max(48, keyWidth);

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
          color: palette.padText,
        }}>
        {label}
      </Text>
    </Pressable>
  );

  const digitKeys = DIGITS.map((digit) => key(String(digit), () => onDigit(digit), keyWidth * 0.5));

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
