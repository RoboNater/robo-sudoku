import { GRID_SIZE } from '@/engine/types';

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
}

/** Fits the 9×9 board plus any one-cell strips and the 3×3 box guide. */
export function fitBoardWithUnusedSize({
  availableWidth,
  availableHeight = Number.POSITIVE_INFINITY,
  maxBoardSize,
  visibility,
  boxPlacement,
}: FitBoardSizeOptions): number {
  const sideBox = visibility.box && boxPlacement === 'side';
  const bottomBox = visibility.box && boxPlacement === 'bottom';
  const horizontalGuides = Number(visibility.row) + Number(sideBox);
  const verticalGuides = Number(visibility.col) + Number(bottomBox);
  const widthScale = 1 + Number(visibility.row) / GRID_SIZE + Number(sideBox) / 3;
  const heightScale = 1 + Number(visibility.col) / GRID_SIZE + Number(bottomBox) / 3;
  const widthFit = (availableWidth - horizontalGuides * UNUSED_GUIDE_GAP) / widthScale;
  const heightFit = (availableHeight - verticalGuides * UNUSED_GUIDE_GAP) / heightScale;

  return Math.max(0, Math.floor(Math.min(maxBoardSize, widthFit, heightFit)));
}
