# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] — 2026-11-15

### Fixed

- Guest-cart merge now refreshes the shell even when the merge effect unmounts, and retries the
  session race.
- The player reapplies the resume position after media metadata loads; saved positions just past
  one second are resumed instead of starting at zero.
- E2E infrastructure no longer leaves stale servers or payment mocks on its ports, and the test
  servers keep connections alive long enough for pooled API clients.
- Mobile video journeys, hydration-sensitive form flows and shared fixture data were stabilised;
  WebKit now runs the video journeys through hls.js/MSE.

### Changed

- Test-only timeouts reflect a shared development host; retries remain disabled.

## [1.1.0] — 2026-11-11

### Added

- Course catalog with Arabic-normalised search, filters, sorting, pagination and SEO metadata.
- Stripe Checkout with signed idempotent webhooks, coupons, VAT, invoices and refunds.
- HLS video player with signed manifests, captions, resume, private timestamped notes and Q&A.
- Server-graded quizzes, 90%-watch completion, verifiable PDF certificates and public verification.
- Reviews, instructor replies, reports, in-app notifications and a durable bilingual email outbox.
- Instructor analytics, earnings, payout requests and admin finance operations.
- Admin console: users, courses, applications, categories, coupons, orders, payouts, refunds,
  reports, contact messages, announcements, settings, maintenance mode and audit log.
- Bilingual seed, Docker deployment, accessibility and visual regression suites, k6 load scenarios.

## [1.0.0] — 2026-11-11

First complete release of the platform.
