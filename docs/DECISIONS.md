# Architecture decision log

Short decision records for choices that are expensive to reverse. Format: **Context → Decision →
Consequences**. Superseding a decision means adding a new record; the old one stays.

## ADR-0001 — pnpm via Corepack with a committed lockfile

**Context.** The project needs reproducible installs across development and CI.

**Decision.** Enable pnpm through Corepack and commit `pnpm-lock.yaml` and `packageManager` in
`package.json`.

**Consequences.** Every clone resolves the same package manager and dependency graph. Global pnpm
installs are not used.

## ADR-0002 — Exact dependency versions, Node 22

**Context.** Silent minor upgrades in an LMS with payments and media are unacceptable.

**Decision.** Pin direct dependencies exactly, target Node 22 LTS, and upgrade deliberately with the
full test suite.

**Consequences.** Upgrades are explicit pull requests. Renovate-style automation is optional and
must keep the lockfile and engine constraints.

## ADR-0003 — Feature-based modules and Server Actions

**Context.** The product spans catalog, commerce, learning, finance and admin surfaces.

**Decision.** Group UI, actions and services by feature (`src/features`, `src/server`), keep pure
rules in `src/lib`, and route mutations through a shared action wrapper for validation,
authorization, rate limiting and error shape.

**Consequences.** Ownership checks live next to the service that mutates data. Client components
never receive a trusted role or price.

## ADR-0004 — Arabic-first i18n and logical CSS

**Context.** Arabic RTL is the default locale, not a translation layer added later.

**Decision.** Use next-intl with route-based locales, ICU messages, logical CSS properties, and
direction-aware components. Server components receive only their route's message namespaces.

**Consequences.** Layout and keyboard direction are correct from the first paint. New copy requires
both `ar` and `en` keys.

## ADR-0005 — HLS-first video with a Mux adapter; player stays LTR

**Context.** The platform must self-host video now and be able to switch to a managed provider.

**Decision.** Store a 720p HLS ladder produced by ffmpeg, serve signed playlists/segments, and keep
the player layout LTR because timecodes read left-to-right even in Arabic.

**Consequences.** The player works with hls.js/MSE on all supported engines. A Mux adapter can
replace the storage/playback layer without changing lessons.

## ADR-0006 — Stripe Checkout; enrolment only from a verified webhook

**Context.** Payment success must never depend on a browser redirect.

**Decision.** Create Stripe Checkout sessions server-side; grant enrolment only when the signed
webhook is verified and recorded as processed.

**Consequences.** Closing the tab after payment still enrols the learner. Duplicate webhook
deliveries are idempotent.

## ADR-0007 — Injectable clock for time-dependent rules

**Context.** Refund windows, quiz timers and analytics ranges must be testable without sleeping.

**Decision.** Services accept a clock (or an injected `now`) for time-sensitive rules.

**Consequences.** Boundary tests are deterministic; production uses the system clock.

## ADR-0008 — Latin numerals in Arabic (`ar-SA-u-nu-latn`)

**Context.** Mixing Arabic-Indic and Latin digits in prices, dates and IDs causes support errors.

**Decision.** Render digits as 0–9 in Arabic copy while keeping Arabic currency and date wording.

**Consequences.** Prices, invoices, quiz timers and certificate codes are unambiguous and match the
Latin digits used by payment providers.

## ADR-0009 — Original PDF pipeline through Chromium

**Context.** Arabic shaping in generated PDFs is non-trivial.

**Decision.** Render HTML to PDF in a worker with headless Chromium and embedded fonts.

**Consequences.** Arabic text shapes correctly. This decision is superseded for certificates and
invoices by ADR-0014/0015; Chromium is retained only where HTML fidelity is required.

## ADR-0010 — Palette adjusted for WCAG AA

**Context.** The starting palette did not meet AA contrast on every surface.

**Decision.** Keep the ink/paper direction, adjust `--border-strong` and `--accent-strong`, and
record measured contrast ratios.

**Consequences.** All text/background pairs meet AA. Visual tests and the design-system document
carry the final tokens.

## ADR-0011 — Local object storage with MinIO

**Context.** Development and E2E need S3 semantics without cloud credentials.

**Decision.** Run a digest-pinned MinIO container on non-default host ports; production uses any
S3-compatible store through environment variables.

**Consequences.** Upload, signing and worker flows are exercised locally. No code path depends on
MinIO-specific APIs.

## ADR-0012 — ESLint pinned to the Next.js-supported major

**Context.** A new ESLint major arrived before the Next.js config supported it.

**Decision.** Stay on the supported major and upgrade when the framework config does.

**Consequences.** Lint remains part of `pnpm verify` without compatibility shims.

## ADR-0013 — Seed media is generated locally

**Context.** The repository must not contain stock photography with unclear licensing.

**Decision.** Generate course covers, short lesson videos and handouts deterministically with
ImageMagick/ffmpeg during seeding.

**Consequences.** The seed is reproducible and license-clean. Media is uploaded to object storage,
not committed.

## ADR-0014 — Invoices use pdf-lib with token-level RTL placement

**Context.** Chromium in the request path is too heavy for invoice downloads.

**Decision.** Draw invoices with pdf-lib, shaping Arabic text into positioned tokens with the
embedded font.

**Consequences.** Invoices are fast and dependency-light. Arabic shaping is covered by PDF smoke
tests and integration assertions.

## ADR-0015 — Certificates also use pdf-lib (supersedes ADR-0009 for certificates)

**Context.** Certificates need QR codes and verifiable codes without a browser process.

**Decision.** Generate certificates with pdf-lib and the same Arabic shaping pipeline as invoices.

**Consequences.** Certificate generation runs in the worker and in tests without Chromium. The
public verification page remains the source of truth.

## ADR-0016 — Durable database outbox for email

**Context.** Sending mail inside a request loses messages when the process restarts.

**Decision.** Persist an `EmailJob` row in the same transaction as the domain change; a worker
renders and sends bilingual templates.

**Consequences.** Mail survives restarts and retries. The worker is a single process; a distributed
lock is a future scaling step.

## ADR-0017 — Maintenance flag read through a same-origin route

**Context.** Middleware runs before application code and cannot query Prisma directly.

**Decision.** Expose a small internal route that returns the maintenance flag, cached per isolate
for five seconds, and let middleware consume it.

**Consequences.** Toggling maintenance takes effect within seconds without a deploy. The trade-off
is a short propagation delay.
