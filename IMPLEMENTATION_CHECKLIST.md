# 🛠️ Implementation Checklist — Mosque Digital Clock

**Version:** 2.0  
**Updated:** August 9, 2026  
**Source:** Static code audit, production build, workspace lint, and `DESIGN_SYSTEM.md` v2.0  
**Status:** Active remediation plan

---

## Status Legend

| Marker | Meaning |
|---|---|
| `[x]` | Implemented and verified from code/tool output |
| `[~]` | Partially implemented or not fully verified |
| `[ ]` | Not implemented |
| `[!]` | Blocker or critical security issue |

An item is complete only when its acceptance criteria and relevant automated checks pass.

---

## Current Verified Baseline

### Build and lint — August 9, 2026

| Check | Result |
|---|---|
| `web-client` production build | ✅ Passed |
| `shared-types` TypeScript build | ✅ Passed |
| `web-admin` compilation/type step | ✅ Passed before page-data collection |
| `web-admin` complete build without DB environment | ❌ Failed during page-data collection |
| `web-admin` lint | ❌ 233 problems: 171 errors, 62 warnings |
| `web-client` lint | ❌ 75 problems: 48 errors, 27 warnings |
| Automated tests | ❌ No established test suite/script found |

### Interpretation

- A successful compile does not mean security, lint, accessibility, or runtime behavior is correct.
- Previous broad `[x]` phase markers were not sufficiently verified; this version separates implemented and complete states.
- Admin currently initializes database-dependent modules during build evaluation. Docker supplies a dummy URL, but the normal root build is not portable.

---

# 🔴 PHASE 0 — RELEASE BLOCKERS

Target: before any new production release.

## [~] 0.1 Replace forgeable session cookie

**Affected files:**

- `apps/web-admin/app/api/auth/login/route.ts`
- `apps/web-admin/app/api/auth/google/callback/route.ts`
- `apps/web-admin/lib/auth.ts`
- `apps/web-admin/middleware.ts`

The current `admin-session` cookie contains a raw user ID. Cookie transport flags do not authenticate its contents.

- [x] Replace raw user ID with a cryptographically random opaque token.
- [x] Store only a SHA-256 session-token hash server-side with user ID, expiry, creation, last-use, and revocation state.
- [x] Create fresh sessions after password, registration, and Google login.
- [~] Revoke the current session on logout; revocation on security-sensitive account changes remains pending.
- [x] Enforce absolute and idle expiration server-side.
- [~] Karate integration tests cover missing/forged sessions, opaque-token login, profile access, and logout revocation; direct expiry and fixation/rotation assertions still require dedicated fixtures.
- [x] Remove route authorization decisions based solely on an unsigned cookie value; middleware remains an optimistic navigation check only.

**Verification — August 9, 2026:** admin TypeScript check passed; the new session module and central auth/profile/logout consumers pass targeted ESLint. Karate project structure and Maven XML parse successfully, but the suite has not run because Maven is unavailable in the current environment. Broader touched routes retain pre-existing lint debt. Migration `002_admin_sessions.sql` must be applied before deployment.

**Acceptance:** changing `admin-session` to a known user ID never grants access; logout invalidates the server-side session.

---

## [!] 0.2 Secure upload paths and content validation

**Affected file:** `apps/web-admin/app/api/upload/route.ts`

- [x] Authentication and mosque ownership check exists.
- [x] File extension allowlist exists.
- [ ] Reject separators, `..`, absolute paths, control characters, and malformed Unicode names.
- [ ] Generate storage names server-side using UUIDs; retain original names only as metadata.
- [ ] Verify `resolve(targetPath)` remains inside the mosque upload directory.
- [ ] Validate MIME type and file signatures, not extension alone.
- [ ] Enforce per-file, request, upload, chunk-count, and storage-quota limits.
- [ ] Validate `uploadId`, `chunkIndex`, and `totalChunks` strictly.
- [ ] Fail assembly if any chunk is missing and clean partial files atomically.
- [ ] Prevent accidental overwrite or define explicit replacement semantics.
- [ ] Remove internal exception details from production responses.
- [ ] Add traversal, malformed chunk, oversized file, MIME spoofing, and concurrency tests.

