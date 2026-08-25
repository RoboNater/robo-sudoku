import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { getUnusedDigitsByUnit } from '@/engine/rules';
import { GRID_SIZE, type Board, type Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

import { NotesGrid } from './board-cell';
import { gridLineWidthAfter } from './board-geometry';
import { BoardGrid } from './board-grid';
import {
  getBoardWithUnusedGeometry,
  UNUSED_GUIDE_GAP,
  type BoxGuidePlacement,
  type UnusedNumberVisibility,
} from './board-with-unused-layout';

interface BoardWithUnusedProps {
  board: Board;
  palette: SkinPalette;
  skin: BoardSkin;
  boardSize: number;
  selected: number | null;
  conflicts: Set<number>;
  notesVisible: boolean;
  spotlight: Digit | null;
  unusedNumbers: UnusedNumberVisibility;
  boxPlacement: BoxGuidePlacement;
  onSelectCell: (index: number) => void;
}

/**
 * The regular playable board surrounded by read-only, notes-style unit guides:
 * columns above, rows to the right, and boxes in their own 3×3 map.
 */
export function BoardWithUnused({
  board,
  palette,
  skin,
  boardSize,
  selected,
  conflicts,
  notesVisible,
  spotlight,
  unusedNumbers,
  boxPlacement,
  onSelectCell,
}: BoardWithUnusedProps) {
  const unused = useMemo(() => getUnusedDigitsByUnit(board), [board]);

  const playableBoard = (
    <BoardGrid
      board={board}
      palette={palette}
      skin={skin}
      boardSize={boardSize}
      selected={selected}
      conflicts={conflicts}
      notesVisible={notesVisible}
      spotlight={spotlight}
      onSelectCell={onSelectCell}
    />
  );

  if (
    boardSize <= 0 ||
    (!unusedNumbers.row && !unusedNumbers.col && !unusedNumbers.box)
  ) {
    return playableBoard;
  }

  const geometry = getBoardWithUnusedGeometry(
    boardSize,
    unusedNumbers,
    boxPlacement,
    skin.metrics,
  );
  const { cellSize, stripExtent, boxExtent, sideGuideWidth } = geometry;
  const boxGuide = unusedNumbers.box ? (
    <GuideGrid
      masks={unused.box}
      unit="box"
      tileSize={cellSize}
      guideSize={boxExtent}
      palette={palette}
      skin={skin}
      spotlight={spotlight}
    />
  ) : null;

  return (
    <View style={[styles.guideFrame, { width: geometry.width }]}>
      {unusedNumbers.col && (
        <View style={{ marginLeft: sideGuideWidth }}>
          <GuideStrip
            masks={unused.col}
            unit="column"
            tileSize={cellSize}
            guideLength={boardSize}
            guideThickness={stripExtent}
            palette={palette}
            skin={skin}
            spotlight={spotlight}
          />
        </View>
      )}

      <View
        style={[
          styles.boardRow,
          unusedNumbers.col && { marginTop: UNUSED_GUIDE_GAP },
        ]}>
        {sideGuideWidth > 0 && <View style={{ width: sideGuideWidth }} />}
        {playableBoard}
        {unusedNumbers.row && (
          <View style={{ marginLeft: UNUSED_GUIDE_GAP }}>
            <GuideStrip
              masks={unused.row}
              unit="row"
              vertical
              tileSize={cellSize}
              guideLength={boardSize}
              guideThickness={stripExtent}
              palette={palette}
              skin={skin}
              spotlight={spotlight}
            />
          </View>
        )}
        {boxPlacement === 'side' && boxGuide && (
          <View style={{ marginLeft: UNUSED_GUIDE_GAP }}>{boxGuide}</View>
        )}
      </View>

      {boxPlacement === 'bottom' && (
        <View
          style={[
            styles.bottomBoxGuide,
            {
              width: boardSize,
              marginLeft: sideGuideWidth,
              marginTop: UNUSED_GUIDE_GAP,
            },
          ]}>
          {boxGuide}
        </View>
      )}
    </View>
  );
}

interface GuideProps {
  masks: number[];
  unit: 'row' | 'column' | 'box';
  tileSize: number;
  palette: SkinPalette;
  skin: BoardSkin;
  spotlight: Digit | null;
}

function GuideStrip({
  masks,
  unit,
  tileSize,
  palette,
  skin,
  spotlight,
  guideLength,
  guideThickness,
  vertical = false,
}: GuideProps & {
  guideLength: number;
  guideThickness: number;
  vertical?: boolean;
}) {
  const borderStyle = {
    width: vertical ? guideThickness : guideLength,
    height: vertical ? guideLength : guideThickness,
    backgroundColor: palette.boardBackground,
    borderColor: palette.boxLine,
    borderWidth: skin.metrics.boxLineWidth,
    borderRadius: skin.metrics.boardCornerRadius,
  };

  return (
    <View
      style={[styles.strip, vertical && styles.verticalStrip, borderStyle]}>
      {masks.map((mask, index) => (
        <GuideTile
          key={index}
          mask={mask}
          label={`${unit} ${index + 1}`}
          tileSize={tileSize}
          palette={palette}
          skin={skin}
          spotlight={spotlight}
          borderStyle={
            vertical
              ? {
                  borderBottomColor:
                    index % 3 === 2 ? palette.boxLine : palette.gridLine,
                  borderBottomWidth: gridLineWidthAfter(index, skin.metrics),
                  marginBottom: index === GRID_SIZE - 1 ? 0 : skin.metrics.cellGap,
                }
              : {
                  borderRightColor:
                    index % 3 === 2 ? palette.boxLine : palette.gridLine,
                  borderRightWidth: gridLineWidthAfter(index, skin.metrics),
                  marginRight: index === GRID_SIZE - 1 ? 0 : skin.metrics.cellGap,
                }
          }
        />
      ))}
    </View>
  );
}

function GuideGrid({
  masks,
  unit,
  tileSize,
  guideSize,
  palette,
  skin,
  spotlight,
}: GuideProps & { guideSize: number }) {
  return (
    <View
      style={[
        styles.boxGrid,
        {
          width: guideSize,
          height: guideSize,
          backgroundColor: palette.boardBackground,
          borderColor: palette.boxLine,
          borderWidth: skin.metrics.boxLineWidth,
          borderRadius: skin.metrics.boardCornerRadius,
        },
      ]}>
      {masks.map((mask, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        return (
          <GuideTile
            key={index}
            mask={mask}
            label={`${unit} ${index + 1}`}
            tileSize={tileSize}
            palette={palette}
            skin={skin}
            spotlight={spotlight}
            borderStyle={{
              borderRightColor: palette.gridLine,
              borderRightWidth: col === 2 ? 0 : skin.metrics.gridLineWidth,
              borderBottomColor: palette.gridLine,
              borderBottomWidth: row === 2 ? 0 : skin.metrics.gridLineWidth,
              marginRight: col === 2 ? 0 : skin.metrics.cellGap,
              marginBottom: row === 2 ? 0 : skin.metrics.cellGap,
            }}
          />
        );
      })}
    </View>
  );
}

function GuideTile({
  mask,
  label,
  tileSize,
  palette,
  skin,
  spotlight,
  borderStyle,
}: {
  mask: number;
  label: string;
  tileSize: number;
  palette: SkinPalette;
  skin: BoardSkin;
  spotlight: Digit | null;
  borderStyle: ViewStyle;
}) {
  const digits = Array.from({ length: GRID_SIZE }, (_, index) => index + 1)
    .filter((digit) => mask & (1 << (digit - 1)))
    .join(', ');

  return (
    <View
      accessible
      accessibilityLabel={`${label} unused digits: ${digits || 'none'}`}
      style={[
        {
          width: tileSize,
          height: tileSize,
          backgroundColor: palette.cellBackground,
          borderRadius: skin.metrics.cellCornerRadius,
        },
        borderStyle,
      ]}>
      {mask !== 0 && (
        <NotesGrid
          notes={mask}
          palette={palette}
          skin={skin}
          cellSize={tileSize}
          spotlight={spotlight}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  guideFrame: {
    alignItems: 'flex-start',
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  strip: {
    flexDirection: 'row',
  },
  verticalStrip: {
    flexDirection: 'column',
  },
  boxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bottomBoxGuide: {
    alignItems: 'center',
  },
});
