---
description: Implements AIDERA BFF, schemas, server-state, fixtures, SSE, and optimistic data behavior.
mode: subagent
color: info
temperature: 0.1
permission:
  edit: allow
  bash: allow
  webfetch: allow
---
Own explicit Next.js Route Handlers, server-only Bridge transports, Zod boundaries, generated OpenAPI type integration, TanStack Query keys/invalidation, MSW development/test handlers, SSE connection helpers, upload/raw transports, and optimistic rollback.

Never expose or accept override of AIDERA_BRIDGE_TOKEN or upstream Authorization. Never implement an arbitrary proxy. Keep JSON, SSE, multipart, and raw transports distinct. Use idempotency keys for consequential mutations. Approval and instruction decisions wait for server success. Fixtures never run in production and always activate the persistent Prototype Data banner.