**Acceptance:** malicious filenames or chunk metadata cannot create or modify files outside the authorized directory.

---

## [!] 0.3 Replace plaintext bootstrap credentials

**Affected files:**

- `apps/web-admin/schema.sql`
- `apps/web-admin/data/users.json`
- `docker-compose.yml`
- `apps/web-admin/init-db.js`

- [x] Runtime login uses `bcrypt.compare()`.
- [x] Registration hashes passwords.
- [ ] Remove plaintext `admin123` from `password_hash` seed data.
- [ ] Remove default `ADMIN_PASSWORD=admin123` from Compose.
- [ ] Remove or migrate legacy plaintext credentials in `data/users.json`.
- [ ] Implement one-time bootstrap using a required secret environment value.
- [ ] Generate a bcrypt hash during bootstrap and reject known/default passwords.
- [ ] Require initial password change or provide a secure invitation flow.
- [ ] Document migration for existing deployments.

**Acceptance:** a clean deployment has no known default login and all password records contain valid adaptive hashes.

---

## [!] 0.4 Authenticate device pairing and heartbeat

**Affected files:**

- `apps/web-admin/app/api/devices/route.ts`
- `apps/web-admin/app/api/config/route.ts`
- `apps/web-client/app/components/SetupOverlay.tsx`
- `apps/web-client/app/lib/constants.ts`

- [x] Admin GET/PUT/DELETE device operations check mosque ownership.
- [ ] Protect anonymous `POST /api/devices` with one-time pairing credentials.
- [ ] Prevent an existing global `device_id` from being moved to another mosque by upsert.
- [ ] Issue a revocable per-device credential after pairing.
- [ ] Authenticate config, SSE, heartbeat, sync status, and remote commands as that device.
- [ ] Validate mosque key before setup completes.
- [ ] Define device ID uniqueness using a secure server-side model.
- [ ] Close SSE and reject all requests from blocked devices.
- [ ] Add pairing expiry, replay, transfer, and blocked-device tests.

**Acceptance:** knowing a mosque key or device ID is insufficient to register, move, impersonate, or reactivate a device.

---

## [!] 0.5 Add CSRF protection and origin policy

- [~] Session cookies have browser protections; exact settings still require flow-by-flow verification.
- [ ] Protect every cookie-authenticated mutation using CSRF tokens or strict same-origin validation.
- [ ] Define an explicit trusted-origin allowlist.
- [ ] Never use wildcard CORS for credentialed/admin operations.
- [ ] Audit every POST/PUT/PATCH/DELETE route.
- [ ] Add cross-origin form and fetch tests.

**Acceptance:** a malicious external origin cannot perform an authenticated state change.

---

# 🔴 PHASE 1 — SECURITY AND DATA INTEGRITY

## [~] 1.1 Password security

- [x] `bcrypt` and its types are installed.
- [x] Login uses `bcrypt.compare()`.
- [x] Registration uses bcrypt hashing.
- [~] Registration currently uses 12 rounds; central policy is not verified.
- [ ] Add current-password verification for sensitive changes.
- [ ] Add password change/reset using expiring one-time tokens.
- [ ] Add common/breached password controls where appropriate.
- [ ] Test valid, invalid, malformed, and legacy hashes.
- [ ] Complete bootstrap remediation in Phase 0.3.

---

## [~] 1.2 Environment and secret management

- [x] Database library validates required connection configuration.
- [x] Compose references environment values for database, Redis, and Google secrets.
- [ ] Remove every known/default credential from tracked files.
- [ ] Maintain `.env.example` with names and safe descriptions only.
- [ ] Document secret generation, rotation, ownership, and expiry.
- [ ] Ensure server-only secrets never use `NEXT_PUBLIC_*`.
- [ ] Scan repository history and current tree for leaked secrets.
- [ ] Make production startup fail clearly on weak or missing security secrets.
- [ ] Separate development, staging, and production secrets.

Only document variables used by current code. MQTT/VAPID variables are deferred until those features exist.

---

## [~] 1.3 Runtime input validation

