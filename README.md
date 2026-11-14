# مِداد · Midad

Arabic-first, bilingual (RTL/LTR) learning marketplace: course catalog and checkout, HLS video
learning, quizzes and verifiable certificates, instructor earnings and payouts, refunds, reviews,
notifications and a full admin console.

## What is built

| Area        | Delivered                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public site | Arabic-first home, catalog with Arabic-normalised search/filters/sort/pagination, course detail with preview, category and instructor pages, about/FAQ/contact/terms/privacy, RTL/LTR, light/dark                                                                                                                                                                                  |
| Auth        | Better Auth email/password + verification/reset, Google when keys exist, DB sessions, RBAC (student/instructor/admin), ban/deleted session invalidation, admin impersonation with audit bar                                                                                                                                                                                        |
| Learning    | Student dashboard (resume, streak, progress, certificates, wishlist, purchases), Vidstack HLS player with signed manifests/captions/speed/keyboard/resume, text/PDF lessons, timestamped private notes, questions/answers with accepted answer                                                                                                                                     |
| Assessment  | Server-graded quizzes (single/multi/true-false/short answer), attempts, timers, review with explanations, 90%-watched completion, bilingual PDF certificates with QR + public `/verify/[code]` + LinkedIn share                                                                                                                                                                    |
| Commerce    | Guest cart + merge, coupons (percentage/fixed, global/course, limits), server-side quote (discount → VAT → total, banker's rounding), Stripe Checkout + signed idempotent webhook, success/failure polling, free enrolment, purchases, PDF invoice                                                                                                                                 |
| Engagement  | Reviews (20% progress rule, one per learner, edit/delete, aggregate in transaction), instructor replies, reports, in-app notifications with bell/count/read, 10 bilingual email templates through a durable outbox, instructor announcements to enrolled learners                                                                                                                  |
| Finance     | Instructor analytics 7/30/90 (revenue from ledger, students, rating, completion), earnings statement, availability after refund window, payout request with one-pending rule, admin approval/payment with transfer reference and ledger entry, refunds via Stripe with enrollment revocation and ledger reversal, admin KPIs/orders/payouts/refunds/reports/contact/settings/audit |
| Platform    | Admin tables with search/filter/sort/server pagination/CSV, bilingual seed, S3/MinIO uploads (image crop/magic bytes, resumable video), ffmpeg HLS worker, certificate/email workers, durable audit log, platform settings incl. maintenance mode, SEO (canonical/hreflang/sitemap/robots/OG), strict CSP + security headers, Docker deployment                                    |

## Stack

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind CSS 4 + Radix UI · next-intl ·
Prisma 7 + PostgreSQL 16 · Better Auth · Stripe Checkout + webhooks · S3/MinIO · Vidstack + hls.js ·
Tiptap · Recharts · pdf-lib · Nodemailer + Mailpit · Redis · Playwright/Vitest.

## Requirements

| Tool             | Version                  |
| ---------------- | ------------------------ |
| Node.js          | 22.x                     |
| pnpm             | 12.x (`corepack enable`) |
| Docker + Compose | 29.x / v2                |
| ffmpeg           | 6.x (HLS worker)         |

Local ports are offset: PostgreSQL **5433**, Redis **6380**, MinIO **9000/9001**, Mailpit **8025**;
the app uses **3000** (dev) or **3100** (E2E).

## Run in three commands

```bash
corepack enable && cp .env.example .env.local   # then set AUTH_SECRET (openssl rand -base64 48)
pnpm install && pnpm dev:up && pnpm db:seed
pnpm dev
```

Open <http://localhost:3000>. Mailpit: <http://localhost:8025> · MinIO console: <http://localhost:9001>.

## Test accounts

Seeded by `pnpm db:seed`; every account uses **`Midad-Test-2026`**.

| Role           | Email                        | State                                           |
| -------------- | ---------------------------- | ----------------------------------------------- |
| Admin          | `admin@midad.test`           | all admin queues/settings                       |
| Student demo   | `student.demo@midad.test`    | mid-course, certificate, reviews, notifications |
| Student new    | `student.new@midad.test`     | empty states                                    |
| Student banned | `student.banned@midad.test`  | banned-account behaviour                        |
| Instructor     | `instructor.demo@midad.test` | published courses, sales, pending payout        |
| Instructor 2   | `khalid.alharbi@midad.test`  | ownership/IDOR negative tests                   |
| Applicant      | `applicant@midad.test`       | pending instructor application                  |

### Stripe test cards (test mode)

- Success: `4242 4242 4242 4242`, any future expiry, any CVC.
- Declined: `4000 0000 0000 0002`.
- 3-D Secure required: `4000 0025 0000 3155`.

The automated E2E suite uses a loopback Stripe gateway that runs the real SDK and signs webhooks;
no live key is needed.

## Commands

| Command                                                   | Purpose                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`                  | app                                                                                            |
| `pnpm dev:up` / `dev:down` / `dev:reset`                  | local Postgres, Redis, MinIO, Mailpit                                                          |
| `pnpm db:seed` / `db:verify` / `db:migrate`               | seed, invariants, migrations                                                                   |
| `pnpm worker`                                             | HLS, certificate PDF and email outbox worker                                                   |
| `pnpm lint` · `typecheck` · `i18n:check` · `format:check` | static gates                                                                                   |
| `pnpm test`                                               | unit + integration with coverage (349 tests)                                                   |
| `pnpm test:e2e`                                           | Playwright across desktop/mobile Chromium, Firefox, WebKit and iPhone (678 checks, 8 projects) |
| `pnpm verify`                                             | all gates in order                                                                             |

## Validation

`pnpm lint`, `pnpm typecheck`, `pnpm i18n:check`, `pnpm test` and `pnpm build` are green. The
Playwright suite covers the eleven end-to-end journeys in Arabic and English on every browser
project, the accessibility gate (axe, zero serious/critical), the interaction audit and visual
regressions. Load and stress scenarios live in `tests/load` (k6) and are documented in
`docs/TEST_PLAN.md`.

Known limitation: mobile Lighthouse performance on the development host remains below the 90
target because of main-thread time under 4× CPU throttling; LCP and CLS are within budget. This is
tracked as an open performance item, not a hidden pass.

## Project structure

```text
src/app/[locale]      pages (public, auth, dashboard, learn, instructor, admin)
src/app/api           auth, player, invoice, export, webhook, health, maintenance routes
src/features          feature components + server actions
src/server            services, auth, RBAC, money, storage, Stripe, email outbox
src/lib               pure rules (money, quiz, progress, refunds, payouts, SEO)
prisma                schema + forward migrations + bilingual seed
worker                HLS + certificate PDF + durable email outbox
tests                 unit, integration, e2e, a11y, visual, load
docs                  architecture, rules, decisions, test plan
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — layers, data model, request and media flows.
- [Business rules](./docs/BUSINESS_RULES.md) — pricing, coupons, refunds, payouts, certificates.
- [Design system](./docs/DESIGN_SYSTEM.md) — tokens, typography, RTL and accessibility rules.
- [Decisions](./docs/DECISIONS.md) — architecture decision log.
- [Test plan](./docs/TEST_PLAN.md) — gates, browser matrix, load and chaos scenarios.
- [Deployment](./docs/DEPLOYMENT.md) — Docker/VPS, managed services, worker, backups, Stripe live.

## Security

The platform applies server-side authorization on every action, signed media URLs, a strict CSP,
rate limiting, audit logging and secret scanning in CI. The security review in
`docs/SECURITY.md` describes the threats and controls; it is not a claim that the software is
vulnerability-free.

## License

Proprietary — all rights reserved.
