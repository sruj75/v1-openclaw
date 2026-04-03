# Project Instructions

This repository is the working plan for building Intentive as a proactive execution scaffold on top of OpenClaw, with Braintrust used from the beginning for rescue-loop traces, evals, and learning.

## Repo-Wide Rules

- Keep product-specific behavior in Intentive-owned modules and keep upstream OpenClaw changes minimal, seam-based, and documented.
- Engineering implementation should follow [docs/agents/design-philosophy.md](docs/agents/design-philosophy.md), especially deep modules, one clear home per concern, thin interfaces, and low dependency leakage.
- Engineering execution should follow [docs/agents/engineering-practice.md](docs/agents/engineering-practice.md), especially redesign over patch stacking, ruthless scope control, and explicit operational defaults.
- Structure the codebase to stay agent-ready: maintain a real test foundation, fast feedback loops, documentation as code, clear architecture boundaries, enforced conventions, typed contracts, and strong change safety. Use [docs/agents/codebase-readiness.md](docs/agents/codebase-readiness.md) as an engineering constraint, not just an assessment rubric.
- Treat comments as part of documentation: use them to capture design intent, invariants, boundary rationale, and ownership where code alone would hide the why. Do not use comments for obvious line-by-line narration.
- Treat Stage 1 as a direct `Expo -> OpenClaw WebSocket` path with Braintrust instrumentation from day 1, but build it so Stage 2 adapter mode remains easy to introduce.
- Treat raw OpenClaw protocol, runtime internals, and sidecars as infrastructure details to hide behind Intentive-owned contracts and mappers.
- Prefer the concrete repo shape `vendor/openclaw`, `apps/expo`, `apps/intentive-api`, `packages/openclaw-bridge`, `packages/intentive-*`, and `patches`, adding shared packages only when they earn their keep.
- Treat `docs/agents/product.md` as the founder lens: what we are building, for whom, and why it matters.
- Treat `docs/agents/engineering.md` as the engineer lens: how we plan to build it, with explicit assumptions and constraints.
- Capture unsettled ideas in `docs/agents/open-questions.md` instead of presenting them as decided facts.

## Read More

- [docs/agents/product.md](docs/agents/product.md): Founder view of the product, users, value, and scope.
- [docs/agents/engineering.md](docs/agents/engineering.md): Engineering view of architecture, systems, and delivery choices.
- [docs/agents/design-philosophy.md](docs/agents/design-philosophy.md): Module-design philosophy for keeping Intentive deep, decoupled, and strategically designed.
- [docs/agents/engineering-practice.md](docs/agents/engineering-practice.md): Operating system for how engineering work should be scoped, redesigned, validated, and shipped.
- [docs/agents/codebase-readiness.md](docs/agents/codebase-readiness.md): Structural rules for keeping tests, docs, feedback loops, conventions, and change safety strong enough for fast agent-assisted engineering.
- [docs/agents/testing.md](docs/agents/testing.md): Verification surface, testing expectations, and the default shape of lint, type, test, and end-to-end checks.
- [docs/agents/tooling.md](docs/agents/tooling.md): Preferred tools and libraries when they fit the current subsystem and architecture.
- [docs/agents/decisions.md](docs/agents/decisions.md): Durable architectural decisions that should not be re-litigated casually in every implementation pass.
- [docs/agents/mvp-plan.md](docs/agents/mvp-plan.md): Stage-1 30-day MVP plan grounded in the actual OpenClaw and Braintrust stack.
- [docs/agents/openclaw-map.md](docs/agents/openclaw-map.md): Repo-grounded OpenClaw touch map for Stage 1, Stage 2, and later pruning.
- [docs/agents/open-questions.md](docs/agents/open-questions.md): Active uncertainties, tradeoffs, and decisions still in flight.
