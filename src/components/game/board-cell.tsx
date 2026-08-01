import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { Cell, Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

const NOTE_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
      {cell.value !== 0 ? (
        <Text
          style={{
            fontSize: cellSize * 0.55,
            fontFamily: skin.fonts.cellFontFamily,
            fontWeight: cell.given ? skin.fonts.givenWeight : skin.fonts.entryWeight,
            color,
          }}>
          {cell.value}
        </Text>
      ) : (
        cell.notes !== 0 && <NotesGrid notes={cell.notes} palette={palette} skin={skin} cellSize={cellSize} />
      )}
    </Pressable>
  );
}

/**
 * Pencil marks as a 3x3 mini-grid, digit `d` always at row `(d-1)/3`, column
 * `(d-1)%3` — unset digits leave an equally sized blank so every mark keeps its
 * place. Absolutely positioned because the cell itself is a centering flex box.
 */
function NotesGrid({
  notes,
  palette,
  skin,
  cellSize,
}: {
  notes: number;
  palette: SkinPalette;
  skin: BoardSkin;
  cellSize: number;
}) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.notes, { padding: cellSize * 0.06 }]}>
      {NOTE_DIGITS.map((digit) => (
        <Text
          key={digit}
          style={{
            width: '33.33%',
            height: '33.33%',
            textAlign: 'center',
            fontSize: cellSize * 0.22,
            lineHeight: cellSize * 0.29,
            fontFamily: skin.fonts.cellFontFamily,
            color: palette.notesText ?? palette.mutedText ?? palette.gridLine,
          }}>
          {notes & (1 << (digit - 1)) ? digit : ' '}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  notes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
