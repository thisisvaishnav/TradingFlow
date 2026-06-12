# ─────────────────────────────────────────────────────────────────────────────
# TradingFlow — Client Dockerfile
# Build context: repo root  (docker build -f apps/client/Dockerfile .)
#
# Stage 1: Build the Vite/React app with Bun
# Stage 2: Serve the static output with Nginx
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS builder
WORKDIR /app

# Install dependencies (cached layer)
COPY package.json bun.lock .npmrc ./
COPY apps/client/package.json       ./apps/client/package.json
COPY packages/common/package.json   ./packages/common/package.json
COPY packages/eslint-config/package.json  ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN bun install --frozen-lockfile

# Copy source
COPY apps/client/    ./apps/client/
COPY packages/common/ ./packages/common/

# Build the Vite app
# VITE_API_BASE_URL must be passed as a build arg so it's baked into the bundle
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN cd apps/client && bun run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Nginx config: serve SPA with API proxy to backend
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