- [x] Zod exists in the project.
- [x] Login and registration use shared schemas.
- [~] Some routes perform manual validation.
- [ ] Make `packages/shared-types` declare `zod` as its direct runtime dependency.
- [ ] Replace `z.record(z.string(), z.any())` with the actual config contract.
- [ ] Reconcile `MosqueConfigSchema` with `MosqueConfig`.
- [ ] Derive TypeScript types from Zod where practical.
- [ ] Validate query, headers, and bodies for every API route.
- [ ] Bound coordinates, offsets, opacity, blur, volume, duration, and file metadata.
- [ ] Validate URL schemes and remote endpoints against explicit policies.
- [ ] Reject unknown fields for security-sensitive inputs.
- [ ] Add validator unit and malformed-request integration tests.

**Acceptance:** malformed nested config cannot be persisted, and validation exists at every external input boundary.

---

## [~] 1.4 Authorization consistency

- [x] Shared `validateAccess()` and `requireSession()` helpers exist.
- [~] Many admin routes enforce mosque ownership.
- [ ] Remove duplicated route-local authorization helpers.
- [ ] Create an endpoint matrix: public, session, mosque-owner, or device.
- [ ] Verify every endpoint against the matrix.
- [ ] Require mosque ownership for all mosque-scoped admin operations.
- [ ] Require device credentials for all device-scoped operations.
- [ ] Verify Google OAuth account/key assignment.
- [ ] Add cross-tenant tests for every mosque-scoped endpoint.

---

## [~] 1.5 Rate limiting and abuse controls

- [x] Redis-backed/fallback rate-limit infrastructure exists.
- [x] Login, registration, config mutation, and upload integrate rate limits.
- [ ] Inventory every costly/public endpoint and assign an explicit policy.
- [ ] Verify Redis failure behavior is safe and observable.
- [ ] Return consistent `429` responses and `Retry-After` headers.
- [ ] Limit device registration, SSE churn, log ingestion, Quran downloads, and proxies.
- [ ] Add per-user/per-mosque quotas where IP-only limiting is insufficient.
- [ ] Add automated enforcement tests.

---

## [ ] 1.6 XSS, URL, and custom-theme controls

- [ ] Replace global regex tag stripping with schema validation and sink-safe rendering.
- [ ] Validate URL schemes and reject dangerous protocols.
- [ ] Threat-model and restrict `advancedDisplay.customCss`.
- [ ] Clamp runtime theme values to documented safe ranges.
- [ ] Add contrast validation and “Reset to safe defaults”.
- [ ] Test stored XSS in running text, mosque info, media metadata, and theme fields.

---

## [ ] 1.7 SSRF and outbound proxy hardening

- [~] Wabot proxy requires a session and contains some target restrictions.
- [ ] Centralize outbound URL validation.
- [ ] Reject loopback, link-local, private, metadata-service, and rebinding destinations.
- [ ] Prefer fixed upstream allowlists over user-controlled URLs.
- [ ] Apply timeouts, response-size limits, and content-type checks.
- [ ] Prevent credential and internal-error forwarding.
- [ ] Add SSRF and redirect-chain tests.

---

# 🟠 PHASE 2 — RUNTIME CORRECTNESS

## [!] 2.1 Fix audio heartbeat routing and identity

**Affected files:**

- `apps/web-client/app/components/AudioPlayer.tsx`
- `apps/web-admin/app/api/audio/active-status/route.ts`
- `apps/web-admin/lib/audio-status.ts`

- [ ] Send heartbeat to the configured admin API URL, not a relative client route.
- [ ] Read mosque identity from canonical paired-device state, not query fallback `default`.
- [ ] Include authenticated `deviceId` in every report.
- [ ] Use the existing React refs for current time/duration; remove stale local pseudo-refs.
- [ ] Store and report state per `(mosqueKey, deviceId)`.
- [ ] Make pause/stop/logout commands device-specific with delivery acknowledgement.
- [ ] Add multi-device heartbeat and command tests.

**Acceptance:** the dashboard shows accurate progress per device and commands reach only the selected device.

---

## [ ] 2.2 Make real-time state multi-instance safe

