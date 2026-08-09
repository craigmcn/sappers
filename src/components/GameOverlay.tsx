import { useRef } from "react";
import type { GameStatus } from "../engine/types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import "./GameOverlay.css";

interface GameOverlayProps {
  status: GameStatus;
  elapsedSeconds: number;
  onPlayAgain: () => void;
}

export function GameOverlay({
  status,
  elapsedSeconds,
  onPlayAgain,
}: GameOverlayProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isOver = status === "won" || status === "lost";
  useFocusTrap(cardRef, isOver);

  if (!isOver) return null;

  return (
    <div className={`game-overlay game-overlay--${status}`}>
      <div
        ref={cardRef}
        className="game-overlay__card"
        role="alertdialog"
        aria-modal="true"
        aria-label={
          status === "won" ? "Field cleared" : "Detonation — mine field lost"
        }
        tabIndex={-1}
      >
        <p className="game-overlay__message">
          {status === "won"
            ? `Field cleared in ${elapsedSeconds}s`
            : "Detonation — mine field lost"}
        </p>
        <button
          type="button"
          className="game-overlay__button"
          onClick={onPlayAgain}
        >
          Play again
        </button>
      </div>
    </div>
  );
}
