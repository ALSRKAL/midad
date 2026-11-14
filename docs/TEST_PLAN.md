# TEST_PLAN — Midad

> Thresholds below are **minimums**; lowering one is forbidden. Test runs produce the evidence.

## 1. Levels and acceptance thresholds

| Level         | Tool                                                       | Minimum acceptance                                                         | Where                  |
| ------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------- |
| Unit          | Vitest                                                     | 90% coverage of `features/*/services.ts` and `lib/*`; **100% of BR rules** | `tests/unit/**`        |
| Integration   | Vitest + real Postgres (test container)                    | every Server Action and Route Handler                                      | `tests/integration/**` |
| E2E           | Playwright (Chromium, Firefox, WebKit, Pixel 7, iPhone 14) | all 11 journeys of §13.3 in both locales; **flaky rate 0**                 | `tests/e2e/**`         |
| Accessibility | `@axe-core/playwright`                                     | zero serious/critical on every crawled page                                | `tests/a11y/**`        |
| Visual        | Playwright `toHaveScreenshot`                              | key pages × both locales × both themes                                     | `tests/visual/**`      |
| Performance   | Lighthouse CI                                              | Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95                        | CI job                 |
| Load          | k6                                                         | see §6 below                                                               | `tests/load/**`        |

Web Vitals budgets on the five most important public pages (mobile): **LCP < 2.5s, CLS < 0.1,
INP < 200ms**, initial JS < 200 KB gzip.

## 2. Unit testing rules

1. Every rule BR-01…BR-21 has tests for the happy path, the boundaries, and the rejection case
   (named `BR-07: rejects expired coupon` — the product requirements).
2. Pricing is a table test with **≥ 30 cases** (`it.each`): 100% discount, fixed discount larger than
   the price, banker's-rounding halves, both currencies, VAT boundaries.
3. Mandatory pure-function suites: `search-normalize` (Arabic normalization), course state machine
   (every allowed _and_ disallowed transition), 90%-watched computation, quiz grading, ICU plural
   selection for all six Arabic categories, currency/date formatting via `Intl`.
4. Services are testable in isolation: no Prisma client is constructed inside a service; repositories
   are injected.
5. A failing test is **never** fixed by editing the test or adding `.skip`. The code is fixed; if the
   test itself was wrong, the commit message says so and why (the product requirements rule 11).

## 3. Integration testing rules

For **every** Server Action:

| Case                           | Expected                        |
| ------------------------------ | ------------------------------- |
| no session                     | 401                             |
| wrong role                     | 403                             |
| another user's resource (IDOR) | 403/404 — never 200             |
| invalid input                  | field-level `VALIDATION` errors |
| success                        | the DB actually changed         |

For the **Stripe webhook**: bad signature → 400; duplicate event → exactly one enrollment;
10 concurrent deliveries of one event → exactly one enrollment; refund → enrollment cancelled and
the ledger entry reversed.

Concurrency suites (real transactions, not mocks):
`BR-07` coupon cap=1 × 5 concurrent purchases → 1 redemption;
`BR-13` two concurrent payout requests → 1 payout;
`BR-17` two concurrent completions → 1 certificate.

