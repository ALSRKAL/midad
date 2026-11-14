# Security

This document describes the application's security controls. It is an engineering reference, not
a penetration-test report or a certification.

## Headers and CSP

Every HTML response receives a nonce-based Content-Security-Policy plus:

| Header                      | Value                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `X-Content-Type-Options`    | `nosniff`                                                  |
| `X-Frame-Options`           | `DENY`                                                     |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                          |
| `Permissions-Policy`        | camera, microphone, geolocation and payment disabled       |
| `Strict-Transport-Security` | production only, two years, `includeSubDomains`, `preload` |

The CSP allows `'strict-dynamic'` scripts with a per-request nonce, blocks objects and framing, and
restricts images/media/connect to the application origin and the configured object store.
`style-src` allows inline styles because React, Radix and Recharts emit them. API routes are outside
the HTML CSP by design.

## Authorization

- Every Server Action passes through a shared wrapper: Zod validation → session → role → resource
  ownership in the service → rate limit → mutation → revalidation.
- Admin mutations require the `ADMIN` role. Instructor mutations resolve course ownership from the
  session rather than trusting client-supplied ids.
- Student reads are scoped by `userId`/`orderId`; foreign ids return 404 or 403.
- Route handlers re-check the session. The player progress route validates Origin when present; the
  Stripe webhook verifies the raw-body signature and de-duplicates events by id.

## Rate limiting

Better Auth applies a per-IP window to sign-in, sign-up, verification and password reset. The action
wrapper rate-limits contact messages, coupon application, checkout and quiz submission. The client
IP is read from `x-forwarded-for`/`x-real-ip`.

## Uploads and rich text

Uploads validate declared type, size and magic bytes before storage. Tiptap HTML is sanitized on the
server before persistence; review and announcement bodies are rendered as text, never as HTML.

## Authentication and sessions

Passwords are hashed by Better Auth (scrypt). Sign-in and reset responses do not reveal whether an
address exists. Sessions are database rows with `HttpOnly` and `SameSite=Lax` cookies, `Secure` when
`APP_URL` is HTTPS. Banned and deleted accounts are rejected when the session is created, and their
sessions are invalidated.

## Secrets and dependencies

- `.env` and `.env.local` are ignored; gitleaks scans staged changes in the pre-commit hook and CI.
- Production dependencies are audited; known transitive advisories are pinned or overridden in
  `pnpm-workspace.yaml`.
- Test credentials in the seed and the loopback Stripe gateway are explicitly demo/test values and
  must never be reused in production.

## Residual risks

- No third-party penetration test or runtime exploit campaign is included here.
- The CSP permits inline styles; scripts remain nonce-gated.
- The maintenance flag is read through a small same-origin route cached for five seconds.

Never deploy with the example secrets, the seeded demo accounts, or the loopback payment gateway.
Use real Stripe keys, HTTPS, a managed SMTP provider and a private object store.
