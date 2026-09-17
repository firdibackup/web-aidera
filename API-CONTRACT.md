# AIDERA Agent Bridge — API Contract

Headless API for AIDERA content operations. No UI. Consumed by a local Next.js app.

- Base URL (prod): `https://aidera-bridge.firdiaudi.my.id`
- Base URL (dev): `http://127.0.0.1:8099`
- Auth: `Authorization: Bearer <AIDERA_BRIDGE_TOKEN>` on every request except `/api/health` and `/api/openapi.json`
- Content type: `application/json; charset=utf-8`
- Errors: `{"error": {"code": "...", "message": "...", "details": {...}}}` with proper HTTP status
- Idempotency: mutating endpoints accept `Idempotency-Key` header; repeat key returns the original result
- CORS: allowlist origins (default `http://localhost:3000`, `http://127.0.0.1:3000`), allows `Authorization`, `Idempotency-Key`, methods GET/POST/PATCH/DELETE/OPTIONS
- Pagination: `?limit=&offset=`; list responses return `{"data": [...], "meta": {"total": n, "limit": n, "offset": n}}`
- Single-object responses return `{"data": {...}}`
- Rate limits: per-token, separate buckets for runs vs reads; `429` with `Retry-After`

## Auth & meta

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness, worker state, version (no auth) |
| GET | `/api/openapi.json` | machine-readable spec (no auth) |
| GET | `/api/whoami` | token scope + limits |

## Agents

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/agents` | list 7 agents: slug, name, role, profile, model, status, counts, last_activity |
| GET | `/api/agents/{slug}` | one agent + active instructions + skills |
| PATCH | `/api/agents/{slug}` | set model / enabled |

Allowlisted slugs only: `ceo, research, writer, validator, growth, design, qa` mapping to `aidera-*` Hermes profiles.

## Runs (agent execution)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/runs` | start a run; returns `run_id`, `status=queued` |
| GET | `/api/runs` | list runs, filter `agent`, `status`, `content_id`, `thread_id` |
| GET | `/api/runs/{id}` | run detail incl. structured result, tokens, duration, cost estimate |
| POST | `/api/runs/{id}/cancel` | cancel (process-group kill) |
| POST | `/api/runs/{id}/retry` | retry bounded by max_attempts, no duplicate artifacts |
| GET | `/api/runs/{id}/events` | SSE stream for this run |

`POST /api/runs` body:
```json
{
  "agent": "research",
  "prompt": "…",
  "thread_id": 12,
  "context": { "scope": "content", "content_id": 5, "plan_id": null, "stage": "research" },
  "attachments": [{ "name": "ref.md", "mime": "text/markdown", "content_base64": "…" }],
  "options": { "save_artifact": true, "artifact_type": "research", "timeout_s": 900 }
}
```
Response `202`:
```json
{ "data": { "run_id": 31, "status": "queued", "agent": "research", "thread_id": 12 } }
```

Run result (structured envelope, validated; fallback `unstructured: true` with raw markdown):
```json
{
  "message": "…",
  "summary": { "title": "…", "items": ["…"] },
  "blocks": [{ "type": "recommendation", "title": "…", "content": "…", "severity": "info" }],
  "artifacts": [{ "id": 9, "type": "research", "title": "…", "version": 1, "path": "AID-001/research-v1.md" }],
  "proposedInstructions": [{ "scope": "agent", "text": "…", "reason": "…" }],
  "actions": [{ "type": "approve", "label": "…", "payload": {} }]
}
```

## Threads & messages

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/threads` | list/create threads (scope: global, plan, content) |
| GET/PATCH/DELETE | `/api/threads/{id}` | detail incl. messages, rename, delete |
| GET | `/api/threads/{id}/messages` | paginated messages with structured payloads |

## Instructions (institutional memory)

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/instructions` | list / propose (status `proposed`) |
| GET | `/api/instructions/{id}` | detail incl. diff vs active |
| POST | `/api/instructions/{id}/approve` | activate new version |
| POST | `/api/instructions/{id}/reject` | reject with note |
| POST | `/api/instructions/{id}/rollback` | reactivate previous version |
| GET | `/api/instructions/history` | full version history, filter `agent`, `scope` |

Only approved instructions are injected into prompts.

