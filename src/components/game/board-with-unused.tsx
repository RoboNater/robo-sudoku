import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { getUnusedDigitsByUnit } from '@/engine/rules';
import { GRID_SIZE, type Board, type Digit } from '@/engine/types';
import type { BoardSkin, SkinPalette } from '@/skins/types';

import { NotesGrid } from './board-cell';
import { BoardGrid } from './board-grid';
import {
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

  const tileSize = Math.floor(boardSize / GRID_SIZE);
  const boxGuide = unusedNumbers.box ? (
    <GuideGrid
      masks={unused.box}
      unit="box"
      tileSize={tileSize}
      palette={palette}
      skin={skin}
      spotlight={spotlight}
    />
  ) : null;

  return (
    <View style={styles.guideFrame}>
      {unusedNumbers.col && (
        <GuideStrip
          masks={unused.col}
          unit="column"
          tileSize={tileSize}
          palette={palette}
          skin={skin}
          spotlight={spotlight}
        />
      )}

      <View style={styles.boardRow}>
        {playableBoard}
        {unusedNumbers.row && (
          <GuideStrip
            masks={unused.row}
            unit="row"
            vertical
            tileSize={tileSize}
            palette={palette}
            skin={skin}
            spotlight={spotlight}
          />
        )}
        {boxPlacement === 'side' && boxGuide}
      </View>

      {boxPlacement === 'bottom' && (
        <View style={[styles.bottomBoxGuide, { width: boardSize }]}>{boxGuide}</View>
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
  vertical = false,
}: GuideProps & { vertical?: boolean }) {
  return (
    <View
      accessibilityLabel={`Unused numbers by ${unit}`}
      style={[styles.strip, vertical && styles.verticalStrip]}>
      {masks.map((mask, index) => (
        <GuideTile
          key={index}
          mask={mask}
          label={`${unit} ${index + 1}`}
          tileSize={tileSize}
          palette={palette}
          skin={skin}
          spotlight={spotlight}
        />
      ))}
    </View>
  );
}

function GuideGrid({ masks, unit, tileSize, palette, skin, spotlight }: GuideProps) {
  return (
    <View
      accessibilityLabel="Unused numbers by box"
      style={[styles.boxGrid, { width: tileSize * 3 }]}>
      {masks.map((mask, index) => (
        <GuideTile
          key={index}
          mask={mask}
          label={`${unit} ${index + 1}`}
          tileSize={tileSize}
          palette={palette}
          skin={skin}
          spotlight={spotlight}
        />
      ))}
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
}: {
  mask: number;
  label: string;
  tileSize: number;
  palette: SkinPalette;
  skin: BoardSkin;
  spotlight: Digit | null;
}) {
  const digits = Array.from({ length: GRID_SIZE }, (_, index) => index + 1)
    .filter((digit) => mask & (1 << (digit - 1)))
    .join(', ');

  return (
    <View
      accessible
      accessibilityLabel={`${label} unused digits: ${digits || 'none'}`}
      style={{
        width: tileSize,
        height: tileSize,
        backgroundColor: palette.cellBackground,
        borderColor: palette.gridLine,
        borderWidth: Math.max(1, skin.metrics.gridLineWidth),
        borderRadius: skin.metrics.cellCornerRadius,
      }}>
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
    gap: UNUSED_GUIDE_GAP,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: UNUSED_GUIDE_GAP,
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
