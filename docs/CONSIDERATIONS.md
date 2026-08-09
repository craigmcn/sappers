# Further considerations

A senior-level pass over the current codebase (post PR #1–#4) across
accessibility, security, and usability, looking for what's needed to make
this the best possible version of the app — not bugs in what's there, but
gaps in what isn't yet. Written 2026-08-09 against `main` @ `ef01782`.

Each numbered finding below has a matching GitHub issue (linked) for
tracking; this file is the durable "why" behind them. Re-read this before
picking up one of those issues, and update both together if the underlying
tradeoff changes.

## How this was produced

Not guesswork: contrast ratios below were computed with the actual WCAG 2.x
relative-luminance formula against this repo's real token values (see
`src/index.css`), not eyeballed. Keyboard/ARIA gaps were confirmed by
reading the actual event handlers in `Cell.tsx`/`Board.tsx`, not assumed
from the component names. Where a fix is suggested, it was checked to
actually clear the target ratio, not just "probably better."

---

## Accessibility

This is where most of the real gaps are. The app already has a real a11y
practice (jsx-a11y lint, `vitest-axe` in unit tests, semantic `aria-label`s
throughout `Cell.tsx`, the modal/focus-trap work from PR #1) — these
findings build on that, they're not saying it's been ignored.

### 1. No keyboard way to flag a cell — issue [#5](../../issues/5)

`Cell.tsx`'s only flag paths are `onContextMenu` (right-click, desktop) and
a touch-only `onPointerDown` + `setTimeout` long-press
(`LONG_PRESS_MS = 450`). Reveal and chord both work via keyboard for free,
because they're plain `onClick` on a `<button>` and the browser turns
Enter/Space into a click — but there is no `onKeyDown` handler anywhere for
flag, so a keyboard-only player can reveal every cell but can never place a
flag. That's a hard failure of **WCAG 2.1.1 Keyboard**, a Level A (baseline)
criterion — not a nice-to-have.

Flags aren't required to win (per `docs/DESIGN.md`), so a keyboard user can
technically still finish a game blind-guessing — but that's not really
"playing Minesweeper," it's playing Minesweeper with one hand tied.

### 2. Board has no grid semantics or efficient keyboard navigation — issue [#6](../../issues/6)

`Board.tsx` wraps the cells in `role="group"`, and every cell is a flat
`<button>` in normal tab order. That's fine for Beginner (81 cells) but on
Expert (16×30 = 480 cells), reaching the far corner by keyboard means
pressing Tab 480 times. There's no `role="grid"`/`role="row"`/
`role="gridcell"` structure and no arrow-key roving-tabindex navigation —
the standard, well-documented pattern for exactly this
([WAI-ARIA APG: Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)).
Sighted players navigate the board spatially for free; keyboard users
currently get none of that. Relates to **WCAG 2.4.3 Focus Order**.

This is naturally sequenced after #1 — arrow-key navigation without a way
to flag is only half useful.

### 3. Two number colors fail WCAG AA contrast in light mode — issue [#7](../../issues/7)

Computed against `--panel` (`#e2dbc4`, the revealed-cell background), with
the board's numbers rendered bold at `1rem`/16px (`Cell.css` /
`font-weight: 700`, `font-size: 1rem`) — too small to qualify as WCAG's
"large text" exception (needs ≥18.66px bold), so the standard 4.5:1 minimum
for **1.4.3 Contrast (Minimum)** applies:

| Token     | Hex       | Ratio on `--panel` | Verdict                 |
| --------- | --------- | ------------------ | ----------------------- |
| `--num-2` | `#56682e` | 4.44:1             | **fails** (needs 4.5:1) |
| `--num-8` | `#8a6a1e` | 3.64:1             | **fails**               |

The `--signal`/`--signal-ink` pair used for CTA button text ("New Field,"
"Play again") also fails in light mode: `#fdf6ee` on `#d9531e` is 3.76:1.
(Dark mode passes everywhere — verified separately, see the raw numbers in
the PR that added this doc if you want the full table.)

Checked, working fixes (kept as close to the original hue as possible):

