# Phase 3 Relay Retirement

Parent PRD: #31

Phase 3 retires the custom Intentive relay runtime. The repository no longer
targets SQLite Discord routing, custom Discord gateway ingress, or an
Intentive-managed OpenClaw gateway proxy as product runtime architecture.

OpenClaw built-in Discord is the current runtime path. Future WhatsApp support
should use OpenClaw built-in channel support unless that proves impossible.

The surviving repository responsibility is intentionally small: resolve a named
Langfuse text prompt (`intentive-runtime-bundle` in production rollouts), apply
`## File:` / `## Config: openclaw` sections via `openclaw:apply`, maintain
`openclaw-workspaces.json`, and keep tests green. Relay-era smoke tests,
scripts, migrations, and runtime modules were removed so operators do not treat
the relay as an active fallback option.