**Leakage suite**: for every public query, assert the returned object shape excludes
`passwordHash`, quiz `isCorrect`, `User.email` where it must be masked (instructor's student list),
and other users' notes.

## 4. E2E journeys (the product requirements) — each in `ar` and `en`

1. Guest: Arabic search without hamza → filter → open course → watch preview → add to cart → prompted to register → register → verify email from Mailpit → cart preserved → apply coupon → pay with `4242 4242 4242 4242` → success → course in dashboard.
2. Failed payment (declined card and 3-DS) → no enrollment, clear message, cart intact.
3. Student completes a course (video + text + quiz failed then passed) → certificate issued → PDF downloaded → verification link opened in a logged-out browser.
4. Student closes the browser mid-video → returns → resumes within ~2 s of the same second; adds a timestamped note and clicking it seeks the video.
5. Student asks a question → instructor is notified and replies → student is notified (in-app + email) → accepts the answer. Then reviews the course and the average changes immediately.
6. Instructor application → admin approves → instructor builds a course from scratch (real upload + processing wait, drag-and-drop reorder, quiz) → submits → admin rejects with notes → instructor edits and resubmits → admin approves → course appears in catalog and search.
7. Instructor creates a coupon → student uses it → earnings show as _pending_ → clock advanced 15 days → _available_ → payout request → admin marks it paid.
8. Student requests a refund → admin approves → access revoked immediately and earnings reversed. A request above 30% progress is rejected with the reason.
9. Admin bans a signed-in user in another browser → their session ends on the next request. Impersonation shows the warning bar and is audited.
10. Authorization: every protected route rejected for each unauthorized role; a direct paid-lesson URL without enrollment shows no content; an expired signed URL fails.
11. Locale and theme switch from every major page preserves place and state, and survives reload and signing in from another device.

### E2E engineering principles

- **Page Object Model**; locators by `role` and accessible name/label — never CSS classes.
- **Zero `waitForTimeout`**; wait on assertions/network instead.
- Database is reset from a fixed seed per worker.
- `trace: 'on-first-retry'`, `video: 'retain-on-failure'`.
- The full suite must pass **3 consecutive runs** before it is considered stable.
- Rate limiting is proven on a **second server** (port 3101, ceiling 3) started from the same build
  by `scripts/e2e-servers.sh`: exhausting a bucket there cannot affect the functional suite on 3100.

## 5. Interaction audit (the product requirements)

`tests/e2e/audit/interaction-audit.spec.ts`, for each role (guest, student, instructor, admin) ×
each locale:

1. Crawl every page reachable from a central route list plus discovered links (real seed ids).
2. Collect visible `a`, `button`, `[role=button|tab|menuitem|link|checkbox|switch]`, `select`,
   `input[type=submit]`.
3. Fail on: empty/`#`/`javascript:` href; internal link returning 4xx/5xx; control without an
   accessible name; control whose click changes nothing (no navigation, DOM change, dialog or
   network request); any console error after a click.
4. Destructive controls are marked `data-destructive`; the audit only asserts they open a
   confirmation dialog, then cancels.
5. Output: pages crawled, controls checked per page, result.
   **Target: zero failures.**

## 6. Load and stress (k6, against a local production build)

| Scenario | Shape                                                                             | Targets                                                                                                |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Load     | 200 VUs, 10 min, mixed (browse 60%, search 20%, watch+save progress 15%, cart 5%) | p95 < 500 ms pages, < 300 ms actions, error rate < 0.5%                                                |
| Stress   | ramp to 1000 VUs                                                                  | find the breaking point; degrade gracefully (429 from rate limiting, no 500s); recover after ramp-down |
| Spike    | 10 → 500 VUs on one course page                                                   | no 5xx; recovery within 60 s                                                                           |
| Soak     | 50 VUs, 30 min                                                                    | no memory growth, no DB connection pool exhaustion                                                     |

Afterwards: review slow queries with `pg_stat_statements`, fix, re-measure. Before/after numbers go
in the test run output.

## 7. Chaos and edge cases (the product requirements)

- Stop Redis, MinIO, or the worker mid-run → clear messages instead of crashes; jobs resume after recovery.
- Slow-3G and offline while saving a form or submitting a quiz.
- Very long text (200-char title, a name with no spaces), mixed Arabic/English, emoji.
- XSS and SQL-injection attempts in every text field (the SQLi attempt must be a _parameterized_
  no-op; the XSS attempt must come back sanitized from Tiptap storage).
- Empty lists and huge lists (a 300-lesson course; an instructor with 10,000 students in a
  performance-only seed).
- Rapid double-click on every submit; the same account open in two tabs editing the same form;
  session expiry while filling a form (content must not be lost).
- Uploading a file with a faked extension, a corrupted file, an oversize file, and a network cut
  mid-upload followed by a resume.

## 8. Visual and a11y review

- Visual regression on: home, catalog, course, cart, player, quiz, student dashboard, builder,
  admin dashboard, certificate — with volatile regions (dates, avatars) masked.
- axe on every crawled page in both locales and both themes.
- Per-task browser protocol (the product requirements) is mandatory evidence for every UI task: 8 screenshots
  (2 locales × 2 widths × 2 themes) in the test artifact directory, plus a documented keyboard-only
  pass, console/network inspection (zero unexpected errors/failed requests), mid-flow reload, in-page
  locale switch, and an axe run.

## 9. Exploratory session (the product requirements)

One full manual pass per role, Arabic then English, mobile then desktop, hunting for friction
(unclear step, confusing copy, unindicated waiting, misplaced action, weak translation). Every
finding is recorded with a screenshot and fixed before release.

## 10. Commands

| Command                | Runs                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm test`            | unit + integration                                                                           |
| `pnpm test:e2e`        | Playwright journeys                                                                          |
| `pnpm test:audit`      | interaction audit                                                                            |
| `pnpm test:a11y`       | axe suite                                                                                    |
| `pnpm test:visual`     | visual regression                                                                            |
| `pnpm test:lighthouse` | Lighthouse CI                                                                                |
| `pnpm test:load`       | k6 scenarios                                                                                 |
| `pnpm verify`          | lint → typecheck → i18n:check → unit → integration → build → e2e → audit → a11y (fails fast) |

## 11. Coverage and CI gates

- Coverage thresholds in `vitest.config.ts` are enforced, not reported: services/lib 90%,
  BR rules 100% (asserted by the rule-name test inventory in `tests/unit/_rule-inventory.test.ts`).
- CI (`.github/workflows/ci.yml`) runs: lint → typecheck → i18n:check → unit → build → e2e
  (Chromium) → audit → a11y, then the nightly full matrix (Firefox/WebKit/mobile + Lighthouse + k6 smoke).
- A red gate blocks merge to `main`; no test is disabled to go green.

## 12. Test data and accounts

Fixed seed accounts (documented in README): `admin@`, `instructor@` (approved),
`instructor2@` (another instructor's course, for negative tests), `student@` (paid course progress),
`student.new@` (no enrollments), `student.banned@`, `applicant@pending`. All share a documented
test password; Mailpit catches their email; Stripe test cards are listed in the README.

## 13. Executable evidence

### 13.1 Per-project data isolation

`scripts/e2e-fixture-server.ts` is a loopback-only factory API. It refuses to start unless
`NODE_ENV=test`, binds `127.0.0.1:3201`, and is started by `scripts/e2e-servers.sh` beside the test
servers. Every journey calls it in `beforeAll` and receives its own user, course, coupon, order or
application. No mutation journey reads a shared `/tmp` fixture file or a seeded account that another
project edits.

The eleven §13.3 journeys live in `tests/journeys/` and run on **every** browser project
(desktop-chromium, mobile-chromium, firefox, webkit, mobile-safari). Each is parameterised over
Arabic and English. Remaining specs are assigned to projects with `testMatch`/`testIgnore` in
`playwright.config.ts`; there are **no `test.skip` calls** left in `tests/`. A project not matching a
spec does not collect it, so it is not reported as a skip.

No journey relies on a browser exception. The only engine-specific test code is the existing WebKit
console-noise filter for Next's RSC prefetch, which is a browser message, not a skipped assertion.

### 13.2 Mobile accessibility

`tests/a11y/audit-mobile.spec.ts` scans the complete interaction-audit route list (four roles × two
locales × two themes) on **Pixel 7 and iPhone 14**. Gate: zero `serious` or `critical` violations on
every page. The ten pages of the instructor and admin shells are included, so a desktop-only audit
is not accepted as a substitute.

### 13.3 Lighthouse

Five public pages, mobile emulation, three consecutive runs each:

```sh
pnpm dlx lighthouse http://127.0.0.1:3100/ar --chrome-path=/usr/bin/google-chrome \
  --only-categories=performance,accessibility,best-practices,seo --output=json --quiet
```

Targets: Performance ≥ 90, LCP < 2.5 s, CLS < 0.1, TBT < 200 ms. Results are recorded in
the measurement run; a run that misses a target is reported as a miss, not averaged away.

Work performed: scoped `NextIntlClientProvider` messages per route, removed the Motion dependency
from the Lottie island, modern `browserslist`, and verified the initial JS budget. The performance trace recorded
a Lighthouse trace of `/ar`: the five longest tasks are the inline Next RSC bootstrap (499 ms), the
react-dom chunk (433 ms) and three smaller browser/inline tasks; the react-dom evaluation is the
floor. That attempt also moved the desktop-only theme/language controls out of the mobile bundle.
The measured results (including any target still missed) are in the report; T03 is reported failed.

### 13.4 Load and stress topology

`compose.prod-test.yml` runs **eight** standalone web containers behind nginx on port 8080. Nginx
caches HTML for 60 s with a per-cookie key (session pages are cached per session, never shared),
bypasses POST/RSC/prefetch, and uses background revalidation. Managed Postgres/Redis/MinIO/Mailpit
stay on the host so the database is the seeded one. Postgres allows 300 connections because eight
replicas exhausted the default 100 during the first 200-VU run (P2037). `pg_stat_statements` is
enabled in `docker-compose.yml` for the slow-query review.

Scenarios: `tests/load/browse.js` (200 VUs × 10 min mixed; page p95 <500 ms, action p95 <300 ms;
progress heartbeat and write variants tagged separately so k6 prints p50/p95/p99 per action),
`auth.js` (login separated from the action budget; p95 <1000 ms, no change to password hashing),
`stress.js` (ramp to 1000), `spike.js` (10 → 500 → 10), `soak.js` (50 VUs × 30 min). No 5xx is
accepted; 429 is the intended degradation. Results are recorded with the run.

### 13.5 Chaos

`tests/chaos/` is a serial Desktop-Chromium project that stops and restarts the real compose
services. Cases:

- Redis stopped → `/api/health` 503 naming Redis; public catalog still 200; restart recovers.
- MinIO stopped → `/api/health` 503 naming storage; course page still 200; restart recovers.
- Worker stopped → a queued email is not delivered; starting the worker delivers it (resume).
- Offline note save → translated error, typed text preserved, retry succeeds.
- Slow 3G note save → pending state then success.
- Expired session during a form → the user is not silently logged in and the typed value is not
  discarded by the client before navigation.
- Rapid double submit of the contact form → exactly one stored message.
- Two tabs editing one account → both saves succeed, last write wins, no corrupt profile.
- Fake and oversized avatar files → clear translated errors.
- 300-lesson course → page renders with zero horizontal overflow.

The existing builder spec also covers a real multipart upload aborted mid-part and resumed to
`READY` (`tests/e2e/instructor-builder.spec.ts`); the chaos suite keeps that evidence instead of
duplicating a 90-second upload path.

### 13.6 Worker image

The worker is bundled by esbuild into `worker-dist/index.mjs` and runs on production dependencies
only (no `tsx`, no devDependencies). `worker/pdf-smoke.mjs` runs inside the container and writes a
certificate and a real invoice to `/tmp`, asserting both start with `%PDF-`. Image size and smoke
outputs are in the verification artifacts.

### 13.7 Browser-conditional exceptions

An initial assumption held that Playwright's WebKit could not decode the seeded H.264/HLS media. Measurement showed the
engine instead of relying on the assumption: Playwright WebKit 1.65 exposes MSE (`MediaSource`,
`isTypeSupported('video/mp4; codecs="avc1.42E01E") === true`), hls.js attaches the HLS playlist as a
blob, and the media clock advances. The player does not use native HLS on WebKit; it uses the same
hls.js/MSE path as the other engines.

The two video journeys therefore run on **every** browser project, including webkit and
mobile-safari. There is no `test.skip` in `tests/journeys/` and the suite reports no skips. The only
engine-specific code is the WebKit console-noise filter for Next's RSC prefetch, which filters a
browser message and skips no assertion.

Playback starts through `startVideoPlayback()`: it waits for `readyState >= 2`, calls `play()` on a
muted element, proves the media clock advanced, and falls back to a real tap plus the player's own
play control if a mobile engine requires a gesture. Journey 4 closes the tab only after the player's
`saved` acknowledgement, because closing before the pause flush committed was the actual mobile
flake (the resumed SSR read position 0). Reference for the historical codec concern:
https://github.com/microsoft/playwright/issues/2709
