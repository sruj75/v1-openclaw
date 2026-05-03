# v1-openclaw

Operator toolkit for OpenClaw-native Intentive pilot rollout.

Phase 3 moved runtime execution onto OpenClaw built-in channels. OpenClaw
built-in Discord is the current path for user and expert interaction. Phase 4
uses that path for a two-user productized manual pilot with one shared expert,
proactive support, Langfuse-managed runtime behavior, and redacted evidence.
Future WhatsApp support should use the same OpenClaw built-in-channel model
unless that proves impossible.

This repository is no longer a Discord ingress service, SQLite relay router, or
OpenClaw gateway proxy. Its active job is to apply Langfuse-managed runtime
prompts to registered OpenClaw workspaces and keep enough docs and tests around
that operator flow and the productized manual pilot runbook.

## Local Commands

Use the project Node runtime:

```sh
nvm use
```

Build the TypeScript operator tooling:

```sh
npm run build
```

Run automated tests:

```sh
npm test
```

Apply the production Langfuse runtime prompt to every registered OpenClaw
workspace:

```sh
LANGFUSE_PUBLIC_KEY=... \
LANGFUSE_SECRET_KEY=... \
npm run openclaw:apply -- \
  --langfuse-prompt intentive-runtime-bundle \
  --langfuse-label production
```

Pinned rollout:

```sh
LANGFUSE_PUBLIC_KEY=... \
LANGFUSE_SECRET_KEY=... \
npm run openclaw:apply -- \
  --langfuse-prompt intentive-runtime-bundle \
  --langfuse-version <number>
```

## Runtime Direction

OpenClaw owns the live channel runtime. The product path is:

- OpenClaw built-in Discord for the current Phase 3 pilot runtime.
- Langfuse-managed runtime prompts for shared prompt and config rollout.
- `openclaw-workspaces.json` as the committed active-workspace registry.
- Future WhatsApp through OpenClaw built-in channel support, not a separate
  Intentive relay.

Relay-era surfaces have been retired. Do not reintroduce SQLite Discord routing,
custom Discord gateway ingress, or an Intentive-managed OpenClaw gateway proxy
as the product runtime without a new architecture decision.

Runtime bundles may include `## Config: openclaw` only for the live heartbeat
prompt patch. That patch must provide a non-empty
`agents.defaults.heartbeat.prompt`; `openclaw:apply` preserves any existing
heartbeat settings outside the bundle-owned prompt field.

For the human-operated Phase 3 pilot setup, use
[`docs/phase3-openclaw-discord-runtime.md`](docs/phase3-openclaw-discord-runtime.md).

For the Phase 4 two-user productized manual pilot, use
[`docs/phase4-productized-manual-pilot.md`](docs/phase4-productized-manual-pilot.md).

## Module Homes

- `src/openclaw/apply.ts`: `openclaw:apply` command
- `src/openclaw/runtime-bundle.ts`: Langfuse prompt fetch boundary
- `src/openclaw/workspace-registry.ts`: active workspace registry loader
- `src/openclaw/managed-file-apply.ts`: managed Markdown file section rollout
- `src/openclaw/config-apply.ts`: allowlisted OpenClaw config patch rollout

## Registry

`openclaw-workspaces.json` lists every active OpenClaw user workspace that
receives the same resolved Langfuse runtime prompt version during a rollout.
The registry also names the OpenClaw config file used for allowlisted config
patches.

The registry may use personal-name-style agent directory names during the pilot.
Do not put secrets, tokens, Discord IDs, phone numbers, therapist notes, or
private user content in this file.
