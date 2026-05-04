# Phase 4 Productized Manual Pilot Runbook

Parent PRD: #42
Child issue: #43

Phase 4 proves Intentive as a real product loop, not another wiring smoke test.
The pilot is a productized manual workflow for two users, one shared expert,
OpenClaw built-in Discord, proactive agent support, Langfuse-managed shared
runtime behavior, and founder-reviewed evidence.

This runbook is intentionally operational. It does not build a session upload
flow, expert dashboard, note allocator, local annotation exporter, or custom
Intentive relay. It gives the operator a repeatable way to run the manual pilot
and collect evidence without committing private content.

## Product Decisions

- Phase 4 is a productized manual pilot.
- The acceptance unit is a real two-user pilot week.
- One shared expert participates across both pilot users.
- OpenClaw built-in Discord remains the user-facing runtime.
- Each pilot user has one private Discord channel and one dedicated OpenClaw
  agent/workspace.
- Langfuse owns shared runtime behavior and review evidence.
- `openclaw:apply` applies the same resolved Langfuse prompt version to all
  registered pilot workspaces.
- Proactive heartbeat/check-in behavior is required.
- Expert-approved one-on-one session summaries are handed off to the correct
  OpenClaw agent through an operational runtime/admin interaction.
- The agent decides how to internalize each handoff into memory, workspace,
  durable context, or future behavior.
- The founder owns the final Phase 4 success judgment.

## Explicit Non-Goals

- No custom Discord ingress or Intentive relay resurrection.
- No SQLite routing, relay persistence, or relay-owned session state.
- No custom note allocator or note-to-file materialization schema.
- No direct workspace edit path for one-on-one session summaries.
- No session upload UI, transcript extraction pipeline, approval workflow, or
  expert dashboard.
- No local annotation tables, JSONL/CSV exporters, Langfuse upload tooling,
  custom scorers, or automated eval dashboard.
- No WhatsApp expansion unless it uses the same OpenClaw built-in-channel model
  after this pilot.

## Private Data Rules

Do not commit or paste private pilot material into git, GitHub, committed docs,
test fixtures, shell history copied into docs, or issue comments.

Never commit:

- Discord tokens
- OpenRouter keys
- Langfuse keys
- Discord user IDs or channel IDs
- phone numbers
- therapist notes
- private user facts
- one-on-one session summary text
- Discord message content
- screenshots of private messages

Safe evidence should use redacted labels:

- `<pilot-user-a>`
- `<pilot-user-b>`
- `<shared-expert>`
- `<pilot-channel-a>`
- `<pilot-channel-b>`
- `<workspace-a>`
- `<workspace-b>`
- `<langfuse-project>`
- `<langfuse-trace-a>`
- `<langfuse-trace-b>`

Observability identifiers used for OpenRouter and Langfuse must be redacted and
must never contain real names, Discord IDs, tokens, private message content, or
therapist notes.

## OpenRouter-to-Langfuse Identity Contract

Every OpenRouter request used for Phase 4 acceptance evidence must carry the
same identity contract so Langfuse can cleanly separate pilot users and
sessions.

Required fields and Langfuse mapping:

- OpenRouter `user` -> Langfuse User
- OpenRouter `session_id` -> Langfuse Session
- OpenRouter `trace.trace_name` -> Langfuse Trace metadata `trace_name`
- OpenRouter `trace.environment` -> Langfuse Trace metadata `environment`
- OpenRouter `trace.tenant_id` -> Langfuse Trace metadata `tenant_id`
- OpenRouter `trace.openclaw_agent_id` -> Langfuse Trace metadata `openclaw_agent_id`
- OpenRouter `trace.workspace_label` -> Langfuse Trace metadata `workspace_label`
- OpenRouter `trace.channel` -> Langfuse Trace metadata `channel`
- OpenRouter `trace.prompt_name` -> Langfuse Trace metadata `prompt_name`
- OpenRouter `trace.prompt_version` or `trace.prompt_label` -> Langfuse Trace metadata prompt version selector

These fields are mandatory for evidence used in this runbook. If any trace
lacks required identity fields, do not use it for Phase 4 acceptance evidence.

## Runbook

### 1. Prepare The Pilot Record

Create a private operator evidence packet using the template below. Keep it in
a private run log, secure evidence store, or private ticket. Do not commit it to
this repository.

Required top-level fields:

```text
Pilot label:
Parent PRD:
Operator:
Founder reviewer:
Shared expert label:
Pilot start:
Pilot end:
Evidence location:
```

### 2. Verify Two-User Setup

For each pilot user, verify the private Discord channel and OpenClaw binding.

```text
User label:
Private Discord channel label:
OpenClaw agent/workspace label:
OpenClaw binding location:
Channel participants checked:
Shared expert present:
OpenClaw bot present:
Workspace listed in registry:
Binding verified by:
Date:
Notes:
```

The two users must not share the same workspace, runtime session, or channel.
Record any ambiguity as a pilot blocker.

### 3. Verify Shared Expert Setup

The same expert should be able to participate in both private pilot channels.
Phase 4 does not lock a low-level message-visibility rule for expert messages.
The operator/founder observes whether the agent handles the human workflow
well enough.

