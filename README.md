<p align="center">
  <img src=".github/banner.png" alt="TradingFlow" width="100%" />
</p>

<h3 align="center">Visual Trading Automation for Crypto Markets</h3>

<p align="center">
  Design workflows. Connect exchanges. Automate trades.
</p>

<p align="center">
  <a href="https://github.com/thisisvaishnav/TradingFlow/actions/workflows/ci.yml"><img src="https://github.com/thisisvaishnav/TradingFlow/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=000" alt="Bun" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=fff" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=fff" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=fff" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Express-5-000?logo=express&logoColor=fff" alt="Express 5" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb&logoColor=fff" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Turborepo-monorepo-ef4444?logo=turborepo&logoColor=fff" alt="Turborepo" />
</p>

---

A **full-stack, workflow-based trading automation platform** built as a **Turborepo monorepo**. Users visually design trading workflows by connecting **triggers** (price alerts, timers) to **actions** (exchange orders) and **notifications** (email, Telegram) — and the system **executes them autonomously** in real time.

---

## Resume Highlights

> **Key technical achievements to feature on your resume:**

| Area | Highlight |
|------|-----------|
| **Architecture** | Designed and built a production-grade **Turborepo monorepo** with 3 apps and 4 shared packages, enforcing strict code sharing boundaries |
| **Visual Workflow Builder** | Implemented a **drag-and-drop DAG editor** using React Flow, allowing users to compose complex trading strategies without writing code |
| **DAG Execution Engine** | Built a custom **directed acyclic graph (DAG) runner** with topological traversal, fail-fast error handling, and full execution audit trail |
| **Exchange Integration** | Integrated real-time order execution via the **Lighter exchange SDK** (Bun FFI to native signer library), with a pluggable adapter pattern for multi-exchange support |
| **Real-Time Market Data** | Consumed **Binance API** for live price tickers with real-time updates; **CoinGecko** used for trigger price evaluation with a 15-second TTL cache |
| **Type-Safe Shared Schemas** | Enforced end-to-end type safety using **Zod schemas** shared across frontend, backend, and executor via a common package |
| **Auth System** | Implemented JWT-based authentication with bcrypt password hashing, protected routes, and token persistence |
| **Notification System** | Built transactional email notifications using **Resend + React Email** with HTML-rendered templates |
| **CI/CD Pipeline** | Set up **GitHub Actions** CI with lint, format, type-check, and build stages leveraging Turbo cache for fast incremental builds |
| **Modern Stack** | React 19, TypeScript, Tailwind CSS 4, Vite 8, Express 5, Bun runtime, MongoDB + Mongoose |

---

## How It Works

```
User builds workflow in UI  -->  Backend saves it to MongoDB  -->  Executor polls & runs it
```

1. **Design** a workflow in the browser using the drag-and-drop node editor (React Flow).
2. **Connect** trigger nodes (price threshold, timer interval) to action nodes (Lighter, Hyperliquid, Backpack) and notification nodes (email, Telegram).
3. **Save** the workflow via the REST API.
4. **Execute** — the background executor picks it up, continuously evaluates trigger conditions, and fires the action chain when conditions are met.
5. **Monitor** every execution (status, timing, errors) on the executions dashboard.

---

## Architecture

```
apps/
  client/          React 19 + TypeScript + Vite 8 + Tailwind 4 + shadcn/ui + React Flow
  backend/         Bun + Express 5 REST API + JWT auth
  executor/        Bun background worker — trigger poller & DAG runner

packages/
  common/          Shared Zod schemas, TypeScript types, asset metadata
  db/              Mongoose models (User, Workflow, Execution)
  lighter-sdk-ts/  TypeScript SDK for Lighter.xyz exchange (Bun FFI native signer)
  eslint-config/   Shared ESLint configuration
```

### Data Flow

```
┌─────────────┐  create/update  ┌───────────┐   read/write   ┌─────────┐
│   Client    │ ──────────────▶ │  Backend  │ ─────────────▶ │ MongoDB │
│ (React 19)  │  view results   │ (Express) │                │         │
└─────────────┘ ◀────────────── └───────────┘ ◀───────────── └─────────┘
                                                                  │  ▲
                                                       load       │  │  write
                                                     workflows    │  │ results
                                                                  ▼  │
                                                            ┌──────────┐
                                                            │ Executor │
                                                            │  (Bun)   │
                                                            └──────────┘
                                                                  │
                                                   ┌──────────────┼──────────────┐
                                                   ▼              ▼              ▼
                                              CoinGecko      Lighter       Resend
                                             (prices)      (orders)      (email)
```

---

## Key Features

### Visual Workflow Editor
- Drag-and-drop node graph powered by **React Flow** (@xyflow/react)
- Pre-built workflow templates (SOL Price Breakout, BTC DCA Timer, ETH Cascade)
- Real-time workflow toggle (active/inactive)

### Trigger System

