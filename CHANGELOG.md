# Changelog
All notable changes to the **Momentum** monorepo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning.

---

## [Unreleased]

### Added
- **Phase 3 — Code Efficiency & Coherency (Reuse & DRY):**
  - **Auth consolidation:** De-duplicated and refactored the auth controller; centralized JWT `signToken` and trimmed `googleAuthController` bloat.
  - **BFF route proxying:** Replaced 49+ hand-written Next.js route handlers in `momentum-web/app/web-bff/` with a centralized `createProxyHandler` (`momentum-web/lib/bffProxy.ts`). Each route file is now 3 lines.
  - **Points synchronization:** Unified quest and task point completions through a shared `pointsService` so wishlist/store payouts use one code path.
  - **API stability:** Standardized `wishlistController` response shapes and errors; implemented raw points additions for quests; resolved Socket.IO circular dependency.
  - **Mobile API facade:** Simplified `api.ts` by exporting dynamically bound composed services directly.
- **Phase 2 — DX, Performance & Polish (DX, Performance & Documentation):**
  - Wrapped mobile list rendering components (`TaskItem`, `QuestItem`) in `React.memo` and replaced general `ScrollView` with smooth virtualized `FlatList` inside the mobile family screen to solve scroll lag.
  - Replaced the initial member selection `useEffect` setup with highly-efficient lazy state initialization to prevent initial render cycles.
  - Harmonized custom theme typography references inside `bentoTokens.ts` with loaded font engines inside mobile `App.tsx` to clear emulator warnings.
  - Implemented Mongoose `.lean()` calls in core database queries to avoid excessive query hydration cycles.
  - Removed obsolete dependencies (`node-fetch`) and aligned Express typing profiles inside the BFF gateway configurations.
  - Completely aligned all `momentum-shared` core library documentation (`README.md`, `API_REFERENCE.md`, `USAGE_GUIDE.md`, `MIGRATION_CHECKLIST.md`) to eradicate API drift.
- **Phase 1 — Architecture & Type Safety (Type Safety, Connection Resiliency & Schema Validations):**
  - Removed loose `any` typing from `DataContext.tsx`, `SocketContext.tsx`, and `ThemeContext.tsx`.
  - Added Socket.IO client-side exponential backoff delay retry parameters with randomized jitter in mobile contexts.
  - Integrated React Native AsyncStorage for theme persistence on individual personal child devices.
  - Configured a 15-second AbortController request timeout and exponential retry mechanism with randomized jitter inside mobile network clients.
  - Normalized `_id` and `id` structure at the mobile boundary inside `DataContext.tsx` using a helper `WithMongoId<T>`.
  - Configured response `compression` inside core Express API server configuration.
  - Set up dynamic, lightweight request validation middleware inside the core API.
  - Standardized all real-time events on the primary websocket channels inside core API helper scripts.
  - Integrated HTTP `Retry-After: 60` headers and cryptographic SHA-256 Memory Keys inside mobile BFF rate limiters.
- **Phase 0 — Monorepo Documentation Suite:**
  - Created centralized root `README.md` detailing service architecture, workspace script configurations, and a visual service-interaction Mermaid flowchart.
  - Added new backend service setup guide at `momentum-api/README.md`.
  - Added new mobile development setup guide at `momentum-mobile/README.md` addressing Expo configuration and theme parameters.
  - Added new gateway setup guide at `momentum-mobile-bff/README.md`.
  - Created root-level `CHANGELOG.md` to track modernization progress.
- **Phase 0 — Security, Resiliency & Stability Improvements:**
  - Hardened the Mobile BFF by closing public `/debug` routes and masking credentials inside request log headers.
  - Restored resilient partial rendering to BFF dashboards via `Promise.allSettled` to prevent single-endpoint crashes from breaking the UI.
  - Eliminated raw database user PIN stdout leakage in the API models.
  - Enhanced the Express global error handler to handle circular serialization and map native Mongoose database errors (CastError, ValidationError, Duplicate Keys) to proper 400-level HTTP responses.
  - Cleaned up the monorepo by consolidating and archiving legacy AI plans, logs, and summaries into dedicated system archive directories.

---

## [1.0.0] - 2026-05-20
*Initial release of the Momentum Family Management Platform.*

### Added
- Unified Family Management Platform core identity focusing on ADHD-specific motivation schemes.
- Gameified Tasks & Quests modules allowing parent-assigned and member-selected responsibilities.
- Morning, Afternoon, and Evening Routine tracking systems.
- Integrated household calendars supporting Google Calendar and iCal sync protocols.
- Household meal planner and mandatory profile meal rating captures.
- Co-Parenting Governance mechanism enabling secure child profile synchronization between independent parent views.
- Secure 4-digit individual profile validation PIN infrastructure.
- Motivational currency economy featuring point gains, streaks, bonuses, store selections, and wishlists.
- Multi-theme visual engines supporting individual visual customizations on child devices.
