import { GRID_SIZE } from '@/engine/types';

export interface BoardMetrics {
  gridLineWidth: number;
  boxLineWidth: number;
  cellGap: number;
}

export interface BoardGeometry {
  boardSize: number;
  cellSize: number;
}

/**
 * The outer box border and eight cell gaps consume layout space. Interior
 * borders are drawn inside each cell's dimensions on React Native and web.
 */
export function getBoardGeometry(boardSize: number, metrics: BoardMetrics): BoardGeometry {
  const fixedSize = 2 * metrics.boxLineWidth + (GRID_SIZE - 1) * metrics.cellGap;
  return {
    boardSize,
    cellSize: Math.max(0, (boardSize - fixedSize) / GRID_SIZE),
  };
}

/** Border after a cell in a full nine-cell board row or column. */
export function gridLineWidthAfter(index: number, metrics: BoardMetrics): number {
  if (index === GRID_SIZE - 1) return 0;
  return index % 3 === 2 ? metrics.boxLineWidth : metrics.gridLineWidth;
}
