import type { GameStatus } from "../engine/types";
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
  if (status !== "won" && status !== "lost") return null;

  return (
    <div className={`game-overlay game-overlay--${status}`} role="status">
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
  );
}
