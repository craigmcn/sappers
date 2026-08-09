# Sappers — design doc

A browser-based Minesweeper, built with the same standard stack as the rest
of `~/Web/` (React 19 + Vite 8 + TypeScript, Vitest/RTL, Playwright), shipped
as an installable PWA.

## 1. Game rules (reference: classic Windows Minesweeper)

- **Board & mines** — rectangular grid, N mines placed uniformly at random.
  Presets: Beginner 9×9/10, Intermediate 16×16/40, Expert 30×16/99.
- **First click is always safe** — mines are placed _after_ the first
  reveal, excluding the clicked cell and its neighbors, so the opening move
  always produces a cascade rather than a coin-flip loss. This matches
  modern (XP+) Windows behavior, chosen over the original 1990 fully-random
  placement per explicit direction.
- **Reveal** — clicking a cell shows it. A 0-adjacent-mines cell
  flood-fills all contiguous 0-cells and reveals their bordering numbered
  cells. A numbered cell (1–8) shows its adjacent mine count. A mine ends
  the game.
- **Flagging** — marks a cell as suspected-mine; flagged cells can't be
  revealed by accident. Flags aren't required to win.
- **Chording** — clicking a revealed number whose adjacent flag count
  equals the number reveals all its remaining unflagged neighbors. Desktop:
  triggered by clicking an already-revealed numbered cell (both mouse
  buttons in the original; here, a plain click on a satisfied number does
  the chord, since browsers don't expose a clean middle-click chord
  convention). Touch: tapping a satisfied revealed number does the same.
- **Flagging on touch** — long-press a cell to toggle its flag (no
  right-click on touch devices).
- **Win** — all non-mine cells revealed. **Loss** — a mine is revealed; all
  mines are shown, incorrectly-placed flags are marked wrong.
- **Timer** starts on first reveal; mine counter = mines − flags placed
  (can go negative, matching the original).
- No undo, no hints — matches the reference game.

## 2. Architecture

```
src/
  engine/          pure TS, no DOM/React — fully unit-testable in isolation
    types.ts       Board, Cell, Difficulty, GameState
    board.ts       grid creation, mine placement (post-first-click), neighbor math
    engine.ts       reveal (flood fill), toggleFlag, chord, win/loss detection
  components/      React, render-only — no game logic lives here
    Board.tsx / Cell.tsx / Header.tsx / DifficultySelector.tsx / GameOverlay.tsx
  stats/           anonymous device stats, storage behind an interface
    deviceId.ts    persistent per-device UUID (localStorage)
    statsStore.ts  StatsStore interface + IndexedDB implementation
  App.tsx          wires engine state (useReducer) to components
```

The engine/UI split is the load-bearing decision: every rule (flood fill,
chording, first-click safety, win/loss) is a pure function over plain data,
so it's tested directly with Vitest without mounting any component. React
only ever dispatches engine actions and renders the resulting `GameState` —
this also makes future rule changes (custom boards, no-guess generation)
additive rather than a UI rewrite.

State management is a single `useReducer` in `App.tsx` (no external state
library needed — one board, one active game, no cross-component state
sharing beyond parent/child props).

## 3. Data model — stats

Anonymous, device-scoped, local-only for now (per explicit direction — no
backend yet, but kept behind an interface for an easy future login/sync
addition):

```ts
interface StatsStore {
  recordResult(difficulty: Difficulty, result: GameResult): Promise<void>;
  getSummary(difficulty: Difficulty): Promise<DifficultySummary>;
}

interface GameResult {
  won: boolean;
  elapsedMs: number;
  timestamp: number;
}

interface DifficultySummary {
  played: number;
  won: number;
  bestTimeMs: number | null;
  currentStreak: number;
}
```

- **Device ID**: a `crypto.randomUUID()` generated once and persisted in
  `localStorage` — the "anonymous account" key. No auth, no network call.
- **Storage**: IndexedDB (via a tiny wrapper, not a full ORM) keyed by
  device ID + difficulty, since results should survive a `localStorage`
  clear-on-quota-pressure better than `localStorage` itself and scale to
  per-game history if that's ever wanted.
