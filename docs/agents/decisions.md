# Decisions

This file captures durable architectural decisions that should guide implementation until a deliberate replacement decision is made.

Use it to keep settled bets out of recurring debate and to keep the main docs from mixing permanent decisions with open questions.

## Current Decisions

### D-001: Build Around OpenClaw, Not Inside It

- OpenClaw is the upstream engine.
- Intentive owns product behavior, product contracts, routines, and user-facing workflows.
- Upstream edits should stay tiny, seam-based, and documented.

### D-002: Preferred Repo Shape

- `vendor/openclaw`
- `apps/expo`
- `apps/intentive-api`
- `packages/openclaw-bridge`
- `packages/intentive-*`
- `patches`

Shared packages should only be added when they stabilize a real shared contract or hide real complexity.

### D-003: Stage Progression

- Stage 1 uses direct `Expo -> OpenClaw WebSocket`
- Stage 2 introduces `apps/intentive-api` and `packages/openclaw-bridge`
- Stage 3 internalizes only what real product pressure justifies

Direct mode is a speed move, not the desired long-term app boundary.

### D-004: Runtime Data Stays Outside The Repo

Writable runtime data belongs in `/runtime-data`, not in the source tree.

Preferred shape:

```text
/runtime-data/
  sandboxes/{tenant_id}/{job_id}/
  caches/
  logs/
```

Code and durable product behavior stay in Git-managed source.

### D-005: Product Wedge

The first owned loop is:

- planned work-block start
- no-start or derailment rescue
- measurable action or intentional reschedule outcome

Features that do not strengthen that loop are not V1 by default.

### D-006: Braintrust From Day 1

Braintrust is part of the product loop from the beginning.

- one trace per rescue attempt
- meaningful spans inside the rescue attempt
- eval-ready metadata captured early even if labels start manually

### D-007: Comments Are Documentation

Comments should capture:

- design intent
- invariants
- why a boundary exists
- why a module owns specific knowledge

Comments should not narrate obvious line-by-line behavior.

## Decision Hygiene

- move unresolved tension to [open-questions.md](open-questions.md)
- update this file when a major architectural bet becomes settled enough that future implementation should assume it
- if a decision is replaced, update the old entry rather than leaving contradictory rules in multiple docs
