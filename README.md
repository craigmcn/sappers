# Sappers

A browser-based Minesweeper, built as an installable PWA.

See [CLAUDE.md](CLAUDE.md) for architecture and [docs/DESIGN.md](docs/DESIGN.md)
for the full rules/design doc.

## How to play

Clear every non-mine cell without detonating one. Numbers show how many
mines are hiding in the 8 neighboring cells; use them to work out where the
mines are. Your first reveal is always safe — mines are placed only after
that click, never under it or its neighbors.

|                        | Desktop                                                                                                            | Mobile / touch                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Reveal                 | Click a hidden cell                                                                                                | Tap a hidden cell                                                 |
| Flag                   | Right-click a hidden cell                                                                                          | Long-press a hidden cell                                          |
| Chord                  | Click an already-revealed number whose adjacent flag count matches it, to reveal its remaining unflagged neighbors | Tap the same kind of satisfied number                             |
| New Field / difficulty | Always visible above the board                                                                                     | Tap **Menu** to open **New Field** and the clearance-level picker |

Pick a clearance level — **Recruit** (9×9, 10 mines), **Sapper** (16×16, 40
mines), or **Demolitions** (16×30, 99 mines) — before or during a game; it
starts a new field at that size. The mine counter (mines minus flags placed)
and timer are in the header; a win or loss shows as an overlay with a
**Play again** button.

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
