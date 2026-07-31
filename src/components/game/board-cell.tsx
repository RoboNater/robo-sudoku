import { Pressable, Text, type ViewStyle } from 'react-native';

import type { Cell } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

interface BoardCellProps {
  cell: Cell;
  palette: SkinPalette;
  skin: BoardSkin;
  cellSize: number;
  selected: boolean;
  peer: boolean;
  sameValue: boolean;
  conflict: boolean;
  borderStyle: ViewStyle;
  onPress: () => void;
}

export function BoardCell({
  cell,
  palette,
  skin,
  cellSize,
  selected,
  peer,
  sameValue,
  conflict,
  borderStyle,
  onPress,
}: BoardCellProps) {
  const background = selected
    ? palette.selectedCell
    : sameValue
      ? (palette.sameValueHighlight ?? palette.peerHighlight)
      : peer
        ? palette.peerHighlight
        : palette.cellBackground;

  const color = conflict
    ? palette.conflictText
    : cell.given
      ? palette.givenText
      : palette.entryText;

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: cellSize,
          height: cellSize,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          borderRadius: skin.metrics.cellCornerRadius,
        },
        borderStyle,
      ]}>
      {cell.value !== 0 && (
        <Text
          style={{
            fontSize: cellSize * 0.55,
            fontFamily: skin.fonts.cellFontFamily,
            fontWeight: cell.given ? skin.fonts.givenWeight : skin.fonts.entryWeight,
            color,
          }}>
          {cell.value}
        </Text>
      )}
    </Pressable>
  );
}
