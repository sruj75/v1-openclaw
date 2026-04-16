# v1-openclaw

Intentive v1 relay prototype for routing private Discord channel messages to an
OpenClaw-backed agent workspace.

## Local Commands

Use the project Node runtime:

```sh
nvm use
```

Build the TypeScript service:

```sh
npm run build
```

Run the synthetic local entrypoint:

```sh
npm run dev
```

Run automated tests:

```sh
npm test
```

Seed local routing assignments into SQLite:

```sh
npm run seed:local
```

Run the real Discord bot adapter:

```sh
npm run build
DISCORD_BOT_TOKEN=... RELAY_DATABASE_PATH=data/local.sqlite node --no-warnings dist/main.js --discord
```

The bootstrap slice does not require Discord or OpenClaw credentials. The
synthetic entrypoint submits a normalized Discord-style user message through the
relay and uses an unconfigured OpenClaw adapter placeholder.

## Discord Bot Setup

Required local environment:

- `DISCORD_BOT_TOKEN`: bot token from the Discord Developer Portal. Keep it in an ignored local shell profile or `.env` file, never in source.
- `RELAY_DATABASE_PATH`: SQLite database with seeded routing assignments. Defaults to `data/local.sqlite`.

Optional local environment:

- `DISCORD_BOT_USER_ID`: bot user ID. The adapter also learns this from Discord `READY`, but setting it locally protects startup-edge self-message filtering.
- `DISCORD_GATEWAY_INTENTS`: numeric gateway intent bitmask. The default is direct/private messages plus message content.
- `DISCORD_GATEWAY_URL`: override only for controlled gateway smoke tests.
- `DISCORD_API_BASE_URL`: override only for controlled REST smoke tests.

Safe test-channel expectations:

- Use a private test DM or a tightly scoped private Discord channel that is seeded in `user_assignments.discord_channel_id`.
- Do not invite production users into the smoke-test channel.
- Confirm the bot can read messages and send messages in that channel before testing.
- The adapter ignores bot/system/self messages and posts with `allowed_mentions.parse` empty, so test replies should not notify roles or everyone.

Controlled smoke test:

```sh
npm test
```

The `Discord bot adapter normalizes private messages and posts relay replies to the same channel` test drives a fake Discord gateway and fake Discord REST API. It proves inbound `MESSAGE_CREATE` normalization, self-message loop prevention, relay processing, and outbound reply posting without live credentials.

## Module Homes

- `src/config`: environment and service configuration
- `src/db`: SQLite schema, seed workflow, routing lookup, and persistence boundary
- `src/discord`: normalized Discord event types and synthetic event helpers
- `src/relay`: relay orchestration for accepted normalized events
- `src/openclaw`: OpenClaw gateway adapter boundary
