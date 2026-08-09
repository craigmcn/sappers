import type { GameStatus } from "../engine/types";
import type { DifficultySummary } from "../stats/statsStore";
import "./Header.css";

interface HeaderProps {
  minesRemaining: number;
  elapsedSeconds: number;
  status: GameStatus;
  summary: DifficultySummary | null;
  onNewGame: () => void;
}

function formatCounter(value: number): string {
  const clamped = Math.max(-99, Math.min(999, value));
  const sign = clamped < 0 ? "-" : "";
  const digits = Math.abs(clamped)
    .toString()
    .padStart(clamped < 0 ? 2 : 3, "0");
  return `${sign}${digits}`;
}

function formatTime(seconds: number): string {
  return Math.min(999, seconds).toString().padStart(3, "0");
}

function formatBestTime(ms: number | null): string {
  if (ms === null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const STATUS_LABEL: Record<GameStatus, string> = {
  pending: "Ready",
  playing: "Clearing",
  won: "Field cleared",
  lost: "Detonated",
};

export function Header({
  minesRemaining,
  elapsedSeconds,
  status,
  summary,
  onNewGame,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header__row">
        <div className="header__readout" aria-label="Mines remaining">
          <span className="header__readout-label">Mines</span>
          <span className="header__readout-value">
            {formatCounter(minesRemaining)}
          </span>
        </div>

        <div className="header__title">
          <h1>Sappers</h1>
          <p className={`header__status header__status--${status}`}>
            {STATUS_LABEL[status]}
          </p>
        </div>

        <div className="header__readout" aria-label="Elapsed time in seconds">
          <span className="header__readout-label">Time</span>
          <span className="header__readout-value">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      <div className="header__row header__row--controls">
        <button type="button" className="header__new-game" onClick={onNewGame}>
          New Field
        </button>
        {summary && (
          <p className="header__summary">
            Best {formatBestTime(summary.bestTimeMs)} · Streak{" "}
            {summary.currentStreak} · {summary.won}/{summary.played} cleared
          </p>
        )}
      </div>
    </header>
  );
}
