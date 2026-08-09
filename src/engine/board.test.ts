import { describe, expect, it } from "vitest";
import { cellKey, createEmptyBoard, neighborCoords, placeMines } from "./board";

describe("createEmptyBoard", () => {
  it("creates a rows x cols grid of hidden, mine-free cells", () => {
    const board = createEmptyBoard(3, 4);
    expect(board).toHaveLength(3);
    expect(board[0]).toHaveLength(4);
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toEqual({
          mine: false,
          adjacent: 0,
          visibility: "hidden",
        });
      }
    }
  });
});

describe("neighborCoords", () => {
  it("returns 8 neighbors for an interior cell", () => {
    expect(neighborCoords(1, 1, 3, 3)).toHaveLength(8);
  });

  it("clips out-of-bounds neighbors for a corner cell", () => {
    const coords = neighborCoords(0, 0, 3, 3);
    expect(coords).toHaveLength(3);
    expect(coords).toEqual(
      expect.arrayContaining([
        [0, 1],
        [1, 0],
        [1, 1],
      ]),
    );
  });

  it("clips out-of-bounds neighbors for an edge cell", () => {
    expect(neighborCoords(0, 1, 3, 3)).toHaveLength(5);
  });
});

describe("placeMines", () => {
  it("places exactly mineCount mines, none in the excluded set", () => {
    const rows = 5;
    const cols = 5;
    const board = createEmptyBoard(rows, cols);
    const exclude = new Set([cellKey(2, 2), cellKey(2, 3), cellKey(1, 2)]);

    placeMines(board, rows, cols, 5, exclude, () => 0.5);

    let mineCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].mine) {
          mineCount++;
          expect(exclude.has(cellKey(r, c))).toBe(false);
        }
      }
    }
    expect(mineCount).toBe(5);
  });

  it("caps placed mines at the number of available (non-excluded) cells", () => {
    const rows = 2;
    const cols = 2;
    const board = createEmptyBoard(rows, cols);
    const exclude = new Set([cellKey(0, 0)]);

    placeMines(board, rows, cols, 10, exclude, () => 0.5);

    const mineCount = board.flat().filter((cell) => cell.mine).length;
    expect(mineCount).toBe(3);
  });

  it("computes correct adjacent-mine counts", () => {
    const rows = 3;
    const cols = 3;
    const board = createEmptyBoard(rows, cols);
    board[0][0].mine = true;
    board[0][1].mine = true;

    placeMines(board, rows, cols, 0, new Set(), () => 0.5);

    expect(board[0][2].adjacent).toBe(1);
    expect(board[1][0].adjacent).toBe(2);
    expect(board[1][1].adjacent).toBe(2);
    expect(board[2][2].adjacent).toBe(0);
  });
});
