import { fitBoardWithUnusedSize } from '../board-with-unused-layout';

describe('fitBoardWithUnusedSize', () => {
  it('uses the ordinary board constraints when every guide is hidden', () => {
    expect(
      fitBoardWithUnusedSize({
        availableWidth: 300,
        availableHeight: 250,
        maxBoardSize: 520,
        visibility: { row: false, col: false, box: false },
        boxPlacement: 'side',
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
      }),
    ).toBe(459);
  });

  it('reserves vertical room for the column strip and a bottom box guide', () => {
    expect(
      fitBoardWithUnusedSize({
        availableWidth: 390,
        availableHeight: 500,
        maxBoardSize: 520,
        visibility: { row: true, col: true, box: true },
        boxPlacement: 'bottom',
      }),
    ).toBe(335);
  });

  it('never returns a negative size before the window has usable dimensions', () => {
    expect(
      fitBoardWithUnusedSize({
        availableWidth: 0,
        availableHeight: 0,
        maxBoardSize: 520,
        visibility: { row: true, col: true, box: true },
        boxPlacement: 'bottom',
      }),
    ).toBe(0);
  });
});
