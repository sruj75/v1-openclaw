# Phase 1 Level 2 Workspace Repurpose (OpenClaw-Native)

This doc maps OpenClaw workspace primitives and tools to the Level 2 Intentive
mechanism:

- Agent initiates.
- User supplies context.
- User does the actual work.
- Agent keeps proactive follow-through clean.

This is Phase 1 mechanism scope only, not deep cognitive optimization.

## Ground Truth From OpenClaw Docs

- Workspace is the agent's home and default working directory.
- Standard workspace files include:
  - `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `TOOLS.md`,
    `HEARTBEAT.md`, `BOOT.md`, `BOOTSTRAP.md`, `memory/YYYY-MM-DD.md`,
    optional `MEMORY.md`.
- `BOOTSTRAP.md` is one-time first-run ritual and should be removed after setup.
- `TOOLS.md` is guidance only and does not control tool availability.
- Heartbeat is periodic main-session wake-up.
- Cron is precise scheduling and persists on the gateway side.

## Level 2 Architecture (No Heavy Integrations)

Level 2 should not start by integrating all external systems.

Use this loop:

1. Heartbeat or cron wakes the agent.
2. Agent decides: intervene now or intentional silence.
3. If intervening, agent asks one next-step question in conversational language.
4. User gives context and executes real-world work.
5. Agent confirms what happened in natural language.
6. Agent updates follow-up contract, memory, and cleanup.

## File-By-File Repurpose

### `AGENTS.md` (system behavior contract)

Put stable mechanism behavior here:

- Capability honesty (never pretend to read tools it does not have).
- One follow-up promise per task.
- Every follow-up must have an exit condition.
- Non-response retry ladder exists.
- Wake-up decision gate: intervene now vs intentional silence.
- Cleanup-after-self (remove stale follow-up residue).

`AGENTS.md` is where hard system boundaries live.
Heuristics run inside those boundaries.

### `SOUL.md` (interaction style)

Put tone and relational style here:

- Conversational, low-pressure startup.
- One step at a time.
- Escalate tone progressively, not abruptly.
- No robotic form-filling language.

### `IDENTITY.md` (surface identity)

Keep the assistant's identity stable and clear.
No operational logic here.

### `USER.md` (durable personalization profile)

Store profile-level durable context:

- Role and work shape.
- Deliverable patterns.
- Deadline environment.
- Schedule/rhythm preferences.
- Known collapse tendencies at a high level.
- Preferred nudge style.

Do not put noisy per-turn logs here.

### `BOOTSTRAP.md` (one-time heuristic intake)

Use adaptive questions to initialize `USER.md`:

- Learn how this user works.
- Learn where follow-through breaks.
- Learn rough timing windows and constraints.
- Learn preferred language/pressure style.

This should be heuristic and conversational, not a fixed checklist.

After bootstrap, persist and continue in `USER.md` + memory files.

### `HEARTBEAT.md` (short wake-up checklist)

Keep small and operational:

- Check if there is an active commitment needing re-entry.
- Check if there is a pending follow-up promise due soon.
- Check if there is a stale commitment that needs recovery.
- If no meaningful intervention: return `HEARTBEAT_OK`.

Do not turn this into a long policy document.

### `memory/YYYY-MM-DD.md` (daily operations log)

Write minimal operational traces:

- Wake-up decision (`intervene` or `silence`) with short reason.
- Follow-up created/updated/closed.
- User outcome summary in plain terms.
- Retry ladder step used (if any).

This is the day-level audit and continuity surface.

### `MEMORY.md` (curated long-term memory)

Promote only durable patterns:

- Stable user preferences.
- Repeat failure patterns that remain true over time.
- High-signal interventions that repeatedly work.
- Durable constraints (time windows, communication boundaries).

Do not dump every operational event into `MEMORY.md`.

### `TOOLS.md` (local tool conventions)

Document conventions only:

- How the team names follow-up contracts.
- How to phrase cron event payloads.
- Any local formatting conventions for memory notes.

Remember: this file does not grant tool access.

## Tool Surface For Phase 1 Level 2

Required in practice:

- `message` (outbound proactive nudges)
- `cron` (precise follow-up promises)
- heartbeat runtime (periodic re-entry)
- `read`/`write`/`edit` (workspace file updates)
- `memory_search`/`memory_get` (recall)

Helpful:

- `sessions_*` / `session_status` for runtime inspection

Not required for Phase 1:

- Direct Gmail/Calendar/Slack/Docs ingestion
- Heavy external integration infrastructure

## Cron vs Heartbeat In Level 2

Use cron when timing is a promise:

- "I'll check back at 4:00 PM."
- "Ping me 30 minutes after this starts."

Use heartbeat for general awareness:

- User went quiet after agreeing to start.
- No active plan for the day.
- Something looks stale and needs recovery.

Rule of thumb:

- Cron keeps promises.
- Heartbeat notices drift.

## Follow-Up Contract Model (Simple)

Each active follow-up should carry:

- `task_ref` (which deliverable/task this belongs to)
- `promise_type` (`cron` or `heartbeat`)
- `when` (exact time if cron; intent window if heartbeat)
- `exit_condition` (done/deferred/superseded/dropped)
- `status` (active/closed)
- `updated_at`

And enforce:

- One active follow-up per task at a time.
- New follow-up should update/replace existing one, not duplicate.

## What "Closed" Means In Level 2

`closed` is internal cleanup bookkeeping, not user-facing robot language.

User can speak naturally:

- "done"
- "finished"
- "not today"
- "moved to tomorrow"
- "stuck"

Agent maps this free text to internal updates using heuristics.

## Guardrail Model

Use this split:

- System invariants (must-follow reliability boundaries).
- Heuristic execution (adaptive language/timing/judgment).

This keeps the system trustworthy without making it robotic.

## Practical Next Step

Create a first draft of:

1. `BOOTSTRAP.md` heuristic prompt
2. `HEARTBEAT.md` compact checklist
3. `AGENTS.md` Level 2 mechanism block
4. memory logging snippet format for `memory/YYYY-MM-DD.md`

Then run a 3-day manual simulation with one user and tighten from traces.

