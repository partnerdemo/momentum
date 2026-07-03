# MOMENTUM — Single Source of Truth

**Last verified against code:** 2026-06-14
**How to use this doc:** Part 1 describes what the code does, *today*, with `file:line` citations you can spot-check. Part 2 describes what we want the product to be. Part 3 names the gap. When you change code, update Part 1. When you change the product vision, update Part 2. There are no other authoritative docs in this repo.

---

## Table of Contents

- [Part 1 — As-Built (verified from code)](#part-1--as-built-verified-from-code)
  - [1.1 Repo layout & service topology](#11-repo-layout--service-topology)
  - [1.2 Request flow](#12-request-flow)
  - [1.3 Authentication & authorization](#13-authentication--authorization)
  - [1.4 Core API (`momentum-api`)](#14-core-api-momentum-api)
  - [1.5 Mobile BFF (`momentum-mobile-bff`)](#15-mobile-bff-momentum-mobile-bff)
  - [1.6 Mobile client (`momentum-mobile`)](#16-mobile-client-momentum-mobile)
  - [1.7 Web client (`momentum-web`)](#17-web-client-momentum-web)
  - [1.8 Shared library (`momentum-shared`)](#18-shared-library-momentum-shared)
  - [1.9 Real-time (WebSocket)](#19-real-time-websocket)
  - [1.10 External integrations](#110-external-integrations)
  - [1.11 Known fragility — from code, not from logs](#111-known-fragility--from-code-not-from-logs)
- [Part 2 — Target (what we want it to be)](#part-2--target-what-we-want-it-to-be)
  - [2.1 Who it's for](#21-who-its-for)
  - [2.2 What it does](#22-what-it-does)
  - [2.3 Design philosophy](#23-design-philosophy)
  - [2.4 UX principles](#24-ux-principles)
  - [2.5 Quality bar](#25-quality-bar)
  - [2.6 Feature map](#26-feature-map)
  - [2.7 Explicit non-goals](#27-explicit-non-goals)
- [Part 3 — Gap analysis (Part 1 vs Part 2)](#part-3--gap-analysis-part-1-vs-part-2)

---

# Part 1 — As-Built (verified from code)

## 1.1 Repo layout & service topology

Five packages in one directory. Each backend package is its own git repo; `momentum-shared` is plain source consumed via npm workspace links.

| Package | Role | Port (dev) | Deploy |
|---|---|---|---|
| `momentum-api` | Core API — MongoDB, business logic, Google Calendar sync, WebSocket source | 3001 | Render |
| `momentum-mobile-bff` | Mobile-only gateway: proxy + 4 aggregation routes + socket pass-through | 3002 | Render |
| `momentum-web` | Next.js App Router parent/admin UI; talks **directly** to Core API (its own `web-bff/` is a Next route handler, not the BFF service) | 3000 | not yet deployed (per [momentum-web/package.json](momentum-web/package.json)) |
| `momentum-mobile` | React Native (Expo SDK 54) — kids and shared kitchen tablet | — | EAS |
| `momentum-shared` | Logic-only `.ts` (no `.tsx`) — types, color helpers, validation, formatters | — | npm workspace |

**Topology** (verified from [momentum-api/src/server.ts:99-110](momentum-api/src/server.ts), [momentum-mobile-bff/src/server.ts](momentum-mobile-bff/src/server.ts), [momentum-mobile/src/services/base.api.ts:4-8](momentum-mobile/src/services/base.api.ts), [momentum-web/app/layout.tsx](momentum-web/app/layout.tsx)):

```
[Mobile (Expo)] --HTTPS--> [momentum-mobile-bff :3002/mobile-bff] --HTTP--> [momentum-api :3001/api/v1]
[Web (Next.js)] --------------HTTPS, direct---------------------> [momentum-api :3001/api/v1]
                                                                          |
                                                                          +--> MongoDB Atlas
                                                                          +--> Google Calendar API
[Mobile, Web] <----Socket.IO----- [momentum-mobile-bff] <--Socket.IO-- [momentum-api]
   (web connects directly; mobile pass-through via BFF)
```

The web app does NOT use the mobile BFF. The folder `momentum-web/app/web-bff/` is a set of Next.js route handlers (58 of them) that proxy to the Core API using `createProxyHandler` in [momentum-web/lib/bffProxy.ts](momentum-web/lib/bffProxy.ts). They exist so web can call same-origin endpoints in the browser without a CORS preflight on every request. Each is 3 lines.

## 1.2 Request flow

### Mobile request lifecycle
1. Mobile screen calls a method on the API facade ([momentum-mobile/src/services/api.ts](momentum-mobile/src/services/api.ts))
2. Facade delegates to a sub-service (`auth.service.ts`, `task.service.ts`, `household.service.ts`)
3. Sub-service uses [`BaseApi.request()`](momentum-mobile/src/services/base.api.ts) — a `fetch` wrapper with: 15-second `AbortController` timeout, 3 attempts max, exponential backoff with jitter on 429s and network errors, JWT in `Authorization: Bearer` header from `expo-secure-store`
4. Request goes to `BFF_API_URL` (default `http://localhost:3002/mobile-bff`, env override `EXPO_PUBLIC_API_BASE_URL`)
5. BFF either aggregates (4 routes) or proxies via `http-proxy-middleware` to `http://localhost:3001/api/v1`
6. Core API runs middleware stack → controller → MongoDB / Google Calendar API → response

### Web request lifecycle
1. Component calls `fetch('/web-bff/<route>')` (same-origin Next route handler)
2. Route handler is a 3-line file using `createProxyHandler()` from [momentum-web/lib/bffProxy.ts](momentum-web/lib/bffProxy.ts) — forwards to `INTERNAL_API_URL` (Core API) with the auth header
3. Core API responds; Next route handler streams the response back to the browser

### Common middleware on every Core API request
From [momentum-api/src/server.ts:197-216](momentum-api/src/server.ts):
- `compression()` (gzip)
- `helmet()` (security headers)
- Rate limit: 3000 req / 15 min per IP, **skipped for `/auth/` endpoints** because the BFF shares one IP for all mobile users
- `express-mongo-sanitize` against NoSQL injection
- CORS with allow-list from `ALLOWED_ORIGINS` env var
- `express.json({ limit: '10kb' })`

## 1.3 Authentication & authorization

### Three sign-in paths
1. **Email + password** — `POST /api/v1/auth/signup`, `POST /api/v1/auth/login` ([authRoutes.ts](momentum-api/src/routes/authRoutes.ts))
2. **Google ID token** (mobile native) — `POST /api/v1/auth/google` — accepts `idToken` + optional `serverAuthCode` for calendar scope
3. **Google OAuth code** (web) — `POST /api/v1/auth/google/oauth` — full server-side code exchange

All three return a JWT containing `{ id: <FamilyMember._id>, householdId: <Household._id> }` ([authMiddleware.ts:13-16](momentum-api/src/middleware/authMiddleware.ts)).

Auth endpoints are rate-limited to **30 attempts / 15 min per IP** at the route level ([authRoutes.ts:13-20](momentum-api/src/routes/authRoutes.ts)).

### `protect` middleware ([authMiddleware.ts:26-65](momentum-api/src/middleware/authMiddleware.ts))
Every non-auth route uses `router.use(protect)`. It:
1. Extracts `Bearer <token>` from `Authorization` header
2. Verifies the JWT signature against `JWT_SECRET`
3. Looks up the `FamilyMember` document by `decoded.id`
4. If `user.passwordChangedAt > token.iat`, rejects with 401
5. Attaches `req.user` and `req.householdId` for downstream handlers

### `restrictTo('Parent' | 'Child')` middleware ([authMiddleware.ts:68-87](momentum-api/src/middleware/authMiddleware.ts))
Looks up the user's role in the *current* household's `memberProfiles[]`, not on the user document. This means the same person can be Parent in one household and Child in another.

### PIN — second factor for shared devices
Routes in [pin.ts](momentum-api/src/routes/pin.ts):
- `POST /api/v1/pin/setup-pin` (protected) — set initial PIN
- `PUT /api/v1/pin/change-pin` (protected) — change existing PIN
- `GET /api/v1/pin/pin-status` (protected) — is PIN set?
- `POST /api/v1/pin/verify-pin` (PUBLIC, rate-limited) — verify PIN on a shared device, keyed by `householdId:memberId`, 5 attempts / 15 min

PINs are 4 digits, bcrypt-hashed, stored on `FamilyMember.pin`.

### Onboarding completion
`POST /api/v1/auth/onboarding/complete` ([googleAuthController.ts:311-540](momentum-api/src/controllers/googleAuthController.ts)) does a lot in one handler:
- Sets PIN
- Joins via invite code OR updates an existing household OR creates a new one
- Deletes the "zombie" placeholder household if a new one was created
- Optionally creates or links a Google Calendar (personal + family)
- Issues a **fresh JWT** with the now-correct `householdId`

## 1.4 Core API (`momentum-api`)

### Endpoints (mounted in [server.ts:222-251](momentum-api/src/server.ts))

| Mount | Routes file | Endpoints |
|---|---|---|
| `/api/v1/auth` | [authRoutes.ts](momentum-api/src/routes/authRoutes.ts) | `POST /signup`, `POST /login`, `POST /google`, `POST /google/oauth`, `GET /me`, `POST /onboarding/complete` |
| `/api/v1/pin` | [pin.ts](momentum-api/src/routes/pin.ts) | `POST /setup-pin`, `PUT /change-pin`, `GET /pin-status`, `POST /verify-pin` |
| `/api/v1/households` | [householdRoutes.ts](momentum-api/src/routes/householdRoutes.ts) | `POST /join`, `POST /`, `GET /`, `GET/:id`, `PATCH/:id`, `DELETE/:id`, `GET/POST /:id/invite-code`, `POST /:householdId/members`, `PATCH/DELETE /:householdId/members/:memberProfileId` |
| `/api/v1/household` | [householdLinkRoutes.ts](momentum-api/src/routes/householdLinkRoutes.ts) | Parent-only. `POST /child/generate-link-code`, `POST /child/link-existing`, `GET /child/validate-code/:code`, `GET /links`, `GET /link/:linkId/settings`, `POST /link/:linkId/propose-change`, `POST /link/:linkId/approve-change/:changeId`, `POST /link/:linkId/reject-change/:changeId`, `POST /child/:childId/unlink` |
| `/api/v1/tasks` | [taskRoutes.ts](momentum-api/src/routes/taskRoutes.ts) | `GET /`, `POST /` (Parent), `GET/:id`, `PATCH/:id` (Parent), `DELETE/:id` (Parent), `POST /:id/complete`, `POST /:id/approve` (Parent), `POST /:id/reject` (Parent) |
| `/api/v1/store-items` | [storeItemRoutes.ts](momentum-api/src/routes/storeItemRoutes.ts) | `GET /`, `POST /` (Parent), `GET/PATCH/DELETE /:id` (Parent for write), `POST /:id/purchase` |
| `/api/v1/quests` | [questRoutes.ts](momentum-api/src/routes/questRoutes.ts) | `GET /`, `POST /`, `PUT/:id`, `DELETE/:id`, `POST /:id/claim`, `POST /:id/complete`, `POST /:id/approve` |
| `/api/v1/routines` | [routineRoutes.ts](momentum-api/src/routes/routineRoutes.ts) | `GET /`, `POST /`, `GET /member/:memberId`, `GET/PUT/DELETE /:id`, `POST /:id/items/:itemId/toggle`, `POST /:id/reset` |
| `/api/v1/meals` | [mealRoutes.ts](momentum-api/src/routes/mealRoutes.ts) | Recipes / Restaurants / MealPlans CRUD + `GET /unrated`, `POST /rate/:mealId` |
| `/api/v1/wishlist` | [wishlistRoutes.ts](momentum-api/src/routes/wishlistRoutes.ts) | `GET /household/:householdId`, `GET /member/:memberId`, `POST /`, `PUT/:id`, `DELETE/:id`, `POST /:id/purchase` |
| `/api/v1/notifications` | [notificationRoutes.ts](momentum-api/src/routes/notificationRoutes.ts) | `GET /`, `PATCH /read-all`, `PATCH /:id/read`, `POST /remind`, `POST /push-token` |
| `/api/v1/calendar/google` | [googleCalendarRoutes.ts](momentum-api/src/routes/googleCalendarRoutes.ts) | `POST /connect`, `GET /events`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id`, `GET /list` |
| `/api/v1/calendar` | [calendarManagementRoutes.ts](momentum-api/src/routes/calendarManagementRoutes.ts) | `GET /list`, `POST /create`, `POST /verify` |
| `/api/v1/dashboard` | [dashboardRoutes.ts](momentum-api/src/routes/dashboardRoutes.ts) | `GET /page-data` |
| `/api/v1/family` | [familyRoutes.ts](momentum-api/src/routes/familyRoutes.ts) | `GET /page-data` |
| `/api/v1/events` | [eventRoutes.ts](momentum-api/src/routes/eventRoutes.ts) | `GET /`, `POST /`, `GET/PATCH/DELETE /:id` |
| `/api/health` | (server.ts) | `GET /` |

**Note:** `dashboardRoutes` and `familyRoutes` both call into `dashboardController` (different methods). Two routes, one controller. Minor.

### Data model (verified from [`momentum-api/src/models/*`](momentum-api/src/models))

| Model | Key fields | Notes |
|---|---|---|
| **FamilyMember** | `firstName, lastName, email, password?, googleId?, pin?, googleCalendar?, linkedHouseholds?, sharedData?, onboardingCompleted, pinSetupCompleted` | Single user record. Role lives in `Household.memberProfiles[].role`, not here. |
| **Household** | `householdName, memberProfiles[], inviteCode?, familyColor?, familyCalendarId?` | Each `memberProfile` is `{ familyMemberId, displayName, profileColor, role: 'Parent'|'Child', pointsTotal }`. |
| **HouseholdLink** | `childId, household1, household2, linkCode, sharingSettings, pendingChanges[], proposalHistory[], status` | The Mandatory Consensus Protocol lives here. `pendingChanges` is the inbox; `proposalHistory` is the audit log. |
| **ChildLinkCode** | `childId, code, expiresAt, status, usedBy?, usedAt?` | One-time codes for linking a child across households. TTL index auto-deletes expired. |
| **Event** | `householdId, title, startDate, endDate, allDay, attendees[], googleEventId?, googleCalendarId?, calendarType: 'personal'\|'family', color?` | Dual-storage with Google Calendar. `color` is the persisted hex (cached locally to survive Google's integer `colorId` round-trip). |
| **Task** | `householdId, visibleToHouseholds[], title, pointsValue, status, assignedTo[], completedBy?, dueDate?, isRecurring, recurrenceInterval?` | `visibleToHouseholds` = the consensus-shared list for co-parenting. |
| **Quest** | `householdId, visibleToHouseholds[], title, pointsValue, questType: 'one-time'\|'limited'\|'unlimited', maxClaims?, claims[], claimHistory[], recurrence?` | Quests have a claim/complete/approve lifecycle. Methods on the schema: `claimQuest`, `completeQuest`, `approveQuest`, `checkAndProcessRecurrence`. |
| **Routine** | `householdId, memberId, timeOfDay: 'morning'\|'noon'\|'night', items[], lastResetDate?` | Daily checklist, auto-resets via `lastResetDate` comparison. |
| **StoreItem** | `itemName, cost, stock?, isInfinite?, householdRefId` | Reward store. |
| **WishlistItem** | `memberId, householdId, title, pointsCost, priority, isPurchased` | Personal goal list, can be marked purchased. |
| **Transaction** | `transactionType, pointValue (signed), memberRefId, relatedRefId, householdRefId, transactionNote` | Point ledger. |
| **Notification** | `recipientId, householdId, type, title, message, data?, isRead` | Push + in-app. |
| **Recipe, Restaurant, MealPlan, WeeklyMealPlan** | Meal planning support |  `MealPlan.rating` + `isRated` = the mandatory meal-rating loop. |

### Services (in [`momentum-api/src/services/`](momentum-api/src/services))

| Service | Size | Role |
|---|---|---|
| `googleCalendarService.ts` | 11 KB | Calendar CRUD against Google API (list, create, verify access) |
| `googleCalendarEventService.ts` | 26 KB | Event CRUD on Google side, color mapping, move-between-calendars logic |
| `googleCalendarSyncService.ts` | 13 KB | The reconciliation loop that pulls Google → Mongo |
| `googleAuthService.ts` | 4 KB | OAuth client factory, token exchange helpers |
| `pointsService.ts` | 4 KB | Unified point-awarding (replaces inline duplication in task/quest controllers) |
| `householdSharingService.ts` | 4 KB | Shared logic for cross-household task/quest visibility |

`utils/websocketHelper.ts` exists and is used by some controllers but **not all** — direct `io.to().emit()` calls still litter most controllers (see grep at end of this section).

### Controllers — current sizes
| Controller | Lines | Status |
|---|---|---|
| `taskController` | 154 | ✅ refactored per the old [TASK_CONTROLLER_REFACTORING_PLAN.md](docs/guides/TASK_CONTROLLER_REFACTORING_PLAN.md) (now deleted along with all other docs in this consolidation) |
| `taskCompletionController` | ~200 | extracted from taskController |
| `householdController` | 635 | ⚠️ oversized — see [Part 3 gap analysis](#part-3--gap-analysis-part-1-vs-part-2) |
| `householdLinkController` | 548 | ⚠️ oversized — Mandatory Consensus Protocol lives here |
| `googleAuthController` | 470 | ⚠️ oversized — auth + onboarding mixed |
| `eventController` | 467 | ⚠️ oversized — dual-storage write paths |
| `householdLinkController`, `googleCalendarController`, others | varying | mixed |

## 1.5 Mobile BFF (`momentum-mobile-bff`)

The BFF is **mobile-only**. Web does not touch it.

### Entry
[server.ts](momentum-mobile-bff/src/server.ts):
- Reads `API_BASE_URL` from env (fatal if missing)
- Mounts custom routes at `/mobile-bff/{dashboard,family,members,calendar}`
- Mounts `/mobile-bff/store` with a path-rewrite to `/api/v1/store-items`
- Catches everything else under `/mobile-bff` and proxies via `http-proxy-middleware` to `${API_BASE_DOMAIN}/api/v1*`
- 120-second timeout to tolerate Render free-tier cold starts
- Skips body parsing for proxy routes (proxy needs the raw stream)

### Rate-limit protection ([rateLimitProtection.ts](momentum-mobile-bff/src/middleware/rateLimitProtection.ts))
- Keyed by **hashed Bearer token** if present, otherwise hashed IP — this is what makes per-user limits work even though all mobile clients share one BFF egress IP
- 200 requests / minute / client
- Whitelist: `/auth/`, `/health`, `/debug`, `/onboarding` always allowed
- In-memory `Map`, cleaned every 2 minutes — restart = limits reset

### Custom aggregation routes
- [`dashboard.ts`](momentum-mobile-bff/src/routes/dashboard.ts) — `/page-data`, fans out and consolidates
- [`family.ts`](momentum-mobile-bff/src/routes/family.ts) — `/page-data`, uses `Promise.allSettled` over `/households`, `/tasks`, `/store-items` so one upstream failure doesn't blank the page
- [`members.ts`](momentum-mobile-bff/src/routes/members.ts) — **calls `/households/me` which is not a defined Core API route**. ⚠️ See [Part 3](#part-3--gap-analysis-part-1-vs-part-2).
- [`calendar.ts`](momentum-mobile-bff/src/routes/calendar.ts) — proxies calendar OAuth URL endpoint

### Socket.IO pass-through
Each mobile client gets a **dedicated upstream socket** to the Core API on connect. Events flow `mobile ↔ BFF ↔ API` via `clientSocket.onAny` / `upstreamSocket.onAny` bridges. On client disconnect, the upstream socket disconnects too. Auth token required on `socket.handshake.auth.token`.

## 1.6 Mobile client (`momentum-mobile`)

### Entry — [App.tsx](momentum-mobile/App.tsx)
Provider order (outermost → innermost):
```
GestureHandlerRootView
└── ErrorBoundary
    └── SafeAreaProvider
        └── ThemeProvider
            └── NavigationContainer
                └── AuthProvider
                    └── SocketProvider
                        └── DataProvider
                            └── AppNavigator
```
- Inter font loaded via `@expo-google-fonts/inter` before render
- Orientation lock: tablets unlocked, phones locked portrait
- Google Sign-In configured at boot via `configureGoogleSignIn()`

### Navigation — [AppNavigator.tsx](momentum-mobile/src/navigation/AppNavigator.tsx)
Stack navigator with three top-level branches gated on `useAuth()`:
1. **Unauthenticated:** `SignupOptions → Login | Register`
2. **Authenticated, onboarding incomplete:** `Onboarding`
3. **Authenticated, onboarded:** `Family` (FamilyBentoScreen) → can navigate to `Parent`, `MemberDetail`, `MemberStore`, `SharingSettings`, `NotificationCenter`, `ParentCalendar`

### Screens — verified
```
src/screens/
├── auth/             LoginScreen, RegisterScreen, SignupOptionsScreen, OnboardingScreen,
│                     components/{PINEntry,PINKeypad}.tsx
├── calendar/         ParentCalendarScreen
├── family/           FamilyBentoScreen, MemberDetailScreen, MemberStoreScreen,
│                     components/{AvatarButton, EnvironmentCol, FamilyEventCard,
│                                 FamilyRosterGrid, FamilyTimelineCard}.tsx
├── household/        SharingSettingsScreen
├── notifications/    NotificationCenterScreen
└── parent/           ParentScreen,
                      tabs/{MemberManagement, ParentDashboard, ParentSettings,
                            QuestManagement, RoutinesManagement, TaskManagement}.tsx
```

### State — four overlapping React Contexts
- **`AuthContext`** ([AuthContext.tsx](momentum-mobile/src/contexts/AuthContext.tsx)) — `{user, householdId, token, isLoading, isAuthenticated, login, googleLogin, register, logout, refreshUser, updateAuthState}`
- **`DataContext`** ([DataContext.tsx](momentum-mobile/src/contexts/DataContext.tsx)) — holds tasks, quests, members, household, storeItems, meals, restaurants, routines, wishlistItems, events. Subscribes to socket events for invalidation.
- **`SocketContext`** ([SocketContext.tsx](momentum-mobile/src/contexts/SocketContext.tsx)) — owns the Socket.IO connection (singleton via `useRef`), exposes `on/off/emit/isConnected`
- **`ThemeContext`** ([ThemeContext.tsx](momentum-mobile/src/contexts/ThemeContext.tsx)) — two hardcoded themes (`default`, `dark`), persisted to `AsyncStorage`

### Network — [base.api.ts](momentum-mobile/src/services/base.api.ts)
`fetch` wrapper with: 15s `AbortController` timeout, 3-attempt retry, exponential backoff with jitter on 429 / network error / timeout. JWT in `Authorization: Bearer`. Default `BFF_API_URL` = `http://localhost:3002/mobile-bff`, overridable via `EXPO_PUBLIC_API_BASE_URL`.

### Theme — sources from `momentum-shared`
- [`theme/bentoTokens.ts`](momentum-mobile/src/theme/bentoTokens.ts) — 30-line re-export shim from `momentum-shared/tokens`. Preserves `bentoPalette` and `familyPalette` names so the 24 screen consumers don't need to change imports.
- [`theme/layout.ts`](momentum-mobile/src/theme/layout.ts) — mobile-only platform tokens (`widgetSizes`, `dockConfig`, `breakpoints`, `zIndex`, `a11y`) that don't belong in shared.
- [`theme/constants.ts`](momentum-mobile/src/theme/constants.ts) — `SCREEN_WIDTH`, `IS_IOS`, etc.
- Legacy `theme/colors.ts` (Tailwind ramps) and `theme/typography.ts` (unused scale) deleted 2026-06-15.

## 1.7 Web client (`momentum-web`)

### Entry — [app/layout.tsx](momentum-web/app/layout.tsx)
Provider order:
```
SessionProvider
└── SocketProvider
    └── FamilyDataProvider
        └── ThemeProvider
            └── {children}
```

### Pages (Next.js App Router)
| Route | File | Public? |
|---|---|---|
| `/` | [app/page.tsx](momentum-web/app/page.tsx) | yes — landing |
| `/login` | [app/login/page.tsx](momentum-web/app/login/page.tsx) | yes |
| `/signup` | [app/signup/page.tsx](momentum-web/app/signup/page.tsx) | yes |
| `/onboarding` | [app/onboarding/page.tsx](momentum-web/app/onboarding/page.tsx) | auth required |
| `/family` | [app/family/page.tsx](momentum-web/app/family/page.tsx) | auth required |
| `/admin` | [app/admin/page.tsx](momentum-web/app/admin/page.tsx) | auth required |
| `/websocket-test` | [app/websocket-test/page.tsx](momentum-web/app/websocket-test/page.tsx) | debug page |

### Components — 95 files across 17 subdirectories
`admin/` (12), `approvals/` (1), `auth/` (5), `calendar/` (1), `family/` (1), `focus/` (2), `kiosk/` (19), `layout/` (7), `meals/` (11), `members/` (6), `quests/` (4), `routines/` (4), `settings/` (4), `shared/` (7), `store/` (5), `tasks/` (5 — modal-heavy: Create/Edit/Delete + List + utils), `wishlist/` (1).

The `kiosk/` directory is the heaviest — the kitchen-tablet display surface.

### `web-bff/` route handlers — 58 files
Same pattern as `momentum-mobile-bff` but at the Next.js layer. Every file is 3 lines:
```ts
import { createProxyHandler } from '@/lib/bffProxy';
export const { GET, POST, PUT, PATCH, DELETE } = createProxyHandler();
```
Implementation in [lib/bffProxy.ts](momentum-web/lib/bffProxy.ts). Targets `INTERNAL_API_URL`.

### Lib
[`lib/`](momentum-web/lib) — `bffProxy.ts`, `config.ts`, `socket.ts`, `hooks/{useFamilyData,useSocket}.ts`, `providers/SocketProvider.tsx`.

### Styling
- Tailwind v4 via `@tailwindcss/postcss`
- Design tokens in [app/global.css](momentum-web/app/global.css) `@theme` block are **hand-mirrored from `momentum-shared/tokens`** with a header comment naming the source of truth. A CI-blocking drift test ([__tests__/design-tokens-drift.test.ts](momentum-web/__tests__/design-tokens-drift.test.ts), 32 assertions) parses the CSS and asserts every `--color-*` / `--radius-*` / `--space-*` matches the shared TypeScript token. Hand-edit either side without updating the other → test fails.

## 1.8 Shared library (`momentum-shared`)

**Logic only — zero `.tsx` files.** Exports:
- `components/MemberAvatar/{logic,types}.ts`
- `components/TaskCard/{logic,types}.ts`
- `components/Quest/{logic,types}.ts`
- `components/StoreItem/{logic,types}.ts`
- `components/Modal/{logic,types}.ts`
- `utils/colors.ts` — `hexToRgb`, `addOpacity`, `adjustBrightness` (color *manipulation* only — no actual palette)
- `utils/formatting.ts`
- `utils/validation.ts`
- `utils/helpers.ts`

Used by both `momentum-mobile` and `momentum-web` via npm workspace link (`"momentum-shared": "*"`). **No design tokens, no copy strings, no shared rendering primitives.**

## 1.9 Real-time (WebSocket)

### Connection ([momentum-api/src/server.ts:148-181](momentum-api/src/server.ts))
- Socket.IO authenticates via JWT in `socket.handshake.auth.token`. Web sends `Bearer <token>`, mobile sends raw token; both forms are accepted.
- After connect, client must emit `join_household` (snake) OR `joinHousehold` (camel) with a household ID. Server verifies the requested room matches the JWT's `householdId` before joining. The dual event name is historical — mobile and web used different conventions.
- Rooms are keyed by household ID. All `io.to(householdId)` emissions are scoped to one household.

### Server-emitted events (verified by grep across [`momentum-api/src/controllers/`](momentum-api/src/controllers))

| Event | Source | Payload |
|---|---|---|
| `taskUpdated` | [websocketHelper.ts:41](momentum-api/src/utils/websocketHelper.ts) | unified shape |
| `event_created` / `event_updated` / `event_deleted` | [eventController.ts:196,455,535](momentum-api/src/controllers/eventController.ts) + [googleCalendarController.ts:159,219,270](momentum-api/src/controllers/googleCalendarController.ts) | Event document |
| `household_updated` | [householdController.ts:250,410,530,653](momentum-api/src/controllers/householdController.ts) | `{ type: 'update'|'member_add'|'member_update'|'member_remove', householdId, ... }` |
| `quest_updated` | [questController.ts:75,128,186,220,258,300](momentum-api/src/controllers/questController.ts) | `{ type, quest }` |
| `routine_updated` | [routineController.ts:59,181,207,296](momentum-api/src/controllers/routineController.ts) | `{ type, routine }` |
| `routine_item_toggled` | [routineController.ts:247](momentum-api/src/controllers/routineController.ts) | toggle payload |
| `store_item_updated` | [storeItemController.ts:58,106,132](momentum-api/src/controllers/storeItemController.ts) | `{ type, storeItem }` |
| `meal_plan_updated` | [mealController.ts:127,159,179,203,247](momentum-api/src/controllers/mealController.ts) | `{ type, ... }` |
| `wishlist_updated` | [wishlistController.ts:139,178,205,255](momentum-api/src/controllers/wishlistController.ts) | `{ type, item }` |
| `member_updated` | [websocketHelper.ts:60](momentum-api/src/utils/websocketHelper.ts) | member payload |
| `member_points_updated` | [questController.ts:302](momentum-api/src/controllers/questController.ts), [transactionController.ts:127](momentum-api/src/controllers/transactionController.ts) | points payload |
| `notification` | [notificationController.ts:121](momentum-api/src/controllers/notificationController.ts) | notification |
| `auth_error` | [BFF server.ts](momentum-mobile-bff/src/server.ts) | propagated from upstream socket failure |
| `error` | [server.ts:173](momentum-api/src/server.ts) | auth-room mismatch |

**Naming inconsistency:** `taskUpdated` is camelCase; everything else is `snake_case`. The `taskUpdated` event was added by the websocketHelper extraction; the rest predate it.

## 1.10 External integrations

- **MongoDB Atlas** — connected via Mongoose with `ServerApiVersion.v1` strict mode ([server.ts:75-86](momentum-api/src/server.ts)). Single connection string `MONGO_URI`.
- **Google Calendar API** — `googleapis` v166. Each FamilyMember stores `googleCalendar.{accessToken, refreshToken, expiryDate, selectedCalendarId}` on their record. Household stores `familyCalendarId` for the shared calendar.
- **Google OAuth (Identity)** — `google-auth-library` for ID token verification on mobile; `googleapis` OAuth2 flow for web code exchange.
- **Render** — both API and BFF deploy to Render free tier (per [BFF server.ts](momentum-mobile-bff/src/server.ts) timeout of 120s, comment on "Render cold starts"). Free tier spins down after inactivity — mobile [api.ts](momentum-mobile/src/services/api.ts) calls `wakeUpApi()` before auth to mitigate.
- **Sentry** — wired into 4 packages, opt-in via env var (no-op when unset):
  - API: [`momentum-api/src/config/sentry.ts`](momentum-api/src/config/sentry.ts) — init in [server.ts](momentum-api/src/server.ts) just after `dotenv.config()`; `Sentry.setupExpressErrorHandler(app)` before global error handler; user+household tags set in [authMiddleware.ts](momentum-api/src/middleware/authMiddleware.ts) after JWT verify. DSN env var: `SENTRY_DSN`.
  - BFF: [`momentum-mobile-bff/src/config/sentry.ts`](momentum-mobile-bff/src/config/sentry.ts) — same shape; user tag is opportunistic since BFF doesn't verify the JWT (reads the `sub` claim from the Bearer token without verifying signature). DSN env var: `SENTRY_DSN`.
  - Mobile: [`momentum-mobile/src/config/sentry.ts`](momentum-mobile/src/config/sentry.ts) — `Sentry.init` at the top of [App.tsx](momentum-mobile/App.tsx). DSN env var: `EXPO_PUBLIC_SENTRY_DSN`. **Native crash capture requires `@sentry/react-native` Expo plugin in `app.json` plugins array + EAS prebuild — deferred because `app.json` is currently WIP.**
  - Web: [`sentry.client.config.ts`](momentum-web/sentry.client.config.ts), [`sentry.server.config.ts`](momentum-web/sentry.server.config.ts), [`sentry.edge.config.ts`](momentum-web/sentry.edge.config.ts), [`instrumentation.ts`](momentum-web/instrumentation.ts), and `withSentryConfig` wrapper in [next.config.mjs](momentum-web/next.config.mjs). DSN env vars: `NEXT_PUBLIC_SENTRY_DSN` (client) + `SENTRY_DSN` (server/edge).

## 1.11 Known fragility — from code, not from logs

These are observable in the source as of 2026-06-14. They are *what the code does*, not what BUG_LOG said it does.

| # | Fragility | Evidence | Why it bites |
|---|---|---|---|
| F1 | **Zero automated tests** in any package. | Empty test directories; only sample `__tests__/bffProxy.test.ts` exists (added 2026-06-14). | Every change is deploy-and-see. |
| F2 | **Dual-storage with no transaction model.** Event writes go to Mongo then Google Calendar (or vice versa) with sequential `await`s. | [eventController.ts:41-209](momentum-api/src/controllers/eventController.ts), [googleCalendarEventService.ts](momentum-api/src/services/googleCalendarEventService.ts) | Partial failure = inconsistent state. No outbox, no idempotency keys. |
| F3 | **Four overlapping React Contexts on mobile** with no coordination. | [AuthContext, DataContext, SocketContext, ThemeContext](momentum-mobile/src/contexts) | Socket event arrives → updates SocketContext → DataContext still cached → UI shows stale. Same shape on web (`SessionProvider + FamilyDataProvider + SocketProvider`). |
| F4 | ~~Three competing design-token sources.~~ **RESOLVED 2026-06-15 (G3).** Tokens now in `momentum-shared/tokens/`; mobile re-exports via shim, web aligned + drift-tested. | Was: different hex for `success` (`#10B981` vs `#16A34A`) and `error` (`#EF4444` vs `#DC2626`) — now both `#10B981` and `#EF4444` per the canonical shared values. | (resolved) |
| F5 | **BFF `members.ts` calls a non-existent endpoint** `/households/me`. | [members.ts:16](momentum-mobile-bff/src/routes/members.ts) — no `GET /households/me` route exists in [householdRoutes.ts](momentum-api/src/routes/householdRoutes.ts). | Will 404 silently; BFF returns `data.data?.household?.memberProfiles || []` so the client sees an empty list instead of an error. |
| F6 | **WebSocket event naming is inconsistent.** | `taskUpdated` (camel) vs `event_created`, `household_updated`, `quest_updated`, `routine_updated`, `meal_plan_updated`, `store_item_updated`, `wishlist_updated`, `member_points_updated`, `member_updated` (all snake). Plus dual-name room join (`join_household` + `joinHousehold`). | Client handlers must subscribe to both conventions or miss events. |
| F7 | **Four oversized controllers** mix HTTP parsing, DB writes, external API calls, WebSocket emission, and response shaping. | `householdController` 635 lines, `householdLinkController` 548, `googleAuthController` 470, `eventController` 467 | Hard to test in isolation; one bug fix tends to touch unrelated concerns. |
| F8 | **Optimistic updates with no reconciliation strategy.** Mobile DataContext exposes `updateTask`, `updateQuest`, `updateMember`, etc. that patch local state. | [DataContext.tsx interface](momentum-mobile/src/contexts/DataContext.tsx) | Client/server divergence on conflict is left for the next refetch to resolve. |
| F9 | ~~No request-body schema validation is consistently applied.~~ **RESOLVED 2026-06-15 (G10).** `validateRequest` now wired into 11 route files covering every POST/PUT/PATCH with a body across tasks, quests, routines, wishlist, store, events, pin, households, household-link, notifications, meals. | — | (resolved) |
| F10 | **Render free-tier cold start built into the architecture** via `wakeUpApi()` in mobile [api.ts](momentum-mobile/src/services/api.ts) and 120s proxy timeouts in BFF. | [BFF server.ts](momentum-mobile-bff/src/server.ts) | Login intermittently slow / fails on first request after idle. Removable by upgrading hosting. |
| F11 | **WebSocket helper is partial.** `utils/websocketHelper.ts` exists but only `taskUpdated` and `member_updated` route through it. | Grep `io.to(.+).emit` returns 30+ direct call sites in controllers. | Emission shape and reliability are per-controller, not standardized. |
| F12 | **No observability.** No Sentry, no error tracking, no APM, no structured logging beyond `winston` in BFF. | grep of dependencies in all package.json files. | When something breaks for a user, you find out by them telling you. |
| F13 | ~~Two typography systems on mobile alone.~~ **RESOLVED 2026-06-15 (G3).** `theme/typography.ts` (dead `systemTypography`) deleted. Semantic `typography` tokens now sourced from `momentum-shared`. | — | (resolved) |
| F14 | **`pinController.verifyPin` is the only PIN endpoint that's public** (per [pin.ts:24-27](momentum-api/src/routes/pin.ts) — `setup-pin`/`change-pin`/`pin-status` use `protect`, only `verify-pin` does not). The 5-attempt-per-15-min rate limit keyed on `householdId:memberId` is the only protection. | route definition | Brute force is bounded but not impossible; depends on rate limit memory persistence (in-process Map, resets on restart). |

---

# Part 2 — Target (what we want it to be)

This half is the product vision. When Part 1 and Part 2 disagree, Part 2 wins and the work in [Part 3](#part-3--gap-analysis-part-1-vs-part-2) moves us toward it.

## 2.1 Who it's for

**A family with at least one ADHD member** — parent, child, or both — running on shared and personal devices.

Primary users:
- **A parent** (you) — has a phone or computer, wants oversight without nagging, wants to delegate cognitive load
- **Children** — have varying device access (a shared kitchen tablet, sometimes a personal phone, sometimes nothing)
- **A co-parent in a separate household** — needs to see/share *some* of the family's data without surrendering control of everything

The kitchen tablet kiosk is a first-class surface, not an afterthought. It runs unattended for hours and shows live state to whoever walks by.

## 2.2 What it does

Momentum is **one app for running a family**. It replaces:
- Sticker charts and chore wheels (Tasks, Routines, Streaks)
- Allowance ledgers and reward catalogs (Points, Store, Wishlist)
- Shared family calendars on the fridge (Calendar with Google Calendar sync)
- Meal planning whiteboards (MealPlan, Recipes, Restaurants, mandatory rating)
- Co-parenting handoff documents (HouseholdLink + Mandatory Consensus Protocol)

The unifying idea: **friction kills follow-through for ADHD families.** Every feature is judged on how much friction it removes for the family member with the least executive function in the room.

## 2.3 Design philosophy

Preserved from the prior `DESIGN_PHILOSOPHY.md` because it's still right:

> **"Disney Adult with ADHD."** Extremely functional, but engaging, tactile, and visually rewarding. Structured whimsy, not chaos. Premium polish, not cutesy. Tactile feedback (buttons feel satisfying). Immersive theming (the household's color is everywhere, not just the logo).

> **"High dopamine, low friction."** Reward early and often. One thing at a time — focus modes truly hide distractions. Color-code meaningfully (each family member has a distinct color). Icons over text where possible. Big primary actions. **Glanceability** — 2 seconds of looking should answer "who is doing what, what's next." Forgiving UI — Undo everywhere, clear empty states, never punish a mistake.

This is aspirational vs. the current state. See [Part 3](#part-3--gap-analysis-part-1-vs-part-2).

## 2.4 UX principles

These are the rules the app should obey, on every surface:

1. **Same action, same name, same feel.** "Complete task" on mobile, web, and kiosk produces the same animation, the same haptic/sound, the same confirmation copy, the same color of green.
2. **One canonical state.** The screen reflects the server, period. Optimistic UI is allowed but must reconcile cleanly when the server disagrees — never silently revert without telling the user.
3. **Predictable feedback for every action.** Loading, success, failure, and empty states all have a defined shape that every screen uses.
4. **No dead ends.** Every error explains what happened in plain language and shows what to do next.
5. **Glanceable hierarchy.** The thing the user most likely needs is the biggest, brightest, most obvious element on the screen.
6. **Quiet by default, loud when it matters.** Notifications, badges, sounds are reserved for things the user actually needs. Background activity is silent.
7. **Resumable.** Any flow that can be interrupted (a kid wanders off mid-PIN entry, a parent puts their phone down mid-task) resumes where they left off, not at the start.
8. **Cross-surface continuity.** Start a task on mobile, finish it on the kitchen tablet, see it confirmed on web — all without thinking.

## 2.5 Quality bar

Concrete bar the codebase should meet:

| Dimension | Target |
|---|---|
| Test coverage | Integration tests on the **top 10 user flows** at minimum: signup, Google sign-in, onboarding, create task, complete task, approve task, claim quest, link households, propose consensus change, calendar event create/edit/delete. Unit tests for every service. |
| Error tracking | Sentry (or equivalent) in all 5 packages. Every uncaught error tagged with `householdId`, `userId`, `route`. |
| Data integrity | Dual-storage (Mongo + Google Calendar) reconciled by an explicit outbox with idempotency keys. No "freshness windows." |
| Client state | One library (TanStack Query or equivalent) for server state on both web and mobile. React Contexts only for genuinely-local state (theme, current screen). |
| Design tokens | One source — in `momentum-shared/tokens/` — consumed by web (CSS-var generation at build) and mobile (TS import). Drift is structurally impossible. |
| Feedback patterns | Shared `<EmptyState>`, `<Loading>`, `<ErrorBanner>`, `<SuccessToast>` *contracts* in `momentum-shared/components/feedback/`. Each platform implements the contract. |
| Latency | First meaningful paint <2s on mobile after wake-up; <500ms perceived for any action via optimistic UI + reconciliation. |
| Observability of user-visible flows | Each top-10 flow has a named span + success counter so we can SEE when it breaks. |
| Hosting | Off Render free tier. No `wakeUpApi()` workarounds. |

## 2.6 Feature map

What the product should include. Some are built, some are partial, some are unbuilt — see [Part 3](#part-3--gap-analysis-part-1-vs-part-2).

### Identity & household
- Email/password and Google sign-in (✅ built)
- 4-digit PIN for shared-device profile switching (✅ built)
- Onboarding that gets a new user to a usable home screen in <60s (⚠️ partial — 230-line `completeOnboarding` does a lot but error paths are uneven)
- Multi-household linking with the **Mandatory Consensus Protocol** (a setting changes only when *both* parents agree) (✅ built in data model, partial in UI)
- Invite codes for joining existing households (✅ built)

### The motivation engine
- **Tasks** — parent-assigned, with points and approval flow (✅)
- **Quests** — opt-in extras with claim/complete/approve and recurrence (✅)
- **Routines** — daily checklists segmented by time-of-day (morning/noon/night), auto-reset (✅)
- **Streaks** with multipliers on point values (per `pointsService`) (⚠️ partial — multipliers exist, streak math reportedly extracted to `streakCalculator.ts`, needs verification)
- **Store** — parent stocks rewards, anyone with points can purchase (✅)
- **Wishlist** — personal long-term goals, parents can mark purchased (✅)
- **Transactions** — full point ledger (✅)

### Calendar
- Personal + family calendars per member, synced bidirectionally with Google Calendar (✅ built, fragile per F2)
- **Smart routing**: 0 attendees → parent's personal calendar; 1 attendee → that person's calendar; 2+ → family calendar (✅ built)
- Color-coded by attendee (✅ built; color persistence is the source of multiple bugs per BUG_LOG)
- Editable on all three surfaces (mobile, web, kiosk) (⚠️ partial)

### Meals
- Recipes + Restaurants library (✅)
- Weekly meal planning by day + meal-type (✅)
- **Mandatory rating** after a meal happens (✅ data model, ❓ UI surfacing)

### Notifications
- In-app feed + push tokens (✅ built, push delivery integration unclear)
- Parent-to-child reminders that the parent triggers explicitly (✅)

### Real-time
- Every change visible in the household sees all surfaces within ~1s (✅ via Socket.IO, ⚠️ payload shapes inconsistent per F6)

### Kitchen kiosk
- Always-on view of who's doing what, what's next, today's meals, who's earning points
- PIN-gated parent overrides
- (✅ web `/kiosk` components exist — 19 files — depth and reliability not yet verified)

### Co-parenting governance
- Per-link sharing settings (which tasks/quests/routines visible to the other household)
- Propose/approve/reject change flow with audit trail (✅ built in [householdLinkController.ts](momentum-api/src/controllers/householdLinkController.ts), UI surfacing TBD)

### Focus mode (referenced in DESIGN_PHILOSOPHY)
- Strip the UI to the next single task; hide all other surface area
- (⚠️ `momentum-web/app/components/focus/` exists with 2 files; mobile state unclear)

## 2.7 Explicit non-goals

What we are NOT trying to do:

- **Social features** — no following, no leaderboards across families, no public sharing
- **AI-generated content** for tasks/quests/recipes — explicit human authoring only
- **Calendar integrations beyond Google** for v1 (no iCloud, Outlook, CalDAV)
- **Payments / real money** — points are internal, not convertible
- **Educational content** — this is a household management app, not a learning app
- **Stress-inducing automation** — no auto-assigning tasks, no nagging algorithms. Per DESIGN_PHILOSOPHY: "Controlled Reminders: Automation is strictly manual to prevent stress-inducing passive notification loops on child profiles."

---

# Part 3 — Gap analysis (Part 1 vs Part 2)

The delta between what's built and what we want it to be. This is the working roadmap — ordered by *leverage*, not by *visibility*.

| # | Gap | Status | Maps to | Effort | Risk if skipped |
|---|---|---|---|---|---|
| **G1** | **No tests on the top 10 flows** | 🟡 PARTIAL — 42 integration tests cover signup/login/`/me`/JWT-protect (12), PIN setup/verify/change/status (15), Task CRUD + isolation (10), plus pre-existing health (1) + notification (4) suites. Remaining: Google sign-in, onboarding-complete, task completion/approve/reject, quest claim/complete/approve, household link flows, calendar event CRUD. Test infrastructure (`tests/setup.ts`, `tests/helpers/{db,auth}.ts`, jest config) is in place — any new flow is a single test file using `connectTestDb()`/`signUpParent()`. | [§2.5 quality bar](#25-quality-bar), [F1](#111-known-fragility--from-code-not-from-logs) | M (started) | Every other fix risks regressing something else. Foundation. |
| **G2** | **Server state managed by 4 ad-hoc React Contexts** instead of a real cache | ⬜ TODO | [F3, F8, §2.4 principle 2/3](#24-ux-principles) | M | The "wrong color, has to refresh, stale data" UX feel persists. |
| **G3** | **Three design-token sources drift** | ✅ DONE — Source of truth in [`momentum-shared/tokens/`](momentum-shared/tokens). **Mobile migrated:** [`momentum-mobile/src/theme/bentoTokens.ts`](momentum-mobile/src/theme/bentoTokens.ts) is now a 30-line re-export shim from `momentum-shared`; the legacy `theme/colors.ts` (Tailwind ramps, dead code) and `theme/typography.ts` (unused `systemTypography`) are deleted; mobile-only layout config moved to `theme/layout.ts`. No consumer imports changed because the shim preserves the `bentoPalette` / `familyPalette` names. **Web migrated:** [`momentum-web/app/global.css`](momentum-web/app/global.css) aligned to canonical values (previously divergent `success` `#16A34A` → `#10B981` and `error` `#DC2626` → `#EF4444`). **Drift is now structurally impossible** via [`momentum-web/__tests__/design-tokens-drift.test.ts`](momentum-web/__tests__/design-tokens-drift.test.ts) — 32 assertions parse global.css and compare every CSS variable to the shared token. CI fails on any future drift in either direction. | [F4, F13, §2.5](#25-quality-bar) | (resolved) | (resolved) |
| **G4** | **Dual-storage has no transaction model** | ⬜ TODO | [F2, §2.5](#25-quality-bar) | L | Recurring calendar bugs (color reverting, events disappearing, race conditions) keep coming back. |
| **G5** | **4 oversized controllers** mixing 6 concerns each | ⬜ TODO | [F7](#111-known-fragility--from-code-not-from-logs) | M | Service layer doesn't exist; logic duplicated across controllers (e.g., 3 implementations of "create household"). |
| **G6** | **No shared feedback primitives** (loading/empty/error/success) | ⬜ TODO | [§2.4 principle 3](#24-ux-principles) | M | Every screen invents its own; user experience inconsistent. |
| **G7** | **Web vs mobile pattern divergence**: web is modal-heavy, mobile is sheet/screen-based for the same flows | ⬜ TODO | [§2.4 principle 1, §2.4 principle 8](#24-ux-principles) | L | "Same action, same feel" is impossible until rendering contracts are aligned. |
| **G8** | **No observability** (no Sentry, no APM) | 🟡 PARTIAL — Sentry wired into API, BFF, Mobile, and Web (4/5 packages — shared is logic-only, no Sentry needed). All wiring is env-driven (`SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`): unset = no-op, so local dev needs zero config. API attaches `userId` + `householdId` tags to every authenticated request via [authMiddleware](momentum-api/src/middleware/authMiddleware.ts); BFF does the same opportunistically from the Bearer token. Each service tagged with its name so events land in separate buckets. **To activate:** set the DSN env vars; for mobile add `"@sentry/react-native"` to `app.json` plugins and EAS-prebuild; for web set `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` in CI for source-map upload. | [F12, §2.5](#25-quality-bar) | S (wired, not activated) | We learn about breakage from users complaining. |
| **G9** | **WebSocket event naming inconsistency** + only 2 events route through helper | ⬜ TODO | [F6, F11](#111-known-fragility--from-code-not-from-logs) | S | Clients need defensive handlers for both naming conventions. |
| **G10** | **Request validation middleware exists but isn't wired** | ✅ DONE (modulo WIP) — `validateRequest({ body: { ... } })` wired into all writable route files: [tasks](momentum-api/src/routes/taskRoutes.ts), [quests](momentum-api/src/routes/questRoutes.ts), [routines](momentum-api/src/routes/routineRoutes.ts), [wishlist](momentum-api/src/routes/wishlistRoutes.ts), [store-items](momentum-api/src/routes/storeItemRoutes.ts), [events](momentum-api/src/routes/eventRoutes.ts), [pin](momentum-api/src/routes/pin.ts), [households](momentum-api/src/routes/householdRoutes.ts), [household-link](momentum-api/src/routes/householdLinkRoutes.ts), [notifications](momentum-api/src/routes/notificationRoutes.ts), [meals](momentum-api/src/routes/mealRoutes.ts) — 11 route files, ~30 validators covering every POST/PUT/PATCH with a body. Enum constraints checked for `timeOfDay`, `role`, `mealType`, `itemType`, `priority`; numeric ranges for `pointsCost`, `cost`, `rating`; date parsability for event/meal start/end; 4-digit PIN format. Type-check clean, all 42 tests still green. **Skipped only:** `authRoutes.ts` (in WIP); `calendarManagementRoutes.ts` / `googleCalendarRoutes.ts` (OAuth-specific, lower priority). | [F9](#111-known-fragility--from-code-not-from-logs) | (resolved) | (resolved) |
| **G11** | **BFF `members.ts` calls `/households/me` which doesn't exist** | ✅ DONE — [`momentum-mobile-bff/src/routes/members.ts`](momentum-mobile-bff/src/routes/members.ts) now calls the actual `/households` endpoint, propagates upstream errors instead of swallowing them, and fixes the response-shape parsing (`data.data.memberProfiles` not `data.data.household.memberProfiles`). | [F5](#111-known-fragility--from-code-not-from-logs) | XS | (resolved) |
| **G12** | **Render free-tier built into architecture** via `wakeUpApi()` | ⬜ TODO | [F10, §2.5](#25-quality-bar) | XS (money) | Intermittent login slowness; coupling to specific provider quirks. |
| **G13** | **Onboarding `completeOnboarding` is 230 lines doing 5 things** | ⬜ TODO — blocked on WIP commit (file is `googleAuthController.ts`, not WIP, but its route lives in `authRoutes.ts` which IS WIP) | [§2.6 feature map, F7](#26-feature-map) | M | Onboarding error paths are uneven; "orphaned user" / "zombie household" bugs traceable to this. |
| **G14** | **PIN setup/change require auth; verify is public** | ⬜ TODO | [F14](#111-known-fragility--from-code-not-from-logs) | XS | Brute force is bounded by in-memory rate limit only. Add Redis-backed limit or token-bucket persistence. |
| **G15** | **No copy/microcopy strings shared** | ⬜ TODO | [§2.4 principle 1](#24-ux-principles) | S | "Complete task" might be "Done!" on one surface and "Mark complete" on another. |
| **G16** | **Focus mode** mentioned in philosophy but partial in code | ⬜ TODO | [§2.6, DESIGN_PHILOSOPHY](#26-feature-map) | M | Core ADHD feature unrealized. |

### Resolved during this work session (2026-06-14)

- **Security fix landed alongside G1:** the auth signup test caught a real bug — `POST /api/v1/auth/signup` was returning the bcrypt password hash in the response body. Fixed at the schema level in [`momentum-api/src/models/FamilyMember.ts`](momentum-api/src/models/FamilyMember.ts) by adding `toJSON`/`toObject` transforms that strip `password`, `pin`, and `googleCalendar` from any serialization. Means no future controller can leak these by accident either.
- **G11 resolved.** Members endpoint no longer hits a dead route.
- **Test foundation in place.** `npm test` (in `momentum-api/`) now runs 42 integration tests against in-memory MongoDB in ~18s. Adding a new test for any other flow is a single file using the helpers in `tests/helpers/`.
- **Sentry wired (G8 partial).** Init code present in all 4 long-lived packages with env-driven activation. Type-checks clean on API + BFF; 42 tests still green after wiring.
- **Design-token unification done (G3).** `momentum-shared/tokens/` is the source of truth. Mobile theme files migrated to thin re-export shim; legacy duplicates deleted. Web `global.css` aligned and guarded by 32 drift-detection tests that fail CI on hand-edits. Both divergent semantic colors (`success`, `error`) now resolve to the canonical hex on every surface.
- **Request validation wiring done (G10).** ~30 validators across 11 route files. Every POST/PUT/PATCH body in the writable surface is now type/enum/range-checked before any controller code runs.

### Recommended sequence

The order matters more than the speed. Each row sets up the next.

1. **G1** (tests on top 10 flows) — without this, everything else risks silent regression.
2. **G8** (Sentry) — cheap, instant payoff for the rest of the work.
3. **G10** (wire `validateRequest` to routes) and **G11** (fix `/households/me`) — both small, both eliminate a class of silent failure.
4. **G3** (design tokens in `momentum-shared`) — small but unlocks G6 and G7.
5. **G2** (TanStack Query replacing four Contexts) — biggest UX-feel improvement per unit of effort.
6. **G5** (extract service layer) — sets up G7 and G13.
7. **G13** (split onboarding) — fragility-source elimination.
8. **G4** (dual-storage outbox) — biggest bug-class elimination, do it after tests exist.
9. **G6** (shared feedback primitives) and **G15** (shared copy) — UX unification on a stable foundation.
10. **G7** (web/mobile flow parity) — the *feels-unified* moment; depends on everything above.
11. **G9, G14, G12, G16** — cleanup and the focus-mode build, in any order.

---

## Maintaining this document

- **Part 1 (As-Built)** must be updated whenever a route, model, controller, service, or external integration changes. If you touch the code, touch this. The `file:line` citations must keep working — when you rename a file, update its citation.
- **Part 2 (Target)** changes when the product vision changes — not when implementation changes. A new feature idea goes in §2.6. A new principle goes in §2.4. Removing a feature goes in §2.7.
- **Part 3 (Gap)** is a derivative — when Part 1 catches up to Part 2 on a row, delete the row. When Part 2 grows, add a new gap.

When in doubt: **Part 1 is grep-able from code. Part 2 is what we agreed on. Part 3 is what's left to do.**
