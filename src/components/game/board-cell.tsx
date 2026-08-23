import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { Cell, Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

const NOTE_DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** How far everything that is not the spotlit digit recedes. */
const SPOTLIGHT_DIM = 0.35;

interface BoardCellProps {
  cell: Cell;
  palette: SkinPalette;
  skin: BoardSkin;
  cellSize: number;
  selected: boolean;
  peer: boolean;
  sameValue: boolean;
  conflict: boolean;
  notesVisible: boolean;
  /** Digit to spotlight in values and notes, or null when spotlight is off. */
  spotlight: Digit | null;
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
  notesVisible,
  spotlight,
  borderStyle,
  onPress,
}: BoardCellProps) {
  const spotlit = spotlight !== null && cell.value === spotlight;
  // Only filled cells recede; an empty one has nothing but its notes to fade.
  const dimmed = spotlight !== null && cell.value !== 0 && !spotlit;

  const background = selected
    ? palette.selectedCell
    : spotlit
      ? (palette.spotlightCell ?? palette.sameValueHighlight ?? palette.peerHighlight)
      : sameValue
        ? (palette.sameValueHighlight ?? palette.peerHighlight)
        : peer
          ? palette.peerHighlight
          : palette.cellBackground;

  // Conflicts keep their red even under the spotlight — an error still matters
  // more than the highlight does.
  const color = conflict
    ? palette.conflictText
    : spotlit
      ? (palette.spotlightText ?? palette.entryText)
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
            fontSize: cellSize * (spotlit ? 0.62 : 0.55),
            fontFamily: skin.fonts.cellFontFamily,
            fontWeight: spotlit ? '800' : cell.given ? skin.fonts.givenWeight : skin.fonts.entryWeight,
            color,
            opacity: dimmed ? SPOTLIGHT_DIM : 1,
          }}>
          {cell.value}
        </Text>
      ) : (
        notesVisible &&
        cell.notes !== 0 && (
          <NotesGrid
            notes={cell.notes}
            palette={palette}
            skin={skin}
            cellSize={cellSize}
            spotlight={spotlight}
          />
        )
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
  spotlight,
}: {
  notes: number;
  palette: SkinPalette;
  skin: BoardSkin;
  cellSize: number;
  spotlight: Digit | null;
}) {
  const noteColor = palette.notesText ?? palette.mutedText ?? palette.gridLine;
  return (
    <View style={[StyleSheet.absoluteFill, styles.notes, { padding: cellSize * 0.06 }]}>
      {NOTE_DIGITS.map((digit) => {
        const spotlit = digit === spotlight;
        return (
          <Text
            key={digit}
            style={{
              width: '33.33%',
              height: '33.33%',
              textAlign: 'center',
              // Kept under the fixed line height so a spotlit mark grows without
              // nudging the other eight out of place.
              fontSize: cellSize * (spotlit ? 0.25 : 0.22),
              lineHeight: cellSize * 0.29,
              fontFamily: skin.fonts.cellFontFamily,
              fontWeight: spotlit ? '800' : undefined,
              color: spotlit ? (palette.spotlightText ?? palette.entryText) : noteColor,
              opacity: spotlight !== null && !spotlit ? SPOTLIGHT_DIM : 1,
            }}>
            {notes & (1 << (digit - 1)) ? digit : ' '}
          </Text>
        );
      })}
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
