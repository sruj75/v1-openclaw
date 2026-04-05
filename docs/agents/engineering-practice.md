# Engineering Practice

Intentive engineering should optimize for speed with structural clarity, not speed with debt.

## Kernel

These are non-negotiable defaults for product engineering work:

- treat every feature request as a redesign problem, not an additive patch
- rebuild affected behavior as a coherent system for current requirements
- redesign only impacted domains and leave unrelated systems untouched
- delete non-essential requirements before design and code
- prefer the fewest moving parts that can stay correct
- treat recurring bugs as architecture signals, not patch tickets

Health probe:

- does one product behavior require too many moving parts to stay correct?

If yes, simplify before shipping.

## Before Any Plan Or Build

### Target Behavior

Define the outcome in user-visible terms:

- behavior to add or improve
- non-negotiable acceptance criteria
- existing behavior that must remain correct

### Affected Surface

Classify scope as:

- `affected-direct`
- `affected-indirect`
- `unaffected`

Keep unaffected systems out of scope.

### Reference Baseline

Before designing, gather the most relevant official documentation and reference implementations for the technologies in scope.

Rules:

- start from proven documented patterns when they fit the subsystem
- customize only where product behavior requires divergence
- keep deviations explicit and localized
- do not re-create primitives casually when a documented pattern already solves the problem cleanly

### First-Principles Requirements

Reduce requirements to:

- essential inputs
- essential outputs
- critical invariants
- hard constraints such as latency, consistency, safety, and cost

Do not inherit legacy implementation details as requirements.

### Deleted Requirements

Delete before building:

- speculative flexibility
- duplicate pathways
- convenience abstractions that increase complexity
- future-facing extras that are not required now

If nothing can be deleted, challenge assumptions again.

## Main Loop

### Iteration Architecture

Design `C` from `A + B`.

Rules:

- do not append B to A
- redesign affected boundaries and data flow for the combined intent
- collapse duplicated logic and hidden state transitions
- ensure clear ownership and explicit contracts
- incorporate validated documented patterns into the new design
- customize only where product behavior requires divergence

Target properties:

- low coupling
- predictable state transitions
- minimum component count required for correctness

### Implementation Sequence

Implement in dependency order:

1. foundation contracts and data model
2. core behavior path
3. integration surfaces
4. cleanup and removal of superseded paths

Allow temporary adapters only for safe migration.
Remove them quickly after cutover.

### Validation Plan

Validate both correctness and simplicity:

- acceptance criteria pass
- regressions stay covered
- moving-part count is reduced or tightly bounded
- debugging path is clearer than before
- no hidden state jumps are introduced

If behavior passes but complexity regresses, redesign again.

### Promotion Loop

When the same correction appears more than once:

- update the nearest stable doc if the issue is conceptual
- add or tighten a check if the issue is mechanically enforceable
- move the lesson into a durable decision if it changes architecture or repo policy

Do not rely on conversational repetition as the main enforcement mechanism.

## Bug Policy

On bug discovery:

1. identify the design assumption that allowed the failure
2. redesign the boundary, contract, or state flow to remove the failure mode
3. re-implement the affected code cleanly
4. add tests that prove structural prevention

Emergency containment patches are allowed only for active incidents.
After containment, redesign cleanup should happen in the same cycle.

## Forever Rules

### Core Invariants

- keep one source of truth per domain
- keep one write path per feature
- keep one transport contract per feature
- keep one owner per module
- keep one obvious debugging path per incident class
- favor deterministic behavior over adaptive behavior
- prefer explicit transitions over inferred transitions
- keep recovery behavior simpler than happy-path behavior
- keep local state-machine count low
- reject additions that increase mental load without measurable value

### Boundaries

- keep UI responsible for render and intent capture only
- keep orchestration responsible for flow control only
- keep API route layers responsible for validation, auth, and routing only
- keep service layers responsible for business invariants
- keep persistence access behind repository or storage boundaries
- keep agent layers responsible for proposal and tool selection only
- keep tool handlers responsible for external side effects
- keep domain logic outside screens, hooks, and route handlers
- keep cross-feature coupling explicit and rare
- keep dependency direction inward toward domain rules

### Reference-Informed Design

- start design work by identifying the technologies in scope and reviewing their official documentation
- use documented best practices and reference implementations as the baseline
- adapt proven patterns to fit product requirements instead of inventing new primitives by default
- when no reliable reference exists, design only the missing part with first principles and keep it minimal
- if diverging from documented patterns, keep the reason explicit and the change localized

