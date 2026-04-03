# Design Philosophy

Read this file when designing modules, refactoring boundaries, or deciding how Intentive code should be organized as the product grows.

## Use This When

- Creating new packages, apps, or feature folders
- Designing APIs, bridges, adapters, or policies
- Deciding whether a module is too shallow or too coupled
- Reviewing architecture changes for long-term complexity cost

## Core Principle

Complexity is the main thing to manage.

Every engineering decision should be judged by whether it reduces or increases:

- change amplification
- cognitive load
- unknown unknowns

If a design makes future changes harder to locate, reason about, or isolate, it is probably the wrong design even if it works today.

## Current Score Target

Goal:

- 10 out of 10 for deep modules, clear abstractions, good information hiding, and low dependency leakage

Use this file as a review rubric when shaping new Intentive modules.

## Design Rules

### Deep Module Rule

Prefer deep modules:

- small, simple interface
- substantial hidden implementation
- meaningful functionality concentrated behind one abstraction

Avoid shallow modules:

- thin wrappers
- pass-through APIs
- folders that exist only to mirror implementation layers
- modules that expose lots of knobs but hide little complexity

Practical rule:

- if a module’s interface feels almost as complex as its implementation, redesign it

### One Concern, One Home Rule

Default to one product concern or feature area having one clear module home, often one folder.

Examples:

- one folder for work-block state and transitions
- one folder for intervention policy
- one folder for OpenClaw transport mapping
- one folder for Braintrust rescue tracing

This does not mean “make everything tiny.”

It means:

- group code by owned knowledge
- avoid scattering one feature across many unrelated places
- avoid temporal decomposition like `read`, `process`, `write` modules that all share the same knowledge

### Thin Interface Rule

Interfaces should be thinner than implementations.

Good interface properties:

- few entry points
- few required parameters
- clear ownership
- stable semantics

Good implementation properties:

- handles complexity internally
- chooses sensible defaults
- hides transport, format, and storage details

Push complexity down instead of forcing callers to coordinate it manually.

### Dependency Budget Rule

Dependencies are one of the main causes of complexity.

Keep module dependencies:

- limited
- explicit
- directional
- information-poor

Bad signs:

- one feature requires touching many folders
- modules depend on each other cyclically
- callers must know internal data formats
- protocol details leak into UI code

If a small change requires edits in many places, treat it as a structural problem, not just implementation work.

### Information Hiding Rule

Each module should hide at least one important design decision.

Examples:

- the OpenClaw bridge hides raw gateway protocol details
- the intervention policy module hides rescue-selection heuristics
- the block state machine module hides state transition rules
- the Braintrust instrumentation module hides trace and span wiring

If two modules share the same hidden knowledge, either:

- merge them
- or create a new module that owns that knowledge explicitly

### Strategic Programming Rule

Do not optimize only for speed of the current feature.

Treat every engineering change as a chance to leave the design clearer than before.

Expected behavior:

- spend time improving boundaries while implementing features
- avoid tactical shortcuts that create long-term coupling
- prefer strategic simplicity over fast local hacks

This is especially important in an early-stage startup, because complexity compounds fast.

## Intentive-Specific Guidance

### Module Shape For This Repo

The expected shape is:

- `vendor/upstream`: OpenClaw engine and minimal fork delta
- `packages/*`: Intentive deep modules and abstractions
- `apps/*`: product surfaces and service entrypoints

Use that shape intentionally:

- `apps` should orchestrate
- `packages` should own deep domain logic
- `vendor/upstream` should remain as untouched as practical

### Interface Ownership

Intentive-facing contracts should be ours, not borrowed raw from OpenClaw.

Examples:

- app-facing session APIs
- work-block lifecycle APIs
- intervention-policy inputs and outputs
- Braintrust rescue-trace interfaces

The caller should interact with Intentive concepts, not infrastructure internals.

### OpenClaw Boundary

When working near OpenClaw:

- keep product code out of upstream core files unless there is no better choice
- prefer wrappers, adapters, bridge packages, and loader seams
- keep upstream patches tiny and documented

This is not just for merge safety.

It is also a deep-module rule:

- upstream provides engine depth
- Intentive provides product depth
- do not collapse both into one tangled layer

## Comment And Documentation Rule

Comments should capture design intent where code alone is not enough.

Write comments for:

- abstractions
- invariants
- why a boundary exists
- why a module owns a piece of knowledge

Do not waste comments on obvious line-by-line narration.

If a module boundary is hard to explain in one sentence, the design may still be too muddy.

## Quick Review Checklist

Before finalizing a design, ask:

- Can I describe what this module owns in one sentence?
- Is the interface simpler than the implementation behind it?
- Does this module hide an important design decision?
- Would a future change touch one clear home, or many scattered places?
- Are callers forced to know protocol, storage, or policy details they should not know?
- Is this design strategic, or just the fastest tactical move today?

If several answers are no, the score is not yet high enough.

## Design Smells

Watch for:

- classitis or too many tiny wrapper modules
- pass-through methods and shallow folders
- per-feature logic scattered across many layers
- UI code knowing raw OpenClaw protocol
- modules split by time sequence instead of owned knowledge
- too many configuration parameters pushed to callers
- comments that explain what the code does but not why it exists

## How To Use This With Engineering Work

When doing engineering work in this repo:

- use this philosophy together with [engineering.md](engineering.md)
- use [openclaw-map.md](openclaw-map.md) for repo-aware edit points
- use [mvp-plan.md](mvp-plan.md) for Stage-1 sequencing

The philosophy should shape:

- module boundaries
- folder structure
- API design
- refactor decisions
- code review feedback
