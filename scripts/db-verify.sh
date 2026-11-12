#!/bin/sh
# Runs the database invariant checks (tools/db-invariants.sql) against the local Postgres
# container. Exits non-zero if any guard is missing or if a rule can be violated.
set -eu

CONTAINER="${MIDAD_POSTGRES_CONTAINER:-midad-postgres}"
DB_USER="${POSTGRES_USER:-midad}"
DB_NAME="${POSTGRES_DB:-midad}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "db:verify — container '$CONTAINER' is not running. Start it with: pnpm dev:up" >&2
  exit 1
fi

# ON_ERROR_STOP makes psql exit non-zero on the first unhandled error, so a missing guard
# (which raises) fails this script and therefore CI.
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f - \
  < tools/db-invariants.sql