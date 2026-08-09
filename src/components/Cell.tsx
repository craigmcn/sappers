import { useRef } from "react";
import type { Cell as CellData } from "../engine/types";
import "./Cell.css";

const LONG_PRESS_MS = 450;

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  gameOver: boolean;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

export function Cell({
  cell,
  row,
  col,
  gameOver,
  onReveal,
  onFlag,
  onChord,
}: CellProps) {
  const longPressFired = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLongPressTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== "touch" || gameOver) return;
    longPressFired.current = false;
    timerRef.current = setTimeout(() => {
      longPressFired.current = true;
      onFlag(row, col);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => clearLongPressTimer();
  const handlePointerLeave = () => clearLongPressTimer();

  const handleClick = () => {
    if (gameOver) return;
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (cell.visibility === "revealed") {
      onChord(row, col);
    } else if (cell.visibility === "hidden") {
      onReveal(row, col);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (gameOver || cell.visibility === "revealed") return;
    onFlag(row, col);
  };

  const label =
    cell.visibility === "flagged"
      ? `Flagged cell, row ${row + 1}, column ${col + 1}`
      : cell.visibility === "revealed"
        ? cell.mine
          ? `Mine, row ${row + 1}, column ${col + 1}`
          : cell.adjacent > 0
            ? `${cell.adjacent} adjacent mines, row ${row + 1}, column ${col + 1}`
            : `Empty, row ${row + 1}, column ${col + 1}`
        : `Hidden cell, row ${row + 1}, column ${col + 1}`;

  return (
    <button
      type="button"
      className={`cell cell--${cell.visibility}${cell.mine && cell.visibility === "revealed" ? " cell--mine" : ""}`}
      data-row={row}
      data-col={col}
      aria-label={label}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {cell.visibility === "flagged" && (
        <span className="cell__flag" aria-hidden="true" />
      )}
      {cell.visibility === "revealed" && cell.mine && (
        <span className="cell__mine" aria-hidden="true" />
      )}
      {cell.visibility === "revealed" && !cell.mine && cell.adjacent > 0 && (
        <span className={`cell__number cell__number--${cell.adjacent}`}>
          {cell.adjacent}
        </span>
      )}
    </button>
  );
}
