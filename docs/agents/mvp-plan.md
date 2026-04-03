# MVP Plan

Read this file when planning or implementing the current Stage-1 30-day MVP.

## Use This When

- Turning the product wedge into a week-by-week execution plan
- Deciding what to build first on top of OpenClaw
- Wiring Braintrust traces and evals into the MVP from day 1
- Checking whether a proposed task helps Stage 1 or belongs to a later stage
- Applying [design-philosophy.md](design-philosophy.md) during implementation, not just after the fact

## Plan Frame

This is not a generic startup MVP plan.

It is a Stage-1 plan grounded in the actual stack:

- Expo app
- direct WebSocket connection to OpenClaw
- OpenClaw gateway and runtime
- Intentive work-block rescue behavior layered on top
- Braintrust traces, evals, and experiment loop from day 1

The month is successful only if three loops exist together:

- product loop: work block, stall risk, intervention, recovery
- runtime loop: Expo and OpenClaw session loop actually works
- measurement loop: Braintrust traces and evals explain what happened

If any one of these is missing, the month fails.

## Month Goal

By day 30, Stage 1 should prove all of these:

- direct Expo to OpenClaw WebSocket flow works reliably
- per-user and per-session isolation is structurally correct
- the work-block intervention wedge works end to end
- Braintrust captures enough traces and eval-ready outcomes to guide decisions

Atomic outcome:

- user was likely to stall
- Intentive intervention happened
- user started or intentionally rescheduled instead of silently failing

## Non-Negotiable Rules

- Keep OpenClaw mostly intact during Stage 1.
- Keep Intentive behavior additive and isolated.
- Do not scatter founder-specific logic through random OpenClaw runtime files.
- Build Stage 1 as if Stage 2 adapter mode is definitely coming later.
- Instrument every important rescue step into Braintrust from day 1.
- Do not sacrifice multi-user correctness just because the first pilot is small.
- Implement new behavior as deep modules with thin interfaces, not as scattered tactical edits.
- Give each major concern one clear module home instead of spreading one feature across many folders.
- Treat dependencies as a budget: keep them few, explicit, and directional.

## Design Philosophy For Stage 1

Month 1 should follow the same design philosophy we want later.

Rules:

- one concern, one home: block state, intervention policy, OpenClaw transport mapping, and Braintrust tracing should each have a clear owner
- deep modules: each module should hide meaningful complexity behind a small interface
- thin interfaces: callers should not need raw protocol, storage, or tracing details
- low dependency leakage: a feature should not require touching many unrelated modules
- strategic programming: spend time improving boundaries while building, not only after the prototype works

Bad month-1 pattern:

- a little block logic in one place
- a little rescue logic in another
- raw OpenClaw event handling in screens
- Braintrust spans wired ad hoc in unrelated files

Better month-1 pattern:

- one clear module for block lifecycle and state transitions
- one clear module for intervention policy and prompt shaping
- one clear module for OpenClaw transport and event mapping
- one clear module for Braintrust rescue tracing and eval hooks

## Stage-1 North Stars

- runtime north star: direct Expo to OpenClaw WebSocket works reliably
- product north star: user starts after intervention
- scale-shape north star: per-user session isolation is correct
- learning north star: Braintrust explains why interventions succeed or fail

## Stage-1 Design Patterns

### Event Contract Pattern

Even though Stage 1 uses direct WebSocket transport, treat the socket as a product event bus, not as vague freeform chat.

Client-to-runtime events should be typed and explicit, for example:

- `session.init`
- `block.create`
- `block.list`
- `block.start_ack`
- `block.status_update`
- `intervention.response`
- `block.complete`
- `presence.ping`

Runtime-to-client events should be typed and explicit, for example:

- `session.ready`
- `agent.message`
- `intervention.prompt`
- `block.reminder`
- `block.rescue`
- `block.closed`
- `error`
- `trace.ref`

Rule:

- design the Stage-1 event shape so it can survive into Stage 2, even if the transport boundary changes later

### Identity Pattern

Stage 1 must already treat identity as first-class.

Required IDs:

- `user_id`
- `session_id`
- `block_id`
- `intervention_id`
- `trace_id`

