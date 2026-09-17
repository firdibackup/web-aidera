# AIDERA Repository Instructions

## Read First

1. Read `PRODUCT.md` and `DESIGN.md`.
2. Read relevant sections of `AIDERA-CONTENT-STUDIO-NEXTJS-MASTER-PRD.md`.
3. Verify paths and payloads against `API-CONTRACT.md` and `OPENAPI.json`.
4. Inspect nearby code and tests before editing.

## Ownership

This repository owns the local Next.js App Router UI and same-origin BFF. The Bridge owns durable SQLite state, jobs, retries, process cancellation, artifacts, approval enforcement, activity, and Hermes execution.

## Non-negotiable Rules

- Browser code calls only same-origin `/api/*`.
- `AIDERA_BRIDGE_TOKEN` is server-only and must never enter browser bundles, responses, logs, screenshots, source maps, or fixtures.
- Never create an open proxy or accept caller-supplied upstream authorization headers.
- TanStack Query is the only server-state cache.
- Do not store board, calendar, approvals, artifacts, or instructions as browser source of truth.
- Do not display fake operational activity, agent work, metrics, approvals, or artifacts.
- Prototype fixtures are allowed only in development/test and must show the persistent `Prototype Data` banner.
- Never auto-approve or auto-publish.
- Permanent instructions change only through proposal, approval, version history, and rollback.
- Use the versioned `aidera.agent_response.v1` schema and render unknown blocks safely.

## Workflow

Work in vertical slices: failing test, minimal implementation, focused tests, refactor, then lint, typecheck, broader tests, Playwright, and build. A production feature is incomplete until its real Bridge mutation survives refresh and emits real activity.

## Code Conventions

- TypeScript strict with `noUncheckedIndexedAccess`; avoid `any`.
- Zod validates environment, UI input, network boundaries, and structured agent output.
- Generated OpenAPI types are never manually edited.
- Use explicit domain Route Handlers; separate JSON, SSE, upload, and raw-file transports.
- Forward `Idempotency-Key` for consequential mutations.
- Board/calendar may update optimistically with exact rollback; approvals/instructions wait for server success.
- Keep files focused and preserve established component vocabulary.
- Do not add code comments unless requested.

## Stop and Escalate

Stop rather than guess when OpenAPI lacks a required payload, a gate cannot be enforced server-side, board ordering/version semantics are unclear, artifact ownership is ambiguous, or implementation would require fake production data.

## Commands

Use the scripts defined in `package.json`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`. Run all relevant checks before declaring work complete.

## Git

Do not commit, amend, push, create a branch, or create a pull request unless explicitly requested. Never commit secrets or `.env.local`.
