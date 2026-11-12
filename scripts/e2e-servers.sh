#!/bin/sh
# Playwright web server for the E2E suite (docs/TEST_PLAN.md §3–§4).
#
# Two servers share one build:
#   3100 — the functional suite, with a limiter ceiling high enough for dozens of legitimate sign-ins;
#   3101 — the rate-limit suite, with the production-shaped ceiling (3 per window) so a test can
#          actually reach a 429 without exhausting the bucket the functional suite depends on.
#
# 3101 starts and becomes healthy first, then 3100. Playwright only watches 3100, so by the time the
# tests begin both ports are guaranteed ready and no test races the second server's boot.
set -eu

# Playwright only kills the process it started; a SIGKILLed run leaves the Next servers, fixture API
# and Stripe mock bound and the next attempt dies on EADDRINUSE (P15-T01). These four ports belong
# exclusively to this test stack.
if command -v fuser >/dev/null 2>&1; then
  for port in 3100 3101 3200 3201; do
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  done
fi

pnpm build

next_bin="./node_modules/.bin/next"

wait_for_health() {
  port="$1"
  attempts=0
  while [ "$attempts" -lt 240 ]; do
    if curl -fsS "http://127.0.0.1:${port}/api/health" >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 0.5
  done
  echo "e2e: server on ${port} did not become ready" >&2
  return 1
}

# Review/application queues need PENDING rows on every run; reset only the fixture rows.
# This runs before any server so a fixture failure aborts the run instead of half-starting it.
node --env-file=.env.local --import tsx scripts/e2e-fixtures.ts

# Per-test data factories (P14-T01). NODE_ENV=test is enforced by the server itself; it binds to
# loopback and is never part of the application image.
NODE_ENV=test node --env-file=.env.local --import tsx scripts/e2e-fixture-server.ts &
fixture_pid=$!
fixture_ready=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:3201/health" >/dev/null 2>&1; then
    fixture_ready=1
    break
  fi
  sleep 0.5
done
if [ "$fixture_ready" -ne 1 ]; then
  echo "e2e: fixture API did not become ready" >&2
  exit 1
fi

# A loopback Stripe gateway lets the suite drive the real Stripe SDK and signed webhooks without
# live keys. The values are deterministic test-only derivations (not secrets and not reachable from
# the app image) so a stale mock process from an interrupted run cannot sign with a different secret
# than the freshly started web server (P14-T01 WebKit diagnosis).
test_stripe_key="sk_test_$(printf '%s' 'midad-e2e-gateway' | sha256sum | cut -c1-32)"
test_webhook_secret="whsec_$(printf '%s' 'midad-e2e-webhook' | sha256sum | cut -c1-32)"

# An interrupted run can leave its loopback gateway bound; the new mock would then fail to start and
# the old process would serve stale payment behaviour. Free the test-only port first.
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3200/tcp >/dev/null 2>&1 || true
fi

STRIPE_SECRET_KEY="$test_stripe_key" \
STRIPE_WEBHOOK_SECRET="$test_webhook_secret" \
  node scripts/stripe-mock-server.mjs &
mock_pid=$!

APP_URL="http://127.0.0.1:3101" \
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3101" \
AUTH_RATE_LIMIT_MAX="3" \
  "$next_bin" start --port 3101 --keepAliveTimeout 65000 &
limit_pid=$!

wait_for_health 3101

APP_URL="http://127.0.0.1:3100" \
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3100" \
AUTH_RATE_LIMIT_MAX="1000" \
STRIPE_SECRET_KEY="$test_stripe_key" \
STRIPE_WEBHOOK_SECRET="$test_webhook_secret" \
STRIPE_API_BASE="http://127.0.0.1:3200" \
  "$next_bin" start --port 3100 --keepAliveTimeout 65000 &
main_pid=$!

wait_for_health 3100

# The video pipeline needs the HLS worker: the upload test waits for an asset to become READY.
# It reads DATABASE_URL and the S3 settings from .env.local, exactly like `pnpm worker`.
node --env-file=.env.local --import tsx worker/index.ts &
worker_pid=$!

cleanup() {
  kill "$main_pid" "$limit_pid" "$worker_pid" "$fixture_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait "$main_pid" "$limit_pid"
