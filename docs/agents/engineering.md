# Engineering

Read this file when the task depends on understanding how `v1-openclaw` should be built.

## Use This When

- Planning architecture or system boundaries
- Choosing implementation patterns or tooling
- Applying the module-design rules in [design-philosophy.md](design-philosophy.md)
- Turning product intent into buildable technical work
- Handing off to the Stage-1 execution plan in [mvp-plan.md](mvp-plan.md)
- Looking up repo-grounded OpenClaw touch points in [openclaw-map.md](openclaw-map.md)

## Current State

This document is a living summary of the current engineering direction. It should capture durable system rules, boundaries, and implementation strategy rather than every temporary build idea.

For the current 30-day execution sequence, read [mvp-plan.md](mvp-plan.md). This file captures the durable patterns that plan should follow.
For repo-grounded file touch points and “edit vs inspect vs avoid” guidance, read [openclaw-map.md](openclaw-map.md).
For module design, dependency control, and deep-module guidance, read [design-philosophy.md](design-philosophy.md).

## Core Rule

Do not build the product inside OpenClaw.

Build the product around OpenClaw.

The working system model is:

- OpenClaw is an engine and upstream dependency
- Intentive owns the product layer, contracts, workflows, and user-facing behavior
- the fork should minimize overlap with upstream internals so upstream updates stay survivable

Decision rule:

- if a change is product-specific, assume it belongs in an Intentive-owned module unless there is a strong reason it must live upstream

## Repo Boundary Model

The fork should be treated as two zones:

- upstream zone: stays as close to OpenClaw main as possible
- Intentive zone: where the real product lives

Upstream-zone changes are allowed only when clearly necessary, such as:

- bug fixes
- tiny extension points
- small hooks
- config support
- dependency or security patches

Intentive-zone ownership includes:

- Expo app
- Intentive API
- product-specific skills and workflows
- cron and routine logic
- memory policy
- product-specific session logic
- UI contracts
- analytics

Recommended repository shape:

- `vendor/upstream` for the OpenClaw engine or mirrored upstream code
- `packages/` for Intentive-owned abstractions and deep modules
- `apps/` for user-facing product surfaces and service entrypoints
- `patches/` for tiny unavoidable upstream diffs

The goal is to keep custom behavior concentrated in a few predictable places instead of spreading it across upstream internals.

As a solo founder, this separation exists to preserve leverage from the OpenClaw community:

- upstream bug fixes and improvements should stay easy to pull in
- product velocity should come from building the Intentive layer, not maintaining a heavily diverged fork
- community-maintained engine work and founder-owned product work should reinforce each other instead of colliding

## Engineering Patterns

These are repeatable implementation patterns, not just high-level preferences.

Apply the `software-design-philosophy` skill when doing engineering-heavy design work in this repo, especially when deciding module boundaries, interfaces, or refactors.

### Placement Pattern

Ask of every change:

- is this upstream-generic or Intentive-specific?

Use this rule:

- generic bug fix, extension seam, reusable config support, or security patch may belong upstream
- product workflow, product policy, UI contract, memory behavior, or business logic belongs in Intentive-owned modules

### Modification Pattern

When adding behavior:

- first prefer wrappers
- then adapters
- then bridge packages
- then loader or config seams
- only then consider a tiny upstream patch

If a proposed change requires broad edits across upstream core files, stop and redesign the boundary.

### Override Pattern

When Intentive needs different behavior from an upstream file:

- do not replace the upstream file in place
- add an Intentive-owned alternative beside it
- route selection through one small loader or config seam
- resolve the override first
- fall back to the upstream default second

This is the reusable pattern behind:

```ts
const SOUL_PATH = env.SOUL_PATH || "souls/soul.md";
```

### Ownership Pattern

Keep these concerns separate every time:

- product code lives in Git and deployable modules
- user state lives in DB and storage
- temporary work lives in disposable workspaces
- deployed runtime serves requests and creates sandboxes, but does not become the source of truth

### Change Path Pattern

Choose the path based on what is being changed:

- user task output goes to sandbox, storage, and metadata
- experimental agent improvement goes to sandbox, branch, and PR
- real product behavior change goes through Git review and normal deployment

### Isolation Pattern

Every system action should answer three questions explicitly:

- whose state is this touching?
- which workspace may it write to?
- which code version handled it?

If those answers are unclear, the boundary is not designed well enough yet.

### Module-Depth Pattern

Prefer deep modules with small, stable interfaces and substantial hidden implementation.

Rules:

