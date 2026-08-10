import { useState } from "react";
import type { GameState } from "../engine/types";
import { Cell } from "./Cell";
import "./Board.css";

interface BoardProps {
  game: GameState;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

const ARROW_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
]);

export function Board({ game, onReveal, onFlag, onChord }: BoardProps) {
  const gameOver = game.status === "won" || game.status === "lost";
  const [dims, setDims] = useState({ rows: game.rows, cols: game.cols });
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });

  if (dims.rows !== game.rows || dims.cols !== game.cols) {
    setDims({ rows: game.rows, cols: game.cols });
    setFocusedCell({ row: 0, col: 0 });
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!ARROW_KEYS.has(event.key)) return;
    const target = event.target as HTMLElement;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return;

    let nextRow = row;
    let nextCol = col;
    switch (event.key) {
      case "ArrowUp":
        nextRow = Math.max(0, row - 1);
        break;
      case "ArrowDown":
        nextRow = Math.min(game.rows - 1, row + 1);
        break;
      case "ArrowLeft":
        nextCol = Math.max(0, col - 1);
        break;
      case "ArrowRight":
        nextCol = Math.min(game.cols - 1, col + 1);
        break;
      case "Home":
        nextCol = 0;
        break;
      case "End":
        nextCol = game.cols - 1;
        break;
    }
    if (nextRow === row && nextCol === col) return;

    event.preventDefault();
    const nextCell = event.currentTarget.querySelector<HTMLButtonElement>(
      `[data-row="${nextRow}"][data-col="${nextCol}"]`,
    );
    nextCell?.focus();
  };

  return (
    <div
      className={`board${game.status === "lost" ? " board--lost" : ""}`}
      style={
        {
          "--cols": game.cols,
          gridTemplateColumns: `repeat(${game.cols}, var(--cell-size))`,
          gridTemplateRows: `repeat(${game.rows}, var(--cell-size))`,
        } as React.CSSProperties
      }
      role="grid"
      aria-label="Minefield"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {game.board.map((rowCells, row) => (
        <div role="row" key={row} style={{ display: "contents" }}>
          {rowCells.map((cell, col) => (
            <Cell
              key={`${row}-${col}`}
              cell={cell}
              row={row}
              col={col}
              gameOver={gameOver}
              tabIndex={
                focusedCell.row === row && focusedCell.col === col ? 0 : -1
              }
              onReveal={onReveal}
              onFlag={onFlag}
              onChord={onChord}
              onCellFocus={(r, c) => setFocusedCell({ row: r, col: c })}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
