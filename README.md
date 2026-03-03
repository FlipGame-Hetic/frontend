# Flipper — Frontend

Multiplayer Fighting pinball game running on a two-screen physical setup. Each screen is an independent React/Three.js app sharing a common design system, type definitions, and utilities through a pnpm monorepo.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Physical Setup                       │
│                                                         │
│   ┌──────────────────┐     ┌──────────────────────┐     │
│   │   front-screen   │     │    back-screen       │     │
│   │   :3000          │     │    :3001             │     │
│   │                  │     │                      │     │
│   │  Player-facing   │     │  Scoreboard /        │     │
│   │  3D playfield    │     │  secondary view      │     │
│   └──────────────────┘     └──────────────────────┘     │
└─────────────────────────────────────────────────────────┘
         │                          │
         └──────────┬───────────────┘
                    │ consumes
         ┌──────────▼───────────────┐
         │      packages/           │
         │  types · utils · ui      │
         │  eslint-config           │
         │  tailwind-config         │
         │  tsconfig                │
         └──────────────────────────┘
```

**Stack:** React · TypeScript · Vite · React Three Fiber · Rapier.js · TailwindCSS v4 · Zustand

**Tooling:** pnpm workspaces · ESLint · Prettier · Vitest · Playwright · Husky + lint-staged

---

## Getting started

**Prerequisites:** Node >= 20, pnpm >= 9

```bash
# 1. Install dependencies, link workspace packages, and set up git hooks (Husky)
pnpm install

# 2. Only needed if you plan to run E2E tests (~300 MB browser download)
pnpm exec playwright install --with-deps chromium

# 3. Start both dev servers
pnpm dev
```

> `pnpm install` automatically runs the `prepare` script which initialises Husky —
> no separate git hook setup required.

| App            | URL                   | Description                 |
| -------------- | --------------------- | --------------------------- |
| `front-screen` | http://localhost:3000 | Player-facing 3D view       |
| `back-screen`  | http://localhost:3001 | Scoreboard / secondary view |

---


## Starting with Docker

We used [Athena](https://github.com/Jeck0v/Athena) for init the structure of the docker-compose.yml file.
For use it, you need to install it first.
After that, you can run:
```bash
athena validate multi-react-apps.ath
```
This will validate the configuration.
After this you need to run:
```bash
athena build multi-react-apps.ath
```
This will generate the docker-compose.yml file.

To run the app locally using Docker, follow these steps:

```bash
docker compose up --build
```
Then go to: 
- Back Screen: http://localhost:3000
- DMD Screen: http://localhost:3001
- Front Screen: http://localhost:3002


And if you want to stop the app:
```bash
docker compose down
```


## Commands

All commands run from the repo root unless noted.

### Development

```bash
pnpm dev              # both apps in parallel
pnpm dev:front        # front-screen only
pnpm dev:back         # back-screen only
```

### Build & typecheck

```bash
pnpm build            # build all apps
pnpm typecheck        # typecheck all packages and apps

# Per-app
pnpm --filter @frontend/front-screen build
pnpm --filter @frontend/front-screen typecheck
```

### Lint & format

```bash
pnpm lint             # ESLint on the whole repo
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier on everything
pnpm format:check     # Prettier check (no write)
```

### Tests

```bash
# Unit tests (Vitest) — all packages + apps
pnpm test
pnpm test:watch

# Unit tests — single app or package
pnpm --filter @frontend/front-screen test
pnpm --filter @frontend/utils test

# E2E tests (Playwright) — all apps
pnpm test:e2e

# E2E tests — single app
pnpm --filter @frontend/front-screen test:e2e
```

### Utilities

```bash
pnpm clean            # delete all node_modules and dist folders
```

---

## Monorepo structure

```
frontend/
├── apps/
│   ├── front-screen/          @frontend/front-screen  (port 3000)
│   └── back-screen/           @frontend/back-screen   (port 3001)
│
└── packages/
    ├── types/                 @frontend/types
    ├── utils/                 @frontend/utils
    ├── ui/                    @frontend/ui
    ├── tailwind-config/       @frontend/tailwind-config
    ├── eslint-config/         @frontend/eslint-config
    └── tsconfig/              @frontend/tsconfig
```

### Shared packages

| Package                     | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `@frontend/types`           | Game domain types — `GameState`, `Player`, WS message protocol |
| `@frontend/utils`           | Pure utility functions — `clamp`, `lerp`, `formatScore`        |
| `@frontend/ui`              | Shared React components — `ScoreDisplay`, HUD elements         |
| `@frontend/tailwind-config` | Tailwind v4 CSS theme (`@theme` tokens — neon palette, fonts)  |
| `@frontend/eslint-config`   | Shared ESLint flat config (strict TS + React rules)            |
| `@frontend/tsconfig`        | Shared TypeScript base configs (`base`, `react`, `node`)       |

### Path alias

Both apps map `@/` to their own `src/`:

```ts
import { MyComponent } from "@/components/MyComponent"
```

---

## App structure

Each app follows the same layout:

```
src/
  components/      React UI components
  hooks/           Custom React hooks
  scenes/          React Three Fiber scene definitions
  stores/          Zustand state stores
  App.tsx
  main.tsx
  index.css        Tailwind entry (@import "tailwindcss" + theme)
  vite-env.d.ts    Vite asset type declarations
tests/             Vitest unit tests (separate from src/)
  setup.ts
e2e/               Playwright end-to-end tests
```

---

## Design system

The visual theme is defined once in `packages/tailwind-config/theme.css` and imported by both apps. No `tailwind.config.ts` or PostCSS config — Tailwind v4 runs entirely through the `@tailwindcss/vite` plugin.

**Color tokens:**

| Token            | Value     | Use                       |
| ---------------- | --------- | ------------------------- |
| `neon-pink`      | `#FF2D6B` | Accents, player 1         |
| `neon-cyan`      | `#00F0FF` | Highlights, UI glow       |
| `neon-purple`    | `#B026FF` | Player 2, special effects |
| `neon-yellow`    | `#FFE156` | Scores, warnings          |
| `surface-dark`   | `#0A0A0F` | Page background           |
| `surface-card`   | `#12121A` | Card / panel background   |
| `surface-border` | `#1E1E2E` | Borders, dividers         |

**Fonts:** Orbitron (display/headings) · Inter (body)

---

## Team

Arnaud Fischer · Louis Dondey · Arthur Jenck · Alexis Gontier · Maxime Bidan

v1.0.0- 03/03/26
