# TradingFlow Project Config

## Agent Essentials (Top 10)
1. **Tech stack + versions**
   - Use React + TypeScript on client.
   - Use Bun + Express on backend.
   - Use shared types/schemas from `packages/common`.

2. **Canonical commands**
   - Use Bun commands for workspace tasks.
   - Preferred commands:
     - `bun run dev`
     - `bun run build`
     - `bun run test`
     - `bun run lint`
     - `bun run typecheck`

3. **Code style rules**
   - Keep code simple and readable.
   - Prefer early returns for branching logic.
   - Use descriptive names for variables/functions.
   - Follow existing lint/format conventions.
   - Keep components DRY and avoid duplicated logic.

4. **Architecture boundaries**
   - `apps/client`: UI and browser-only code.
   - `apps/backend`: API, auth, and server logic.
   - `packages/common`: shared types and schemas.
   - `packages/db`: DB layer and persistence helpers.
   - Do not import server-only modules into client.

5. **API and route conventions**
   - Keep route names and API paths consistent across client and backend.
   - Preserve current REST naming patterns for workflow/auth routes.
   - Return consistent JSON success/error payloads.

6. **Type/schema source of truth**
   - Shared API/domain types must be defined in `packages/common/types`.
   - Backend input validation should align with shared schema contracts.
   - Client API typing should consume shared types whenever possible.

7. **State and data-fetching conventions**
   - Keep API calls in dedicated client API modules (for example `src/lib/api-client.ts`).
   - Handle loading, error, and empty states explicitly in UI pages.
   - Surface actionable backend errors to users.

8. **Testing requirements**
   - Add or update tests for meaningful behavior changes.
   - Run targeted tests for changed areas before marking work complete.
   - Prefer small, focused tests over broad brittle tests.

9. **Safety and git workflow constraints**
   - Preserve existing user changes; do not revert unrelated edits.
   - Do not commit secrets or environment credentials.
   - Keep commits scoped to requested changes.

10. **Definition of done**
    - Implementation is complete (no TODO placeholders).
    - Targeted lint/type checks pass for edited files.
    - Routes/types remain consistent across client/backend/shared packages.
    - User-facing behavior is verified for changed flows.

## Stack
- Monorepo with workspaces: `apps/*`, `packages/*`
- Client: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Bun + Express + MongoDB (via `MONGO_URI`)
- Shared validation/types: `packages/common`

## Runtime Defaults
- Client dev URL: `http://localhost:5173`
- Backend API URL: `http://localhost:3000`
- Client API base env: `VITE_API_BASE_URL` (fallbacks to `http://localhost:3000`)
- Backend auth env: `JWT_SECRET` (fallback exists for dev only)
- Backend DB env: `MONGO_URI` (required)
- Backend CORS env: `CORS_ORIGIN` (comma-separated, optional)

## Key Routes
- Auth: `POST /signup`, `POST /signin`
- Workflows: `GET /workflow`, `GET /workflow/:workflowId`, `POST /workflow`, `PUT /workflow/:workflowId`
- Executions: `GET /workflow/execution/:workflowId`

## Lessons Captured
- Always enable CORS for browser clients on different origins.
- Avoid eager imports for unstable/heavy pages; lazy-load route modules.
- Return actionable error messages from API and surface them in UI.
- Validate request payloads with schemas on backend before DB writes.