### Data And State

- store canonical state once
- recompute derived state from canonical state whenever possible
- limit client state to ephemeral UI needs unless offline requirements force otherwise
- model state transitions as finite named states
- replace boolean clusters with explicit status enums
- store timestamps in UTC and convert at boundaries
- treat timezone as required data, not inferred ambient state
- carry correlation IDs through client, API, worker, and logs
- version externally visible payloads
- enforce schema validation at every trust boundary

### API And Transport

- define strict request and response schemas for every endpoint
- enforce idempotency on every write endpoint
- require client-generated operation IDs for replay safety where relevant
- keep error payloads machine-readable with stable error codes
- treat retryability as explicit metadata, not guesswork
- avoid transport-specific domain behavior divergence
- keep chat, voice, and background channels behaviorally aligned through shared service logic
- document and test endpoint side effects
- remove legacy routes after migration cutover

### Agent Runtime

- treat model output as untrusted until tool-confirmed
- allow tools to mutate state; prevent free-form text from mutating state
- keep tool contracts typed and validated
- keep toolsets minimal per mode
- enforce business invariants in deterministic code, not prompt text
- keep memory windows bounded and purpose-specific
- persist only context needed for next-step correctness
- track tool-call outcomes and compare them with assistant claims
- replace speculative recovery prompts with explicit reconciliation flows
- keep fallback modes observable and removable

### Async And Recovery

- use at-least-once delivery with idempotent handlers
- deduplicate with stable operation keys
- retry transient failures with bounded exponential backoff
- do not retry validation, authorization, or invariant failures
- record attempt count, last error, and next retry time
- route exhausted retries to dead-letter workflows where appropriate
- prefer replay from source-of-truth over local reconstruction
- avoid multi-layer blind retries
- require a sunset plan for every fallback branch

### Observability

- emit structured logs only
- include correlation ID, feature path, and version metadata in logs
- track latency, error rate, retry count, and fallback rate per feature
- log domain events with stable event names
- build dashboards by user journey, not only by component
- alert on user-impacting symptoms first
- convert repeated incidents into redesign tasks
- track moving-part count for critical flows

### Testing

- test contracts before implementation details
- add regression tests for every production bug class
- test idempotency and duplicate submission paths
- test race conditions on stale session results
- test out-of-order and repeated event handling
- test degraded dependency behavior
- keep end-to-end tests for top user journeys
- keep fast unit tests for invariants and guards
- fail CI on flaky tests until fixed
- require migration and rollback validation for schema changes

### Security And Safety

- validate all external input
- apply least privilege across services and tools
- keep secrets out of client builds and logs
- audit sensitive operations
- minimize stored personal data by default
- encrypt in transit and at rest
- treat prompts, tool inputs, and webhooks as untrusted
- keep security checks in CI
- rotate long-lived credentials
- document retention and deletion behavior

## Redesign Triggers

Stop and redesign when any of these appear:

- one user behavior requires touching many unrelated modules
- the same failure class appears more than once in a short interval
- recovery logic exceeds happy-path complexity
- multiple stores claim canonical ownership of the same data
- engineers avoid a module because change risk feels unpredictable
- feature additions require exception branches across multiple layers
- observability cannot explain failure cause quickly
- agent behavior is relied on for invariant enforcement
- compatibility code accumulates without removal
- delivery speed drops while architecture surface area grows

## What This Should Change In Practice

This operating model should affect:

- feature planning
- bug response
- refactor timing
- API and state-machine design
- observability defaults
- rollout and migration discipline
- test maintenance and regression strategy
- documentation updates as part of the same change
- design-intent comments in code when a module or boundary would otherwise be hard to reason about
- CI and local feedback-loop speed

## Readiness As Structural Discipline

Use [codebase-readiness.md](codebase-readiness.md) as an operating constraint, not a periodic ceremony.

That means:

- maintain tests as a verification system, not a best-effort backlog
- maintain docs as code so instructions and architecture do not drift apart
- maintain feedback loops so iteration stays fast enough for agent-assisted work
- maintain conventions and dependency boundaries through automation where possible
- maintain change safety through explicit contracts, observability, and regression coverage

When one of those starts degrading, do not wait for a formal assessment to tell you the codebase is drifting.
Treat the drift itself as an engineering problem to correct.

Use it together with [design-philosophy.md](design-philosophy.md), [engineering.md](engineering.md), [mvp-plan.md](mvp-plan.md), and [openclaw-map.md](openclaw-map.md).
