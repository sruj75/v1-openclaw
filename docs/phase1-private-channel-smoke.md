# Phase 1 Private Channel Smoke

This smoke verifies one controlled Discord private-channel loop against real
runtime boundaries:

- SQLite is seeded with one safe user, expert, agent, and Discord channel assignment.
- The relay processor uses real OpenClaw gateway configuration.
- The Discord bot adapter posts the agent reply to the mapped Discord channel.
- The database is checked for the user message, conversation session, agent
  reply, duplicate handling, unknown-channel handling, and OpenClaw failure
  fallback behavior.

The smoke uses a controlled inbound Discord event instead of asking a human to
type in the channel. That keeps the run repeatable while still posting the
OpenClaw reply through the real Discord REST adapter.

## Required Environment

```sh
DISCORD_BOT_TOKEN=...
DISCORD_BOT_USER_ID=...
LIVE_SMOKE_DISCORD_CHANNEL_ID=...
LIVE_SMOKE_DISCORD_USER_ID=...
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=...
```

Optional:

```sh
LIVE_SMOKE_DB_PATH=data/phase1-private-channel-smoke.sqlite
LIVE_SMOKE_EXPERT_DISCORD_USER_ID=...
LIVE_SMOKE_OPENCLAW_AGENT_ID=main
LIVE_SMOKE_MESSAGE="Phase 1 private-channel smoke: reply with exactly 'phase 1 private channel smoke ok'."
OPENCLAW_DEVICE_IDENTITY_JWK=...
OPENCLAW_REQUEST_TIMEOUT_MS=180000
```

If `OPENCLAW_DEVICE_IDENTITY_JWK` is omitted, the smoke creates an ephemeral
Ed25519 device identity for the run.

## Command

Build and run:

```sh
npm run smoke:phase1
```

When the OpenClaw gateway is bound to a VM loopback interface, open an IAP tunnel
first:

```sh
gcloud compute ssh v1-openclaw \
  --project=agentic-accountability \
  --zone=us-west1-a \
  --tunnel-through-iap \
  -- -N -L 18789:127.0.0.1:18789
```

## Verification Queries

Use the `LIVE_SMOKE_DB_PATH` from the smoke output:

```sql
SELECT id, discord_channel_id, openclaw_session_key
FROM conversation_sessions
ORDER BY started_at DESC
LIMIT 5;

SELECT discord_message_id, role, message_type, session_id, originating_message_id, openclaw_status
FROM messages
ORDER BY created_at DESC
LIMIT 10;
```

Expected result:

- The controlled user message has `message_type = 'user_message'`.
- A conversation session exists with
  `discord:<channel_id>:agent:<openclaw_agent_id>`.
- The OpenClaw-routed user row has `openclaw_status = 'ok'`.
- The Discord-posted reply is persisted as `message_type = 'agent_reply'`
  and links to the originating user message.
- Reprocessing the same controlled event reports `duplicateVerified: true`.
- The unknown-channel check persists `unknown_sender` without OpenClaw status.
- The controlled OpenClaw failure check records `failed` and verifies the fixed
  fallback reply path without posting an extra real Discord message.

## Known Phase 1 Limitations

- The inbound side is controlled, not a human-typed Discord gateway event. The
  real bot gateway adapter is covered separately by the adapter smoke test and
  can be run in HITL mode with `node --no-warnings dist/main.js --discord`.
- Only one mapped private channel is seeded per smoke run.
- The failure check uses a controlled failing OpenClaw client to avoid posting
  an intentional failure message into the real Discord channel.
