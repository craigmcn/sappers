# Onboarding guide

This doc is for a junior/intermediate frontend (TypeScript) developer picking
up this codebase for the first time. It explains the _why_ behind the
structure in plain English — for the current architecture reference, see
[CLAUDE.md](../CLAUDE.md); for the full game-rules/design spec, see
[DESIGN.md](DESIGN.md).

## What this app actually is

Sappers is Minesweeper. You click cells to reveal them; numbers tell you how
many mines are hiding in the 8 cells around you; you flag cells you think
are mines; you win by revealing every non-mine cell. If you'd like to play
it once before reading code, run `yarn dev` and open
http://localhost:3150 — five minutes of play will make the rest of this
doc click into place much faster.

The one non-obvious rule worth knowing up front: **your first click can
never lose the game.** Mines aren't placed on the board until _after_ your
first reveal, and they're placed everywhere _except_ the cell you clicked
and its 8 neighbors. That single decision shapes a chunk of the engine code
(see `reveal()` below), so it's worth internalizing before you read it.

## The big idea: engine vs. UI

The most important structural fact about this codebase is that it's split
into two halves that don't know about each other:

- **`src/engine/`** — the rules of Minesweeper, written as plain
  TypeScript functions. No React, no DOM, no `window`. Every function takes
  a `GameState` (and maybe a row/column) and returns a _new_ `GameState`.
  Nothing here ever mutates the state you pass in from outside — it either
  returns the same object unchanged or builds a fresh one.
- **`src/components/`** — React components that render a `GameState` and
  call the engine functions in response to clicks/taps/keys. They don't
  contain any game logic themselves (no mine-counting, no win checks) —
  they just call into the engine and re-render whatever comes back.

Why bother with this split? Two practical reasons:

1. **The engine is trivial to test.** No DOM, no React Testing Library, no
   rendering — just call a function with an input state and assert on the
   output state. Look at `src/engine/engine.test.ts` for dozens of examples.
2. **Future rule changes (custom board sizes, "no-guess" board generation,
   etc.) only touch `src/engine/`.** If you're asked to change a _rule_,
   you should almost never need to touch a `.tsx` file. If you're asked to
   change how something _looks or feels_, you should almost never need to
   touch `src/engine/`.

If you're about to make a change and you're not sure which side it belongs
on, ask: "does this change what counts as a win, a loss, or a valid move?"
If yes, it's engine. If it's about pixels, animations, ARIA labels, or
input handling, it's components.

## How state flows through the app

There's exactly one `GameState` object alive at a time, and it lives in
`src/App.tsx` via a single `useState`:

```ts
const [game, setGame] = useState(() => createGame(difficulty));
```

Everything downstream is a one-way flow:

```
App.tsx (owns `game` state)
  → passes `game` down as props to Header / ControlsMenu / Board
  → Board passes individual cells down to Cell
  → Cell's onClick/onContextMenu/onKeyDown call callback props
    (onReveal / onFlag / onChord) that were passed down from App
  → those callbacks call an engine function and setGame(newState)
  → React re-renders everything below App with the new state
```

Concretely, in `App.tsx`:

```ts
<Board
  game={game}
  onReveal={(row, col) => setGame((g) => reveal(g, row, col))}
  onFlag={(row, col) => setGame((g) => toggleFlag(g, row, col))}
  onChord={(row, col) => setGame((g) => chord(g, row, col))}
/>
```

`reveal`, `toggleFlag`, and `chord` are all pure engine functions from
`src/engine/engine.ts` — `App.tsx` is just wiring them up to UI events. If
you're trying to trace "what happens when I click a cell", start at
`Cell.tsx`'s `handleClick`, follow the `onReveal` prop up through `Board.tsx`
to `App.tsx`, then jump into `engine.ts`'s `reveal()`.

`App.tsx` also owns some state that isn't strictly game state but is
derived from it via `useEffect`: the elapsed-time timer, a
screen-reader-only "N cells cleared, N mines remaining" announcement, and
recording win/loss results to the stats store. None of that is
Minesweeper _rules_ — it's presentation/side-effect glue — which is why it
lives in the component layer, not the engine.

## Walking through the engine (`src/engine/`)

Read these files in this order; each builds on the last:

1. **`types.ts`** — the shapes. `Cell` (`mine`, `adjacent`, `visibility`),
   `Board` (`Cell[][]`), `GameState` (the whole game, including status,
   timers, and mine/flag counts), and `DIFFICULTY_CONFIGS` (the three board
   sizes). Start here so the rest makes sense.
2. **`board.ts`** — board-shaped helpers with no game _status_ logic:
   `createEmptyBoard`, `neighborCoords` (the 8-cell/edge-clamped neighbor
   lookup used everywhere), `cloneBoard` (a deep-ish copy so engine
   functions never mutate the state they were given), and `placeMines`
   (random placement that skips an `exclude` set of cells — this is how
   "first click is safe" is implemented, and it takes an injectable `rng`
   parameter so tests can force deterministic mine layouts instead of
   relying on `Math.random`).
