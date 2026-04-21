---
date: 2026-04-20T12:15:02+05:30
researcher: Codex
git_commit: aadf5e7f4cde676900f66c8535e948c6e7dcb6e0
branch: codex/phase-3
repository: v1-openclaw
topic: "Phase 3 OpenClaw-native runtime and Braintrust prompt loop, issues #31-#40"
tags: [research, codebase, phase-3, openclaw, braintrust, relay, discord]
status: complete
last_updated: 2026-04-20
last_updated_by: Codex
---

# Research: Phase 3 OpenClaw-Native Runtime and Braintrust Prompt Loop

**Date**: 2026-04-20T12:15:02+05:30
**Researcher**: Codex
**Git Commit**: aadf5e7f4cde676900f66c8535e948c6e7dcb6e0
**Branch**: codex/phase-3
**Repository**: v1-openclaw

## Research Question

Document the current codebase state for GitHub parent issue #31, "PRD: Phase 3 OpenClaw-Native Runtime + Braintrust Prompt Loop," and child issues #32-#40:

- #32 Phase 3: Retire relay runtime and recenter docs
- #33 Phase 3: Add active OpenClaw workspace registry
- #34 Phase 3: Fetch Braintrust runtime bundle by latest or pinned version
- #35 Phase 3: Apply bundle file sections to managed workspace blocks
- #36 Phase 3: Apply allowlisted OpenClaw config from bundle
- #37 Phase 3: Wire openclaw:apply end to end
- #38 Phase 3: Document OpenClaw built-in Discord runtime setup
- #39 Phase 3: Validate Braintrust expected-only review loop
- #40 Phase 3: Run end-to-end OpenClaw and Braintrust acceptance smoke

## Summary

The current repository is still shaped around the earlier Intentive relay architecture. The live TypeScript modules include a custom Discord bot adapter, relay message classification and routing, SQLite-backed routing/session/message persistence, a protocol v3 OpenClaw gateway client, a manual context metadata command, Phase 1 and Phase 2 smoke docs, and tests for those flows.

Issue #31 defines Phase 3 as a move away from the custom relay runtime toward OpenClaw built-in Discord, with Braintrust owning runtime bundle content and eval review evidence. The current checkout does not contain `openclaw-workspaces.json`, an `openclaw:apply` package script, a Braintrust bundle fetch module, managed block application code, allowlisted OpenClaw config patching code, or Phase 3 OpenClaw built-in Discord setup docs.

The existing Braintrust-related implementation is indirect: docs describe OpenRouter Broadcast to Braintrust, the OpenClaw client exposes an OpenRouter metadata helper, and local SQLite stores runtime IDs and context labels for reconciliation. Expert annotation handling exists as relay classification and persistence for tagged Discord messages, not as a Braintrust `Expected` review loop.

## Detailed Findings

### Phase 3 Issue Context

Parent issue #31 describes Phase 3 as replacing the custom Intentive relay with OpenClaw built-in channel runtime. It also defines `openclaw-workspaces.json`, an `openclaw:apply` command, Markdown bundle sections using `## File: <relative/path>` and `## Config: openclaw`, managed block markers, allowlisted config patching, and Braintrust expected-output review.

