# OpenClaw operator toolkit

`src/openclaw` contains the operator CLI and libraries for applying
Langfuse-managed runtime bundles to every workspace in `openclaw-workspaces.json`.
Phase 3 runbooks cover single-user OpenClaw built-in Discord setup; Phase 4
extends the same apply path to the two-user productized manual pilot.

OpenClaw built-in Discord is the current runtime surface. Future WhatsApp should
follow the OpenClaw built-in-channel path unless that proves impossible. This
module does not provide a custom Discord ingress service, SQLite relay router,
or OpenClaw gateway proxy.

## Bundle Apply Flow

`openclaw:apply` resolves a Langfuse text prompt by name and exactly one
selector:

- `--langfuse-label production`
- `--latest`
- `--langfuse-version <number>`

Optional: `--registry <path>` selects a workspace registry file (defaults to
`openclaw-workspaces.json` in the current working directory).

The command loads the registry, builds file and config plans, then
validates every target before writing changes.

Supported bundle sections:

- `## File: <relative/path>` updates managed blocks in every registered
  workspace file.
- `## Config: openclaw` patches the allowlisted OpenClaw heartbeat prompt.

The only live config field a bundle may set is
`agents.defaults.heartbeat.prompt`, and it must be a non-empty string. The
apply step merges that prompt into the existing heartbeat object so bundle
rollout does not erase operator-owned heartbeat settings.

The command reports the resolved Langfuse prompt version plus changed or unchanged
targets so operators can record the exact rollout version.

## Workspace Registry

`openclaw-workspaces.json` is the committed product-level source of active
OpenClaw workspaces for Langfuse rollout. Each path in `workspaces` is an
OpenClaw user workspace that receives the same resolved Langfuse runtime prompt
version during a bundle apply. The top-level `config` path points to the
OpenClaw config file used by allowlisted config patching.

The registry may use personal-name-style agent directory names during the pilot.
Do not put secrets, tokens, Discord IDs, phone numbers, therapist notes, or
private user content in this file.
