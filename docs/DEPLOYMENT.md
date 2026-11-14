# Deployment — Midad

Production topology: **web replicas** (Next standalone image) + **one worker instance** + managed
PostgreSQL, Redis and S3-compatible storage + an SMTP provider. Stripe runs in live mode behind a
public HTTPS endpoint.

## 1. Build the images

The repository ships a two-target `Dockerfile`:

```bash
docker build --target web \
  --build-arg NEXT_PUBLIC_SITE_URL=https://midad.example \
  -t registry.example/midad-web:1.0.0 .

docker build --target worker -t registry.example/midad-worker:1.0.0 .
```

- **web** runs `node server.js` from Next's traced `standalone` output as the non-root `node` user.
- **worker** includes ffmpeg and runs `node --import tsx worker/index.ts`; it needs the source and
  the generated Prisma client, so it is a separate target.
- `.dockerignore` excludes `.next`, `node_modules`, tests, screenshots, reports and env files.
- `NEXT_PUBLIC_SITE_URL` is baked at build time; changing the public origin requires a rebuild.

Images were smoke-built and the web image was started against the local Postgres/Redis (health
reported database/redis OK). Storage/SMTP were intentionally pointed at the host; a real deployment
supplies their managed endpoints.

## 2. Environment

Copy every variable from `.env.example`. Required in production:

| Group      | Variables                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| App        | `APP_URL`, `NEXT_PUBLIC_SITE_URL` (same HTTPS origin), `AUTH_SECRET` (32+ random chars)                                                |
| DB / cache | `DATABASE_URL`, `REDIS_URL`                                                                                                            |
| Storage    | `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_PUBLIC`, `S3_BUCKET_PRIVATE`, `S3_FORCE_PATH_STYLE` |
| Auth/mail  | `AUTH_EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` (or `RESEND_API_KEY`)                         |
| Stripe     | `STRIPE_SECRET_KEY` (`sk_live_…`), `STRIPE_WEBHOOK_SECRET` (`whsec_…`), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`)             |
| Worker     | `FFMPEG_PATH`, `WORKER_CONCURRENCY`                                                                                                    |

Never set `STRIPE_API_BASE`, `CLOCK_OFFSET_MS` or `ALLOW_SEED_IN_PRODUCTION` in production; the env
schema rejects test-only combinations.

## 3. Database

Run migrations as a one-off job **before** starting new web instances:

```bash
docker run --rm --env-file /etc/midad/production.env \
  registry.example/midad-worker:1.0.0 pnpm exec prisma migrate deploy
```

The seed is for demos/tests only. In production create the first admin deliberately (SQL or a
one-off script); do not run `pnpm db:seed`.

Recommended managed Postgres settings: TLS required, daily automated snapshots + 7–30 day PITR,
connection pooler (PgBouncer) in front, `max_connections` budgeted per web replica × `DATABASE_URL`
pool size. The worker uses the same database.

## 4. Web replicas and reverse proxy

Run at least two web containers behind a TLS-terminating proxy/CDN. Example compose fragment:

```yaml
services:
  web:
    image: registry.example/midad-web:1.0.0
    env_file: /etc/midad/production.env
    restart: unless-stopped
    deploy:
      replicas: 2
    ports: ["3000"]
    healthcheck:
      test: ["CMD-SHELL", 'wget -qO- http://127.0.0.1:3000/api/health | grep -q ''"status":"ok"''']
      interval: 30s
      timeout: 5s
      retries: 3
```

The proxy must forward `X-Forwarded-For`/`X-Forwarded-Proto`; the app uses them for client IPs and
Better Auth's origin checks. Terminate TLS at the proxy and keep HSTS enabled (the app emits it in
production when `APP_URL` is HTTPS).

`/api/health` returns 200 only when the required dependencies (database, Redis, storage, mail) are
healthy; wire it to the orchestrator's readiness check (not liveness, to avoid restart loops during a
short SMTP outage).

## 5. Worker

Run **exactly one** worker instance per environment:

```yaml
worker:
  image: registry.example/midad-worker:1.0.0
  env_file: /etc/midad/production.env
  restart: unless-stopped
  command: ["node", "--import", "tsx", "worker/index.ts"]
```

It processes, in order: pending HLS video assets, the durable email outbox, then certificate PDFs.
Two workers can duplicate HLS/certificate work (KI-04); scale horizontally only after adding a
distributed lock. The worker needs outbound access to the database, Redis/S3 and SMTP, and writable
`/tmp` for ffmpeg.

## 6. Object storage

- Two buckets: public (covers/avatars/video thumbs) and private (videos, HLS, attachments, invoices,
  certificates). Keep the private bucket **private**; the application serves it through signed URLs.
- Enable versioning and a lifecycle rule for incomplete multipart uploads. Back up the public and
  private buckets with the provider's replication/export tooling.
- CDN in front of the public bucket is optional; set the S3 endpoint/public URL accordingly and
  rebuild the web image if the origin changes.

## 7. Backups and restore

- Postgres: provider snapshots + PITR; additionally take a logical `pg_dump --format=custom` daily to
  a separate region, encrypted.
- Object storage: versioning + cross-region replication for the private bucket (course videos and
  issued certificates are irreplaceable).
- Quarterly restore drill: restore the latest dump into a scratch database, run migrations, start a
  web container against it and call `/api/health` + an invoice download.
- Keep the previous two image tags for rollback; roll back web first, never roll back a forward-only
  migration without a reviewed down script.

## 8. Stripe go-live

1. Switch to live keys in the secret manager; update `STRIPE_SECRET_KEY`,
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Add the webhook endpoint `https://midad.example/api/webhooks/stripe` for
   `checkout.session.completed` and `checkout.session.expired`; copy the signing secret to
   `STRIPE_WEBHOOK_SECRET`.
3. Make one real low-price purchase with `4242 4242 4242 4242` in test mode first, then a live
   controlled purchase; confirm the order, enrollment, ledger entry, receipt email and invoice.
4. Exercise a refund through the admin refunds page and confirm the Stripe refund, enrollment
   revocation and negative ledger entry.
5. Keep the webhook endpoint's raw body untouched (the route verifies the signature); do not put a
   body-rewriting proxy in front of it.

## 9. Maintenance and operations

- Admin → Settings controls commission, VAT, refund/review windows, payout minimum, signed URL TTL
  and maintenance mode. Maintenance redirects visitors to `/[locale]/maintenance` within ~5 s while
  `/admin`, login, verification and reset stay reachable.
- Audit log is read-only; CSV exports are available for every admin table.
- Email: check the `email_jobs` table for `FAILED` rows; the worker retries five times. A stuck row
  can be requeued by resetting `status='PENDING', attempts=0` after fixing SMTP.
- Certificates: `certificates` rows with `pdfKey=null` are processed by the worker; check worker logs
  and S3 private bucket.

## 10. Known deployment limits

- Load test on one Node process: p95 far above §13.6 at 200 VUs (KI-18). The topology above adds
  replicas and a pooler, but anonymous HTML is still SSR; add CDN/ISR caching before large campaigns.
- Lighthouse mobile Performance is 77–80 on the build host (KI-17); TBT is React hydration. A faster
  edge/CDN and further bundle splitting are the next steps.
