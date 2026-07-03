# CLAUDE.md — Operational Guide for AI Assistants

> **Rule zero:** [MOMENTUM.md](MOMENTUM.md) is the only authoritative doc. If anything in this file conflicts with it, MOMENTUM.md wins. If anything you remember from a previous session conflicts with the code, the code wins.

## How to work in this repo

1. **Before claiming anything about how the code works, verify it in the code.** Open the file, read the relevant lines, cite `file:line` in your response. Past AI runs filled the repo with confidently-wrong documentation; do not perpetuate that pattern.
2. **Don't create new documentation files.** If you have something to say about the codebase, it goes in [MOMENTUM.md](MOMENTUM.md) (Part 1 if it's a change to what exists, Part 2 if it's a vision change, Part 3 if it's a gap to track). No `*_COMPLETE.md`, no `*_SUMMARY.md`, no `*_PROGRESS.md` files. Ever.
3. **One canonical doc.** Per-package READMEs are operational (commands + env vars), not architectural. Anything bigger belongs in MOMENTUM.md.
4. **Update Part 1 when you change code.** If you add a route, model, service, or external integration, the corresponding row/section in MOMENTUM.md Part 1 must be updated in the same change.
5. **Tests don't exist yet.** When you write new code, you cannot run `npm test` and expect coverage. The first item on the gap list ([Part 3 G1](MOMENTUM.md#part-3--gap-analysis-part-1-vs-part-2)) is fixing this. Until then, every change is verified by reading and running.

## Repo layout

5 packages in one directory. See [MOMENTUM.md §1.1](MOMENTUM.md#11-repo-layout--service-topology).

| Package | Role |
|---|---|
| `momentum-api` | Core API (Express + Mongoose + Socket.IO) — :3001 |
| `momentum-mobile-bff` | Mobile-only gateway — :3002 |
| `momentum-mobile` | React Native (Expo SDK 54) |
| `momentum-web` | Next.js App Router — :3000 |
| `momentum-shared` | Logic-only `.ts` (no `.tsx`) — imported via workspace link |

## Dev commands

From repo root:
```bash
npm install
npm run dev:api      # Core API
npm run dev:bff      # Mobile BFF
npm run dev:web      # Next.js web
npm run dev:mobile   # Expo
npm run lint
npm run test         # currently mostly empty
```

Per-package commands live in each package's README. Database scripts and one-off utilities are in [momentum-api/README.md](momentum-api/README.md).

## Environment variables

Each package has its own `.env`. The full list lives in each package README. Critical: `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` on the API; `API_BASE_URL` on the BFF; `EXPO_PUBLIC_API_BASE_URL` on mobile; `INTERNAL_API_URL`/`NEXT_PUBLIC_INTERNAL_API_URL` on web.

## Common confusions to avoid

- **There are two things called "BFF"** — the standalone `momentum-mobile-bff` service (mobile-only) and the Next.js route handlers in `momentum-web/app/web-bff/` (same-origin proxy for the web client). They serve different clients.
- **The web app does not use `momentum-mobile-bff`.** It talks to the Core API directly through its own Next.js proxy.
- **Role is per-household, not per-user.** `FamilyMember` has no `role` field. Role lives in `Household.memberProfiles[].role`. The same person can be Parent in one household and Child in another.
- **PIN verification is the only public PIN endpoint.** Setup/change/status require auth. Verify is rate-limited per `householdId:memberId`.
- **WebSocket event names are inconsistent.** `taskUpdated` is camelCase; everything else is snake_case. Both `join_household` and `joinHousehold` are accepted for room joining. See [MOMENTUM.md §1.9](MOMENTUM.md#19-real-time-websocket).
- **Three design-token sources exist and disagree.** Until [Part 3 G3](MOMENTUM.md#part-3--gap-analysis-part-1-vs-part-2) lands, treat them as drifting.

## Known fragility

[MOMENTUM.md §1.11](MOMENTUM.md#111-known-fragility--from-code-not-from-logs) lists 14 items, all citation-backed. Skim it before touching anything risky.

## When you're done

If your change affects what's documented in MOMENTUM.md Part 1, update Part 1 in the same change. If your change moves a gap from Part 3 to "done," delete that row from Part 3.