- [x] SSE config notifications exist.
- [x] Polling provides a delayed config fallback.
- [ ] Move config events to Redis Pub/Sub or Streams.
- [ ] Move audio and sync state to Redis with TTL.
- [ ] Persist pending device commands until acknowledged or expired.
- [ ] Authenticate SSE subscriptions.
- [ ] Make duplicate/replayed event handling idempotent.
- [ ] Verify behavior with at least two admin instances.

---

## [~] 2.3 Config fetch, cache, and offline behavior

- [x] A custom client config hook exists.
- [x] In-memory and localStorage fallback caching exist.
- [x] Polling and SSE-triggered refresh exist.
- [ ] Correct outdated polling comments/documentation.
- [ ] Define one TTL and stale-while-revalidate policy.
- [ ] Reconcile client and server default configs.
- [ ] Prevent arbitrary config creation through unauthenticated GET.
- [ ] Display last successful sync and stale/offline state.
- [ ] Add offline-first and recovery tests.

---

## [~] 2.4 Error and loading behavior

- [x] Client `ErrorBoundary` exists.
- [x] Reusable loading components exist.
- [~] Several async operations have local handling.
- [ ] Adopt one API error envelope with stable code, message, and request ID.
- [ ] Remove raw internal details from production responses.
- [ ] Cover loading, success, empty, partial, and failure states for every async action.
- [ ] Preserve unsaved admin form data after transient failures.
- [ ] Keep kiosk displaying last-known valid data during failures.
- [ ] Add error-boundary and failed-request interaction tests.

---

## [~] 2.5 Long-running kiosk reliability

- [~] Many intervals and listeners include cleanup.
- [ ] Resolve React hook lint violations before claiming memory-leak completion.
- [ ] Replace render-time `Math.random()` with stable precomputed decoration.
- [ ] Audit timers, media listeners, EventSource reconnects, and service-worker subscriptions.
- [ ] Run a 24-hour soak test with heap and network monitoring.
- [ ] Test sleep/wake, network loss, midnight rollover, and config changes.
- [ ] Document acceptable memory growth and recovery behavior.

---

## [~] 2.6 Prayer-time correctness

- [x] `adhan` calculation is implemented.
- [x] Coordinates, adjustments, Friday replacement, and Imsak logic exist.
- [ ] Consolidate duplicated prayer-time logic into a shared package.
- [ ] Define timezone behavior instead of assuming `Asia/Jakarta` globally.
- [ ] Validate coordinates and calculation configuration.
- [ ] Test midnight rollover and next-prayer calculation.
- [ ] Test Friday, Ramadan, leap year, timezone boundaries, and DST-capable zones.
- [ ] Add golden tests against approved Kemenag/reference schedules.

---

# 🟠 PHASE 3 — DATABASE AND DEPLOYMENT

## [!] 3.1 Establish one migration path

- [x] A migration runner and normalized-table migration exist.
- [ ] Move Google OAuth changes into numbered migrations.
- [ ] Reconcile schema differences between `schema.sql` and OAuth migration.
- [ ] Reproduce a clean DB using one ordered migration sequence.
- [ ] Ensure normalized tables exist before config routes start.
- [ ] Record migration checksums, not filenames only.
- [ ] Document MySQL DDL implicit-commit and recovery behavior.
- [ ] Test empty-DB migration and upgrades from supported versions.
- [ ] Run migrations as an explicit deployment step with backup/rollback controls.

---

## [ ] 3.2 Define config source of truth

- [ ] Decide whether JSON or normalized tables are authoritative.
- [ ] Create one repository/service used by APIs, workers, and scripts.
- [ ] Eliminate direct partial reads of `config_json`.
- [ ] Define consistent transaction boundaries.
- [ ] Add round-trip and backup/restore tests.
- [ ] Version configuration schemas.

---

## [!] 3.3 Make build reproducible

