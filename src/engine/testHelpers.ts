import { neighborCoords } from "./board";
import type { Board, Cell, Difficulty, GameState } from "./types";

/**
 * Builds a fully-controlled GameState from an ASCII layout ('M' = mine,
 * anything else = safe), already in the 'playing' status with adjacency
 * counts computed — for tests that need a specific board shape rather than
 * one produced by random placement.
 */
export function buildManualState(layout: string[]): GameState {
  const rows = layout.length;
  const cols = layout[0].length;

  const board: Board = layout.map((line) =>
    line.split("").map((ch): Cell => ({
      mine: ch === "M",
      adjacent: 0,
      visibility: "hidden",
    })),
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (const [nr, nc] of neighborCoords(r, c, rows, cols)) {
        if (board[nr][nc].mine) count++;
      }
      board[r][c].adjacent = count;
    }
  }

  const mines = board.flat().filter((cell) => cell.mine).length;

  return {
    difficulty: "beginner" as Difficulty,
    rows,
    cols,
    mines,
    board,
    status: "playing",
    flagsPlaced: 0,
    revealedCount: 0,
    startTime: Date.now(),
    endTime: null,
  };
}
