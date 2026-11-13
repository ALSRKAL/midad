# syntax=docker/dockerfile:1.7
#
# Midad production image (P13-T02).
#
#   docker build --target web --build-arg NEXT_PUBLIC_SITE_URL=https://midad.example -t midad-web .
#   docker build --target worker -t midad-worker .
#
# The web target is Next's traced standalone output. The worker target is bundled with esbuild to a
# single ESM file and runs on production dependencies only (P14-T06); no tsx or devDependencies are
# present in the final image.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable
# The schema is copied later; the explicit `prisma generate` in the builder stage is the only one
# that must run. Skipping the postinstall here keeps dependency installation independent of source.
ENV SKIP_PRISMA_GENERATE=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts/postinstall.mjs ./scripts/postinstall.mjs
RUN pnpm install --frozen-lockfile

FROM base AS builder
# Build-time placeholders: no real secret is baked into the image. Runtime values come from the
# orchestrator's environment.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV REDIS_URL=redis://localhost:6379
ENV S3_ENDPOINT=http://localhost:9000
ENV S3_ACCESS_KEY_ID=build
ENV S3_SECRET_ACCESS_KEY=build
ENV S3_BUCKET_PUBLIC=midad-public
ENV S3_BUCKET_PRIVATE=midad-private
ENV AUTH_SECRET=build-only-secret-not-used-at-runtime
ENV NODE_ENV=production
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build
# The worker and its smoke script are bundled to plain JS; dependencies stay external and are
# installed in the slim runtime stage below.
RUN pnpm exec esbuild worker/index.ts --bundle --platform=node --format=esm \
      --packages=external --tsconfig=tsconfig.json --outfile=worker-dist/index.mjs
RUN pnpm exec esbuild worker/pdf-smoke.ts --bundle --platform=node --format=esm \
      --packages=external --tsconfig=tsconfig.json --outfile=worker-dist/pdf-smoke.mjs

FROM node:22-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/assets ./assets
USER node
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:22-bookworm-slim AS worker-deps
WORKDIR /app
# Only the worker's own dependency closure, not the Next/React/editor stack. Versions are pinned to
# the same values as the application package.json.
COPY worker/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS worker
# ffmpeg-static ships a single binary; the Debian ffmpeg package pulled ~475 MB of codec libraries.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=worker-deps /app/node_modules ./node_modules
COPY --from=worker-deps /app/package.json ./package.json
RUN ln -s /app/node_modules/ffmpeg-static/ffmpeg /usr/local/bin/ffmpeg
COPY --from=builder /app/worker-dist ./worker-dist
COPY --from=builder /app/assets ./assets
USER node
# The HLS/email/certificate loop.
CMD ["node", "worker-dist/index.mjs"]
# Smoke: `docker run --rm --env-file ... IMAGE node --conditions=react-server worker-dist/pdf-smoke.mjs`