3. **`engine.ts`** — the actual game moves, each one a pure function:
   - `createGame(difficulty)` — builds a fresh, mine-less `GameState` in
     `"pending"` status. No mines exist yet.
   - `reveal(state, row, col)` — the interesting one. If this is the very
     first reveal (`status === "pending"`), mines are placed _now_,
     excluding the clicked cell and its neighbors, and the status flips to
     `"playing"`. Then it checks: mine → you lose (`revealAllMines`, status
     `"lost"`); not a mine → flood-fill outward from that cell
     (`floodReveal`, a stack-based fill that stops at numbered cells and
     keeps expanding through cells with `adjacent === 0`) and check for a
     win (every non-mine cell revealed).
   - `toggleFlag(state, row, col)` — flips `hidden` ↔ `flagged` on one
     cell and adjusts the flag counter. Revealed cells can't be flagged.
   - `chord(state, row, col)` — clicking an already-revealed number whose
     adjacent flag count matches its own value reveals all its remaining
     unflagged neighbors in one go (a standard Minesweeper speed-up). It's
     literally implemented as calling `reveal()` in a loop over the
     unflagged neighbors, bailing out early if one of those reveals ends
     the game.
   - `remainingMineCount(state)` — `mines - flagsPlaced`, shown in the
     header. Note this is just a _display_ number — it's allowed to go
     negative if you over-flag, and it isn't used to determine a win.
