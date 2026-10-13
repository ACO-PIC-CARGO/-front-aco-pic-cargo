# front_operativo_last

## Requirements

Node 20.19+ or 22.12+. Install with `npm ci`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on http://localhost:8080 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint with the Vue 3 / Vuetify 4 migration rules |
| `npm run test:e2e` | Playwright suite (needs the backend running and `E2E_USER`, `E2E_PASSWORD`, `E2E_BRANCH`) |

Environment variables keep the `VUE_APP_` prefix (`.env.development`, `.env.development.local`).
To expose the dev server through a tunnel, set `VITE_ALLOWED_HOSTS=.trycloudflare.com`.
