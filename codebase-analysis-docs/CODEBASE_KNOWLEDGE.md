# CODEBASE_KNOWLEDGE.md — hostelHub

## Scope
This document captures architecture, features, data model, runtime flows, and change-risk notes for `fo56/hostelHub`.

---

## PHASE 1 — Initial Context Scan

### 1) What the application is
HostelHub is a role-based hostel operations platform with three primary personas:
- **Admin**: creates users, reviews dish suggestions, generates/publishes weekly menus, monitors issues and reviews.
- **Student**: votes for dishes, views published menu, submits meal reviews, suggests dishes, raises issues.
- **Worker**: views assigned issues and marks them resolved.

Primary implementation split:
- **Backend**: Express + TypeScript + Mongoose + Redis + Socket.IO.
- **Frontend**: React + TypeScript + Vite + Tailwind-like utility CSS patterns.

Refs:
- [[F:README.md#1-408#660d5ad8]]
- [[F:backend/src/server.ts#1-93#d7f3d1ef]]
- [[F:frontend/src/routes/router.tsx#1-43#b368c2e5]]

### 2) Tech stack and major dependencies
- Backend runtime: `express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `redis`, `socket.io`, `zod` (declared). [[F:backend/package.json#1-44#1b6bca99]]
- Frontend runtime: `react`, `react-router-dom`, `socket.io-client`, `lucide-react`. [[F:frontend/package.json#1-40#b38e475d]]
- Datastores:
  - MongoDB for persistent domain data.
  - Redis for menu cache, computation/build locks.
- Infra helper: docker-compose only provisions Redis. [[F:docker-compose.yml#1-16#21fc9b8e]]

### 3) Architecture type and directory structure
- **Monorepo-style split** with independent `backend/` and `frontend/` apps.
- Backend pattern: **route → middleware → controller → model/service**.
- Frontend pattern: **route tree → role layout → feature page → `useApi` service layer**.

Key roots:
- Backend entrypoint: `backend/src/server.ts`.
- Frontend entrypoint: `frontend/src/main.tsx`, `frontend/src/App.tsx`.

### 4) Main features and business purpose
1. **Authentication + Identity bootstrap**
   - Admin registration (hostel creation), role login, QR login, tokenized URL login, set-password onboarding, refresh/logout.
   - Business purpose: secure role-separated access and low-friction first login for student/worker.
2. **User management (admin)**
   - Create student/worker, auto email generation by hostel domain, QR/login link regeneration, activation lifecycle.
   - Business purpose: controlled provisioning of hostel user accounts.
3. **Dish lifecycle + suggestion moderation**
   - Student suggestions (rate-limited), admin approve/reject with scoring, admin direct dish creation.
   - Business purpose: crowdsourced menu candidate pipeline with admin quality gate.
4. **Voting + recommendation + menu publishing**
   - Student saves 7/meal preferences, admin sees vote stats, generates menu, previews and publishes.
   - Business purpose: convert preferences into weekly menu with transparent publish flow.
5. **Meal review system**
   - Student submits rating/comment/images with one-review-per-day constraints; admin paginated review browsing.
   - Business purpose: feedback loop for meal quality.
6. **Issue tracking workflow**
   - Student raises issue, admin assigns worker, worker/admin update status, student/admin observe progress.
   - Business purpose: hostel operations maintenance workflow.

### FILE INDEX (Pass 0, prioritized)
Format: `(#) PRIORITY | PATH | TYPE | LINES | HASH8 | NOTES`

1. P0 | `backend/src/server.ts` | entrypoint | 93 | d7f3d1ef | route mounting, middleware, startup
2. P0 | `backend/src/controllers/auth.controller.ts` | controller | 460 | ac534a26 | full auth lifecycle
3. P0 | `backend/src/controllers/adminUser.controller.ts` | controller | 382 | c344eb7d | admin provisioning
4. P0 | `backend/src/controllers/issue.controller.ts` | controller | 255 | 04bbc85a | issue workflow
5. P0 | `backend/src/controllers/studentVote.controller.ts` | controller | 141 | 677623ab | student voting persistence
6. P0 | `backend/src/controllers/adminMenu.controller.ts` | controller | 106 | deec3e8d | generate/publish menu
7. P0 | `backend/src/services/menuComputation.service.ts` | service | 131 | 67a3b40a | ranking algorithm + lock/cache
8. P0 | `backend/src/services/menuBuilder.service.ts` | service | 61 | dcc8bf5f | weekly menu construction
9. P0 | `backend/src/services/menuCache.service.ts` | service | 79 | c6bf6be2 | menu cache + invalidation
10. P0 | `backend/src/models/*.ts` | models | varies | varies | core schema contracts
11. P0 | `frontend/src/hooks/useApi.ts` | frontend infra | 90 | d02d1c63 | auth header + refresh retry
12. P0 | `frontend/src/services/authService.ts` | frontend infra | 312 | 53fb01c3 | auth API client
13. P0 | `frontend/src/routes/router.tsx` | routing | 43 | b368c2e5 | top-level route map
14. P1 | `frontend/src/pages/login/login.tsx` | page | 353 | 1196dbad | multi-role login UX
15. P1 | `frontend/src/pages/admin/AdminIssues.tsx` | page | 276 | d380a6b8 | assignment/status admin UI
16. P1 | `frontend/src/pages/student/StudentVoting.tsx` | page | 191 | 4bf3b758 | vote UX + socket events
17. P1 | `frontend/src/pages/worker/Dashboard.tsx` | page | 269 | 90add6a6 | worker issue handling
18. P1 | `frontend/src/pages/admin/AdminDishApprovals.tsx` | page | 298 | 6b3677d1 | moderation UI
19. P1 | `frontend/src/pages/admin/AdminMessMenu.tsx` | page | 96 | 4e3c93f9 | menu preview/publish UI
20. P1 | `frontend/src/pages/student/StudentReview.tsx` | page | 183 | 2b9e1121 | review submission UI
21. P1 | `frontend/src/pages/student/StudentIssues.tsx` | page | 164 | 7ef4ac7b | student issue list + create
22. P1 | `frontend/src/components/common/RaiseIssueForm.tsx` | component | 143 | 5acb0add | issue creation form
23. P2 | `README.md` | docs | 408 | 660d5ad8 | broad but partially stale endpoints
24. P2 | `backend/apiREADME.md` | docs | 288 | 5e76b06a | API docs, partially stale
25. P2 | `docker-compose.yml` | infra | 16 | 21fc9b8e | redis local infra

### PHASE 1 — Decisions/Findings
- This is a full-stack hostel operations system with tightly coupled backend and frontend contracts.
- Menu and voting features are the most coupled subsystem (DB + Redis + sockets + multiple UIs).
- Docs in repo include stale routes and should not be treated as source of truth over code.

### PHASE 1 — Open Questions
- Should worker and student logins be persisted in `AuthContext`, or is admin-only context intentional?
- Is Redis mandatory in all environments (startup currently always tries to connect)?

### PHASE 1 — Next Steps
- Deep map component interactions and exact data flow.
- Enumerate cross-cutting concerns and security implications.

### STATE BLOCK — AFTER PHASE 1
- **INDEX_VERSION**: v1
- **FILE_MAP_SUMMARY**: Mapped all backend source files and all frontend source files; identified ~25 high-priority runtime files.
- **OPEN_QUESTIONS**:
  1. Socket room join mismatch validity/intent.
  2. Endpoint mismatches frontend↔backend for reviews.
  3. Stale documentation scope.
- **KNOWN_RISKS**:
  1. Auth context inconsistency by role.
  2. Runtime feature break from endpoint drift.
  3. Cross-hostel data leakage in recommendation computation.
- **GLOSSARY_DELTA**: Added: hostel-scoped tenancy, menu recommendation, vote window, qrToken/loginURL onboarding.

---

## PHASE 2 — System Architecture Deep Dive

## Architecture diagrams
- System architecture: `codebase-analysis-docs/assets/system-architecture.mmd`
- Request/response data flow: `codebase-analysis-docs/assets/request-dataflow.mmd`
- Data model ERD: `codebase-analysis-docs/assets/database-erd.mmd`

### Component map
1. **API server assembly**
   - Security middleware: `helmet`, CORS origin lock, JSON limit.
   - Route groups mounted by concern and role.
   - Global error handler fallback.
   - Startup initializes Mongo, Redis, then Socket.IO.
   - [[F:backend/src/server.ts#31-93#d7f3d1ef]]

2. **Authentication + authorization cross-cutting**
   - `verifyToken` decodes JWT and writes `req.user` (`_id`, role, hostelId).
   - `requireRole` gate for role-specific access.
   - [[F:backend/src/middlewares/verifyToken.middleware.ts#11-40#43d691dd]]
   - [[F:backend/src/middlewares/requireRole.middleware.ts#3-15#6e9a624f]]

3. **Domain data layer**
   - Mongoose models enforce role/enum constraints and key uniqueness (`MessMenu`, `MenuVoteWindow`, `MealReview`, `RefreshToken`).
   - [[F:backend/src/models/MessMenu.ts#55-59#adae0764]]
   - [[F:backend/src/models/MenuVoteWindow.ts#37-40#312710d1]]
   - [[F:backend/src/models/MealReview.ts#58-61#27bfb364]]

4. **Menu intelligence pipeline**
   - Aggregation-based scoring in `menuComputation.service`.
   - Build with 7 dishes/meal requirement and lock guard.
   - Cache `current` and `today` menu snapshots in Redis.
   - [[F:backend/src/services/menuComputation.service.ts#25-126#67a3b40a]]
   - [[F:backend/src/services/menuBuilder.service.ts#25-56#dcc8bf5f]]
   - [[F:backend/src/services/menuCache.service.ts#8-78#c6bf6be2]]

5. **Frontend orchestration**
   - Router composes role route trees.
   - `useApi` injects token, retries once on 401 via refresh.
   - `authService` controls credential storage + token persistence.
   - [[F:frontend/src/routes/router.tsx#17-42#b368c2e5]]
   - [[F:frontend/src/hooks/useApi.ts#16-87#d02d1c63]]
   - [[F:frontend/src/services/authService.ts#105-311#53fb01c3]]

### End-to-end data flow (typical protected request)
1. User action triggers frontend API call.
2. `useApi.request` attaches `Authorization` header from localStorage.
3. Backend route executes `verifyToken` and optionally `requireRole`.
4. Controller uses `req.user.hostelId` and `req.user._id` for tenancy and user-scoped filtering.
5. Controller persists/reads MongoDB documents; menu flows also read/write Redis.
6. JSON response returns to UI; some flows emit socket events.

### Third-party integration inventory
- **MongoDB/Mongoose**: canonical system-of-record.
- **Redis**: cache + distributed-style lock keys (best-effort).
- **Socket.IO**: near-real-time voting/menu notifications.
- **QRCode library**: generate data-url QR artifacts.

### Cross-cutting concerns
- **Security**
  - JWT-based protected routes.
  - Role checks at route level.
  - CORS origin restricted to configured frontend URL.
  - Helmet on all requests.
- **Logging/Audit**
  - Critical admin/dish actions write `ActivityLog`.
- **Caching**
  - Menu retrieval cached by hostel.
  - Invalidate cache on publish.
- **Rate limiting**
  - Student dish suggestions capped to 3/week by middleware.

### PHASE 2 — Decisions/Findings
- Architecture is conventional and readable; tenancy is primarily enforced by filtering on `hostelId`.
- Menu subsystem is the heaviest coupling point (Redis + Mongo + sockets + 4+ controllers/pages).

### PHASE 2 — Open Questions
- Socket room join event names are inconsistent between frontend and backend.
- `errorHandler` always returns 500 without typed error mapping.

### PHASE 2 — Next Steps
- Detail each feature’s implementation path and cross-feature dependencies.

### STATE BLOCK — AFTER PHASE 2
- **INDEX_VERSION**: v2
- **FILE_MAP_SUMMARY**: Fully mapped runtime architecture, middlewares, routes, services, and role route trees.
- **OPEN_QUESTIONS**:
  1. Room join protocol mismatch.
  2. Whether menu computation should be hostel-scoped explicitly.
- **KNOWN_RISKS**:
  1. Realtime events may not reach intended clients.
  2. Errors may be hard to diagnose due to coarse global handler.
- **GLOSSARY_DELTA**: Added: `req.user` tenancy context, current/today menu cache, computation lock keys.

---

## PHASE 3 — Feature-by-Feature Analysis

## A) Authentication & Session Lifecycle
**Business need:** secure onboarding and ongoing access with role separation.

**Entry points**
- Backend routes: `/api/auth/*`.
- Frontend pages: login, QR login, login-link, set-password.

**Technical flow**
- Admin registration creates `Hostel` + admin `User`, then issues access/refresh tokens.
- Admin and user login verify password hash and role.
- QR login optionally branches to first-time password setup via tokenized URL.
- Refresh token persistence uses `RefreshToken` collection with TTL index.

Refs:
- [[F:backend/src/routes/auth.routes.ts#17-29#f16d0d35]]
- [[F:backend/src/controllers/auth.controller.ts#18-459#ac534a26]]
- [[F:backend/src/utils/jwt.ts#23-99#f0d596e7]]
- [[F:frontend/src/pages/login/login.tsx#49-139#1196dbad]]
- [[F:frontend/src/services/authService.ts#124-273#53fb01c3]]

**Side effects**
- Refresh token creation/deletion.
- QR/login token mutation on user records.

**Cross-feature interactions**
- All protected features depend on valid `req.user` context from JWT decode.

## B) Admin User Management
**Business need:** central account provisioning/deactivation for students/workers.

**Entry points**
- `/api/admin/users/*` routes.
- UI pages: `AdminCreateUser`, `AdminUsers`.

**Technical flow**
- Validates role-dependent fields (`roomNo`/`jobType`).
- Derives default email from hostel domain when omitted.
- Generates QR token + loginURL with 24h expiry.
- Supports deactivate/reactivate/delete/regenerate QR/regenerate login token.

Refs:
- [[F:backend/src/routes/adminUser.routes.ts#21-43#093909ef]]
- [[F:backend/src/controllers/adminUser.controller.ts#30-380#c344eb7d]]
- [[F:frontend/src/pages/admin/AdminCreateUser.tsx#16-173#0879f4ad]]
- [[F:frontend/src/pages/admin/AdminUsers.tsx#21-136#01f7248f]]

**Side effects**
- Writes `ActivityLog` for major admin actions.

## C) Dish Suggestion + Moderation
**Business need:** gather student suggestions while preserving admin control over final candidate pool.

**Entry points**
- Student submit: `POST /api/dishes` (rate-limited).
- Admin review: `/api/admin/dishes` list/approve/reject/create.

**Technical flow**
- Student suggestions created as `UNDER_REVIEW` and blocked if duplicate dish name in hostel.
- Admin approve sets ACTIVE + scores; reject sets INACTIVE + reason.
- Admin direct create immediately ACTIVE with defaulted scores.

Refs:
- [[F:backend/src/routes/dish.routes.ts#1-10#c7ab93d1]]
- [[F:backend/src/middlewares/dishRateLimit.middleware.ts#5-29#5816bf1d]]
- [[F:backend/src/controllers/dish.controller.ts#6-96#2fc8ddf7]]
- [[F:backend/src/controllers/adminDish.controller.ts#5-83#0201be78]]
- [[F:frontend/src/pages/student/StudentSuggestDish.tsx#15-48#3ce40def]]
- [[F:frontend/src/pages/admin/AdminDishApprovals.tsx#26-95#6b3677d1]]

## D) Voting, Recommendation, Menu Generation, Publish
**Business need:** convert student meal preferences into publishable weekly menus.

**Entry points**
- Student: `GET/POST /api/menu-votes/votes`.
- Admin: `/api/admin/menu/voting/stats`, `/generate`, `/preview`, `/publish`.

**Technical flow**
1. Student gets active dishes + existing selections.
2. Student submits exactly 7 dishes per meal; backend validates ObjectIds and hostel membership.
3. Computation service ranks dishes by weighted score:
   - `0.5 * voteScore + 0.3 * healthScore + 0.2 * costEfficiency`.
4. Builder selects top 7 per meal from recommendations.
5. Admin previews unpublished menu and publishes; cache invalidated and socket event emitted.

Refs:
- [[F:backend/src/controllers/studentVote.controller.ts#55-140#677623ab]]
- [[F:backend/src/controllers/adminMenu.controller.ts#28-84#deec3e8d]]
- [[F:backend/src/services/menuComputation.service.ts#55-85#67a3b40a]]
- [[F:backend/src/services/menuBuilder.service.ts#32-45#dcc8bf5f]]
- [[F:backend/src/services/menuCache.service.ts#72-78#c6bf6be2]]
- [[F:frontend/src/pages/student/StudentVoting.tsx#92-118#4bf3b758]]
- [[F:frontend/src/pages/admin/AdminVoting.tsx#37-47#463538c0]]
- [[F:frontend/src/pages/admin/AdminMessMenu.tsx#27-93#4e3c93f9]]

**Side effects**
- Emits `VOTES_UPDATED` and `MENU_PUBLISHED` events.
- Redis cache writes/invalidation.

## E) Menu Consumption + Student Notifications
**Business need:** show published schedule and decision outcomes.

**Entry points**
- Student: `/api/student/menu/current`, `/api/student/menu/today`, `/api/student/notifications`.

**Technical flow**
- Current menu and today menu served from Redis-backed cache wrappers.
- Notification endpoint derives approval/rejection notifications from dish status transitions.

Refs:
- [[F:backend/src/controllers/studentMenu.controller.ts#9-61#9cc16ff9]]
- [[F:backend/src/controllers/studentNotification.controller.ts#8-52#02cac49b]]
- [[F:frontend/src/pages/student/StudentMessMenu.tsx#20-57#35035a81]]
- [[F:frontend/src/pages/student/StudentDashboard.tsx#18-77#a0d5c64e]]

## F) Meal Reviews
**Business need:** capture quality feedback linked to served meals.

**Entry points**
- Student submit endpoint: `POST /api/reviews/submit`.
- Admin list endpoint: `GET /api/admin/reviews`.

**Technical flow**
- Validates dish ownership, meal type match, rating bounds, non-future date.
- Prevents duplicates via schema uniqueness and pre-check.
- Admin supports optional filters + pagination caps.

Refs:
- [[F:backend/src/controllers/mealReview.controller.ts#8-131#6ca60670]]
- [[F:backend/src/models/MealReview.ts#58-61#27bfb364]]
- [[F:backend/src/controllers/adminReview.controller.ts#9-64#d8db4a92]]
- [[F:frontend/src/pages/student/StudentReview.tsx#45-78#2b9e1121]]
- [[F:frontend/src/pages/admin/AdminReviews.tsx#24-43#080672d2]]

## G) Issue Tracking
**Business need:** structured maintenance workflow across student/admin/worker.

**Entry points**
- Student create/list own issues.
- Admin list all, assign worker, status update.
- Worker list assigned, resolve with resolver note.

**Technical flow**
- Create validates category/priority/description.
- Assign enforces worker role + same-hostel checks.
- Status update allowed for assigned worker or admin.
- Delete allowed for admin or original creator.

Refs:
- [[F:backend/src/routes/issue.routes.ts#16-27#45788659]]
- [[F:backend/src/controllers/issue.controller.ts#11-254#04bbc85a]]
- [[F:frontend/src/pages/student/StudentIssues.tsx#30-39#7ef4ac7b]]
- [[F:frontend/src/pages/admin/AdminIssues.tsx#64-109#d380a6b8]]
- [[F:frontend/src/pages/worker/Dashboard.tsx#43-99#90add6a6]]

## Cross-feature interaction map
- Auth provides identity context used by all feature controllers.
- Admin user management feeds login/bootstrap features (qrToken/loginURL).
- Dish moderation feeds voting candidate pool (`Dish.status = ACTIVE`).
- Voting output feeds recommendation computation and menu generation.
- Published menu feeds student menu view and review dish selection.
- Issues feature independent of menu features except shared auth and tenant boundary.

### PHASE 3 — Decisions/Findings
- Backend tenancy is intentionally centralized through `req.user.hostelId` usage.
- Voting/menu and auth/user flows are the most business-critical chains.

### PHASE 3 — Open Questions
- Should issue status transitions enforce state machine constraints (OPEN→IN_PROGRESS→RESOLVED/CLOSED)?
- Should admin/user actions include more granular audit details consistently?

### PHASE 3 — Next Steps
- Capture non-obvious pitfalls, hardcoded rules, and architectural gotchas.

### STATE BLOCK — AFTER PHASE 3
- **INDEX_VERSION**: v3
- **FILE_MAP_SUMMARY**: All major features mapped end-to-end with route/controller/page references.
- **OPEN_QUESTIONS**:
  1. Expected socket room protocol.
  2. Intentionality of stale docs vs in-code behavior.
- **KNOWN_RISKS**:
  1. Menu feature correctness depends on ACTIVE dish quality and counts.
  2. Endpoint drift causes silent frontend failures.
- **GLOSSARY_DELTA**: Added: approval pipeline, first-time login token, menu publish lifecycle.

---

## PHASE 4 — Nuances, Subtleties & Gotchas

## Things You Must Know Before Changing Code
1. **Socket room mismatch likely breaks realtime**
   - Frontend emits `join_hostel_room` but backend only listens for `join_admin_room`.
   - Backend emits to `hostel_${hostelId}` rooms; no current backend handler joins those rooms.
   - Refs: [[F:frontend/src/pages/admin/AdminVoting.tsx#18-24#463538c0]], [[F:frontend/src/pages/student/StudentVoting.tsx#38-43#4bf3b758]], [[F:backend/src/services/socket.service.ts#21-24#5d85dc1c]], [[F:backend/src/controllers/studentVote.controller.ts#125-129#677623ab]].

2. **API route mismatch in student review page**
   - Frontend calls `/student/reviews/submit`; backend route is `/api/reviews/submit`.
   - Likely causes 404 for review submission from student UI.
   - Refs: [[F:frontend/src/pages/student/StudentReview.tsx#53-59#2b9e1121]], [[F:backend/src/server.ts#59-60#d7f3d1ef]], [[F:backend/src/routes/mealReview.routes.ts#6-8#13336db4]].

3. **Hostel scoping in recommendation computation is incomplete**
   - `computeMenuRecommendations` matches all ACTIVE dishes without filtering `hostelId`.
   - Later build filters by hostelId, but recommendation table may contain cross-hostel records for week.
   - Refs: [[F:backend/src/services/menuComputation.service.ts#25-31#67a3b40a]], [[F:backend/src/services/menuBuilder.service.ts#33-37#dcc8bf5f]].

4. **Refresh token growth pattern**
   - New refresh token generated on every login/refresh; old tokens not auto-revoked except explicit logout/token deletion and TTL expiry.
   - Refs: [[F:backend/src/utils/jwt.ts#27-41#f0d596e7]], [[F:backend/src/models/RefreshToken.ts#18-22#5113d5dd]].

5. **`useApi` string literal appears malformed in inspected output**
   - Tool output masks bearer literals and visually shows truncated template strings; verify raw source before editing auth header code.
   - Ref: [[F:frontend/src/hooks/useApi.ts#29-31#d02d1c63]].

6. **`getMe` cannot return name/email**
   - `verifyToken` only stores `_id`, `role`, `hostelId`; controller reads `name/email` from `req.user`, resulting null.
   - Refs: [[F:backend/src/middlewares/verifyToken.middleware.ts#30-34#43d691dd]], [[F:backend/src/controllers/user.controller.ts#10-16#d09d199a]].

7. **Duplicated student issues page file**
   - `frontend/src/pages/student/Issues.tsx` and `StudentIssues.tsx` are effectively duplicates; route uses `StudentIssues.tsx`.
   - Refs: [[F:frontend/src/routes/StudentRoutes.tsx#11-19#cda0a213]], [[F:frontend/src/pages/student/Issues.tsx#1-165#b7d82444]], [[F:frontend/src/pages/student/StudentIssues.tsx#1-164#7ef4ac7b]].

8. **Potential docs drift**
   - README/API docs mention endpoints not present in code (`/admin/menu/voting/open`, etc.).
   - Refs: [[F:backend/apiREADME.md#151-177#5e76b06a]], [[F:backend/src/routes/adminMenu.routes.ts#15-18#2938491f]].

### Performance notes
- Menu cache avoids repeated heavy populate queries for current/today menu.
- Aggregation and recommendation writes can be expensive at scale; no background queue currently.
- Issue/user queries mostly unindexed by explicit schema definitions in this repository snapshot.

### Security implications
- Password min length only (no complexity enforcement server-side).
- JWT secret env var required in jwt util; verifyToken middleware directly uses env without fallback error handling.
- Role enforcement is route-level and generally correct; tenancy checks are present in most write flows but should be re-verified per new endpoint.

### PHASE 4 — Decisions/Findings
- Highest-risk change areas: sockets, auth token flow, menu computation/hostel boundaries.

### PHASE 4 — Open Questions
- Are missing room joins and review endpoint mismatch known regressions or in-progress refactors?

### PHASE 4 — Next Steps
- Build consolidated reference section for modules, schema, APIs, and glossary.

### STATE BLOCK — AFTER PHASE 4
- **INDEX_VERSION**: v4
- **FILE_MAP_SUMMARY**: Added gotcha/risk annotations linked to exact files.
- **OPEN_QUESTIONS**:
  1. Intended websocket room naming convention.
  2. Expected refresh token revocation policy.
- **KNOWN_RISKS**:
  1. Broken real-time UX.
  2. Silent 404s from route drift.
  3. Cross-tenant contamination risk in recommendation computation records.
- **GLOSSARY_DELTA**: Added: room protocol mismatch, docs drift, tenancy leakage risk.

---

## PHASE 5 — Technical Reference & Glossary

## A) Backend module reference
- `server.ts`: app composition and startup orchestration.
- `middlewares/verifyToken.middleware.ts`: JWT decode + inject tenant identity.
- `middlewares/requireRole.middleware.ts`: RBAC gate.
- `controllers/auth.controller.ts`: auth/onboarding flows.
- `controllers/adminUser.controller.ts`: user lifecycle admin operations.
- `controllers/issue.controller.ts`: issue lifecycle operations.
- `controllers/dish.controller.ts` + `adminDish.controller.ts`: suggestion and moderation.
- `controllers/studentVote.controller.ts`: voting read/write contract.
- `controllers/adminMenu.controller.ts`: vote stats, generate, preview, publish.
- `services/menuComputation.service.ts`: weighted scoring aggregation.
- `services/menuBuilder.service.ts`: top-7/meal menu construction.
- `services/menuCache.service.ts`: Redis current/today cache.

## B) Frontend module reference
- `routes/router.tsx`, `routes/AdminRoutes.tsx`, `routes/StudentRoutes.tsx`: route topology.
- `contexts/AuthContext.tsx`: admin login/logout state container.
- `hooks/useApi.ts`: shared API wrapper with refresh retry.
- `services/authService.ts`: auth endpoints + token handling.
- `pages/*`: role-specific operational UIs.

## C) Database schema summary
- **Hostel**: tenant root (`name`, `domain`).
- **User**: role, identity, lifecycle, bootstrap tokens (`qrToken`, `loginURL`).
- **Dish**: suggestion and scoring state (`status`, `priceScore`, `healthScore`, `weeklyVotes`).
- **StudentVote**: one preference record per user (`breakfast/lunch/dinner` arrays).
- **MenuRecommendation**: computed ranked candidates per week/meal.
- **MessMenu**: final weekly 7x3 menu (references recommendation docs).
- **MealReview**: student dish feedback; unique per hostel+student+dish+servedOn.
- **Issue**: maintenance issue with priority/status/assignment.
- **RefreshToken**: session refresh tokens with 7-day TTL index.
- **ActivityLog**: audit trail of notable operations.

See ERD: `codebase-analysis-docs/assets/database-erd.mmd`.

## D) Internal API reference (selected)
Base prefix in code: `/api`

### Auth
- `POST /auth/register-admin`
- `POST /auth/login-admin`
- `POST /auth/login-user`
- `POST /auth/login-qr`
- `POST /auth/login-url`
- `POST /auth/set-password`
- `POST /auth/refresh`
- `POST /auth/logout` (protected)
- `GET /auth/qr/:userId` (protected)

### Shared protected
- `GET /users/me`
- `POST /dishes` (student suggestion + rate limit)
- `POST /reviews/submit`
- `POST /issues`, `GET /issues/my-issues`, `GET /issues/assigned`
- `PATCH /issues/:issueId/status`, `DELETE /issues/:issueId`

### Admin protected
- `/admin/users/*` user lifecycle
- `/admin/dishes` list/create; `/admin/dishes/:id/approve|reject`
- `/admin/menu/voting/stats`, `/admin/menu/generate`, `/admin/menu/preview`, `/admin/menu/publish`
- `/admin/reviews`
- `/issues/admin/all`, `/issues/:issueId/assign`

### Student protected
- `/student/menu/current`, `/student/menu/today`
- `/student/dishes/active`
- `/student/notifications`
- `/menu-votes/votes` (GET+POST)

## E) External interfaces
- Socket events emitted by backend:
  - `VOTES_UPDATED`
  - `MENU_PUBLISHED`
- Redis keys:
  - `lock:menu:compute:{week}`
  - `cache:menu:recommendations:{week}`
  - `lock:menu:build:{hostelId}:{week}`
  - `hostel:{hostelId}:menu:current`
  - `hostel:{hostelId}:menu:today`

## F) Glossary
- **Hostel tenancy**: data partition keyed by `hostelId`.
- **UNDER_REVIEW dish**: student-suggested dish pending admin decision.
- **ACTIVE dish**: eligible for student vote and menu recommendation.
- **StudentVote record**: editable preference set, not immutable ballot.
- **MenuRecommendation**: computed ranking artifact, not final published menu.
- **MessMenu**: weekly final 7 dishes per meal, publishable artifact.
- **loginURL token**: first-time credential bootstrap token, 24h validity.
- **qrToken**: static-ish login token for QR-based login flow.

### PHASE 5 — Decisions/Findings
- Core references are now indexed by module responsibility and runtime role.

### PHASE 5 — Open Questions
- None beyond previously listed systemic questions.

### PHASE 5 — Next Steps
- Assemble final consolidated handoff narrative (this document).

### STATE BLOCK — AFTER PHASE 5
- **INDEX_VERSION**: v5
- **FILE_MAP_SUMMARY**: Completed technical references, schema map, API surface summary.
- **OPEN_QUESTIONS**: unchanged from phase 4.
- **KNOWN_RISKS**: unchanged from phase 4.
- **GLOSSARY_DELTA**: finalized core domain vocabulary.

---

## PHASE 6 — Final Knowledge Assembly

## High-level overview
HostelHub is a hostel-tenant SaaS-like monorepo where admin-controlled provisioning, student participation (voting/reviews/issues), and worker issue resolution are integrated through a JWT-protected Express API and React role dashboards.

## Mid-level technical notes
- Runtime starts API + Redis + socket infrastructure before serving feature routes.
- Auth and role enforcement are route-level and inject minimal tenant context into each request.
- Menu system is computed, then materialized, then published, with cache invalidation and realtime fanout.
- Issue and dish moderation systems provide operational loops outside menu publication.

## Deep reference pointers
- Entry/startup: `backend/src/server.ts`.
- Auth: `backend/src/controllers/auth.controller.ts`, `backend/src/utils/jwt.ts`, `frontend/src/services/authService.ts`.
- Voting/menu: `backend/src/controllers/studentVote.controller.ts`, `backend/src/services/menuComputation.service.ts`, `backend/src/services/menuBuilder.service.ts`, `frontend/src/pages/student/StudentVoting.tsx`, `frontend/src/pages/admin/AdminVoting.tsx`.
- Issues: `backend/src/controllers/issue.controller.ts`, `frontend/src/pages/admin/AdminIssues.tsx`, `frontend/src/pages/student/StudentIssues.tsx`, `frontend/src/pages/worker/Dashboard.tsx`.
- Reviews: `backend/src/controllers/mealReview.controller.ts`, `backend/src/controllers/adminReview.controller.ts`, `frontend/src/pages/student/StudentReview.tsx`, `frontend/src/pages/admin/AdminReviews.tsx`.

## ASSUMPTIONS table
| Assumption | Confidence | Rationale |
|---|---:|---|
| MongoDB is expected external dependency in all envs | High | Required in startup connection path |
| Redis is expected for menu subsystem and startup | High | `connectRedis()` called at server startup |
| Role dashboards are intended as separate navigation shells | High | Distinct route trees and layouts |
| Some docs are stale compared with runtime code | High | Multiple endpoint mismatches observed |

## Recommended first checks before implementing changes
1. Validate endpoint contract directly from route/controller files (not README).
2. Verify socket room naming compatibility before relying on realtime flows.
3. Re-check hostel scoping in any new aggregation or cross-collection logic.
4. For auth changes, test login + refresh + logout + first-time set-password path.

### PHASE 6 — Decisions/Findings
- Document is self-contained and anchored to concrete files.
- Highest-impact refactor zones are explicitly identified.

### PHASE 6 — Open Questions
- Socket room protocol and stale routes should be clarified before major feature work.

### PHASE 6 — Next Steps
- Use this document as authoritative implementation map; treat docs in repo as secondary unless updated.

### FINAL STATE BLOCK
- **INDEX_VERSION**: v6-final
- **FILE_MAP_SUMMARY**: backend + frontend runtime surface fully indexed and analyzed.
- **OPEN_QUESTIONS**:
  1. Socket room/event contract finalization.
  2. Endpoint consistency cleanup plan.
  3. Whether recommendation computation should include explicit hostel filter.
- **KNOWN_RISKS**:
  1. Realtime delivery mismatch.
  2. Hidden API drift across role pages.
  3. Tenant-scope defects in future aggregate features.
- **GLOSSARY_DELTA**: none (finalized).