- one product concern should usually map to one module or one folder with clear ownership
- the public interface should stay thinner than the implementation beneath it
- push complexity down into the module instead of pushing decisions onto callers
- if a module mostly forwards calls or exposes internal details, it is probably too shallow

### Dependency Pattern

Treat dependencies as part of the complexity budget.

Rules:

- dependencies between modules should be few, explicit, and directional
- avoid feature logic spread across many folders that all must change together
- if a small change requires edits in many modules, treat that as a design smell
- prefer information hiding over shared assumptions between modules

### Strategic Programming Pattern

Do not treat engineering work as feature shipping only.

Rules:

- spend part of each change improving structure, not just making the feature work
- avoid tactical shortcuts that increase long-term coupling or obscurity
- comments should capture design intent where the abstraction is not obvious from code

## Architecture Principles

- Prefer composition over modification.
- Patch upstream only at seam points.
- Minimize the surface area where product code overlaps upstream code.
- Keep product assumptions out of framework internals.
- Hide product complexity inside Intentive-owned modules with small, stable interfaces.
- Keep deployed runtime code read-only in production.
- Treat Git as the only durable source of truth for product code and intentional behavior changes.

Seam points include:

- config files
- plugin registration
- adapter layers
- event handlers
- skill loaders
- scheduler hooks
- transport wrappers

Practical rule:

- product code must not live in upstream core files unless there is no other reasonable choice

Preferred extension mechanisms:

- wrappers
- adapters
- bridge packages
- Intentive-owned interfaces
- tiny, documented upstream patches

This is the path that gives:

- easier rebases
- easier security updates
- lower merge-conflict rate
- freedom to evolve Intentive separately

## Contract Ownership

The client app should depend on Intentive contracts, not raw OpenClaw contracts.

Good examples of Intentive-owned interfaces:

- `sendChatMessage`
- `startMorningPlan`
- `completeRoutineStep`
- `subscribeToRealtimeSession`

The app should avoid depending directly on:

- raw OpenClaw gateway handshakes
- upstream control-plane event names
- upstream role and scope semantics

This keeps the frontend stable even if the underlying bridge or upstream runtime changes.

Coupling rule:

- if the Expo app speaks raw OpenClaw protocol directly, the frontend becomes stuck to OpenClaw internal design
- direct protocol use is acceptable as a temporary speed move, but it should be treated as intentional short-term coupling
- the durable target is for the app to speak Intentive-facing contracts while Intentive translates to OpenClaw internally

## MVP Implementation Stages

The 30-day MVP can move through three stages without changing the long-term architecture story.

### Stage 1: Direct mode

Shape:

- fork OpenClaw
- keep the existing gateway
- connect Expo directly to the built-in OpenClaw WebSocket protocol

Why use it:

- fastest way to get something working
- lowest initial code surface
- good for learning the real data flow and transport behavior

Tradeoff:

- frontend becomes tightly coupled to OpenClaw protocol and control-plane semantics

Rule for this stage:

- use it to learn and ship quickly
- do not mistake it for the desired long-term boundary
- keep custom app logic outside upstream while using this shortcut

### Stage 2: Adapter mode

Shape:

- Expo talks to an Intentive-owned API
- Intentive API talks to OpenClaw internally
- Intentive exposes its own HTTP and WebSocket contract

Typical Intentive-facing surfaces:

- `POST /chat/send`
- `GET /session/:id`
- `POST /routine/checkin`
- `POST /morning-plan`
- `WS /realtime/:sessionId`

Why this stage matters:

- this is the real product boundary
- the app becomes simpler and more stable
- backend behavior can evolve without forcing frontend rewrites
- OpenClaw protocol is hidden rather than rewritten

Important distinction:

- Stage 2 does not require rewriting OpenClaw protocol itself
- Stage 2 mainly requires defining a cleaner Intentive-facing contract and translating to OpenClaw internally

### Stage 3: Internalization mode

Shape:

- keep only the upstream pieces that continue to add leverage
- gradually strip or replace parts that no longer matter to the product

Possible outcomes:

- keep runtime or gateway pieces that are still useful
- remove extra channels or generic operator complexity
- replace unnecessary semantics with Intentive-owned implementations
- upstream reusable seams discovered along the way

Rule for this stage:

- only internalize after the product boundary is already stable
- harvest from OpenClaw gradually rather than rewriting everything at once

Implementation recommendation:

- Stage 1 is acceptable for speed
- Stage 2 is the intended product architecture
- Stage 3 is optional and should happen only when real product pressure justifies it