- [x] Client production build passes.
- [x] Shared-types build passes in the current workspace.
- [ ] Make admin build pass without a live database.
- [ ] Avoid DB initialization/validation during module import and page-data collection.
- [ ] Express build order: shared types before both applications.
- [ ] Keep and use `package-lock.json` in Docker.
- [ ] Use deterministic `npm ci` installation.
- [ ] Ensure every workspace declares direct dependencies, including shared-types → Zod.
- [ ] Align local, CI, and Docker builds.
- [ ] Add clean-checkout build to CI.

---

## [~] 3.4 Container and production runtime

- [x] Multi-stage Dockerfile exists.
- [x] Separate admin and client services exist.
- [ ] Minimize runtime dependencies and copied files.
- [ ] Run containers as non-root.
- [ ] Add explicit container health checks.
- [ ] Document external network and reverse-proxy routing.
- [ ] Verify upload and WhatsApp volume permissions.
- [ ] Add resource limits and graceful shutdown.
- [ ] Verify service-worker and asset caching across releases.

---

# 🟡 PHASE 4 — CODE QUALITY AND TESTING

## [!] 4.1 Restore lint as a quality gate

Current baseline: **308 problems: 219 errors and 89 warnings**.

- [ ] Fix all admin lint errors.
- [ ] Fix all client lint errors.
- [ ] Review warnings and allow only documented exceptions.
- [ ] Remove broad `any` use at config/API boundaries.
- [ ] Fix synchronous state updates in effects where values should be derived.
- [ ] Fix hook dependencies without suppressing valid rules.
- [ ] Add root lint CI and prevent regressions.

**Acceptance:** `npm run lint` exits 0 from a clean checkout.

---

## [ ] 4.2 Establish automated test layers

- [ ] Add root `test`, `test:unit`, `test:integration`, `test:e2e`, and `typecheck` scripts.
- [ ] Unit-test validators, prayer times, config hydration, and audio state logic.
- [ ] Add MySQL integration tests for auth, ownership, migrations, config, and devices.
- [ ] Add upload security tests with temporary storage.
- [ ] Add component tests for forms and kiosk overlays.
- [ ] Add Playwright E2E for login, pairing, config save, SSE refresh, and logout.
- [ ] Add accessibility checks to key E2E flows.
- [ ] Set realistic coverage thresholds after foundational tests exist.

---

## [ ] 4.3 Refactor maintainability hotspots

- [ ] Split `apps/web-admin/app/page.tsx` into feature modules and typed components.
- [ ] Extract repeated button/input/card/status variants.
- [ ] Centralize auth, CORS, response, and validation helpers.
- [ ] Centralize API client and mosque/device identity handling.
- [ ] Remove duplicated prayer-time implementation.
- [ ] Define one Redis client policy where feasible.
- [ ] Favor clear responsibility over arbitrary line-count targets.

---

## [ ] 4.4 CI security and dependency checks

- [ ] Add dependency audit with reviewed severity policy.
- [ ] Add secret scanning and SAST/code scanning.
- [ ] Generate an SBOM for release images.
- [ ] Pin and review release-candidate dependencies such as Baileys.
- [ ] Add automated dependency updates with build/test validation.

---

# 🟡 PHASE 5 — DESIGN SYSTEM AND ACCESSIBILITY

Canonical reference: `DESIGN_SYSTEM.md` v2.0.

## [~] 5.1 Adopt semantic design tokens

- [x] Admin has an initial CSS token set.
- [x] Design-system v2 defines canonical semantic tokens.
- [ ] Implement `--ds-*` semantic tokens in admin CSS.
- [ ] Add a kiosk semantic token layer.
- [ ] Replace repeated literal colors in reusable components.
- [ ] Reconcile shadow tokens with the global shadow-disabling rule.
- [ ] Standardize radius, spacing, and status variants.
- [ ] Document intentional kiosk-only exceptions.

---

## [~] 5.2 Accessibility compliance

- [~] Some roles, live regions, labels, and semantic prayer lists exist.
- [ ] Change document language metadata to Indonesian where appropriate.
- [ ] Remove `userScalable: false` and support 200% zoom.
- [ ] Add a consistent global `:focus-visible` treatment.
- [ ] Give every icon-only control an accessible name.
- [ ] Make setup, logout, audio unlock, and overlays keyboard operable.
- [ ] Add dialog semantics, focus trap, initial focus, and restoration.
- [ ] Replace clickable non-interactive elements with buttons/links.
- [ ] Remove non-standard ARIA roles.
- [ ] Verify contrast for light, dark, and image backgrounds.
- [ ] Test keyboard-only and screen-reader workflows.
- [ ] Run automated WCAG checks plus manual review.

