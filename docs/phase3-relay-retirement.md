# Phase 3 Relay Retirement

Parent PRD: #31

Phase 3 retires the custom Intentive relay runtime. The repository no longer
targets SQLite Discord routing, custom Discord gateway ingress, or an
Intentive-managed OpenClaw gateway proxy as product runtime architecture.

OpenClaw built-in Discord is the current runtime path. Future WhatsApp support
should use OpenClaw built-in channel support unless that proves impossible.

The surviving repository responsibility is intentionally small: apply
Braintrust-managed runtime bundles to registered OpenClaw workspaces, maintain
the active workspace registry, and keep rollout checks green. Relay-era smoke
tests, scripts, migrations, and runtime modules were removed so operators do not
treat the relay as an active fallback option.