- `--num-2`: `#56682e` → `#53642c` (4.70:1)
- `--num-8`: `#8a6a1e` → `#755a19` (4.69:1)
- CTA button: either darken `--signal` to `#c34a1b` (4.54:1) — but that's
  the shared accent color, used elsewhere too — or give light mode a
  darker `--signal-ink` instead (dark mode already defines `--signal-ink`
  separately, so this doesn't require touching the shared token).

Exact values are a design call, not mine to make — the issue has the
numbers, a human should pick.

### 4. No live-region announcement for cascades — issue [#8](../../issues/8)

A single click on a 0-adjacent cell can flood-fill open dozens or hundreds
of cells at once (`floodReveal` in `engine.ts`). A sighted player sees this
happen; a screen reader user gets nothing beyond re-navigating the board
cell by cell to discover what changed. An `aria-live="polite"` region
(e.g. "14 cells cleared" or an updated mine-remaining announcement) would
close this — **WCAG 4.1.3 Status Messages**.

### 5. No custom `:focus-visible` styling — issue [#9](../../issues/9)

Confirmed by grep: zero `outline`/`:focus`/`:focus-visible` rules anywhere
in `src/**/*.css`. Everything relies on the browser's default focus ring,
which (a) looks different per browser, and (b) was never checked against
this app's own busy backgrounds — `Board.css`'s repeating grid-line
`background-image` behind every cell, `GameOverlay`'s backdrop, etc. Given
the app has its own deliberate visual identity (`docs/DESIGN.md`), an
explicit `:focus-visible` ring using `--signal` would both guarantee
visibility (**WCAG 2.4.7 Focus Visible**) and look intentional rather than
default-browser-chrome.

### 6. axe accessibility tests never run against a real browser — issue [#10](../../issues/10)

`vitest-axe` (in `App.test.tsx`, wired via `src/test/setup.ts`) runs under
happy-dom, which doesn't do real layout or paint — axe-core's
`color-contrast` rule can't evaluate actual rendered colors in that
environment. This is exactly _why_ finding #3 above went undetected despite
an existing, actively-used a11y test suite: the tests were checking ARIA
attributes and DOM structure the whole time, never colors. The Playwright
e2e suite (a real browser) has no axe integration at all yet. Adding
`@axe-core/playwright` to at least one e2e spec would give real contrast
coverage and catch regressions like #3 automatically going forward.

---

## Security

Most of the real security surface was already closed in PR #3 (CSP with a
hashed inline script rather than `'unsafe-inline'`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`). What's below is what's left, or
worth noting as deliberately _not_ a gap.

- **No Subresource Integrity (SRI) on the built script/stylesheet tags.**
  Not flagged as an issue — SRI defends against a _third-party_ host being
  compromised (a CDN serving a tampered file). Every asset here is
  same-origin (fonts self-hosted, no CDN dependency — see the "No albertcss"
  / self-hosted-fonts decisions in `CLAUDE.md`), so SRI would add near-zero
  marginal protection over what HTTPS + the CSP `default-src 'self'`
  already provide. Revisit only if a CDN dependency is ever added.
- **No PII anywhere.** `deviceId.ts` stores a random UUID, `statsStore.ts`
  stores anonymous win/loss/time records scoped to that device (PR #4).
  Nothing here is worth encrypting at rest — it's not meaningfully
  different from cache data. No action needed; noted so a future reviewer
  doesn't have to re-derive this.
- **Dependency hygiene** is already a standing habit across these repos
  (see the `dependabot-fix` skill and the global `active_projects.md`
  conventions) — not re-documented here as a gap specific to this app.

## Usability & robustness

### 7. Service worker silently updates mid-session — issue [#11](../../issues/11)

`vite-pwa.config.ts:11` sets `registerType: "autoUpdate"`. Workbox
activates a new service worker and takes control of open pages
automatically, with no prompt. If a new version deploys while someone has
an in-progress game open, the app's JS/CSS can be swapped underneath them
mid-session. `registerType: "prompt"` plus a small "Update available —
Reload" toast would hand that decision to the player instead, so a
mid-cascade update doesn't interrupt them uninvited.

### 8. Unhandled promise rejections in the stats layer; no top-level error boundary — issue [#12](../../issues/12)

`App.tsx:35` (`statsStore.getSummary(difficulty).then(setSummary)`) and
`App.tsx:52–59` (the `recordResult(...).then(...).then(setSummary)` chain)
have no `.catch()`. If IndexedDB is unavailable — blocked by a corporate
policy, quota-exhausted, or (historically) restricted in some browsers'
private-browsing modes — these promises reject as _unhandled_ rejections.
Gameplay itself keeps working (`ControlsMenu.tsx:86` already guards
`{summary && (...)}`), but it's an uncaught error with no graceful
messaging, in a codebase that otherwise handles exactly this class of
failure carefully (`deviceId.ts`'s try/catch fallback is the model to
match). Relatedly, there's no top-level React `ErrorBoundary` anywhere in
`src/` — an uncaught render error anywhere currently blanks the whole page
with no recovery UI.

### 9. Board doesn't scale to fit small viewports — issue [#13](../../issues/13)

`Board.tsx:19–20` hardcodes `2rem` (32px) cells via inline
`gridTemplateColumns`/`gridTemplateRows`, regardless of viewport width.
Expert (16×30) comes out to roughly 992px wide — far past a typical phone's
~390px viewport — so `Board.css`'s `overflow: auto` kicks in and the player
has to horizontal-scroll to reach the right side of the board. Workable,
but not great on the app's own largest, most "serious" difficulty tier,
which is exactly the one most likely to be played on a bigger screen but
still worth supporting well on mobile. A responsive cell size (e.g.
`clamp()` driven by `100vw / cols`, with a floor around 24px — WCAG 2.5.8
Target Size (Minimum), Level AA) would let Expert shrink to fit rather than
scroll, without ever going below a legally-tappable size.

**Documented, not filed as an issue:** the current fixed 32px cell already
clears the WCAG AA touch-target minimum (24×24 CSS px) but not the AAA
recommendation (44×44px). This is an inherent, board-density-vs-tap-size
tension every Minesweeper implementation has (including the original) — a
conscious tradeoff, not an oversight, and #9 above doesn't change that
tension, it just stops Expert from also requiring horizontal scrolling on
small screens.

---

## Deliberate non-goals (settled, don't re-raise)

- **i18n** — all strings are hardcoded English. Single-locale app by
  design for now; not an oversight.
- **`noUncheckedIndexedAccess`** — a further TypeScript strictness flag
  beyond the `strict: true` added in PR #2. Would force explicit
  undefined-narrowing on every `board[row][col]`-style access throughout
  `engine.ts`, most of which are already bounds-checked by construction
  (loop bounds, `neighborCoords` filtering). Worth trying if this codebase
  grows meaningfully more complex; skipped for now as more verbosity than
  value at its current size.
- **jsx-a11y `strict` config tier** — `eslint.config.mjs` currently uses
  `jsxA11y.flatConfigs.recommended`. The `strict` tier exists and is
  stricter; low-cost to try, but not chased down here since the findings
  above (keyboard flagging, grid semantics, contrast, live regions) are all
  things static linting can't catch anyway — they needed an actual read of
  the interaction code and computed color math, not a lint rule.