The system must always know:

- which user
- which active session
- which work block
- which intervention
- which outcome

### State Ownership Pattern

Keep state ownership explicit from the beginning.

Expo owns:

- local UI state
- screen state
- temporary optimistic state if needed

OpenClaw session or runtime owns:

- active block state
- intervention state machine
- session context
- per-user working memory for the current session

Persistent store owns:

- user profile and preferences
- block history
- intervention outcomes
- memory that must survive sessions

Braintrust owns:

- traces
- eval datasets
- scoring metadata
- experiment comparisons

Implementation rule:

- the modules that own these concerns should hide their internals instead of leaking storage, protocol, or tracing details into callers

### Block State Machine Pattern

Represent the work-block loop as an explicit state machine, not implicit chat history.

Suggested state model:

- `scheduled`
- `due`
- `prompted`
- `rescued`
- `started`
- `completed`
- `missed`
- `expired`

### Scheduler Pattern

The scheduler can be basic in month 1, but it must be deterministic and traceable.

Responsibilities:

- detect due blocks
- send check-in event
- wait a fixed window
- send rescue if needed
- close block after the window ends

Design rule:

- the scheduler should call a thin block-lifecycle interface, not spread timing logic across multiple unrelated files

### Braintrust Pattern

Braintrust is part of the product loop from day 1, not decoration added later.

Use Braintrust at two levels:

- one trace per rescue attempt
- multiple spans inside that trace for each meaningful step

Trace at minimum:

- incoming WebSocket event
- block state transition
- intervention generation
- outbound prompt
- user response
- resolution outcome

Recommended root trace:

- `intentive.rescue_attempt`

Recommended root trace metadata:

- `user_id`
- `block_id`
- `block_category`
- `trigger_type`
- `policy_name`
- `policy_version`
- `model_name`
- `environment`
- `client`
- `openclaw_session_id`
- `rescue_success`
- `outcome_type`

Collect early eval labels, even if manually at first:

- did the user start after intervention?
- how long did it take?
- was the prompt relevant?
- was the tone right?
- was the rescue useful?
- was this a false positive?
- was there a missed rescue opportunity?

Recommended span structure inside one trace:

- `rescue_triggered` as a function span
- `context_built` as a function span
- `policy_selected` as a function span
- `llm_intervention_generated` as an llm span
- `intervention_sent` as a tool or function span
- `user_response_received` as a function span
- `followup_decision` as an optional function span
- `block_outcome_recorded` as a function span
- `rescue_score` as a score span when scoring is attached

## Week-by-Week Plan

### Week 1

Goal:

- lock the Stage-1 contract

Deliverables:

- one-page Stage-1 MVP spec
- work-block lifecycle spec
- intervention library v1
- WebSocket event contract
- identity model
- state ownership map
- per-user session design
- Braintrust trace schema
- early eval rubric

Decisions to lock:

- the exact wedge: important work-block start plus no-start rescue
- the supported block lifecycle
- the exact typed Stage-1 events
- the minimum identity model
- the ownership split between client, runtime, persistence, and Braintrust

### Week 2

Goal:

- make the thinnest real loop run end to end

Deliverables:

- Expo connected directly to OpenClaw WebSocket
- structured events flowing both ways
- two-user concurrent session test working
- block lifecycle state machine working
- block create flow
- due-time intervention
- one rescue path working
- Braintrust traces visible for each block lifecycle

Build focus:

- direct WebSocket connection and reconnect behavior
- identity attached to all traffic
- duplicate and stale event handling
- session isolation for concurrent users
- explicit block state machine
- simple scheduler
- Braintrust traces on all major transitions

Suggested module homes:

- one module for WebSocket transport and raw frame handling
- one module for mapping raw OpenClaw events into Intentive events
- one module for block lifecycle state transitions
- one module for intervention policy selection
- one module for Braintrust rescue instrumentation

### Week 3

Goal:

- run a tiny real-user pilot and learn where product and runtime break

Deliverables:

- pilot with 3 to 5 real users
- top-performing intervention patterns identified
- top failure modes identified
- session isolation validated under real usage
- state machine debugged under real usage
- first real trace corpus
- first manual eval dataset
- first quality rubric in use