4. **`testHelpers.ts`** — `buildManualState(layout)` turns an ASCII grid
   like `"M.."` / `".M."` / `"..."` into a fully-built `GameState`, so tests
   that care about a specific mine layout (e.g. "chording next to a
   wrongly-flagged mine should detonate it") don't have to fight
   `placeMines`'s randomness. Reach for this whenever a test needs a
   specific board shape rather than a random one.

Everything in this folder is exercised by `*.test.ts` files sitting right
next to the implementation — when you change engine behavior, run
`yarn test` and expect (and update) failures there before you touch any UI.

## Walking through the components (`src/components/`)

- **`Board.tsx`** — renders the grid of `Cell`s and owns the _keyboard
  navigation_ state (which cell has `tabIndex={0}` and should receive
  focus), since that's a UI/accessibility concern, not a game rule. Arrow
  keys move focus between cells; `Home`/`End` jump to row start/end.
- **`Cell.tsx`** — one square. This is the file with the most going on
  per line, because a single cell has to handle: click (reveal or chord,
  depending on current visibility), right-click (flag, desktop), long-press
  (flag, touch — implemented with `pointerdown`/`pointerup` timers, see
  `LONG_PRESS_MS`), and a keyboard shortcut (`F` to flag). If you're
  wondering why `handleContextMenu` bails out when
  `lastPointerType.current === "touch"` — that's guarding against mobile
  browsers firing a native `contextmenu` event on long-press, which would
  otherwise flag the cell twice (see the comment and issue #15 for the
  history).
- **`Header.tsx`** — mine counter, elapsed timer, win/loss status text.
  Pure presentation, no logic beyond formatting.
- **`ControlsMenu.tsx`** + **`DifficultySelector.tsx`** — the "New Field"
  button, difficulty picker, and stats summary. Below 640px this collapses
  behind a "Menu" toggle; above it, it's shown inline. This is the one part
  of the UI with meaningfully different behavior at two breakpoints, so if
  you're debugging something here, check both.
- **`GameOverlay.tsx`** — the win/loss modal. It's a fixed overlay with
  `role="alertdialog"`; while it's open, the rest of the app is marked
  `inert` (see `App.tsx`'s `inert={gameOver || undefined}`) so keyboard/
  screen-reader users can't accidentally interact with a finished board
  underneath it.
- **`ErrorBoundary.tsx`** — a standard React class-component error
  boundary wrapping the app, so a thrown error shows a friendly fallback
  instead of a blank white screen.
- **`UpdateToast.tsx`** — the "a new version is available" banner from the
  PWA service worker (see the PWA section below).
- **`icons.tsx`** — small inline SVG icon components (flag, mine), used
  instead of an icon font/library since there are only two of them.

`useFocusTrap` (in `src/hooks/`) is shared between `GameOverlay` and
`ControlsMenu`'s mobile dropdown — both are "floating panels that should
trap Tab focus and close on Escape", so that behavior was pulled out once
rather than duplicated.

## Feedback: haptics and sound (`src/feedback/`)

This is the newest slice of the app (see the branch this doc was added on).
It's deliberately tiny and has no dependency on the engine or on React
state:

- **`haptics.ts`** — wraps `navigator.vibrate`, and checks
  `prefers-reduced-motion` before firing (`reducedMotionPreferred()`), so
  users who've asked their OS not to vibrate/animate things aren't buzzed
  anyway.
- **`audio.ts`** — plays a short tone via the Web Audio API
  (`playTone(frequency, durationMs)`) — no audio files to load.
- **`settings.ts`** — a `{ haptics: boolean, sound: boolean }` preference,
  persisted to `localStorage` the same way `src/stats/deviceId.ts`
  persists its device id: read defensively (defaults to "on" if
  `localStorage` throws or is empty), write best-effort (swallow errors —
  a failed write just means the preference won't persist, not a crash).
- **`feedback.ts`** — the two call sites: `playFlagFeedback()` (short
  buzz + tone when you long-press flag a cell on touch) and
  `playLossFeedback()` (a longer buzz pattern alongside the board's loss
  shake animation). Both just read the current settings and no-op
  whichever channel is turned off.
- **`useFeedbackSettings.ts`** (in `src/hooks/`) — the React-facing wrapper
  so a settings UI can read/toggle these without every component reaching
  into `localStorage` directly.

If you're asked to add a new kind of feedback (e.g. a tone on win), the
pattern to copy is: add a `playXFeedback()` function in `feedback.ts` that
checks `getFeedbackSettings()`, then call it from wherever that game event
is already detected in the component layer (don't call it from the
engine — the engine has no side effects, by design).

## Stats (`src/stats/`)

Anonymous, per-device, local-only win/loss/best-time tracking, stored in
IndexedDB via the `idb` package. Two things worth knowing:

- **"Device" here means "this browser profile"**, not "this person" —
  `deviceId.ts` just generates and persists a random UUID in
  `localStorage` the first time the app runs. There's no login.
- **`StatsStore` is an interface**, and `IndexedDbStatsStore` is currently
  its only implementation. This is intentional over-engineering-that-isn't:
  it exists so that if login/cloud-sync stats are ever added, that new
  implementation can be swapped in wherever `StatsStore` is used (currently
  just `App.tsx`) without touching engine or component code. Don't read
  this as license to add more abstraction elsewhere without a similar
  concrete reason.

`statsStore.test.ts` is the one test file that _can't_ use the default
`happy-dom` test environment, because happy-dom doesn't implement
IndexedDB — it's forced to Node's environment instead (see the
`@vitest-environment node` comment at the top of that file, and the
"Testing notes" section of CLAUDE.md for the full explanation).

## Testing, at a glance

- `yarn test` — Vitest in watch mode. `yarn test:coverage` for a one-shot
  run with coverage. Engine tests sit next to their implementation
  (`engine.test.ts` next to `engine.ts`); component tests are similarly
  colocated (`Cell.test.tsx`, `App.test.tsx`).
- `App.test.tsx` is the broadest test — it renders the _whole_ wired-up
  app and drives it through reveal/flag/chord/win/loss via
  React Testing Library, including axe accessibility assertions. If you
  change how components wire up to the engine, this is the file most
  likely to catch it.
- `yarn test:e2e` — Playwright, real browser, full page loads (including
  right-click flagging and dark/light theme via `page.emulateMedia`).
  Desktop-viewport only, so it won't catch mobile-only bugs (e.g. the
  `ControlsMenu` collapsed state) — that gap is intentional per CLAUDE.md,
  not an oversight.
- Before you commit, `yarn format:check`, `yarn lint`, and `yarn test`
  (or just let the Husky pre-commit hook run all three plus a type check)
  are the same checks CI runs on every PR.

## A few things that trip people up

- **Engine functions never mutate their input.** If you're adding a new
  engine function, follow the existing pattern: read from `state`, build a
  new `board` (via `cloneBoard` if you're changing cells), and return
  `{ ...state, ...changes }`. Mutating `state.board` in place will produce
  bugs that only show up as stale React renders, which are confusing to
  debug after the fact.
- **`reveal()` does two different things depending on game status.** On
  the very first call (`status === "pending"`) it also places the mines.
  If you're modifying this function, keep that branch clearly separate —
  it's easy to accidentally make "placing mines" happen on every reveal
  instead of just the first one.
- **This app has no shared albertcss stylesheet**, unlike most of the
  other repos under `~/Web/` — it has its own visual identity (see
  `docs/DESIGN.md`). Don't reach for albertcss classes here.
- **The service worker auto-updates silently** (`registerType:
"autoUpdate"` in `vite-pwa.config.ts`) — there's no "click to update"
  prompt gating a new version, just the `UpdateToast` informing the user
  it happened. See `docs/CONSIDERATIONS.md` #11 if you want the tradeoff
  reasoning.
- **Two Netlify build outputs exist** (`netlify/` and `netlify/sappers/`)
  because this app is deployed both at its own domain root and nested
  under `craigmcn.com/sappers`. `scripts/copy-netlify-sw.mjs` exists purely
  to duplicate the generated service worker files into the second output
  directory, since the PWA plugin only writes to one `outDir` itself.

## Where to look next

- [CLAUDE.md](../CLAUDE.md) — current-state architecture reference, kept
  up to date; treat it as the source of truth over this doc if the two
  ever disagree (this doc's job is to _teach_, CLAUDE.md's job is to be
  _current_).
- [DESIGN.md](DESIGN.md) — full Minesweeper rules reference and the
  original design plan for this app.
- [CONSIDERATIONS.md](CONSIDERATIONS.md) — accessibility/security/
  usability review notes and open follow-ups, tracked as GitHub issues.