Execution note:

- the concrete Stage-1 month plan, event-contract guidance, and Braintrust-first observability loop live in [mvp-plan.md](mvp-plan.md)

## Module Placement

Product-specific logic should live outside OpenClaw core in Intentive-owned modules, for example:

- `packages/intentive-skills`
- `packages/intentive-routines`
- `packages/intentive-memory-policy`
- `apps/intentive-api`
- `apps/expo`

The key idea is to keep product complexity concentrated in our own deep modules instead of scattering it through upstream internals.

Next planning step before broad implementation:

- define exact module boundaries before touching code deeply

That boundary work should identify:

- what remains upstream-owned
- what becomes Intentive-owned
- which seams need adapters or loaders
- which interfaces the app and API depend on

Module-boundary pattern:

- upstream owns engine behavior and reusable seams
- bridge layers translate between OpenClaw and Intentive contracts
- Intentive packages own product logic and policies
- apps depend on Intentive contracts, not raw upstream internals

## Override Pattern

Do not replace upstream behavior files in place when a clean override is possible.

Preferred pattern:

- keep the upstream file untouched
- add an Intentive-owned file separately
- add one small loader, registration, or config seam that selects the Intentive file
- make the seam resolve an explicit configurable path first, then fall back to the upstream default

Examples:

- do not replace an upstream `soul.md` directly; keep it and route loading through configuration to an Intentive-owned alternative
- do not edit built-in skills in place; keep upstream skills intact and load `intentive/skills/*` through a loader that can merge or prioritize Intentive-owned entries

The rule is:

- upstream file stays
- Intentive file is added separately
- one tiny seam decides which one is used

Only the loader or configuration point should change upstream, not the whole behavior file.

Concrete pattern:

- route behavior files through a configurable path
- resolve the environment or config override first
- fall back to the upstream default path if no override is supplied

Example shape:

```ts
const SOUL_PATH = env.SOUL_PATH || "souls/soul.md";
```

This means:

- the runtime does not hardcode one behavior file forever
- Intentive can provide its own file without replacing the upstream default
- the override happens through path routing, not in-place file replacement

The same pattern should be reused for:

- soul files
- skills
- prompt bundles
- workflow definitions
- product-specific policy files

## Runtime Mutability Boundary

The system needs a second boundary in addition to the upstream-vs-product split:

- what the deployed runtime is allowed to mutate

Safest production rule:

- the runtime may mutate state, logs, queues, memory, and temporary workspaces
- the runtime must not directly mutate deployed source files, core config, or repo-tracked production logic

Decision rule:

- if something must survive deploys or define product behavior, it belongs in Git-managed code or config
- if something is temporary, per-user, or per-job, it belongs in state storage or sandbox space

This means any “self-editing” behavior must be reinterpreted carefully:

- acceptable in temporary sandboxes
- acceptable in experimental branches or reviewable patches
- not acceptable as a direct hot edit to deployed runtime files

## Four Storage Planes

The architecture should keep four different concerns separate:

### 1. Product code

This is the durable application and backend logic.

Examples:

- API routes
- session manager
- tool executor
- scheduler
- auth
- memory adapters
- upstream runtime code we intentionally keep

Rules:

- version controlled in Git
- deployed from Git
- read-only at runtime in production
- shared across all users

### 2. User state

This is per-user or per-tenant operational data.

Examples:

- profiles
- sessions
- long-term memory
- schedules
- preferences
- credentials
- conversation history
- task queues
- artifact metadata

Rules:

- store in database, object storage, or queue systems
- never treat the repo or runtime filesystem as the source of truth

### 3. Ephemeral workspace

This is disposable scratch space for agent work.

Examples:

- generated files
- temporary edits
- build outputs before save
- sandbox tool operations
- experimental patches

Rules:

- isolate per job, session, or user
- keep disposable
- never mount over deployed app files
- destroy after completion when possible

### 4. Deployment runtime

This is the VM, container, or process that serves the service.

Its job is to:

- serve requests
- run workers
- read config
- talk to DB, storage, and queues
- create temporary sandboxes when needed

It is not the long-term home of truth.

## Control Plane And Data Plane

Keep the system split mentally and operationally:

- control plane decides code version, config, workers, tool availability, and policies
- data plane handles requests, sessions, memories, artifacts, queue jobs, and temporary sandboxes

Rule:

- the data plane must not rewrite the control plane

Git or GitHub should own:

