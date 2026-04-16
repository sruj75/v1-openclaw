# v1-openclaw

Intentive v1 relay prototype for routing private Discord channel messages to an
OpenClaw-backed agent workspace.

## Local Commands

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

The bootstrap slice does not require Discord or OpenClaw credentials. The
synthetic entrypoint submits a normalized Discord-style user message through the
relay and uses an unconfigured OpenClaw adapter placeholder.

## Module Homes

- `src/config`: environment and service configuration
- `src/db`: persistence boundary, currently backed by an in-memory store
- `src/discord`: normalized Discord event types and synthetic event helpers
- `src/relay`: relay orchestration for accepted normalized events
- `src/openclaw`: OpenClaw gateway adapter boundary
