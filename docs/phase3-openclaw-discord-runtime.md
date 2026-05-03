# Phase 3 OpenClaw Built-In Discord Runtime Setup

Parent PRD: #31
Child issue: #38

This runbook is for configuring one private pilot channel through OpenClaw
built-in Discord. OpenClaw owns Discord ingress, channel binding, conversation
execution, and runtime state. This repository owns only the operator tooling
around workspace registration and Langfuse-managed runtime prompt rollout.

Do not commit Discord tokens, OpenRouter keys, Langfuse keys, Discord user
IDs, Discord channel IDs, therapist notes, private user content, or screenshots
of private messages. Record private acceptance evidence in the operator's
private run log, ticket, or secure evidence store.

## Prerequisites

- A private Discord channel with exactly the pilot user, the assigned expert,
  and the OpenClaw Discord bot.
- An OpenClaw installation with built-in Discord enabled by the OpenClaw
  operator, not by this repository.
- One OpenClaw user workspace for the pilot user.
- The same workspace path listed in `openclaw-workspaces.json`.
- OpenRouter configured as the model provider used by the OpenClaw runtime.
- OpenRouter Broadcast configured with Langfuse as an observability
  destination.

## Secret Handling

Configure secrets only in the OpenClaw host environment or the OpenRouter and
Langfuse dashboards:

- Discord bot token
- OpenRouter API key
- Langfuse public key
- Langfuse secret key

Do not put these values in `openclaw-workspaces.json`, Langfuse runtime prompt
content, workspace Markdown files, committed examples, shell history copied into
docs, or acceptance evidence committed to git.

Safe evidence may use labels such as:

- `<pilot-discord-channel>`
- `<pilot-discord-user>`
- `<openclaw-workspace-path>`
- `<langfuse-project>`
- `<langfuse-trace-link>`

## Workspace Binding

Bind exactly one Discord pilot channel to exactly one OpenClaw user workspace.
The private binding record belongs in OpenClaw runtime configuration or the
OpenClaw operator UI, not in this repository.

Use this checklist when creating the binding:

1. Confirm the workspace path exists on the OpenClaw host.
2. Confirm the path is listed in `openclaw-workspaces.json`.
3. Confirm the Discord channel is private to the pilot user, assigned expert,
   and OpenClaw bot.
4. Bind the Discord channel to the OpenClaw user workspace.
5. Bind the pilot Discord user as the only human whose ordinary messages should
   invoke the agent in that channel.
6. Record the binding in the private operator run log using redacted labels.

Private operator run log fields:

```text
Pilot label:
OpenClaw workspace path label:
Discord channel label:
Pilot Discord user label:
Assigned expert label:
OpenClaw binding location:
Operator:
Date:
```

## Trigger Restrictions

Expert presence must not become agent input. Configure OpenClaw built-in Discord
so only the pilot user's eligible messages trigger agent turns.

Required trigger policy:

- Accept normal messages from the bound pilot Discord user in the bound pilot
  channel.
- Ignore assigned expert messages for agent invocation.
- Ignore bot messages, system messages, joins, pins, reactions, and thread
  metadata events for agent invocation.
- Ignore messages from any unbound Discord user, even if they can view the
  channel.
- Prefer an explicit allowlist of triggering Discord users over a broad channel
  listener.
- If OpenClaw supports mention-only or command-prefix gating, leave it disabled
  for the pilot user only when the allowlist is confirmed; otherwise enable the
  narrowest supported trigger gate and document it in the private run log.

Manual preflight:

```text
Triggering user allowlist checked:
Expert messages ignored:
Bot/system messages ignored:
Unbound users ignored:
OpenClaw trigger setting or UI path:
Operator:
Date:
```

## Runtime Bundle Rollout

Apply the same Langfuse-managed runtime prompt to every registered OpenClaw
workspace before asking the pilot user for acceptance evidence.

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

Record the resolved Langfuse prompt version printed by `openclaw:apply` in the
private run log. Do not paste private bundle content into the run log.

## OpenRouter To Langfuse Observability

OpenClaw should send model calls through OpenRouter. OpenRouter Broadcast then
sends traces to Langfuse without this repository adding a separate
observability relay.

OpenRouter Broadcast is already the v1 trace path to Langfuse. Do not add
direct Langfuse SDK tracing in this repository for this slice.

Operator setup:

1. In OpenRouter, enable Broadcast for the account or organization used by
   OpenClaw.
2. Add Langfuse as a Broadcast destination.
3. Configure the Langfuse keys in OpenRouter.
4. Use OpenRouter's test connection flow and save only after it succeeds.
5. Send one pilot message through OpenClaw built-in Discord.
6. In Langfuse, open the project traces and find the matching trace.

Recommended trace lookup fields:

- approximate timestamp
- pilot label
- channel label
- OpenClaw workspace label
- model/provider
- OpenRouter request ID if available
- Langfuse trace link or trace ID

## Manual Acceptance Evidence

Issue #38 is HITL. Do not mark acceptance complete from repository tests alone.
A human operator must run the private pilot path and fill these fields outside
git.

```text
Pilot label:
Operator:
Date:

Discord message evidence:
- redacted channel label:
- redacted pilot user label:
- message timestamp:
- message summary, not private content:

OpenClaw reply evidence:
- reply timestamp:
- reply summary, not private content:
- confirmed reply came from OpenClaw built-in Discord:
- confirmed no custom Intentive relay process was used:

Langfuse trace lookup:
- Langfuse project label:
- approximate trace timestamp:
- trace link or trace ID:
- matching user/session/metadata fields:
- OpenRouter Broadcast destination confirmed:

Trigger restriction evidence:
- expert test message ignored by agent:
- bot/system/unbound message handling checked:
- OpenClaw setting or UI path checked:

Result:
- pass/fail:
- follow-up needed:
```

## Repository Checks

Before handing the runbook to the parent issue owner, run:

```sh
npm test
npm run build
git diff --check HEAD
```

These checks prove the documentation remains discoverable and the operator
tooling still builds. They do not prove the private Discord, OpenClaw, or
Langfuse path; that proof requires the manual acceptance evidence above.
