# TradingFlow

A workflow-based trading automation platform. Users design visual workflows that connect **triggers** (price alerts, timers) to **actions** (exchange orders) — and the system executes them automatically.

## How It Works

```
User builds workflow in UI  -->  Backend saves it to MongoDB  -->  Executor polls & runs it
```

1. **Design** a workflow in the browser using a drag-and-drop node editor (React Flow).
2. **Connect** trigger nodes (price threshold, timer interval) to action nodes (Hyperliquid, Backpack, Lighter exchange orders).
3. **Save** the workflow via the REST API.
4. **Executor** picks it up, continuously evaluates trigger conditions, and fires the action chain when conditions are met.
5. **Track** every execution (status, timing, errors) on the executions page.

## Architecture

```
apps/
  client/        React + TypeScript + Vite + Tailwind + shadcn/ui
  backend/       Bun + Express REST API + JWT auth
  executor/      Bun background worker — trigger poller & graph runner

packages/
  common/        Shared Zod schemas, TypeScript types, asset metadata
  db/            Mongoose models (User, Workflow, Execution)
```

### Data flow

```
┌─────────┐   create/update   ┌─────────┐   read/write   ┌─────────┐
│  Client  │ ───────────────▶  │ Backend │ ─────────────▶  │ MongoDB │
│ (React)  │   view executions │ (Express)│                │         │
└─────────┘ ◀──────────────── └─────────┘ ◀───────────── └─────────┘
                                                               │  ▲
                                                    load       │  │  write
                                                  workflows    │  │ results
                                                               ▼  │
                                                          ┌──────────┐
                                                          │ Executor │
                                                          │  (Bun)   │
                                                          └──────────┘
```

## Node Types

### Triggers

| Type | Metadata | Fires when |
|---|---|---|
| **Price-trigger** | `asset`, `price` | Current market price reaches or exceeds the target |
| **Timer** | `time` (seconds) | Every N seconds since last fire |

### Actions (exchange adapters)

| Type | What it does |
|---|---|
| **Hyperliquid** | Places a LONG/SHORT order on Hyperliquid |
| **Backpack** | Places a LONG/SHORT order on Backpack exchange |
| **Lighter** | Places a LONG/SHORT order on Lighter exchange |

Supported assets: **SOL**, **BTC**, **ETH**.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- A running MongoDB instance

### Install

```bash
bun install
```

### Environment variables

Create a `.env` file in the project root (Bun auto-loads it):

```env
MONGO_URI=mongodb://localhost:27017/tradingflow
JWT_SECRET=your-secret-here

# Optional
VITE_API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
EXECUTOR_POLL_INTERVAL_MS=10000
```

### Run everything

```bash
bun run dev
```

This starts all three apps via Turborepo:

| App | URL / Port | Description |
|---|---|---|
| **client** | `http://localhost:5173` | React UI |
| **backend** | `http://localhost:3001` | REST API |
| **executor** | background process | Workflow poller & runner |

### Run individually

```bash
# Client only
bun run dev --filter=client

# Backend only
bun run dev --filter=backend

# Executor only
cd apps/executor && bun run dev
```

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | No | Create a new account |
| `POST` | `/signin` | No | Sign in, receive JWT |
| `GET` | `/workflow` | Yes | List user's workflows |
| `GET` | `/workflow/:id` | Yes | Get a single workflow |
| `POST` | `/workflow` | Yes | Create a new workflow |
| `PUT` | `/workflow/:id` | Yes | Update existing workflow |
| `GET` | `/workflow/execution/:id` | Yes | List executions for a workflow |

## Executor Details

The executor is a long-lived Bun process that:

1. Connects to MongoDB on startup
2. Polls all workflows every 10 seconds (configurable via `EXECUTOR_POLL_INTERVAL_MS`)
3. Evaluates trigger nodes — price triggers check live prices via CoinGecko, timer triggers fire on interval
4. When a trigger fires, walks the workflow DAG in topological order and executes each downstream action node
5. Records every node execution in the `Execution` collection (PENDING, COMPLETED, or FAILED)
6. Halts the action chain on the first failure — the failed node is recorded and downstream nodes are skipped
7. Shuts down gracefully on SIGINT / SIGTERM

## Tech Stack

- **Runtime**: Bun
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Flow
- **Backend**: Express, JWT, Mongoose
- **Database**: MongoDB
- **Monorepo**: Turborepo with Bun workspaces
- **Validation**: Zod (shared schemas)
