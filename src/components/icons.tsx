// Original artwork for Sappers — not derived from any third-party icon set.

const MINE_SPIKE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="30" y="14" width="6" height="72" rx="1" fill="currentColor" />
      <path d="M36 18 L82 34 L36 50 Z" fill="currentColor" opacity=".4" />
      <path
        d="M36 18 L82 34 L36 50 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="currentColor">
        {MINE_SPIKE_ANGLES.map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 54)`}>
            <rect x="47" y="20" width="6" height="14" rx="1" />
            <circle cx="50" cy="20" r="2.2" />
          </g>
        ))}
        <circle cx="50" cy="54" r="19" opacity=".4" />
        <circle
          cx="50"
          cy="54"
          r="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}