- code
- versioned prompts and policies
- workflow definitions
- infrastructure config
- migrations
- schemas
- templates

Runtime should own:

- current execution
- temporary files
- caches
- logs
- job state

Database and storage should own:

- user data
- memories
- history
- artifacts

## Workspace Isolation

When an agent needs writable space, use explicit sandboxes outside the source tree.

A good workspace model includes:

- `input/` for copied or staged files
- `work/` for mutable scratch operations
- `output/` for final generated files before save or upload
- `metadata.json` for ownership, TTL, creation time, and permissions

Workspace pattern:

- copy in only what the job needs
- mutate only inside `work/`
- save durable results outside the workspace
- clean up after completion

Every job should carry identity through the system so workers know:

- which tenant or user it belongs to
- which workspace it may touch
- which code version handled it

This is how multi-user safety and debuggability stay intact.

## Multi-Tenant Rule

The system should scale as a multi-tenant service, not as one cloned app per user.

Keep these separations strict:

- shared codebase for all users
- tenant or user scoped state in every DB row and queue job
- job-scoped workspaces for temporary agent activity

Typical scoping fields include:

- `tenant_id`
- `user_id`
- `session_id`

Code stays shared.
State is tenant-scoped.
Workspace is job-scoped.

Implementation rule:

- no feature should rely on per-user cloned codebases to achieve isolation

## Upstream Change Budget

If the product requires broad changes across OpenClaw core, the architecture is probably wrong.

Healthy upstream changes look like:

- a few extension hooks
- a few config additions
- a few bridge points
- maybe one reusable client extraction
- maybe one adapter-friendly event surface

Avoid:

- rewriting gateway behavior broadly
- changing core server semantics in place across the repo
- rewriting session internals directly
- baking product-specific assumptions into shared upstream types

## Patch Discipline

Maintain a patch ledger whenever upstream files are touched.

Each entry should capture:

- file touched
- why it was touched
- whether it should be upstreamed later
- whether it can be moved out later
- likely risk during upstream rebase

The goal is to keep unavoidable fork delta visible and intentionally managed.

Patch-ledger pattern:

- every upstream patch should be small enough to explain in one sentence
- every upstream patch should have an exit plan: upstream later, move out later, or keep as intentional fork delta
- pulling from upstream should happen regularly so merge conflicts stay small instead of compounding

## Self-Editing Policy

There are three different cases and they should never be mixed:

### 1. Normal user task

Examples:

- generate a plan
- summarize docs
- create an artifact

Allowed:

- write in sandbox
- save outputs to storage
- store metadata in DB

Not allowed:

- edit deployed code

### 2. Experimental self-improvement

Examples:

- propose a new prompt
- propose a workflow change
- generate a tool-wrapper patch

Allowed:

- create a patch in sandbox
- push to an experimental branch
- open a PR for review

Not allowed:

- hot-edit production runtime files directly

### 3. Real product update

Examples:

- change the application itself
- ship a new workflow or policy
- alter production behavior durably

Required path:

- review in Git
- commit intentionally
- deploy through the normal delivery flow

Only this path should change production behavior durably.

## Git Strategy

Preferred branch model:

- `upstream-main` for a clean mirror of OpenClaw main
- `intentive-main` for product integration
- feature branches off `intentive-main`

Rules:

- never develop directly on the upstream mirror
- keep the upstream mirror clean
- replay a small patch set onto the product branch
- keep most custom work outside the vendor or upstream directory

## Build Stages

### Stage 1: Direct mode

Goal:

- get the system working quickly while touching upstream minimally

Do:

- connect Expo to the built-in gateway WebSocket
- learn the real data flow
- keep custom app logic outside upstream
- make only tiny upstream changes if required

Do not:

- broadly rewrite gateway or session core

### Stage 2: Adapter mode

Goal:

- decouple the product from raw upstream interfaces

Build:

- `intentive-api`
- `openclaw-bridge`
- an Intentive-owned HTTP and WebSocket contract
- an Intentive-owned auth and session abstraction

At this stage, the app should talk to our layer instead of directly to upstream.

### Stage 3: Internalization mode

Goal:

- decide which upstream pieces remain useful after the product boundary is stable

Possible outcomes:

- keep the upstream gateway or runtime
- replace some parts
- delete unused channel logic
- upstream reusable extension points

Because the product is already isolated by this stage, those decisions become manageable instead of destabilizing.

## Engineering Mental Model

Do not ask:

- how do we customize OpenClaw?

Ask:

- how do we build Intentive so OpenClaw is one module underneath it?