Review pattern for every traced block:

- was the due event triggered correctly?
- did the intervention arrive on time?
- did the user understand it?
- did the rescue path make sense?
- did the state transition correctly?
- was the outcome classified correctly?

Prioritize only high-leverage fixes:

- identity and session bugs
- block state machine bugs
- timing bugs
- obviously bad prompts that kill trust

Refactor rule:

- when a fix reveals shallow or scattered design, spend time consolidating it into a deeper module instead of only patching the symptom

### Week 4

Goal:

- harden Stage 1 into a small real product foundation

Deliverables:

- stable block-start and rescue loop
- cleaned intervention set
- hardened WebSocket contract
- explicit multi-user session correctness checks
- documented Stage-2 adapter seam
- usable Braintrust traces
- eval seed set
- founder decision dashboard
- first pilot-user learnings summarized for month 2

End-of-month checks:

- one user’s block never appears in another user’s session
- one user’s memory never bleeds into another’s
- traces are partitioned correctly
- reconnect does not create broken duplicate sessions
- multiple active users do not break scheduler behavior

## Braintrust Evaluation Plan

The first eval sets should stay tied to the wedge.

### Eval Set 1: Intervention Quality

Question:

- did the system produce a clear, actionable, low-load intervention?

Dimensions:

- clarity
- actionability
- empathy without fluff
- low cognitive load
- specificity

### Eval Set 2: Rescue Decision Quality

Question:

- given the context, did the system choose the right intervention type?

Examples:

- overwhelmed user should not get an aggressive push
- unclear task should get task shrinking
- already-starting user should not get redundant nagging

### Eval Set 3: Product Outcome

Question:

- did the block get rescued?

Outcome categories:

- started after intervention
- not started
- partially started
- intentionally rescheduled

Intentional reschedule counts as better than silent failure.

### Eval Set 4: Tone Safety

Question:

- is the tone supportive and direct without sounding shaming, preachy, or therapy-adjacent?

Score for:

- respect
- low shame
- simplicity
- low fluff
- non-patronizing tone

### Eval Set 5: Action Likelihood Proxy

Question:

- based on the intervention and user reply, is this likely to create real action within minutes?

Useful labels:

- `likely_started`
- `unclear`
- `unlikely_started`

## Canonical Eval Cases

Start with a very small seed set.

Case 1:

- unclear task: user planned an investor update, did not start, and says they do not know where to begin

Expected:

- choose task shrinking and ask for one tiny concrete step

Case 2:

- overwhelmed user: user planned deep work and replies that they are already overwhelmed and behind on everything

Expected:

- choose pressure reduction and the smallest restart step, not a harder push

Case 3:

- avoidant but capable: user planned a bug-fix block, is online, and says they just do not want to do it

Expected:

- choose activation such as first file, first command, or a 10-minute sprint

Case 4:

- genuine schedule conflict: a meeting ran long and only a few minutes remain in the block

Expected:

- choose intentional reschedule, not fake rescue

Case 5:

- already started: user says they started but are moving slowly

Expected:

- support continuation instead of restarting the block or over-nudging

## Founder Dashboard

The month should end with a founder-facing dashboard that makes Braintrust and runtime behavior decision-useful.

Minimum useful views:

- blocks created
- blocks due
- blocks started
- rescue success rate
- missed blocks
- top intervention types
- trace count by outcome
- user and session errors

## What To Cut In Month 1

Do not spend this month on:

- broad OpenClaw channel ecosystem work
- voice complexity
- stripping down the full runtime already
- human escalation workflows
- rich memory systems
- advanced agent societies
- deep plugin expansion
- perfect abstractions for future stages
- rebuilding session runtime, gateway transport, or generic orchestration from scratch

## Stage-2 Seam To Document

By the end of month 1, explicitly write down:

- what the Stage-1 client currently does directly over WebSocket
- which CRUD-like actions should move behind HTTP later
- which real-time events should move behind an Intentive-owned WebSocket gateway later
- where auth and session normalization should live in Stage 2
- where product orchestration should thicken in front of OpenClaw

This prevents Stage 1 speed from silently becoming long-term coupling.
