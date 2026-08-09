import type { Difficulty } from "../engine/types";
import { DIFFICULTY_CONFIGS } from "../engine/types";
import "./DifficultySelector.css";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const LABELS: Record<Difficulty, string> = {
  beginner: "Recruit",
  intermediate: "Sapper",
  expert: "Demolitions",
};

const ORDER: Difficulty[] = ["beginner", "intermediate", "expert"];

export function DifficultySelector({
  difficulty,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div
      className="difficulty-selector"
      role="radiogroup"
      aria-label="Clearance level"
    >
      {ORDER.map((level) => {
        const config = DIFFICULTY_CONFIGS[level];
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={difficulty === level}
            className={`difficulty-selector__option${difficulty === level ? " difficulty-selector__option--active" : ""}`}
            onClick={() => onChange(level)}
          >
            <span className="difficulty-selector__name">{LABELS[level]}</span>
            <span className="difficulty-selector__meta">
              {config.rows}×{config.cols} · {config.mines} mines
            </span>
          </button>
        );
      })}
    </div>
  );
}
