# AIDERA Content Studio

Local Next.js control center for AIDERA content planning, specialist-agent work, production stages, scheduling, artifacts, approvals, and audit. The browser talks only to same-origin BFF routes; durable state and Hermes execution remain in AIDERA Agent Bridge.

## Status

The repository is being initialized as a six-screen prototype. Development/test fixtures are explicitly labeled `Prototype Data`; they are not operational Bridge data and are never enabled in production.

## Source of Truth

- Product and implementation contract: `AIDERA-CONTENT-STUDIO-NEXTJS-MASTER-PRD.md`
- Bridge endpoint contract: `API-CONTRACT.md`
- Current machine-readable snapshot: `OPENAPI.json`
- Repository agent rules: `AGENTS.md`
- Product and visual context: `PRODUCT.md`, `DESIGN.md`

## Security

`AIDERA_BRIDGE_TOKEN` is server-only. Never prefix it with `NEXT_PUBLIC_`, expose it in browser responses, or commit `.env.local`.

Setup and scripts will be documented after the application scaffold is installed.
