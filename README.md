# Momentum

Family management app with ADHD-focused design — tasks, quests, routines, points, calendar, co-parenting governance. Built as a 5-package workspace: Core API, Mobile BFF, Mobile (Expo), Web (Next.js), and a shared logic package.

## 📖 The doc

There is exactly one source of truth: **[MOMENTUM.md](MOMENTUM.md)**.

- Part 1 — what the code does today, with `file:line` citations
- Part 2 — what we want the product to be
- Part 3 — the gap between them

Per-package READMEs (`momentum-api/README.md`, etc.) contain only operational commands and env vars for that package. `CLAUDE.md` is the AI operational guide. `CHANGELOG.md` is the release log. Anything else you find that looks like documentation is either stale or wrong — fix it or delete it.

## 🚀 Quick start

```bash
# From repo root
npm install                  # installs all 5 workspaces

# Run individual services (each in its own terminal)
npm run dev:api              # Core API on :3001
npm run dev:bff              # Mobile BFF on :3002
npm run dev:web              # Next.js web on :3000
npm run dev:mobile           # Expo dev server (mobile)
```

Each package's `README.md` lists the env vars it needs.

## Architecture (one diagram)

```
[Mobile (Expo)] → [momentum-mobile-bff :3002] → [momentum-api :3001] → MongoDB Atlas
                                                                     → Google Calendar API
[Web (Next.js)] ──────────── direct ────────→ [momentum-api :3001]

WebSocket: API → BFF → Mobile  /  API → Web (direct)
```

For everything else, read [MOMENTUM.md](MOMENTUM.md).
