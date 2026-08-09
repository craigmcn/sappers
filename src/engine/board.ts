import type { Board, Cell } from "./types";

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function neighborCoords(
  row: number,
  col: number,
  rows: number,
  cols: number,
): [number, number][] {
  const coords: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        coords.push([nr, nc]);
      }
    }
  }
  return coords;
}

export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({
      mine: false,
      adjacent: 0,
      visibility: "hidden",
    })),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * Places `mineCount` mines randomly across the board, skipping any cell in
 * `exclude` (the first-clicked cell and its neighbors), then computes each
 * cell's adjacent-mine count. Mutates and returns `board`.
 */
export function placeMines(
  board: Board,
  rows: number,
  cols: number,
  mineCount: number,
  exclude: Set<string>,
  rng: () => number = Math.random,
): Board {
  const candidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!exclude.has(cellKey(r, c))) candidates.push([r, c]);
    }
  }

  const placeable = Math.min(mineCount, candidates.length);
  for (let i = 0; i < placeable; i++) {
    const swapIndex = i + Math.floor(rng() * (candidates.length - i));
    [candidates[i], candidates[swapIndex]] = [
      candidates[swapIndex],
      candidates[i],
    ];
    const [r, c] = candidates[i];
    board[r][c].mine = true;
  }

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

  return board;
}
