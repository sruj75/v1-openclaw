# v1-openclaw

Operator toolkit for Phase 3 OpenClaw runtime rollout.

Phase 3 uses OpenClaw built-in channels as the runtime surface. OpenClaw
built-in Discord is the current path for user and expert interaction. Future
WhatsApp support should use the same OpenClaw built-in-channel model unless
that proves impossible.

This repository is no longer a Discord ingress service, SQLite relay router, or
OpenClaw gateway proxy. Its active job is to apply Braintrust-managed runtime
bundles to registered OpenClaw workspaces and keep enough docs and tests around
that operator flow.

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

Apply a Braintrust runtime bundle to every registered OpenClaw workspace:

```sh
BRAINTRUST_API_KEY=... \
BRAINTRUST_PROJECT_ID=... \
npm run openclaw:apply -- \
  --braintrust-slug intentive-runtime-bundle \
  --latest
```

Pinned rollout:

```sh
BRAINTRUST_API_KEY=... \
BRAINTRUST_PROJECT_ID=... \
npm run openclaw:apply -- \
  --braintrust-slug intentive-runtime-bundle \
  --braintrust-version <version-id>
```

## Runtime Direction

OpenClaw owns the live channel runtime. The product path is:

- OpenClaw built-in Discord for the current Phase 3 pilot runtime.
- Braintrust-managed runtime bundles for shared prompt and config rollout.
- `openclaw-workspaces.json` as the committed active-workspace registry.
- Future WhatsApp through OpenClaw built-in channel support, not a separate
  Intentive relay.

Relay-era surfaces have been retired. Do not reintroduce SQLite Discord routing,
custom Discord gateway ingress, or an Intentive-managed OpenClaw gateway proxy
as the product runtime without a new architecture decision.

## Module Homes

- `src/openclaw/apply.ts`: `openclaw:apply` command and Braintrust REST client
- `src/openclaw/braintrust-bundle.ts`: Braintrust bundle fetch boundary
- `src/openclaw/workspace-registry.ts`: active workspace registry loader
- `src/openclaw/managed-file-apply.ts`: managed Markdown file section rollout
- `src/openclaw/config-apply.ts`: allowlisted OpenClaw config patch rollout

## Registry

`openclaw-workspaces.json` lists every active OpenClaw user workspace that
receives the same resolved Braintrust runtime bundle version during a rollout.
The registry also names the OpenClaw config file used for allowlisted config
patches.

The registry may use personal-name-style agent directory names during the pilot.
Do not put secrets, tokens, Discord IDs, phone numbers, therapist notes, or
private user content in this file.