## Plans (CEO planning)

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/plans` | list / create weekly or monthly plan (goal, audience, pillars, frequency, references, performance inputs) |
| GET | `/api/plans/{id}` | plan + items |
| POST | `/api/plans/{id}/generate` | ask CEO agent to draft items (returns run_id) |
| PATCH | `/api/plans/{id}` | edit plan fields |
| POST | `/api/plans/{id}/revise` | request revision with notes |
| POST | `/api/plans/{id}/approve` | approve all or `{"item_ids": []}` |
| POST | `/api/plans/{id}/reject` | reject all or selected |
| POST | `/api/plans/{id}/archive` | archive |
| POST | `/api/plans/{id}/convert` | idempotent conversion of approved items to content cards |
| GET/PATCH | `/api/plan-items/{id}` | item detail/edit |

## Contents (Kanban + library + detail)

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/contents` | list/create; filters `status`, `stage`, `pillar`, `format`, `priority`, `archived`, `q`, `sort`, `date_from`, `date_to` |
| GET/PATCH/DELETE | `/api/contents/{id}` | detail (artifacts, tasks, approvals, activity) / edit / delete |
| POST | `/api/contents/{id}/stage` | move Kanban stage (15 stages), persisted |
| POST | `/api/contents/{id}/schedule` | set `scheduled_at` |
| POST | `/api/contents/{id}/duplicate` | duplicate as new idea |
| POST | `/api/contents/{id}/template` | save as template |
| POST | `/api/contents/{id}/archive` | archive/unarchive |
| POST | `/api/contents/{id}/revision` | request revision loop back to writer |
| POST | `/api/contents/{id}/final-package` | assemble final package |
| POST | `/api/contents/{id}/pipeline` | start/stop automatic pipeline |
| POST | `/api/contents/bulk` | bulk schedule/assign/stage/archive |
| GET | `/api/board` | Kanban grouped by stage with WIP counts and badges |
| GET | `/api/calendar` | month/week/list with overdue and not-ready indicators |
| GET | `/api/templates` | saved templates |

Stages: `ideas, ceo_planning, waiting_plan_approval, research, writing, validation, growth_review, waiting_copy_approval, design, qa, final_approval, scheduled, published, performance_review, blocked`.

## Tasks & stages

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/tasks` | list, filter `content_id`, `agent`, `stage`, `status` |
| POST | `/api/tasks` | create stage task (idempotent per content+stage) |
| POST | `/api/tasks/{id}/dispatch` | run the stage agent with handoff artifact |
| POST | `/api/tasks/{id}/handoff` | manual send-to-next-agent |

## Approvals

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/approvals` | pending/decided, filter `type`, `status` |
| GET | `/api/approvals/{id}` | before/after, impact, requester, diff, history |
| POST | `/api/approvals/{id}/approve` | approve with note |
| POST | `/api/approvals/{id}/reject` | reject with note |
| POST | `/api/approvals/{id}/revise` | request revision |

Types: `plan`, `copy`, `final`, `instruction`.

## Artifacts

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/artifacts` | list, filter `content_id`, `type` |
| GET | `/api/artifacts/{id}` | metadata + body |
| GET | `/api/artifacts/{id}/raw` | raw file download |
| GET | `/api/artifacts/{id}/compare/{other_id}` | unified diff |
| POST | `/api/artifacts` | create new version for a content item |

Artifact paths are confined to the workspace root; traversal rejected.

## Attachments

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/attachments` | upload bounded file (MIME + extension + size validated) |
| GET | `/api/attachments/{id}` | fetch metadata/content |

## Activity & events

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/activities` | append-only real events, filter `actor`, `event_type`, `target_type`, `since` |
| GET | `/api/events` | global SSE stream of real events |

No synthetic "agent is thinking" entries. No chain-of-thought stored.

## Settings & workflow

| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/api/settings` | presets, gates, automation flag, per-agent models, retry limit, telegram, branding |
| GET | `/api/workflow` | stage graph, gate positions, automation state |
| POST | `/api/notifications/test` | send a test Telegram notification |

## Metrics

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/dashboard` | needs-decision, active agents, upcoming, pipeline health, token/cost rollups |
| GET/POST | `/api/metrics` | performance metrics per content (views, reach, likes, comments, shares, saves, follows) |

## Security invariants

- Bearer token required for all data endpoints; constant-time comparison.
- Only `aidera-*` profiles may execute; slug allowlist enforced server-side.
- `subprocess` with `shell=False`; no user string reaches a shell.
- Artifact/attachment paths resolved and confined to workspace root.
- Payload cap and upload cap enforced.
- Secrets never returned by any endpoint.
- Cancel terminates the process group.
- Retries bounded; exhausted work becomes `blocked` with error summary.