**Acceptance:** key admin and interactive kiosk flows satisfy documented WCAG 2.2 AA checks.

---

## [ ] 5.3 Reduced motion and low-end performance

- [x] Kiosk `data-perf="lite"` mode exists.
- [ ] Implement `prefers-reduced-motion` globally.
- [ ] Stop or simplify marquee, pulse, glow, stars, and decorative transitions.
- [ ] Ensure skeletons respect reduced motion.
- [ ] Keep operational transitions understandable without animation.
- [ ] Test reduced motion separately from performance-lite mode.

---

## [~] 5.4 Responsive admin and kiosk layouts

- [x] Admin has a mobile drawer and responsive grids.
- [x] Kiosk has responsive typography/layout variants.
- [ ] Remove or define the unverified `xs` breakpoint.
- [ ] Validate admin at 360, 768, 1024, and 1440px.
- [ ] Validate kiosk at 720p, 1080p, 4K, tablet portrait, and narrow recovery sizes.
- [ ] Implement kiosk safe areas for overscan and PWA insets.
- [ ] Support five, six, and seven prayer cards.
- [ ] Test long mosque names, Jumat replacement, and Ramadan Imsak.
- [ ] Verify high-contrast scrims over arbitrary media.

---

## [ ] 5.5 Component and visual regression coverage

- [ ] Create typed primitives for button, input, card, badge, dialog, toast, and progress.
- [ ] Cover default, hover, focus, active, disabled, loading, empty, and error states.
- [ ] Add canonical admin light/dark screenshots.
- [ ] Add normal, Adzan, Iqamah, Imsak, Sholat, offline, syncing, setup, and audio-unlock screenshots.
- [ ] Add visual regression checks to CI.

---

# 🟢 PHASE 6 — OBSERVABILITY AND OPERATIONS

## [~] 6.1 Health and metrics

- [x] Admin health endpoint exists.
- [x] Prometheus metrics endpoint and configuration exist.
- [~] Client metrics route exists, but meaningful coverage requires verification.
- [ ] Separate readiness and liveness checks.
- [ ] Include DB/Redis status without leaking details.
- [ ] Instrument config, pairing, SSE, heartbeat, and sync failures.
- [ ] Use bounded metric labels.
- [ ] Add dashboards and alerts tied to user impact.

---

## [~] 6.2 Structured logging and error tracking

- [x] Logging infrastructure and log API exist.
- [ ] Standardize request ID, route, user, mosque, device, status, and duration fields.
- [ ] Redact cookies, OAuth tokens, DB URLs, phone numbers, and WhatsApp auth data.
- [ ] Protect log endpoints appropriately.
- [ ] Add retention and rotation policy.
- [ ] Add production error tracking with environment/release metadata.
- [ ] Correlate client failures with server requests.

---

## [ ] 6.3 Backup, rollback, and incident readiness

- [ ] Document encrypted DB backup schedule, retention, and restore testing.
- [ ] Back up media and required WhatsApp state according to policy.
- [ ] Define deployment rollback including schema compatibility.
- [ ] Add incident response and credential-rotation runbooks.
- [ ] Define alert ownership and escalation.
- [ ] Perform a restore drill before production readiness.

---

# 🟢 PHASE 7 — OPTIONAL PRODUCT FEATURES

Security, correctness, reproducible builds, lint, and foundational tests take precedence.

## [ ] 7.1 Push notifications for Adzan

- [ ] Confirm product need, consent, and privacy model.
- [ ] Define unsubscribe, expiry, and multi-mosque behavior.
- [ ] Generate and securely manage VAPID keys.
- [ ] Add authenticated subscription endpoints with ownership validation.
- [ ] Implement idempotent scheduling and timezone behavior.
- [ ] Integrate service-worker handling without overwriting generated PWA logic.
- [ ] Test compatibility, delivery, revocation, and analytics.

