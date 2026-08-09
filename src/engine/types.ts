export type Difficulty = "beginner" | "intermediate" | "expert";

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export type CellVisibility = "hidden" | "revealed" | "flagged";

export interface Cell {
  mine: boolean;
  /** Count of mines in the 8 surrounding cells. Meaningless (0) while `mine` is true. */
  adjacent: number;
  visibility: CellVisibility;
}

export type Board = Cell[][];

export type GameStatus = "pending" | "playing" | "won" | "lost";

export interface GameState {
  difficulty: Difficulty;
  rows: number;
  cols: number;
  mines: number;
  board: Board;
  status: GameStatus;
  flagsPlaced: number;
  revealedCount: number;
  startTime: number | null;
  endTime: number | null;
}
