# AIDERA Content Studio Prototype Design

**Date:** 2026-09-13
**Status:** Approved for implementation

## Goal

Build a structured six-screen prototype for AIDERA Content Studio that validates navigation, information architecture, responsive behavior, structured agent output, planning, Kanban, and calendar interactions without pretending fixture data is operational Bridge data.

## Scope

- Responsive Studio Shell
- Dashboard
- Agent directory and three-panel Agent Workspace
- Weekly/monthly Plans
- Fifteen-stage Kanban
- Month/week/list Calendar
- Content detail and approval review as contextual drawers

## Architecture

The browser calls only same-origin `/api/*` interfaces and uses TanStack Query for server state. Development and test may activate MSW fixtures, but the interface must show a persistent `Prototype Data — tidak tersimpan permanen` banner. Production never activates MSW and uses explicit BFF Route Handlers backed by a server-only Bridge client.

## Technology

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, TanStack Query, Zod, React Hook Form, dnd-kit, FullCalendar standard plugins, date-fns with `@date-fns/tz`, MSW, Lucide React, Sonner, Vitest, Testing Library, and Playwright.

## Interaction Model

- Kanban and calendar changes update optimistically and demonstrate rollback failures.
- Approval actions remain pending until acknowledged.
- Agent output uses `aidera.agent_response.v1` with safe unknown-block fallback.
- Mobile uses bottom navigation, agent tabs, and horizontally scrolling Kanban columns.
- Every screen includes loading, empty, error, and relevant offline states.

## Visual Direction

Restrained premium editorial product UI: neutral off-white canvas, white working surfaces, near-black ink, vivid AIDERA orange for primary action and active state, semantic status colors, strong typography, selective borders, and minimal elevation.

## Prototype Acceptance

- Desktop, tablet, and mobile navigation are usable.
- Prototype fixtures cannot be mistaken for live data.
- No browser request targets the Bridge domain directly.
- No server secret appears in browser assets or responses.
- Core navigation, structured chat, plan selection, Kanban movement, and calendar movement have Playwright coverage.
- Lint, typecheck, unit/component tests, E2E tests, and production build pass.

## Deferred Production Requirements

OpenAPI must be completed before generated types become authoritative. Production integration still requires defined board rank/conflict semantics, timezone serialization, SSE replay, attachment IDs/lifecycle, immutable approval target versions, and Bridge staging verification.
