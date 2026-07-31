import { View, type ViewStyle } from 'react-native';

import { GRID_SIZE, colOf, boxOf, rowOf, type Board } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

import { BoardCell } from './board-cell';

interface BoardGridProps {
  board: Board;
  palette: SkinPalette;
  skin: BoardSkin;
  boardSize: number;
  selected: number | null;
  /** Conflicting cell indices; already empty when errors are hidden. */
  conflicts: Set<number>;
  onSelectCell: (index: number) => void;
}

export function BoardGrid({
  board,
  palette,
  skin,
  boardSize,
  selected,
  conflicts,
  onSelectCell,
}: BoardGridProps) {
  const { gridLineWidth, boxLineWidth, cellGap, boardCornerRadius } = skin.metrics;
  const cellSize = Math.floor(
    (boardSize - 2 * boxLineWidth - 8 * gridLineWidth - 8 * cellGap) / GRID_SIZE,
  );

  const selectedRow = selected !== null ? rowOf(selected) : null;
  const selectedCol = selected !== null ? colOf(selected) : null;
  const selectedBox = selected !== null ? boxOf(selected) : null;
  const selectedValue = selected !== null ? board[selected].value : 0;

  const innerBorder = (edge: 'Right' | 'Bottom', line: number): ViewStyle => ({
    [`border${edge}Width`]: line === GRID_SIZE - 1 ? 0 : line % 3 === 2 ? boxLineWidth : gridLineWidth,
    [`border${edge}Color`]: line % 3 === 2 ? palette.boxLine : palette.gridLine,
    [`margin${edge}`]: line === GRID_SIZE - 1 ? 0 : cellGap,
  });

  return (
    <View
      style={{
        alignSelf: 'center',
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
