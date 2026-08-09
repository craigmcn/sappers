import {
  cellKey,
  cloneBoard,
  createEmptyBoard,
  neighborCoords,
  placeMines,
} from "./board";
import {
  DIFFICULTY_CONFIGS,
  type Board,
  type Difficulty,
  type GameState,
} from "./types";

export function createGame(difficulty: Difficulty): GameState {
  const { rows, cols, mines } = DIFFICULTY_CONFIGS[difficulty];
  return {
    difficulty,
    rows,
    cols,
    mines,
    board: createEmptyBoard(rows, cols),
    status: "pending",
    flagsPlaced: 0,
    revealedCount: 0,
    startTime: null,
    endTime: null,
  };
}

function floodReveal(
  board: Board,
  row: number,
  col: number,
  rows: number,
  cols: number,
): void {
  const stack: [number, number][] = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const cell = board[r][c];
    if (cell.visibility === "revealed") continue;
    cell.visibility = "revealed";
    if (cell.adjacent === 0 && !cell.mine) {
      for (const [nr, nc] of neighborCoords(r, c, rows, cols)) {
        if (board[nr][nc].visibility === "hidden") stack.push([nr, nc]);
      }
    }
  }
}

function revealAllMines(board: Board): void {
  for (const row of board) {
    for (const cell of row) {
      if (cell.mine) cell.visibility = "revealed";
    }
  }
}

function countRevealed(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.visibility === "revealed") count++;
    }
  }
  return count;
}

/**
 * Reveals a single cell. On the very first reveal of a game, mines are
 * placed after the fact, excluding the clicked cell and its neighbors, so
 * the opening move is always safe and opens a cascade rather than a
 * coin-flip loss.
 */
export function reveal(state: GameState, row: number, col: number): GameState {
  if (state.status === "won" || state.status === "lost") return state;

  const existingCell = state.board[row][col];
  if (existingCell.visibility !== "hidden") return state;

  let board: Board;
  let status = state.status;
  let startTime = state.startTime;

  if (state.status === "pending") {
    const exclude = new Set<string>([cellKey(row, col)]);
    for (const [nr, nc] of neighborCoords(row, col, state.rows, state.cols)) {
      exclude.add(cellKey(nr, nc));
    }
    board = placeMines(
      createEmptyBoard(state.rows, state.cols),
      state.rows,
      state.cols,
      state.mines,
      exclude,
    );
    status = "playing";
    startTime = Date.now();
  } else {
    board = cloneBoard(state.board);
  }

  const cell = board[row][col];

  if (cell.mine) {
    revealAllMines(board);
    return { ...state, board, status: "lost", startTime, endTime: Date.now() };
  }

  floodReveal(board, row, col, state.rows, state.cols);

  const revealedCount = countRevealed(board);
  const totalSafeCells = state.rows * state.cols - state.mines;
  const won = revealedCount === totalSafeCells;

  return {
    ...state,
    board,
    status: won ? "won" : status,
    startTime,
    endTime: won ? Date.now() : state.endTime,
    revealedCount,
  };
}

export function toggleFlag(
  state: GameState,
  row: number,
  col: number,
): GameState {
  if (state.status === "won" || state.status === "lost") return state;

  const existingCell = state.board[row][col];
  if (existingCell.visibility === "revealed") return state;

  const board = cloneBoard(state.board);
  const cell = board[row][col];
  const wasFlagged = cell.visibility === "flagged";
  cell.visibility = wasFlagged ? "hidden" : "flagged";

  return {
    ...state,
    board,
    flagsPlaced: state.flagsPlaced + (wasFlagged ? -1 : 1),
  };
}

/**
 * Chording: clicking a revealed number whose adjacent flag count matches
 * its own value reveals all remaining unflagged neighbors at once.
 */
export function chord(state: GameState, row: number, col: number): GameState {
  if (state.status !== "playing") return state;

  const cell = state.board[row][col];
  if (cell.visibility !== "revealed" || cell.adjacent === 0) return state;

  const neighbors = neighborCoords(row, col, state.rows, state.cols);
  const flaggedCount = neighbors.filter(
    ([nr, nc]) => state.board[nr][nc].visibility === "flagged",
  ).length;
  if (flaggedCount !== cell.adjacent) return state;

  let next = state;
  for (const [nr, nc] of neighbors) {
    if (next.status === "lost" || next.status === "won") break;
    if (next.board[nr][nc].visibility === "hidden") {
      next = reveal(next, nr, nc);
    }
  }
  return next;
}

export function remainingMineCount(state: GameState): number {
  return state.mines - state.flagsPlaced;
}
