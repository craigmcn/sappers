import type { GameState } from "../engine/types";
import { Cell } from "./Cell";
import "./Board.css";

interface BoardProps {
  game: GameState;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

export function Board({ game, onReveal, onFlag, onChord }: BoardProps) {
  const gameOver = game.status === "won" || game.status === "lost";

  return (
    <div
      className={`board${game.status === "lost" ? " board--lost" : ""}`}
      style={{
        gridTemplateColumns: `repeat(${game.cols}, 2rem)`,
        gridTemplateRows: `repeat(${game.rows}, 2rem)`,
      }}
      role="group"
      aria-label="Minefield"
    >
      {game.board.map((rowCells, row) =>
        rowCells.map((cell, col) => (
          <Cell
            key={`${row}-${col}`}
            cell={cell}
            row={row}
            col={col}
            gameOver={gameOver}
            onReveal={onReveal}
            onFlag={onFlag}
            onChord={onChord}
          />
        )),
      )}
    </div>
  );
}
