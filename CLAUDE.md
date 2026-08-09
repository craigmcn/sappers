# Sappers

A browser-based Minesweeper PWA. Built with React 19, Vite 8, TypeScript 6
(strict). Full rules reference and design plan: [docs/DESIGN.md](docs/DESIGN.md).
Accessibility/security/usability review and open follow-ups (tracked as
GitHub issues): [docs/CONSIDERATIONS.md](docs/CONSIDERATIONS.md).

> Dated narrative write-ups (what a checkpoint or feature PR did, and why)
> belong in `docs/HISTORY.md`, not here — see the "CLAUDE.md hygiene" note in
> the global `active_projects.md`. This file should describe current state
> only.

## Commands

```bash
yarn dev             # dev server (http://localhost:3150)
yarn build           # production build → dist/
yarn build:netlify   # dual build: netlify/ (root) + netlify/sappers/ (craigmcn.com/sappers)
yarn test            # vitest watch mode
yarn test:coverage   # vitest run --coverage
yarn test:e2e        # Playwright headless E2E (run `yarn playwright install` once first)
yarn lint            # ESLint (src, e2e)
yarn format:check    # Prettier check
```

## Architecture

- **`src/engine/`** — pure TS, no DOM/React, fully unit-tested in isolation.
  - `types.ts` — `Difficulty`, `DIFFICULTY_CONFIGS` (beginner 9×9/10,
    intermediate 16×16/40, expert 16×30/99), `Cell`, `Board`, `GameState`.
  - `board.ts` — `createEmptyBoard`, `neighborCoords`, `placeMines` (accepts
    an `exclude` set and an injectable `rng`, defaulting to `Math.random`).
  - `engine.ts` — `createGame`, `reveal` (places mines lazily on the first
    reveal, excluding the clicked cell + its neighbors, then flood-fills),
    `toggleFlag`, `chord` (reveals a satisfied number's remaining neighbors),
    `remainingMineCount`. All pure functions: `(state, ...) => newState`.
  - `testHelpers.ts` — `buildManualState(layout)` builds a fully-controlled
    `GameState` from an ASCII grid (`M` = mine) for engine tests that need a
    specific board shape rather than random placement.
- **`src/components/`** — render-only React; no game rules live here.
  `Board`/`Cell` (click reveals, right-click or long-press flags, click on a
  satisfied revealed number chords), `Header` (mine counter, timer, status),
  `ControlsMenu` (New Field button + `DifficultySelector` + stats summary;
  collapses behind a "Menu" toggle below 640px, inline on wider viewports),
  `GameOverlay` (win/loss modal — fixed overlay, `role="alertdialog"`,
  focus-trapped, rest of the app marked `inert` while shown).
- **`src/hooks/useFocusTrap.ts`** — shared focus-trap/Escape-to-close/
  restore-focus-on-close hook used by both `GameOverlay` and `ControlsMenu`'s
  mobile dropdown, so floating panels behave consistently for keyboard and
  screen-reader users.
- **`src/stats/`** — anonymous, device-scoped, local-only stats.
  `deviceId.ts` persists a `crypto.randomUUID()` in `localStorage` as the
  "anonymous account" key. `statsStore.ts` defines the `StatsStore`
  interface (`recordResult`/`getSummary`) plus `IndexedDbStatsStore`, the
  only implementation for now — a future login/sync backend can implement
  the same interface without touching engine or UI code.
- **`src/App.tsx`** — owns `GameState` via `useState`, dispatches engine
  functions, ticks the elapsed-time display, and records a `StatsStore`
  result whenever `game.status` transitions to `won`/`lost`.

## Key design decisions

- **First click is always safe** — mines are placed only after the first
  reveal, excluding that cell and its 8 neighbors, so the opening move
  always opens a cascade rather than risking an instant loss.
- **Engine/UI split is load-bearing** — every rule change (custom boards,
  no-guess generation) should stay inside `src/engine/`, additive to
  existing tests, rather than touching component logic.
- **Chording is click-based, not middle-click** — browsers don't expose a
  clean middle-click convention across desktop and touch, so a plain click
  on an already-revealed, flag-satisfied number chords; touch uses the same
  tap. Flagging on touch is long-press (`LONG_PRESS_MS` in `Cell.tsx`).
- **No albertcss** — this app has its own visual identity (field-manual /
  ordnance-disposal palette and type, see `docs/DESIGN.md`), not the shared
  albertcss stylesheet used by other repos in `~/Web/`.
- **Fonts are self-hosted, not CDN-linked** — Black Ops One and IBM Plex
  (Sans/Mono) are bundled under `src/assets/fonts/` (both OFL-licensed; see
  `NOTICE.md` there) for offline/PWA reliability.
- **No GitHub Pages for this repo** — Netlify only, dual build output
  (`netlify/` at the domain root, `netlify/sappers/` for
  `craigmcn.com/sappers`), per explicit direction.

## Testing notes

- `src/engine/*.test.ts` cover mine placement/adjacency, first-click safety
  (statistical, run across repeated trials), flood-fill cascades, win/loss,
  flagging, and chording — including a chord that detonates a mine under a
  wrongly-placed flag.
- `src/stats/statsStore.test.ts` forces `@vitest-environment node` (happy-dom
  has no IndexedDB implementation; Node's own global `localStorage`/
  `indexedDB` are handled by `NODE_OPTIONS=--no-experimental-webstorage` in
  the `test`/`test:coverage` scripts and by `fake-indexeddb/auto`,
  respectively). Covers per-difficulty/device-scoped summaries and the v1→v2
  IndexedDB schema migration (compound `byDifficultyAndDevice` index) against
  a hand-built legacy database, to confirm no data loss.
- `src/App.test.tsx` covers the wired-up UI: reveal/flag/chord interaction,
  difficulty switching, New Field reset, and axe a11y checks — including the
  loss overlay (mine placement forced deterministic via a mocked
  `Math.random`) and the open mobile menu, not just the initial idle screen.
- `e2e/` (Playwright) covers full-page flows including right-click flagging
  and dark/light theme rendering via `page.emulateMedia`. Desktop viewport
  only (`playwright.config.ts` uses Desktop Chrome), so it doesn't exercise
  `ControlsMenu`'s mobile-collapsed state.

## PWA / deployment

`vite-pwa.config.ts` (shared by `vite.config.ts` and `vite.config.netlify.ts`)
configures a Workbox `generateSW` service worker themed to the app's own
palette (`registerType: "autoUpdate"` — updates activate silently, no
user prompt; see `docs/CONSIDERATIONS.md` #11 for the tradeoff).
`scripts/copy-netlify-sw.mjs` copies the generated `sw.js`/`workbox-*.js`
into the second Netlify build output directory (`netlify/sappers/`), since
the plugin only writes to a single resolved `outDir`.

`public/_headers` sets a Content-Security-Policy (and other baseline
security headers) for this repo's own Netlify site — copied by Vite into
both `dist/` and the `netlify/` build outputs, but only takes effect where
Netlify actually serves it, i.e. not for the `netlify/sappers/` copy, which
is deployed as part of craigmcn.com's own separate build. `script-src`
allow-lists `index.html`'s one inline script (the trailing-slash redirect
relative-URL asset loading depends on) by exact SHA-256 hash rather than
`'unsafe-inline'` — that hash must be recomputed if the script's content
ever changes (see the comments in both files).