```text
Shared expert label:
Channel A access checked:
Channel B access checked:
Expected expert role in pilot:
Operator notes:
```

### 4. Apply Shared Langfuse Runtime Prompt

Apply the same Langfuse-managed runtime prompt to all registered OpenClaw
pilot workspaces.

Production rollout:

```sh
LANGFUSE_PUBLIC_KEY=<redacted> \
LANGFUSE_SECRET_KEY=<redacted> \
npm run openclaw:apply -- \
  --langfuse-prompt intentive-runtime-bundle \
  --langfuse-label production
```

Pinned rollout:

```sh
LANGFUSE_PUBLIC_KEY=<redacted> \
LANGFUSE_SECRET_KEY=<redacted> \
npm run openclaw:apply -- \
  --langfuse-prompt intentive-runtime-bundle \
  --langfuse-version <number>
```

Record output without private bundle content:

```text
Langfuse project label:
Langfuse prompt name:
Resolved prompt version:
Apply mode: production/latest/pinned
Applied at:
Changed targets summary:
Operator:
Notes:
```

### 5. Confirm Proactive Behavior Configuration

Phase 4 must include proactive heartbeat/check-in behavior. The proactive
prompt should come from Langfuse-managed runtime behavior and the allowlisted
OpenClaw heartbeat config shape supported by the live runtime, not hardcoded
behavior in this repo.

Runtime bundles may set only `agents.defaults.heartbeat.prompt` inside
`## Config: openclaw`, and the prompt must be non-empty. The apply command
merges that prompt with the existing heartbeat object so operator-owned
heartbeat settings remain intact.

```text
Proactive policy source:
OpenClaw heartbeat/config location:
Cadence label, not private content:
Active-hours label:
User A proactive eligibility checked:
User B proactive eligibility checked:
Operator:
Notes:
```

### 6. Deliver Session Handoffs

For each user, the manually prepared, expert-approved one-on-one session summary
is handed off to the correct OpenClaw agent through an operational runtime/admin
interaction.

This is an agent handoff. It is not a direct workspace edit and not an
Intentive-owned note allocator.

```text
User label:
Expert-approved summary exists:
Private summary location:
Handoff delivered by:
Handoff delivered to agent/workspace label:
Handoff method:
Handoff timestamp:
Confirmation signal:
Notes:
```

Do not paste the session summary text into the evidence packet. Record only that
the handoff happened, where private source material lives, and which agent
received it.

### 7. Run The Pilot Week

During the week, record redacted observations for both users.

```text
User label:
Natural Discord support observed:
Proactive check-in observed:
Handoff-aware behavior observed:
Expert monitoring/intervention observed:
Role handling notes:
Support quality notes:
Founder/operator concerns:
Follow-up candidates:
```

Founder judgment owns whether the observed behavior is good enough. The evidence
packet should make that judgment possible without turning the pilot into a
premature metrics exercise.

### 8. Verify Langfuse Evidence

OpenClaw should send model calls through OpenRouter, and OpenRouter Broadcast
should send traces to Langfuse.

OpenRouter Broadcast is already the v1 trace path to Langfuse. Do not add
direct Langfuse SDK tracing in this repository for this slice.

For each user:

```text
User label:
Workspace label:
Prompt name:
Prompt version or label:
Live pilot message timestamp:
Langfuse project label:
Approximate trace timestamp:
Trace link or trace ID:
Matching runtime/user/session labels:
Langfuse Users separation evidence:
Langfuse Sessions separation evidence:
Metadata filter proof (tenant/user, agent, workspace, channel, prompt, version/label):
Only traces with required identity fields referenced: yes/no
Private message content omitted:
OpenRouter Broadcast to Langfuse confirmed:
Annotation queue review added: yes/no/not useful
Dataset seed added: yes/no/not useful
Experiment candidate added: yes/no/not useful
Improvement candidate:
Notes:
```

Phase 4 uses Langfuse traces, annotation queues where useful, dataset seeds
where useful, experiments where useful, and improvement candidates. Do not add
custom local annotation tables, local JSONL/CSV exporters, Langfuse upload
tooling, scorers, or automated eval dashboards.

### 9. Check Multi-User Isolation

Record isolation evidence after setup, handoff, proactive behavior, and live
support.

```text
Channel isolation checked:
Workspace isolation checked:
Session/runtime isolation checked:
Handoff target isolation checked:
Langfuse label/trace separation checked:
No cross-user trace/session ambiguity: yes/no
No cross-user leakage observed:
If leakage or ambiguity occurred, details:
Operator:
Date:
```

### 10. Founder Acceptance Review

The founder reviews the evidence packet and decides whether Phase 4 is complete.

```text
Founder reviewer:
Review date:
Decision: pass/fail/continue
What worked:
What failed:
Proactive behavior findings:
Session handoff findings:
Expert monitoring load:
Role handling findings:
Isolation findings:
Langfuse learning candidates:
Recommended next phase:
```

## Repository Checks

Before handing off issue #43, run:

```sh
npm test
npm run build
git diff --check HEAD
```

These checks prove the runbook remains discoverable and the operator tooling
still builds. They do not prove the live pilot week; the later Phase 4 HITL
issues own that evidence.
