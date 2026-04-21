# OpenClaw Phase 3 Toolkit

`src/openclaw` contains the active Phase 3 operator tooling for applying
Braintrust-managed runtime bundles to OpenClaw workspaces.

OpenClaw built-in Discord is the current runtime surface. Future WhatsApp should
follow the OpenClaw built-in-channel path unless that proves impossible. This
module does not provide a custom Discord ingress service, SQLite relay router,
or OpenClaw gateway proxy.

## Bundle Apply Flow

`openclaw:apply` resolves a Braintrust runtime bundle by slug and either:

- `--latest`
- `--braintrust-version <version-id>`

The command loads `openclaw-workspaces.json`, builds file and config plans, then
validates every target before writing changes.

Supported bundle sections:

- `## File: <relative/path>` updates managed blocks in every registered
  workspace file.
- `## Config: openclaw` patches allowlisted OpenClaw config keys.

The command reports the resolved Braintrust version plus changed or unchanged
targets so operators can record the exact rollout version.

## Workspace Registry

`openclaw-workspaces.json` is the committed product-level source of active
OpenClaw workspaces for Phase 3 global runtime rollout. Each path in
`workspaces` is an OpenClaw user workspace that receives the same resolved
Braintrust runtime bundle version during a bundle apply. The top-level `config`
path points to the OpenClaw config file used by allowlisted config patching.

The registry may use personal-name-style agent directory names while Phase 3 is
being piloted. Do not put secrets, tokens, Discord IDs, phone numbers, therapist
notes, or private user content in this file.
