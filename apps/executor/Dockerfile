# ─────────────────────────────────────────────────────────────────────────────
# TradingFlow — Executor Dockerfile
# Build context: repo root  (docker build -f apps/executor/Dockerfile .)
#
# IMPORTANT: lighter-sdk-ts uses Bun FFI with a native Linux amd64 .so binary.
# This image MUST run on linux/amd64. If you build on ARM (Apple Silicon),
# use --platform linux/amd64.
# ─────────────────────────────────────────────────────────────────────────────

FROM --platform=linux/amd64 oven/bun:1.3-slim AS base
WORKDIR /app

# ── 1. Install dependencies (layer-cached) ───────────────────────────────────
COPY package.json bun.lock .npmrc ./
COPY apps/executor/package.json           ./apps/executor/package.json
COPY packages/common/package.json         ./packages/common/package.json
COPY packages/db/package.json             ./packages/db/package.json
COPY packages/lighter-sdk-ts/package.json ./packages/lighter-sdk-ts/package.json
COPY packages/eslint-config/package.json  ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN bun install --frozen-lockfile

# ── 2. Copy source ────────────────────────────────────────────────────────────
COPY apps/executor/             ./apps/executor/
COPY packages/common/           ./packages/common/
COPY packages/db/               ./packages/db/
# Include the native signer binaries (the .so file is used on linux/amd64)
COPY packages/lighter-sdk-ts/   ./packages/lighter-sdk-ts/

# ── 3. Generate Prisma Client (must run after source is copied) ───────────────
RUN cd packages/db && bunx prisma generate --schema=prisma/schema.prisma

# ── 4. Runtime ────────────────────────────────────────────────────────────────
ENV NODE_ENV=production

# Executor is a long-lived background worker (no HTTP port)
CMD ["bun", "run", "apps/executor/index.ts"]
