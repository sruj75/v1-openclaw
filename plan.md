**Implementation Plan**

## Components

**1. Discord Bot / Ingress**
Receives all channel events from Discord and forwards them to the Intentive relay.
Responsibilities:
- subscribe to private user channels
- identify sender role: `user`, `expert`, `agent`
- normalize Discord message payloads
- post agent replies back into the correct channel

**2. Intentive Relay API**
This is the core control plane.
Responsibilities:
- map `discord_channel_id -> user_id -> agent_id`
- classify messages as `user_message`, `expert_reply`, `expert_annotation`, `system_event`
- forward only eligible messages to OpenClaw
- suppress expert annotation messages from normal runtime context
- attach observability metadata
- persist summaries, annotations, and routing state

**3. OpenClaw Runtime**
One gateway deploy, one agent/workspace per user.
Responsibilities:
- maintain per-user session state
- load workspace prompt files
- run heartbeat/proactive logic later if needed
- generate agent responses

**4. Summary/Approval Service**
Handles weekly session summary workflow.
Responsibilities:
- create summary drafts from session notes/transcript
- store draft vs approved versions
- trigger workspace updates after expert approval

**5. Prompt Registry**
Small internal module that stores shared meta prompts/templates.
Responsibilities:
- store versioned prompt components such as `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `USER_TEMPLATE`, and `HEARTBEAT_POLICY`
- support environment rollout labels such as `dev`, `staging`, and `prod`
- provide the source versions that Braintrust evals compare across users

**6. Workspace Materialization Manager**
Small internal module that renders prompt registry versions into per-agent workspace files.
Responsibilities:
- combine shared meta prompt versions with user-specific approved facts
- write rendered `AGENTS.md`, `USER.md`, `HEARTBEAT.md`, and related files into each agent workspace
- compute rendered file hashes after writing
- log both meta prompt versions and rendered file hashes per turn

**7. Observability Pipeline**
OpenRouter + Braintrust.
Responsibilities:
- attach trace metadata
- record cost/timing/token usage
- link expert annotations back to nearby agent turns
- export eval-ready rows

## Primary Endpoints

**Discord ingress**
- `POST /webhooks/discord/events`
  - receives all Discord message/create/update events
  - validates signature
  - writes raw event log
  - dispatches to classifier

**Message classification + routing**
- `POST /internal/messages/classify`
  - input: normalized Discord event
  - output: `message_type`, `role`, `routing_decision`

- `POST /internal/messages/route`
  - input: `channel_id`, `user_id`, `agent_id`, `message_type`, `content`
  - behavior: either persist only or forward to OpenClaw

**OpenClaw proxy**
- `POST /internal/openclaw/send`
  - input: `agent_id`, `session_key`, `message`, `metadata`
  - behavior: send message to OpenClaw runtime, receive reply, persist trace linkage

- `POST /internal/openclaw/webhook`
  - optional if runtime emits async events
  - behavior: receive tool/run/completion events

**Weekly summary flow**
- `POST /weekly-summaries`
  - create draft summary for a user/week

- `GET /weekly-summaries/:summary_id`
  - fetch draft/approved summary

- `POST /weekly-summaries/:summary_id/approve`
  - expert approves or edits summary
  - triggers workspace update job

**Expert annotations**
- `POST /annotations`
  - create structured annotation from tagged expert message
  - input: `target_agent_message_id`, `annotation_type`, `rationale`

- `GET /annotations?user_id=&week=`
  - list annotations for review/export

**Prompt registry**
- `POST /prompt-components`
  - create a new shared meta prompt component version
  - examples: `AGENTS`, `SOUL`, `TOOLS`, `USER_TEMPLATE`, `HEARTBEAT_POLICY`

- `GET /prompt-components?component_name=&environment=`
  - fetch active or candidate meta prompt versions

- `POST /prompt-components/:component_version_id/promote`
  - promote a component version to an environment such as `dev`, `staging`, or `prod`

**Workspace materialization/versioning**
- `POST /workspace/apply-approved-summary`
  - update user-specific facts from an approved weekly summary
  - rematerialize `USER.md` and possibly `HEARTBEAT.md`

- `GET /workspace/versions/:agent_id`
  - return active meta prompt versions and rendered file hashes

- `POST /workspace/materialize/:agent_id`
  - render selected prompt component versions into one agent workspace
  - record the resulting materialization and file hashes

**Observability/export**
- `POST /internal/traces/link-annotation`
  - attach annotation to trace/span ids

- `POST /internal/evals/export-row`
  - create eval dataset row from corrected interaction

## Data Tables

**users**
- `id`
- `discord_user_id`
- `display_name`
- `status`
- `created_at`

**experts**
- `id`
- `discord_user_id`
- `display_name`
- `status`
- `created_at`

**user_assignments**
- `id`
- `user_id`
- `expert_id`
- `discord_channel_id`
- `agent_id`
- `active`
- `created_at`

**agents**
- `id`
- `openclaw_agent_id`
- `workspace_path`
- `status`
- `created_at`

**prompt_component_versions**
- `id`
- `component_name`
- `scope`
- `version_label`
- `source_text`
- `source_hash`
- `environment`
- `status`
- `created_at`

**workspace_materializations**
- `id`
- `agent_id`
- `component_name`
- `prompt_component_version_id`
- `rendered_path`
- `rendered_hash`
- `created_at`

**conversation_sessions**
- `id`
- `user_id`
- `agent_id`
- `discord_channel_id`
- `openclaw_session_key`
- `started_at`
- `last_seen_at`

**messages**
- `id`
- `discord_message_id`
- `channel_id`
- `user_id`
- `expert_id`
- `agent_id`
- `session_id`
- `role`
- `message_type`
- `content`
- `raw_event_json`
- `created_at`

**weekly_summaries**
- `id`
- `user_id`
- `expert_id`
- `source_ref`
- `draft_text`
- `approved_text`
- `status`
- `approved_at`
- `created_at`

**workspace_versions**
- `id`
- `agent_id`
- `workspace_materialization_ids`
- `agents_md_hash`
- `soul_md_hash`
- `tools_md_hash`
- `user_md_hash`
- `heartbeat_md_hash`
- `bootstrap_md_hash`
- `component_version_labels`
- `environment`
- `created_at`

**trace_runs**
- `id`
- `trace_id`
- `user_id`
- `expert_id`
- `agent_id`
- `session_id`
- `discord_channel_id`
- `mode`
- `workspace_version_id`
- `prompt_component_version_ids`
- `rendered_workspace_hashes`
- `openrouter_generation_id`
- `created_at`

**expert_annotations**
- `id`
- `user_id`
- `expert_id`
- `agent_id`
- `session_id`
- `discord_channel_id`
- `target_agent_message_id`
- `expert_message_id`
- `annotation_type`
- `rationale`
- `trace_id`
- `created_at`

**eval_export_rows**
- `id`
- `annotation_id`
- `input_snapshot`
- `agent_output`
- `expert_correction`
- `workspace_version_id`
- `export_status`
- `created_at`

## Message Processing Rules

- User message in channel:
  - persist
  - forward to OpenClaw
  - attach metadata
  - post reply back to Discord

- Expert normal reply:
  - persist
  - do not automatically forward to OpenClaw unless explicitly marked as context-setting

- Expert annotation tag:
  - persist as structured annotation
  - do not forward as normal conversation
  - link to nearest relevant agent turn

- Weekly summary approval:
  - persist approved summary
  - update user-specific facts
  - materialize active meta prompt versions plus approved facts into workspace files
  - write new workspace materialization and workspace version records

## Suggested Phases

**Phase 1**
- Discord bot
- relay API
- channel/user/agent mapping
- OpenClaw proxy
- raw message persistence

**Phase 2**
- weekly summary draft/approval flow
- prompt registry for shared meta prompt versions
- per-user workspace materialization
- meta prompt version and rendered hash logging

**Phase 3**
- expert annotation parsing
- trace linking
- Braintrust export rows

**Phase 4**
- lightweight operator review page
- replay/eval workflow
- heartbeat/proactive interventions if needed
