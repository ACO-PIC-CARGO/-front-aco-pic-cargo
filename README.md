# front_operativo_last

## Requirements

Node 22.18+ or 24.11+ (20.19+, 22.13+ and 24.0–24.10 work but `npm ci` prints an EBADENGINE warning). Install with `npm ci`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on http://localhost:8080 (localhost only; `npm run dev -- --host` to reach it from the LAN) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint with the Vue 3 / Vuetify 4 migration rules |
| `npm run test:e2e` | Playwright suite (needs the backend running and `E2E_USER`, `E2E_PASSWORD`, `E2E_BRANCH`) |

Run the pricing deep flow on one worker (`npx playwright test tests/e2e/pricing.spec.mjs --workers=1`): the backend hands out duplicate quote numbers when quotes are created in parallel.

Unit tests (e2e helpers and migration scripts): `node --test "tests/e2e/support/*.test.mjs" "scripts/migration/*.test.mjs"`.

Environment variables keep the `VITE_` prefix (`.env.development`, `.env.development.local`).
To expose the dev server through a tunnel, set `VITE_ALLOWED_HOSTS=.trycloudflare.com`.
