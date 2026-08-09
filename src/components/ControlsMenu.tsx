import { useEffect, useRef, useState } from "react";
import type { Difficulty } from "../engine/types";
import type { DifficultySummary } from "../stats/statsStore";
import { DifficultySelector } from "./DifficultySelector";
import "./ControlsMenu.css";

interface ControlsMenuProps {
  difficulty: Difficulty;
  summary: DifficultySummary | null;
  onNewGame: () => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
}

function formatBestTime(ms: number | null): string {
  if (ms === null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ControlsMenu({
  difficulty,
  summary,
  onNewGame,
  onChangeDifficulty,
}: ControlsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleNewGame = () => {
    onNewGame();
    setOpen(false);
  };

  const handleChangeDifficulty = (next: Difficulty) => {
    onChangeDifficulty(next);
    setOpen(false);
  };

  return (
    <div className="controls-menu" ref={menuRef}>
      <button
        type="button"
        className="controls-menu__toggle"
        aria-expanded={open}
        aria-controls="controls-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="controls-menu__toggle-icon" aria-hidden="true" />
        Menu
      </button>

      <div
        id="controls-menu-panel"
        className={`controls-menu__panel${open ? " controls-menu__panel--open" : ""}`}
      >
        <button
          type="button"
          className="controls-menu__new-game"
          onClick={handleNewGame}
        >
          New Field
        </button>
        <DifficultySelector
          difficulty={difficulty}
          onChange={handleChangeDifficulty}
        />
        {summary && (
          <p className="controls-menu__summary">
            Best {formatBestTime(summary.bestTimeMs)} · Streak{" "}
            {summary.currentStreak} · {summary.won}/{summary.played} cleared
          </p>
        )}
      </div>
    </div>
  );
}