The child issues divide that work into relay retirement (#32), workspace registry (#33), Braintrust bundle fetch (#34), managed file block application (#35), allowlisted config patching (#36), command wiring (#37), OpenClaw built-in Discord docs (#38), Braintrust expected-only review validation (#39), and end-to-end smoke evidence (#40). All fetched issues were open at research time.

### Current Package Surface

`package.json` exposes build, context metadata, dev, seed, Phase 1 smoke, start, and test commands. There is no `openclaw:apply` script in the current package scripts ([package.json:9](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/package.json#L9)).

The README describes the project as an "Intentive v1 relay prototype" for routing private Discord channel messages to an OpenClaw-backed workspace ([README.md:3](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/README.md#L3)). It documents local build/test commands, SQLite seeding, running the real Discord bot adapter, Discord bot environment variables, OpenClaw gateway environment variables, and module homes ([README.md:6](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/README.md#L6), [README.md:38](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/README.md#L38), [README.md:108](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/README.md#L108)).

The root file list contains no `openclaw-workspaces.json`. The current JSON workspace-like data lives in `examples/local-routing.seed.example.json`, where an agent entry includes an `openClawAgentId` and `workspacePath` for a local seed assignment ([examples/local-routing.seed.example.json:18](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/examples/local-routing.seed.example.json#L18)).

### Relay Entrypoints

`src/main.ts` has two runtime entrypoints:

- synthetic mode creates an in-memory relay store and sends a synthetic normalized Discord event through `createIntentiveRelay` ([src/main.ts:23](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/main.ts#L23));
- Discord mode opens the SQLite database, applies the Phase 1 schema, creates the Discord bot adapter and OpenClaw client, connects to Discord, and sends each normalized message through `processNormalizedDiscordEvent` ([src/main.ts:46](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/main.ts#L46)).

The same entrypoint chooses the real OpenClaw gateway client only when `OPENCLAW_GATEWAY_URL` is configured; otherwise it uses the unconfigured placeholder client ([src/main.ts:74](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/main.ts#L74)).

### Configuration

`src/config/index.ts` loads relay configuration from environment variables. Defaults include `SERVICE_NAME` as `intentive-relay` and `RELAY_DATABASE_PATH`/`DATABASE_PATH` falling back to `data/local.sqlite` ([src/config/index.ts:13](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/config/index.ts#L13)).

Discord bot configuration requires `DISCORD_BOT_TOKEN` and accepts optional bot user ID, gateway URL, API base URL, and intents ([src/config/index.ts:21](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/config/index.ts#L21)).

OpenClaw gateway configuration is present for a protocol v3 WebSocket gateway. It reads `OPENCLAW_GATEWAY_URL`, optional gateway/auth token aliases, an Ed25519 device identity JWK, client metadata, locale, user agent, and request timeout ([src/config/index.ts:38](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/config/index.ts#L38)).

### Discord Adapter

`src/discord/index.ts` defines normalized Discord events, outbound send requests, Discord gateway and REST adapter types, and a concrete `createDiscordBotAdapter` implementation ([src/discord/index.ts:1](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/discord/index.ts#L1), [src/discord/index.ts:104](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/discord/index.ts#L104)).

The adapter handles Discord gateway HELLO, heartbeat, READY, reconnect, invalid session, and MESSAGE_CREATE dispatches ([src/discord/index.ts:131](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/discord/index.ts#L131)). It filters bot, system, and self messages before invoking the relay handler ([src/discord/index.ts:185](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/discord/index.ts#L185), [src/discord/index.ts:458](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/discord/index.ts#L458)).

Outbound Discord replies are posted through Discord REST to `/channels/{channelId}/messages` with `allowed_mentions.parse` set to an empty array ([src/discord/index.ts:354](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/discord/index.ts#L354)).

### Relay Classification and Processing

`src/relay/classification.ts` classifies normalized Discord events into `user_message`, `expert_reply`, `expert_annotation`, `system_event`, or `unknown_sender` ([src/relay/classification.ts:4](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/classification.ts#L4)). User messages from the mapped Discord user are marked for OpenClaw forwarding, while expert replies and expert annotations are not forwarded ([src/relay/classification.ts:39](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/classification.ts#L39), [src/relay/classification.ts:43](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/classification.ts#L43)).

Expert annotation tags are `#override`, `#better_response`, `#wrong_timing`, and `#good_intervention` ([src/relay/classification.ts:20](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/classification.ts#L20)).

`src/relay/discord.ts` is the main relay processing path. It normalizes payloads, checks duplicate Discord message IDs, resolves channel routing, classifies the message, persists it, optionally creates or reuses a conversation session, resolves context metadata, sends eligible user messages to OpenClaw, updates runtime metadata, and optionally posts/persists the agent reply back to Discord ([src/relay/discord.ts:74](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/discord.ts#L74), [src/relay/discord.ts:82](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/discord.ts#L82), [src/relay/discord.ts:116](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/discord.ts#L116), [src/relay/discord.ts:147](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/discord.ts#L147)).

The runtime metadata sent to OpenClaw includes Discord IDs, user/expert/assignment IDs, environment, context version/update mode, session ID, agent ID, assignment ID, and channel ID ([src/relay/discord.ts:121](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/relay/discord.ts#L121)).

### SQLite Persistence and Routing

The Phase 1 schema creates tables for users, experts, agents, user assignments, conversation sessions, and messages ([src/db/schema.ts:4](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/schema.ts#L4)). The `agents` table includes `openclaw_agent_id`, `workspace_path`, and context metadata columns ([src/db/schema.ts:20](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/schema.ts#L20)). The `messages` table stores role, message type, raw event JSON, routing metadata JSON, OpenClaw status, trace ID, and provider response ID ([src/db/schema.ts:52](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/schema.ts#L52)).

`resolveChannelRouting` joins active user assignments to users, experts, and agents by Discord channel ID, returning the mapped user, expert, OpenClaw agent ID, and workspace path ([src/db/routing.ts:37](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/routing.ts#L37)).

`seedRoutingAssignments` validates and upserts users, experts, agents, and assignments inside a transaction ([src/db/seed.ts:107](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/seed.ts#L107), [src/db/seed.ts:156](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/seed.ts#L156)).

### Manual Context Metadata

`src/context.ts` implements `npm run context:set`. It accepts either `--agent-id` or `--assignment-id`, a required `--context-version`, and optional `--updated-by`, then opens the configured SQLite database and records context metadata ([src/context.ts:23](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/context.ts#L23), [src/context.ts:50](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/context.ts#L50)).

`setContextMetadata` writes `context_version`, `context_update_mode = manual_ssh`, timestamp, and updater onto the `agents` row ([src/db/context.ts:43](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/context.ts#L43)). `resolveContextMetadata` returns `null` when metadata is simply missing, while preserving errors for unknown agents ([src/db/context.ts:117](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/db/context.ts#L117)).

### OpenClaw Gateway Client

`src/openclaw/index.ts` defines the OpenClaw gateway client boundary, request/reply types, metadata shape, default client metadata, and an unconfigured fallback client ([src/openclaw/index.ts:1](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L1), [src/openclaw/index.ts:52](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L52), [src/openclaw/index.ts:117](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L117)).

The client maps relay metadata into OpenRouter-friendly `user`, `session_id`, and `trace` fields through `buildOpenRouterMetadata` ([src/openclaw/index.ts:128](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L128)).

`createOpenClawGatewayClient` waits for `connect.challenge`, signs an Ed25519 device challenge, sends a protocol v3 `connect` request as role `operator` with read/write scopes, then sends `chat.send` with `sessionKey`, `message`, and a Discord message ID idempotency key ([src/openclaw/index.ts:154](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L154), [src/openclaw/index.ts:307](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L307), [src/openclaw/index.ts:333](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L333), [src/openclaw/index.ts:212](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L212)).

After `chat.send`, it waits for matching chat terminal events and also polls `chat.history` as a fallback path to recover assistant content ([src/openclaw/index.ts:224](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L224), [src/openclaw/index.ts:561](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/index.ts#L561)).

The module README documents the same gateway flow, device identity, signed payload shape, and chat flow ([src/openclaw/README.md:1](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/README.md#L1), [src/openclaw/README.md:41](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/src/openclaw/README.md#L41)).

### Phase 1 and Phase 2 Docs

`docs/phase1-private-channel-smoke.md` documents a controlled private-channel loop through SQLite, relay processing, OpenClaw gateway configuration, Discord REST reply posting, verification SQL, and known Phase 1 limitations ([docs/phase1-private-channel-smoke.md:1](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/docs/phase1-private-channel-smoke.md#L1), [docs/phase1-private-channel-smoke.md:61](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/docs/phase1-private-channel-smoke.md#L61)).

`docs/phase2-manual-pilot-smoke.md` documents a manual pilot observability loop where an operator manually edits the user's OpenClaw workspace guidance, records a matching relay context version label, routes a Discord user message through SQLite evidence, and uses OpenRouter Broadcast to Braintrust via external configuration ([docs/phase2-manual-pilot-smoke.md:1](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/docs/phase2-manual-pilot-smoke.md#L1)).

The Phase 2 doc explicitly says the context command updates relay metadata only and must not edit OpenClaw workspace files or store therapist summary text ([docs/phase2-manual-pilot-smoke.md:61](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/docs/phase2-manual-pilot-smoke.md#L61)). Braintrust verification is manual through the Braintrust project configured as an OpenRouter Broadcast destination ([docs/phase2-manual-pilot-smoke.md:163](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/docs/phase2-manual-pilot-smoke.md#L163)).

### Existing PRD and Ideation Context

The root `prd.md` describes the earlier architecture: a private Discord channel per user, an assigned expert, a dedicated OpenClaw agent/workspace, and a thin Intentive relay between Discord and OpenClaw for routing, metadata, annotation parsing, and observability ([prd.md:21](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/prd.md#L21), [prd.md:27](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/prd.md#L27)).

The same PRD names OpenRouter Broadcast to Braintrust as the observability path and Braintrust as the offline eval dataset and prompt improvement loop ([prd.md:59](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/prd.md#L59)). It also describes workspace files as prompt components and durable context, with shared prompt surfaces and per-user prompt surfaces such as `USER.md` and `HEARTBEAT.md` ([prd.md:65](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/prd.md#L65), [prd.md:80](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/prd.md#L80)).

`ideation.md` contains historical product/design notes about OpenClaw as runtime, durable workspace files, Braintrust traces/evals, prompt/versioning strategy, and proactive/heartbeat behavior. These notes are broad background documents rather than implemented Phase 3 code paths.

### Tests

`test/message-classification.test.mjs` covers mapped user message classification and persistence, expert replies, expert annotation tags, relay processing that avoids OpenClaw calls for expert messages, mapped user OpenClaw calls with context metadata, unset context metadata, agent reply posting, duplicate handling, unknown channels, bot/self events, failure fallback replies, and invalid Discord payloads ([test/message-classification.test.mjs:53](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/test/message-classification.test.mjs#L53), [test/message-classification.test.mjs:152](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/test/message-classification.test.mjs#L152), [test/message-classification.test.mjs:509](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/test/message-classification.test.mjs#L509)).

`test/openclaw-gateway-client.test.mjs` covers connect challenge signing, gateway-compatible backend mode defaults, challenge timeouts, terminal-event and history fallback reply paths, chat error handling, stale history filtering, reconnect behavior, and OpenRouter metadata mapping ([test/openclaw-gateway-client.test.mjs:8](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/test/openclaw-gateway-client.test.mjs#L8), [test/openclaw-gateway-client.test.mjs:548](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/test/openclaw-gateway-client.test.mjs#L548)).

`test/context-metadata.test.mjs` covers recording manual context metadata for agents and assignments, overwriting labels, rejecting empty labels, rejecting unknown targets, and resolving missing metadata to null ([test/context-metadata.test.mjs:45](https://github.com/sruj75/v1-openclaw/blob/aadf5e7f4cde676900f66c8535e948c6e7dcb6e0/test/context-metadata.test.mjs#L45)).

No tests were found for Braintrust bundle fetching, `## File` section parsing, `INTENTIVE_MANAGED` block application, `## Config: openclaw` parsing, config allowlists, or `openclaw:apply`.

## Code References

- `package.json:9` - current npm scripts; no `openclaw:apply` entry.
- `README.md:3` - repo narrative as a relay prototype.
- `src/main.ts:46` - Discord bot entrypoint wiring SQLite, Discord, OpenClaw, and relay processing.
- `src/config/index.ts:13` - relay config defaults.
- `src/config/index.ts:38` - OpenClaw gateway config loading.
- `src/discord/index.ts:104` - Discord gateway/REST bot adapter implementation.
- `src/relay/classification.ts:27` - message classification.
- `src/relay/discord.ts:82` - normalized Discord event processing.
- `src/db/schema.ts:1` - SQLite Phase 1 schema.
- `src/db/routing.ts:37` - active Discord channel routing lookup.
- `src/db/context.ts:43` - manual context metadata update.
- `src/openclaw/index.ts:154` - OpenClaw protocol v3 gateway client.
- `src/openclaw/index.ts:128` - OpenRouter-friendly metadata mapping.
- `docs/phase2-manual-pilot-smoke.md:64` - OpenRouter Broadcast setup for Braintrust.

## Architecture Documentation

The implemented architecture has four main layers:

1. Discord adapter layer: receives Discord gateway events, normalizes inbound message payloads, filters self/bot/system messages, and posts outbound replies through Discord REST.
2. Relay layer: classifies normalized Discord events, separates user/expert/system/unknown messages, persists records, routes only mapped user messages to OpenClaw, and writes OpenClaw runtime metadata back to SQLite.
3. Persistence/routing layer: stores users, experts, agents, channel assignments, sessions, messages, runtime IDs, and manual context labels in SQLite.
4. OpenClaw gateway layer: connects to a protocol v3 OpenClaw WebSocket gateway as an operator client, signs device authentication, sends chat messages by session key, and waits for assistant replies through chat events or history.

Braintrust exists in the current repo as an external observability/eval destination documented through OpenRouter Broadcast. The code has metadata fields and helpers for trace reconciliation, but the current codebase does not contain a direct Braintrust client, prompt bundle abstraction, dataset/export code, or expected-output review integration.

Workspace files exist as a concept in PRD/docs/seed data. The current code stores `workspace_path` in SQLite and seed JSON, but it does not read or write workspace files.

## Historical Context (from thoughts/)

No pre-existing `thoughts/` directory was present in this checkout before this research document was created. Historical context was therefore taken from tracked repository docs:

- `prd.md` - earlier Intentive relay architecture and Braintrust/OpenRouter observability model.
- `ideation.md` - product and architecture ideation around OpenClaw runtime, workspace files, Braintrust traces/evals, prompt/versioning strategy, and proactive behavior.
- `docs/phase1-private-channel-smoke.md` - Phase 1 relay smoke flow.
- `docs/phase2-manual-pilot-smoke.md` - Phase 2 manual workspace/context metadata and Braintrust trace reconciliation flow.

## Related Research

No earlier `thoughts/shared/research/` documents were present in this checkout before this document.

## Open Questions

- Whether any Phase 3 implementation exists outside this checkout or branch was not determined from local files.
- Whether the current commit is the complete latest remote state was not re-fetched during this research; local remote refs show the researched commit is contained in `origin/main`.
- The current repo docs do not yet contain Phase 3 acceptance evidence for OpenClaw built-in Discord, Braintrust expected-only review, or end-to-end smoke.
