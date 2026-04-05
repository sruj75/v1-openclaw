# Testing And Verification

Intentive should have one clear verification surface that a coding agent can use without guessing.

Tests, type checks, linting, and targeted verification are part of the product system, not cleanup after the fact.

## Core Rule

Every meaningful change should leave the repo easier to verify.

That means:

- important behavior should have a stable place to test it
- fast checks should exist for local iteration
- deeper checks should exist for critical user journeys
- validation commands should converge on a small predictable set

## Verification Surface

The repo should converge toward these script-level entry points:

- `lint`: formatting, lint, and import-boundary checks
- `typecheck`: schema, contract, and static-type validation
- `test`: fast verification for unit and focused integration tests
- `test:integration`: subsystem interaction tests where they materially matter
- `test:e2e`: top user journeys and rescue-loop outcomes
- `verify`: the default pre-merge path that runs the right combination of the above

Rule:

- agents should prefer stable package scripts over ad hoc command sequences
- if a script does not exist yet, introducing the stable script is often part of the improvement work

## What Must Be Tested

### Product Journeys

Keep high-signal coverage for:

- work-block creation and scheduling
- due-time reminder and rescue trigger
- user response to intervention
- start, reschedule, miss, and complete outcomes
- failure cases that would silently lose or corrupt the rescue loop

### Domain Invariants

Keep focused tests for:

- block lifecycle transitions
- intervention policy selection
- trace and metadata emission
- bridge mapping between Intentive contracts and OpenClaw protocol
- identity, correlation, and replay-safe behavior where async work exists

### Contracts And Boundaries

Keep verification around:

- transport schemas
- API request and response shapes
- persisted data constraints
- error payload stability
- typed event contracts that Stage 1 and Stage 2 depend on

## Test Design Rules

- test contracts before implementation details
- use tests to lock down a module's public behavior so implementation can change safely behind a stable interface
- prefer one clear home for tests that matches owned behavior
- add a regression test for every production bug class
- keep end-to-end tests for top user journeys only
- keep unit tests fast and dense around invariants and guards
- keep integration tests around modules that own cross-boundary behavior
- remove obsolete tests when the old path is intentionally deleted

Do not:

- rely on manual founder testing as the only signal
- hide weak architecture behind brittle mocks
- let flaky tests stay green through retries and silence
- create multiple overlapping test homes for the same behavior without a clear reason

## Feedback-Loop Rules

Verification should support fast iteration:

- local checks should finish quickly enough to be used often
- targeted tests should be runnable without booting the entire stack
- critical flows should have one obvious deeper validation path
- flaky tests should be treated as broken infrastructure, not tolerated noise

If the feedback loop gets slow enough that engineers stop using it, it is already failing.

## CI Expectations

CI should eventually enforce:

- lint and formatting consistency
- type and schema validation
- fast test pass/fail
- critical integration or end-to-end coverage where risk justifies it
- security and dependency checks for user-impacting systems

Rule:

- CI should fail loudly on broken invariants, flaky checks, and contract drift

## Mechanical Enforcement

The most important verification rules should graduate from prose into checks.

Examples:

- lint rules for conventions and import discipline
- structural tests for dependency direction and boundary violations
- schema and contract checks at trust boundaries
- verification scripts that converge on a small stable command surface

Rule:

- if the same verification correction appears repeatedly in review, prefer turning it into an automated check over repeating the same comment forever

## Documentation Requirement

When the implementation surface becomes real enough to standardize, add or update:

- canonical verification scripts
- test placement rules
- fixture and mock guidance
- end-to-end scope boundaries
- known expensive checks and when they are required

This file is the home for that guidance.
