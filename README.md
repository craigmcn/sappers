# Sappers

A browser-based Minesweeper, built as an installable PWA.

See [CLAUDE.md](CLAUDE.md) for architecture and [docs/DESIGN.md](docs/DESIGN.md)
for the full rules/design doc.

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
