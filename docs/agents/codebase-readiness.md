# Codebase Readiness

Intentive should be structured so agents can work safely and repeatedly, not just so humans can eventually assess it.

The `codebase-readiness` skill is useful here not because we want to score the repo every week, but because its dimensions describe the structural conditions the codebase should keep healthy at all times.

## Core Rule

Treat readiness dimensions as build constraints:

- do not let tests become optional
- do not let documentation drift into contradictory notes
- do not let feedback loops get so slow that iteration stalls
- do not let architecture become ambiguous about ownership and boundaries
- do not let conventions remain implicit
- do not let change safety depend on luck

If the codebase becomes hard for an agent to modify safely, it is already becoming hard for humans too.

## The Eight Structural Dimensions

### Test Foundation

Tests are not a later hardening step.
They are part of the product surface.

Rules:

- every important user journey should have at least one high-signal test path
- domain invariants should have fast unit or focused integration coverage
- every production bug class should leave behind a regression test
- test layout should mirror owned behavior, not just technical layers
- test quality matters more than coverage theater

For this repo that means:

- keep end-to-end or integration coverage on the rescue loop
- keep focused tests around block lifecycle, intervention policy, bridge mapping, and tracing contracts
- do not rely on manual founder testing as the only proof of correctness

### Feedback Loops

Fast feedback is part of architecture, not just CI polish.

Rules:

- local checks should catch obvious failures before review
- CI should give useful answers quickly enough to preserve iteration speed
- lint, type, test, and security signals should be easy to run independently
- flaky checks are design debt and should be treated as failures

For this repo that means:

- keep a small set of default commands that every feature can run quickly
- design modules so targeted tests are possible without booting the whole system
- prefer deterministic workflows over fragile long pipelines

### Documentation And Context

Documentation should behave like code:

- each doc should have a clear purpose and source-of-truth boundary
- root guidance should stay concise and delegate depth to leaf docs
- architecture choices, invariants, and rejected alternatives should be captured explicitly
- instructions should not compete across files
- code comments should document why a module, boundary, or invariant exists when that intent would otherwise be lost in implementation detail

For this repo that means:

- `AGENTS.md` is the directive index
- `docs/agents/*.md` files own deeper product, engineering, planning, and readiness guidance
- when a rule becomes important enough to repeat in conversation, it should probably exist in docs
- when two docs begin to disagree, treat that as a bug and resolve it
- comments should explain ownership, invariants, and boundary intent inside deep modules without devolving into tutorial-style narration

### Code Clarity

Code should be easy to navigate without reading the whole repository.

Rules:

- one concern should have one clear home
- file and folder names should reflect owned knowledge
- modules should expose small public surfaces
- large flows should have obvious entry points and obvious owners

This reinforces the deep-module rule rather than competing with it.

### Architecture Clarity

The repo should make boundaries visible.

Rules:

- product-facing code, upstream engine code, bridge code, and runtime data should be clearly separated
- ownership of state, transport, orchestration, and persistence should be explicit
- public contracts should be named and stable
- internal details should stay hidden behind module boundaries

For this repo that means keeping the current shape intentional:

- `vendor/openclaw`
- `apps/expo`
- `apps/intentive-api`
- `packages/openclaw-bridge`
- `packages/intentive-*`
- `/runtime-data/*` outside source control for mutable runtime work

### Type Safety

Type safety is how the codebase makes promises machine-checkable.

Rules:

- validate all trust boundaries
- keep transport and persistence schemas explicit
- prefer typed contracts between app, bridge, runtime, and storage
- do not leak unvalidated OpenClaw protocol details into product code

For this repo that means using schema and contract tooling intentionally, not as decoration.

### Consistency And Conventions

Conventions should be enforced, not remembered.

Rules:

- formatting, linting, naming, and import discipline should be automated where possible
- package and folder structure should reinforce recurring patterns
- dependency boundaries should be visible and checkable
- new code should fit existing patterns or clearly justify a better one

For this repo that means tools like dependency rules, typed schemas, and package conventions should protect the architecture we want.

### Change Safety

The codebase should make it hard to break important behavior silently.

Rules:

- keep one obvious debugging path for each critical flow
- require observability around user-impacting workflows
- use idempotent, replay-safe patterns where retries or async work exist
- make risky changes visible through tests, traces, and clear contracts

For this repo that especially applies to:

- work-block lifecycle transitions
- intervention delivery and user response handling
- Braintrust trace emission
- OpenClaw bridge mapping
- any future async scheduler or worker path

## What This Should Change In Practice

`codebase-readiness` should shape implementation defaults:

- new features should come with tests in the same cycle, not as cleanup
- new modules should document ownership and invariants while they are introduced
- new boundaries should have explicit schemas and failure modes
- docs should be updated when architecture or workflow rules change
- comments should be added or revised when a design decision, invariant, or boundary would otherwise be hard to recover from code alone
- CI and local developer commands should stay fast enough to support iteration
- repeated confusion in review should trigger better docs or clearer boundaries

## Required Artifacts Over Time

This repo should gradually maintain:

- concise root instructions in `AGENTS.md`
- focused leaf docs under `docs/agents/`
- a stable home for durable decisions in `docs/agents/decisions.md`
- architecture notes when system boundaries become materially more complex
- testing and verification guidance in `docs/agents/testing.md`
- stable scripts or commands for lint, type checks, tests, and targeted verification

Not all of these need to exist immediately, but they should appear as soon as the missing artifact starts causing repeated confusion.

## Readiness Without Process Theater

Do not turn this into bureaucracy.

The point is:

- better tests
- better docs
- better boundaries
- faster feedback
- safer changes

The point is not:

- more scorecards than engineering
- duplicate documents
- ceremonial checklists no one uses

Use readiness as a design pressure that keeps the repo legible, verifiable, and safe to evolve.
