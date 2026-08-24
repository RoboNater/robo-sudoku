import { getBoardGeometry } from '../board-geometry';
import {
  fitBoardWithUnusedSize,
  getBoardWithUnusedGeometry,
} from '../board-with-unused-layout';

const NEWSPAPER_METRICS = {
  gridLineWidth: 1,
  boxLineWidth: 2,
  cellGap: 0,
};

describe('fitBoardWithUnusedSize', () => {
  it('uses the ordinary board constraints when every guide is hidden', () => {
    expect(
      fitBoardWithUnusedSize({
        availableWidth: 300,
        availableHeight: 250,
        maxBoardSize: 520,
        visibility: { row: false, col: false, box: false },
        boxPlacement: 'side',
        metrics: NEWSPAPER_METRICS,
      }),
    ).toBe(250);
  });

  it('reserves horizontal room for the row strip and a side box guide', () => {
    expect(
      fitBoardWithUnusedSize({
        availableWidth: 680,
        maxBoardSize: 520,
        visibility: { row: true, col: true, box: true },
        boxPlacement: 'side',
        metrics: NEWSPAPER_METRICS,
      }),
    ).toBe(336);
  });

  it('reserves vertical room for the column strip and a bottom box guide', () => {
    expect(
      fitBoardWithUnusedSize({
        availableWidth: 390,
        availableHeight: 500,
        maxBoardSize: 520,
        visibility: { row: true, col: true, box: true },
        boxPlacement: 'bottom',
        metrics: NEWSPAPER_METRICS,
      }),
    ).toBe(300);
  });

  it('never returns a negative size before the window has usable dimensions', () => {
    expect(
      fitBoardWithUnusedSize({
        availableWidth: 0,
        availableHeight: 0,
        maxBoardSize: 520,
        visibility: { row: true, col: true, box: true },
        boxPlacement: 'bottom',
        metrics: NEWSPAPER_METRICS,
      }),
    ).toBe(0);
  });
});

describe('shared board and guide geometry', () => {
  it('reconstructs the requested board size with high-contrast metrics', () => {
    const metrics = { gridLineWidth: 2, boxLineWidth: 5, cellGap: 0 };
    const { cellSize } = getBoardGeometry(459, metrics);

    expect(2 * metrics.boxLineWidth + 9 * cellSize + 8 * metrics.cellGap).toBeCloseTo(459);
  });

  it('uses the same cell size for the board, strips, and box map', () => {
    const frame = getBoardWithUnusedGeometry(
      459,
      { row: true, col: true, box: true },
      'side',
      NEWSPAPER_METRICS,
    );
    const board = getBoardGeometry(459, NEWSPAPER_METRICS);

    expect(frame.cellSize).toBe(board.cellSize);
    expect(frame.stripExtent).toBe(board.cellSize + 4);
    expect(frame.boxExtent).toBe(3 * board.cellSize + 4);
    expect(frame.width).toBe(459 + 2 * frame.sideGuideWidth);
  });
});
