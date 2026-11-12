#!/bin/sh
# Secret scan of exactly what is about to be committed (the product requirements, §9.1).
# Uses the pinned gitleaks image so every developer and CI scan the same rules.
set -eu

IMAGE="zricethezav/gitleaks:v8.30.1"

if ! command -v docker >/dev/null 2>&1; then
  echo "gitleaks: Docker is required for the pre-commit secret scan." >&2
  echo "Install Docker, or run 'gitleaks git --staged --source .' yourself and bypass with --no-verify." >&2
  exit 1
fi

exec docker run --rm -v "$PWD:/repo" -w /repo "$IMAGE" \
  git --staged --no-banner --redact --config /repo/.gitleaks.toml /repo