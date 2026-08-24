import { getBoardGeometry, type BoardMetrics } from './board-geometry';

export interface UnusedNumberVisibility {
  row: boolean;
  col: boolean;
  box: boolean;
}

export type BoxGuidePlacement = 'side' | 'bottom';

/** Side placement becomes useful without making the puzzle too small. */
export const BOX_GUIDE_SIDE_MIN_WIDTH = 680;
export const UNUSED_GUIDE_GAP = 8;

interface FitBoardSizeOptions {
  availableWidth: number;
  availableHeight?: number;
  maxBoardSize: number;
  visibility: UnusedNumberVisibility;
  boxPlacement: BoxGuidePlacement;
  metrics: BoardMetrics;
}

export interface BoardWithUnusedGeometry {
  width: number;
  height: number;
  cellSize: number;
  stripExtent: number;
  boxExtent: number;
  sideGuideWidth: number;
}

/** Exact outer dimensions, including a left spacer that keeps the board centred. */
export function getBoardWithUnusedGeometry(
  boardSize: number,
  visibility: UnusedNumberVisibility,
  boxPlacement: BoxGuidePlacement,
  metrics: BoardMetrics,
): BoardWithUnusedGeometry {
  const { cellSize } = getBoardGeometry(boardSize, metrics);
  const stripExtent = cellSize + 2 * metrics.boxLineWidth;
  const boxExtent = 3 * cellSize + 2 * metrics.cellGap + 2 * metrics.boxLineWidth;
  const sideBox = visibility.box && boxPlacement === 'side';
  const bottomBox = visibility.box && boxPlacement === 'bottom';
  const sideGuideWidth =
    (visibility.row ? UNUSED_GUIDE_GAP + stripExtent : 0) +
    (sideBox ? UNUSED_GUIDE_GAP + boxExtent : 0);
  const topGuideHeight = visibility.col ? UNUSED_GUIDE_GAP + stripExtent : 0;
  const bottomGuideHeight = bottomBox ? UNUSED_GUIDE_GAP + boxExtent : 0;

  return {
    width: boardSize + 2 * sideGuideWidth,
    height: boardSize + topGuideHeight + bottomGuideHeight,
    cellSize,
    stripExtent,
    boxExtent,
    sideGuideWidth,
  };
}

/** Fits the centred board-and-guide frame within the supplied dimensions. */
export function fitBoardWithUnusedSize({
  availableWidth,
  availableHeight = Number.POSITIVE_INFINITY,
  maxBoardSize,
  visibility,
  boxPlacement,
  metrics,
}: FitBoardSizeOptions): number {
  let low = 0;
  let high = Math.max(0, Math.floor(maxBoardSize));

  while (low < high) {
    const candidate = Math.ceil((low + high) / 2);
    const frame = getBoardWithUnusedGeometry(candidate, visibility, boxPlacement, metrics);
    if (frame.width <= availableWidth && frame.height <= availableHeight) {
      low = candidate;
    } else {
      high = candidate - 1;
    }
  }

  return low;
}