- **Future sync**: `StatsStore` is the seam — a `RemoteStatsStore` that
  syncs the same shape to a backend (Firebase, matching `files`/`sudoku`'s
  precedent) can be swapped in behind the same interface once real login
  exists, without touching engine or UI code.

## 4. Visual design

Distinct identity, not albertcss — see palette/type/layout plan below,
grounded in the "sappers" (combat engineer / ordnance disposal) name rather
than a generic game skin.

**Color** — both themes defined explicitly as CSS custom properties, no
inherited defaults:

| Token            | Light     | Dark      | Use                                |
| ---------------- | --------- | --------- | ---------------------------------- |
| `--paper`        | `#EFEAD9` | `#1B1D16` | page background                    |
| `--ink`          | `#2B2B22` | `#E8E3D0` | text                               |
| `--line`         | `#C9C0A0` | `#3A3D2E` | grid rules, borders                |
| `--panel`        | `#E2DBC4` | `#262920` | unrevealed cell face               |
| `--panel-raised` | `#F5F1E2` | `#2E3226` | cell bevel highlight               |
| `--signal`       | `#D9531E` | `#F2793A` | the one accent — flags, focus, CTA |
| `--danger`       | `#B3261E` | `#E5453B` | detonation                         |
| `--safe`         | `#4C6B3E` | `#7FA65C` | cleared / win                      |

Numbers 1–8 use muted "grease-pencil map annotation" inks rather than the
classic saturated rainbow (slate blue, olive, rust, indigo, maroon, teal,
charcoal, mustard) — cohesive with the palette; numeral + fixed position
already carries the meaning, so color is reinforcement, not the only signal
(color-blind accessible by construction).

**Type** — self-hosted, not CDN-linked:

- Display: "Black Ops One" (OFL stencil face) — wordmark only, used
  sparingly.
- UI text: "IBM Plex Sans".
- Counters (mine count, timer): "IBM Plex Mono" with `font-variant-numeric:
tabular-nums`, styled like a detonator readout.

**Layout** — a HUD/instrument-panel header (stenciled mine counter and
timer flank the wordmark), the board sits on a faint topographic grid
texture, cells render as beveled pressed-metal tiles, flags as small
pennant glyphs. The difficulty picker reads as a clearance-level selector,
not generic tabs. Reveal cascades ripple outward cell-by-cell (staggered
CSS transition delay by BFS depth) rather than popping instantly; a loss
gets a brief shake + flash. All motion respects `prefers-reduced-motion`.

## 5. Testing strategy

- **Unit (Vitest)** — the entire `engine/` module: mine placement excludes
  first-click + neighbors, flood fill matches hand-checked fixtures,
  chording only fires when flag count matches, win/loss detection,
  mine-counter arithmetic including the negative-flags case.
- **Integration (RTL)** — `Board`/`Cell` interaction: click reveals, flag
  toggle, chord-click behavior, win/loss overlay appears, difficulty switch
  resets the board. `vitest-axe` for a11y, matching `wordle-helper`.
- **E2E (Playwright)** — full game flows against the real dev server: play
  to a win, play to a loss, flag/unflag, timer starts on first click and
  stops on game end, difficulty switch, dark-mode rendering
  (`page.emulateMedia`).
- Long-press-to-flag and chord-tap are covered at the integration level via
  simulated touch events, since Playwright's default Chromium project runs
  desktop-style input.

## 6. PWA & deployment

- `vite-plugin-pwa`, `registerType: 'autoUpdate'`, manifest themed to the
  palette above (`theme_color`/`background_color` from `--signal`/`--paper`
  dark variants), installable/offline-playable.
- Netlify only (no GitHub Pages for this repo, per explicit direction) —
  dual build output: `netlify/` (root, this repo's own Netlify site) and
  `netlify/sappers/` (served at `craigmcn.com/sappers`), both built with
  `base: './'` so the same relative-path build works unmodified from either
  location. Service worker files copied into the second output dir the same
  way `sudoku` does it (`vite-plugin-pwa`'s `generateSW` only writes to a
  single resolved `outDir`).
