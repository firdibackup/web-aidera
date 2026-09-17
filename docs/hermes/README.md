# AIDERA Hermes Agent Design Package

## Status

This directory is a **frontend-local draft design contract**. It is documentation and test-design material only; it is not an executable Hermes package and must not be treated as loader configuration.

The executable source of truth must live in:

```text
/home/ubuntu/aidera-bridge
```

Any Bridge implementation must verify its own Hermes loader syntax, runtime integration, profile installation, model bindings, credentials, permissions, persistence, approval enforcement, and artifact behavior. Nothing in this directory overrides the Bridge.

## Sources

This draft is derived only from:

- `AIDERA-CONTENT-STUDIO-NEXTJS-MASTER-PRD.md`
- `API-CONTRACT.md`

If this draft conflicts with the deployed Bridge OpenAPI or implementation, stop and reconcile the contract in `/home/ubuntu/aidera-bridge`; do not guess.

## Contents

- `manifest.yaml`: declarative package inventory and role/handoff map. All loader-like fields are explicitly design-contract fields, not verified Hermes syntax.
- `COMMON.md`: shared runtime invariants for every agent.
- `schemas/runtime-contract.v1.schema.json`: JSON Schema for `aidera.agent_response.v1`.
- `profiles/*.md`: bounded role profiles for the seven allowlisted agents.
- `evals/agent-contract-cases.yaml`: declarative, machine-readable acceptance cases. Its assertion dialect is a frontend-local design contract, not Hermes loader syntax.

## Contract Summary

Every run must:

1. Stay inside the assigned task, context, approved instructions, and supplied attachments.
2. Produce `aidera.agent_response.v1` structured output.
3. Respect role ownership and stop at the declared handoff or human gate.
4. Never approve, activate permanent instructions, or publish.
5. Never expose credentials, tokens, private configuration, or chain-of-thought.
6. Treat artifacts and instruction versions as immutable; revisions create new versions through the Bridge.
7. Return proposals and handoff-ready outputs rather than claiming unobserved side effects.

## Design Director Contract

Each Design Director slide is represented by one `prompt` block. Every such block must repeat these exact lines so the requirement can be tested without interpreting prose:

```text
Canvas: 1080×1350 px (4:5).
Safe area: 50 px outer margin on all sides.
Branding: @aidera.
Tagline: Maximize your AI & Digital Tools! 🚀
```

Each slide block must also carry a positive integer `metadata.slide_number`. The Design Director creates layout briefs/prompts only, never generated images.

## Adoption Boundary

Before using this package operationally, the Bridge repository must own and test an executable equivalent. At minimum it must enforce the slug allowlist, bounded retries and timeouts, process-group cancellation, server-side secrets, approval gates, immutable artifact versions, idempotent consequential mutations, structured-result validation, and real append-only activity.
