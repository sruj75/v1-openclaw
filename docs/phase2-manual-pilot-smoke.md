# Phase 2 Manual Pilot Smoke

This smoke verifies the manual-pilot observability loop:

- The operator manually edits the user's OpenClaw workspace guidance.
- The relay stores a matching context version label.
- A routed Discord user message creates local SQLite evidence.
- OpenRouter Broadcast sends the model trace to Braintrust through external
  destination configuration.

The relay database must not store therapist summary text in Phase 2. Store only
the human-readable context label and runtime identifiers needed to reconcile a
turn with traces.

## Manual Workspace Convention

After receiving the approved weekly summary outside the app, SSH into the
OpenClaw VM and edit the user's workspace guidance file.

Preferred file:

- `USER.md` for user-specific weekly guidance.
- Use `AGENTS.md` only if the current OpenClaw runtime reads that more
  reliably for the workspace.

Add or update a visible header like this:

```md
## User-Specific Weekly Guidance

Context version: alex-week-2026-04-17
Updated by: Srujan
Updated at: 2026-04-17
Update mode: manual_ssh
```

Keep the `Context version` value stable and copy the same value into the relay
metadata with the local command below.

## Record Relay Context Metadata

Seed or point at the relay SQLite database that the Discord bot uses. Then
record the context label against the active agent or assignment:

```sh
npm run context:set -- \
  --agent-id agent_local_alex \
  --context-version alex-week-2026-04-17 \
  --updated-by Srujan
```

Assignment IDs are also supported:

```sh
npm run context:set -- \
  --assignment-id assignment_local_alex_private_channel \
  --context-version alex-week-2026-04-17 \
  --updated-by Srujan
```

The command updates relay metadata only. It must not edit OpenClaw workspace
files or store therapist summary text.

## OpenRouter Broadcast Setup

Configure OpenRouter outside this repo:

1. In OpenRouter, open Settings > Observability.
2. Enable Broadcast.
3. Add the Braintrust destination.
4. Enter the Braintrust API key and project ID.
5. Use Test Connection and save only after the test passes.
6. Enable Privacy Mode for the Braintrust destination when the pilot should
   exclude prompt and completion content from exported traces.

Do not commit Braintrust credentials, OpenRouter API keys, dashboard screenshots
with secrets, or destination configuration exports.

OpenRouter supports `user`, `session_id`, and custom `trace` metadata for
Broadcast destinations. The relay now preserves the local IDs and context label
needed to reconcile traces even if the current OpenClaw gateway cannot forward
every custom field to OpenRouter yet.

## Run One Safe Turn

Use one safe private test channel that is already present in
`user_assignments.discord_channel_id`. Do not use a production user channel for
this smoke.

1. Start or confirm the OpenClaw gateway is reachable.
2. Start the relay Discord bot with the same database where context metadata was
   recorded:

   ```sh
   npm run build
   RELAY_DATABASE_PATH=data/local.sqlite node --no-warnings dist/main.js --discord
   ```

3. Send one benign user message in the safe Discord test channel.
4. Wait for the agent reply to appear in the same channel.

## SQLite Verification

Open the same SQLite database used by the bot and inspect the latest routed user
turn:

```sql
SELECT
  discord_message_id,
  role,
  message_type,
  user_id,
  expert_id,
  agent_id,
  session_id,
  openclaw_status,
  openclaw_trace_id,
  openclaw_provider_response_id,
  routing_metadata_json
FROM messages
WHERE message_type = 'user_message'
ORDER BY created_at DESC
LIMIT 5;
```

Expected local evidence:

- `message_type = 'user_message'`.
- `openclaw_status = 'ok'` for a successful model turn.
- `openclaw_trace_id` or `openclaw_provider_response_id` is present when the
  gateway/runtime returns it.
- `routing_metadata_json` contains:
  - `context_version`
  - `context_update_mode`
  - `context_updated_at`
  - `context_updated_by`
  - `user_id`
  - `expert_id`
  - `agent_id`
  - `discord_channel_id`
  - `session_id`
  - `assignment_id`
  - `environment`

Use a JSON extraction query when the local SQLite build supports it:

```sql
SELECT
  discord_message_id,
  json_extract(routing_metadata_json, '$.context_version') AS context_version,
  json_extract(routing_metadata_json, '$.context_update_mode') AS context_update_mode,
  json_extract(routing_metadata_json, '$.session_id') AS metadata_session_id,
  openclaw_trace_id,
  openclaw_provider_response_id
FROM messages
WHERE message_type = 'user_message'
ORDER BY created_at DESC
LIMIT 5;
```

The expected `context_update_mode` value for Phase 2 is `manual_ssh`.

## Braintrust Verification

In Braintrust, open the project configured as the OpenRouter Broadcast
destination and select Logs.

Look for the trace created by the safe turn. Depending on the current OpenClaw
and OpenRouter passthrough behavior, use one or more of:

- Timestamp from the Discord message and SQLite row.
- OpenRouter model/provider metadata.
- `user` or `session_id` if the gateway forwards those fields.
- Custom metadata paths under `trace` if passthrough is available.
- Local SQLite identifiers such as `openclaw_trace_id`,
  `openclaw_provider_response_id`, `session_id`, and `context_version`.

Braintrust can filter logs and group related traces by metadata. For this phase,
record whether `context_version` is visible directly in Braintrust. If it is not
visible yet, reconcile the trace with SQLite using timestamp and runtime IDs,
and keep #21's OpenRouter metadata helper as the implementation path for future
gateway passthrough.

## Privacy Notes

- Do not store therapist summary text in the relay database.
- Keep context labels human-readable but non-sensitive.
- Use OpenRouter Braintrust Privacy Mode when prompt and completion content
  should be excluded from traces.
- Privacy Mode still allows operational metadata, token counts, timing, model
  information, and custom metadata to be sent.

## HITL Validation Record

When running the smoke, record:

- Date:
- Operator:
- Safe Discord channel:
- Agent or assignment ID:
- Context version:
- SQLite database path:
- SQLite evidence:
- Braintrust trace found: yes/no
- Braintrust-visible metadata:
- Known limitations:

Known limitation before live validation:

- The relay preserves context metadata locally and exposes an OpenRouter-friendly
  mapping helper, but the current OpenClaw protocol v3 `chat.send` payload
  remains compatible with `sessionKey`, `message`, and `idempotencyKey` only.
  If the gateway does not yet forward `user`, `session_id`, or `trace`, use
  SQLite runtime IDs to reconcile the Braintrust trace manually.
