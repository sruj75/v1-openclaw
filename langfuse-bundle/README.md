# Intentive Langfuse Bundle Workspace

This folder is the focused workspace for Intentive runtime prompt iteration.
The canonical prompts live in Langfuse; these Markdown files are source-shaped
copies for local review, design discussion, and `openclaw:apply` test fixtures.

## Bundle Files

- `intentive-runtime-bundle.md` is the shared operating contract for active
  pilot OpenClaw workspaces.
- `intentive-bootstrap-bundle.md` is the first-run prompt surface for initial
  relationship setup and minimal personalization.
- `proactivity-design.md` captures the current design discussion for
  proactivity, heartbeat, cron, and OpenClaw config boundaries.
- `cognitive-design.md` captures the current design discussion for
  outcome-first cognitive intervention, performance intimacy, embodied
  technique, and performance outcomes.

## Iteration Rules

- Treat prompt behavior as product behavior. Keep changes traceable to Langfuse
  observations, expert review, founder judgment, or explicit design decisions.
- Keep global Intentive behavior in Langfuse-managed bundle files.
- Keep user-specific learning in `USER.md`, not in global bundle files.
- Keep OpenClaw mechanism changes narrow. The bundle can currently patch only
  `agents.defaults.heartbeat.prompt` in `## Config: openclaw`; operator-owned
  cadence, active hours, delivery, routing, and secrets stay outside the bundle.
- Prefer small prompt changes with a few representative review cases over a
  giant speculative rewrite.

## Source Anchors

- Anthropic's multi-agent research writeup: use simulations, exact prompts and
  tools, concrete failure modes, explicit delegation boundaries, effort scaling,
  observability, and small early eval sets.
- OpenClaw automation docs: use heartbeat for context-aware periodic main
  session turns; use cron for precise or isolated scheduled tasks.
- OpenClaw config docs: config is schema-validated and most automation fields
  hot-apply, so prompt/config rollout can stay operationally small.