---

# 🧪 Release Verification Checklist

## Security

- [ ] No default credentials or committed secrets.
- [ ] Session authenticity, expiry, rotation, and revocation verified.
- [ ] CSRF and trusted-origin policy verified.
- [ ] Cross-mosque authorization tests pass.
- [ ] Pairing and blocked-device tests pass.
- [ ] Upload traversal, size, MIME, and chunk tests pass.
- [ ] SSRF, stored-XSS, and rate-limit tests pass.

## Functional

- [ ] Login/logout and Google OAuth pass.
- [ ] Config round-trip and normalized persistence pass.
- [ ] Prayer schedules pass approved reference cases.
- [ ] Device pairing, rename, block, and recovery pass.
- [ ] Multi-device audio status and targeted commands pass.
- [ ] SSE update and polling fallback pass.
- [ ] Offline kiosk and asset synchronization pass.
- [ ] WhatsApp connect, reset, groups, and test message pass in a controlled environment.

## Quality

- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npm run lint` exits 0.
- [ ] Typecheck exits 0.
- [ ] Unit, integration, and E2E tests pass.
- [ ] Both production images build without a live database.
- [ ] Migration from a supported previous DB passes.

## UX and accessibility

- [ ] Admin light/dark and target widths verified.
- [ ] Kiosk target resolutions and worship states verified.
- [ ] Keyboard-only operation verified.
- [ ] Screen-reader smoke test completed.
- [ ] Contrast and 200% zoom verified.
- [ ] Reduced-motion and performance-lite modes verified.
- [ ] Offline/loading/error/empty states verified.

## Operations

- [ ] Database/media backups are restorable.
- [ ] Migration and rollback plans are approved.
- [ ] Health/readiness checks pass.
- [ ] Metrics, logs, alerts, and error tracking are verified.
- [ ] Post-deployment smoke tests pass.
- [ ] On-call owner and incident channel are confirmed.

---

# Suggested Delivery Order

| Sprint | Scope | Exit condition |
|---|---|---|
| 1 | Session, upload, credentials, pairing | Critical exploit paths closed and tested |
| 2 | CSRF, validation, authorization, audio heartbeat | External boundaries and multi-device identity reliable |
| 3 | Migrations, config source of truth, reproducible build | Clean DB and checkout deploy deterministically |
| 4 | Lint and foundational tests | CI blocks regressions |
| 5 | Design-system adoption and accessibility | Key flows meet UI/a11y criteria |
| 6 | Redis runtime state and operations | Multi-instance and incident readiness verified |
| Later | Optional product features | Core release checklist remains green |

Estimates should be assigned after technical design and ownership are agreed. The previous 25–30 hour estimate is not reliable for the expanded verified scope.

---

# Documentation to Maintain

- [ ] `README.md`: setup, build, test, and runtime architecture.
- [ ] `.env.example`: actual variables with safe descriptions.
- [ ] Deployment guide: migrations, secrets, proxy, health, and rollback.
- [ ] API reference: auth class, schemas, responses, and rate limits.
- [ ] `DESIGN_SYSTEM.md`: new UI patterns and acceptance criteria.
- [ ] ADRs: sessions, pairing, config persistence, and Redis events.
- [ ] Runbooks: backup/restore, blocked device, WhatsApp reset, and incidents.

---

# Ownership Record

| Workstream | Owner | Reviewer | Target | Status |
|---|---|---|---|---|
| Session/auth security | TBD | TBD | TBD | Not started |
| Upload security | TBD | TBD | TBD | Not started |
| Device pairing | TBD | TBD | TBD | Not started |
| Database/migrations | TBD | TBD | TBD | Not started |
| Audio/multi-device | TBD | TBD | TBD | Not started |
| Test/CI quality gate | TBD | TBD | TBD | Not started |
| Design system/a11y | TBD | TBD | TBD | Partial |
| Operations/observability | TBD | TBD | TBD | Partial |

---

**Next action:** assign Phase 0 owners, design secure session and device-pairing models, then convert each blocker into tracked issues with acceptance tests.
