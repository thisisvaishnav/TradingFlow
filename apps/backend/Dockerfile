# ─────────────────────────────────────────────────────────────────────────────
# TradingFlow — Backend Dockerfile
# Build context: repo root  (docker build -f apps/backend/Dockerfile .)
# ─────────────────────────────────────────────────────────────────────────────

FROM oven/bun:1.3-slim AS base
WORKDIR /app

# ── 1. Install dependencies (layer-cached) ───────────────────────────────────
COPY package.json bun.lock .npmrc ./
COPY apps/backend/package.json            ./apps/backend/package.json
COPY packages/common/package.json         ./packages/common/package.json
COPY packages/db/package.json             ./packages/db/package.json
COPY packages/eslint-config/package.json  ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN bun install --frozen-lockfile

# ── 2. Copy source ────────────────────────────────────────────────────────────
COPY apps/backend/    ./apps/backend/
COPY packages/common/ ./packages/common/
COPY packages/db/     ./packages/db/

# ── 3. Generate Prisma Client (must run after source is copied) ───────────────
RUN cd packages/db && bunx prisma generate --schema=prisma/schema.prisma

# ── 4. Runtime ────────────────────────────────────────────────────────────────
EXPOSE 3001
ENV NODE_ENV=production

CMD ["bun", "run", "apps/backend/index.ts"]