| Type | Metadata | Fires when |
|------|----------|------------|
| **Price Trigger** | `asset`, `price` | Market price crosses the threshold (CoinGecko with 15s cache) |
| **Timer** | `time` (seconds) | Every N seconds since last fire |

### Exchange Adapters (Pluggable Pattern)

| Exchange | Status | Details |
|----------|--------|---------|
| **Lighter** | Fully implemented | Real orders via `lighter-sdk-ts` with Bun FFI native signer |
| **Hyperliquid** | Adapter stub | Pluggable — ready for SDK integration |
| **Backpack** | Adapter stub | Pluggable — ready for SDK integration |

Supported assets: **SOL**, **BTC**, **ETH**

### Notification Handlers

| Channel | Status | Details |
|---------|--------|---------|
| **Email** | Implemented | Resend API + React Email HTML templates |
| **Telegram** | UI ready | Node available in editor, executor handler planned |

### DAG Execution Engine
- Topological sort traversal of workflow graph
- Fail-fast execution — halts action chain on first failure
- Full audit trail: every node execution recorded as PENDING → COMPLETED or FAILED
- Configurable poll interval (`EXECUTOR_POLL_INTERVAL_MS`)
- Graceful shutdown on SIGINT / SIGTERM

### Authentication & Security
- JWT-based auth with bcrypt password hashing
- Protected routes on frontend with token persistence
- Stateless REST API with `Authorization` header

### Live Market Data
- Real-time price ticker consuming **Binance 24hr API** for BTC, ETH, SOL
- Dark/light theme toggle
- Responsive modern UI with shadcn/ui components

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun v1.3+ |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui, Radix, React Flow |
| **Backend** | Express 5, JWT, bcrypt |
| **Database** | MongoDB + Mongoose |
| **Validation** | Zod (shared schemas across all apps) |
| **Email** | Resend + @react-email/render |
| **Exchange** | Lighter SDK (Bun FFI), Hyperliquid, Backpack |
| **Market Data** | CoinGecko API, Binance API |
| **Monorepo** | Turborepo + Bun workspaces |
| **CI/CD** | GitHub Actions (lint, format, type-check, build with Turbo cache) |
| **Routing** | React Router v7 |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- A running MongoDB instance

### Install

```bash
bun install
```

### Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://localhost:27017/tradingflow
JWT_SECRET=your-secret-here

# Optional
VITE_API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
EXECUTOR_POLL_INTERVAL_MS=10000
```

### Run Everything

```bash
bun run dev
```

This starts all three apps via Turborepo:

| App | URL / Port | Description |
|-----|------------|-------------|
| **client** | `http://localhost:5173` | React UI |
| **backend** | `http://localhost:3001` | REST API |
| **executor** | background process | Workflow poller & DAG runner |

### Run Individually

```bash
bun run dev --filter=client     # Client only
bun run dev --filter=backend    # Backend only
cd apps/executor && bun run dev # Executor only
```

---

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/signup` | No | Create a new account |
| `POST` | `/signin` | No | Sign in, receive JWT |
| `GET` | `/workflow` | Yes | List user's workflows |
| `GET` | `/workflow/:id` | Yes | Get a single workflow |
| `POST` | `/workflow` | Yes | Create a new workflow |
| `PUT` | `/workflow/:id` | Yes | Update existing workflow |
| `PATCH` | `/workflow/:id/toggle` | Yes | Toggle workflow active/inactive |
| `DELETE` | `/workflow/:id` | Yes | Delete a workflow |
| `GET` | `/workflow/execution/:id` | Yes | List executions for a workflow |

---

## Executor Details

The executor is a long-lived Bun process that:

1. Connects to MongoDB on startup
2. Polls all active workflows every 10 seconds (configurable)
3. Evaluates trigger nodes — price triggers check live prices via CoinGecko (15s TTL cache), timer triggers fire on interval
4. When a trigger fires, walks the workflow DAG in **topological order** and executes each downstream action/notification node
5. Records every node execution in the `Execution` collection (PENDING → COMPLETED or FAILED)
6. Halts the action chain on the first failure — the failed node is recorded and downstream nodes are skipped
7. Shuts down gracefully on SIGINT / SIGTERM

---

## Project Structure Highlights

```
├── apps/client/src/
│   ├── pages/
│   │   ├── WorkflowDetailsPage.tsx   # React Flow visual editor
│   │   └── DashboardPage.tsx         # Workflow list + templates
│   ├── components/
│   │   ├── nodes/                    # Custom trigger/action/notification nodes
│   │   └── PriceTicker.tsx           # Live Binance price feed
│   └── lib/
│       └── api-client.ts             # Type-safe API client class
│
├── apps/executor/
│   ├── graph-runner.ts               # DAG execution engine
│   ├── trigger-evaluator.ts          # Price & timer trigger logic
│   ├── exchange-adapters/            # Pluggable exchange integration
│   └── notification-handlers/        # Email & notification dispatch
│
└── packages/common/
    ├── schemas.ts                    # Shared Zod validation schemas
    └── types.ts                      # Shared TypeScript types
```
