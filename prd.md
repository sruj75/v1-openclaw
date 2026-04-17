**Intentive V1 Architecture PRD**

## Overview
Intentive v1 delivers between-session execution support for users who struggle to start important work or recover after derailment. The product combines a human expert and an OpenClaw-powered agent in a private Discord channel, with a lightweight feedback loop into Braintrust for evaluation and improvement.

## Problem
Users do not usually fail during a session with an expert. They fail later, in the middle of ordinary life, when friction hits at the moment of action. Traditional therapy or coaching creates insight, but cannot provide timely support throughout the day. Generic productivity tools capture plans, but do not intervene effectively when follow-through breaks down.

## Goal
Build the smallest end-to-end system that proves:
- users receive useful support in the moments between expert sessions
- the expert can monitor and improve agent behavior over time
- expert feedback can be converted into reusable eval evidence
- the experience feels human and supportive, not like homework or a traditional productivity app

## Users
- Primary user: knowledge worker with ADHD, executive dysfunction, or similar action-friction patterns
- Secondary user: psychologist or behavioral expert providing ongoing support and supervision
- Internal user: product/operator team using Braintrust traces and annotations to improve prompt behavior

## Product Shape
Each user gets:
- one private Discord channel
- one assigned expert in that same channel
- one dedicated OpenClaw agent/workspace

Discord is the user-facing surface. OpenClaw is the runtime brain. A thin Intentive relay sits between Discord and OpenClaw to handle routing, metadata, annotation parsing, and observability.

## Core User Flow
1. User has a weekly session with the expert.
2. A session summary is drafted from notes or transcript.
3. The expert approves or edits that summary.
4. Approved guidance updates the user’s active operating context.
5. During the week, the user interacts naturally in the private Discord channel.
6. The agent supports the user when the plan meets resistance.
7. The expert monitors silently and intervenes when needed.
8. Expert corrections are captured as supervision data.
9. Those corrections become Braintrust trace annotations and future eval rows.

## Architecture
### Interaction Layer
- Discord private channel per user
- Participants: user, expert, agent
- Discord permissions provide basic human isolation for v1

### Product Control Layer
- Intentive relay service receives all Discord events first
- Classifies messages as user message, expert normal reply, expert annotation, or system event
- Forwards eligible messages to the correct OpenClaw agent
- Prevents expert control signals from polluting ordinary chat context
- Logs prompt-version metadata and trace metadata

### Runtime Layer
- One OpenClaw gateway deployment
- One OpenClaw agent/workspace per user
- One isolated session state per user channel/session
- Workspace files act as prompt components and durable operating context

### Model and Observability Layer
- OpenRouter for model traffic
- OpenRouter Input/Output Logging for debugging
- OpenRouter Broadcast to Braintrust for traces, metadata, timing, token, and cost metrics
- Braintrust for offline eval datasets and prompt improvement loop

## Prompt Context Model
Workspace files are versioned separately, not as one giant prompt blob. The
system must also separate shared meta prompts from the rendered files that each
OpenClaw agent reads at runtime.

Meta prompt registry:
- stores shared source prompts/templates that can apply across many users
- is the primary surface for Braintrust-driven iteration and rollout
- tracks component versions such as `agents_core_v12`, `user_template_v4`, and `heartbeat_policy_v7`

Workspace materialization:
- renders selected meta prompt versions plus user-specific facts into an agent workspace
- produces the actual `AGENTS.md`, `USER.md`, `HEARTBEAT.md`, and other files OpenClaw injects
- records the rendered file hash so traces can be replayed against the exact runtime context

Shared prompt surfaces:
- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`

Per-user prompt surfaces:
- `USER.md`
- `HEARTBEAT.md`

Optional first-run only:
- `BOOTSTRAP.md`

Each meaningful run should log:
- meta prompt component version
- rendered workspace file hash
- rollout environment
- user/channel/session/agent identifiers

For `USER.md`, treat the file as a rendered artifact:
- `USER_TEMPLATE` is the shared meta prompt structure tested across users
- `USER_FACTS` is the user-specific approved context from sessions and interactions
- rendered `USER.md` is what the OpenClaw agent reads in that user's workspace

## Expert Feedback Model
The expert has three allowed actions:
- normal reply to the user
- approval or correction of the weekly summary
- annotation of agent behavior

Initial annotation tags:
- `#override`
- `#better_response`
- `#wrong_timing`
- `#good_intervention`

Each annotation should capture:
- target agent message
- expert message
- annotation type
- rationale
- active meta prompt versions and rendered workspace file hashes
- user, channel, agent, session, and trace identifiers

## Functional Requirements
- Support one private Discord channel per user
- Support one dedicated OpenClaw agent/workspace per user
- Maintain isolated conversation state per user context
- Allow weekly summary draft and expert approval workflow
- Allow expert behavior annotations inside the same channel
- Keep annotations out of the ordinary runtime conversation path
- Log metadata required for Braintrust analysis and replay
- Keep the user experience conversational and freeform

## Non-Goals
- full multi-tenant SaaS platform
- billing and subscriptions
- mobile app auth and native sessions
- large expert dashboard
- rigid clinical taxonomy
- fully autonomous expert-free operation

## Risks
- expert annotations may contaminate the live transcript if routing is sloppy
- expert monitoring load may become the real bottleneck before agent quality improves
- user-specific context may drift if `USER.md` and `HEARTBEAT.md` are updated inconsistently
- Discord isolation may create false confidence about long-term tenancy and data ownership

## Success Metrics
- users receive timely, relevant support between sessions
- experts can improve agent behavior week over week
- expert feedback produces reusable Braintrust eval data
- the system improves without requiring heavy manual operations
- users feel supported rather than managed
