import { View, type ViewStyle } from 'react-native';

import { GRID_SIZE, colOf, boxOf, rowOf, type Board, type Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

import { BoardCell } from './board-cell';
import { getBoardGeometry, gridLineWidthAfter } from './board-geometry';

/** Widest a board ever gets, and the placeholder's cap before measurement. */
export const MAX_BOARD_SIZE = 520;

/** Keeps the pre-measurement placeholder from collapsing on very short viewports. */
const MIN_PLACEHOLDER_SIZE = 280;

interface BoardGridProps {
  board: Board;
  palette: SkinPalette;
  skin: BoardSkin;
  boardSize: number;
  selected: number | null;
  /** Conflicting cell indices; already empty when errors are hidden. */
  conflicts: Set<number>;
  /** Whether pencil notes are drawn; the caller decides this from notes mode + the setting. */
  notesVisible: boolean;
  /** Digit to spotlight in values and notes, or null when spotlight is off. */
  spotlight: Digit | null;
  onSelectCell: (index: number) => void;
}

export function BoardGrid({
  board,
  palette,
  skin,
  boardSize,
  selected,
  conflicts,
  notesVisible,
  spotlight,
  onSelectCell,
}: BoardGridProps) {
  const { boxLineWidth, cellGap, boardCornerRadius } = skin.metrics;

  // The statically rendered web HTML has no window to measure, so the caller's
  // size comes out empty. Hold the board's footprint with an empty frame instead
  // of painting a collapsed grid that jumps to full size on hydration.
  if (boardSize <= 0) {
    return (
      <View
        style={{
          alignSelf: 'center',
          width: '100%',
          maxWidth: MAX_BOARD_SIZE,
          aspectRatio: 1,
          minHeight: MIN_PLACEHOLDER_SIZE,
          backgroundColor: palette.boardBackground,
          borderWidth: boxLineWidth,
          borderColor: palette.boxLine,
          borderRadius: boardCornerRadius,
        }}
      />
    );
  }

  const { cellSize } = getBoardGeometry(boardSize, skin.metrics);

  const selectedRow = selected !== null ? rowOf(selected) : null;
  const selectedCol = selected !== null ? colOf(selected) : null;
  const selectedBox = selected !== null ? boxOf(selected) : null;
  const selectedValue = selected !== null ? board[selected].value : 0;

  const innerBorder = (edge: 'Right' | 'Bottom', line: number): ViewStyle => ({
    [`border${edge}Width`]: gridLineWidthAfter(line, skin.metrics),
    [`border${edge}Color`]: line % 3 === 2 ? palette.boxLine : palette.gridLine,
    [`margin${edge}`]: line === GRID_SIZE - 1 ? 0 : cellGap,
  });

  return (
    <View
      style={{
        alignSelf: 'center',
        width: boardSize,
        height: boardSize,
        backgroundColor: palette.boardBackground,
        borderWidth: boxLineWidth,
        borderColor: palette.boxLine,
        borderRadius: boardCornerRadius,
        overflow: 'hidden',
      }}>
      {Array.from({ length: GRID_SIZE }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: GRID_SIZE }, (_, col) => {
            const index = row * GRID_SIZE + col;
            const cell = board[index];
            const isSelected = selected === index;
            const peer =
              !isSelected &&
              (row === selectedRow || col === selectedCol || boxOf(index) === selectedBox);
            const sameValue =
              !isSelected && selectedValue !== 0 && cell.value === selectedValue;
            return (
              <BoardCell
                key={col}
                cell={cell}
                palette={palette}
                skin={skin}
                cellSize={cellSize}
                selected={isSelected}
                peer={peer}
                sameValue={sameValue}
                conflict={conflicts.has(index)}
                notesVisible={notesVisible}
                spotlight={spotlight}
                borderStyle={{
                  ...innerBorder('Right', col),
                  ...innerBorder('Bottom', row),
                }}
                onPress={() => onSelectCell(index)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
