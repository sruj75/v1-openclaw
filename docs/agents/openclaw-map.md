# OpenClaw Map

## Stage-1 Principle

Stage 1 should use OpenClaw as an existing gateway and runtime, not as a place to reinvent transport or scatter product behavior.

Rule:

- read core gateway files to understand the boot path and protocol
- prefer very small edits in protocol identity and startup flags
- build Expo connection logic outside OpenClaw

## Key OpenClaw Files

### Composition And Startup

- `src/gateway/server.impl.ts`: main gateway composition root that wires config, HTTP, WebSocket, channels, cron, plugins, and sidecars together
- `src/gateway/server-runtime-state.ts`: creates the HTTP server and WebSocket server and attaches upgrade handling
- `src/gateway/server-startup.ts`: starts browser control, Gmail watcher, hooks, channels, plugin services, and memory backend; this is the main runtime-batteries startup switchboard

### HTTP And WebSocket Surface

- `src/gateway/server-http.ts`: built-in HTTP surface and HTTP-to-WebSocket upgrade path
- `src/gateway/server-ws-runtime.ts`: thin attachment point for the Gateway WebSocket connection handler
- `src/gateway/server/ws-connection.ts`: WebSocket connection lifecycle, `connect.challenge`, handshake timeout, and connection close handling
- `src/gateway/server/ws-connection/message-handler.ts`: handshake, parser, auth, protocol validation, role and scope checks, and later request dispatch

### Protocol Identity

- `src/gateway/protocol/client-info.ts`: canonical client IDs and client modes; this is the clean place for explicit `intentive-expo` or `intentive-api` identity

### Channels And Plugins

- `src/channels/plugins/registry.ts`: where active channel plugins are surfaced; useful later for pruning after startup is already gated

### Build Surface

- `package.json`: confirms existing scripts and already shows `OPENCLAW_SKIP_CHANNELS=1` in gateway dev usage

## Stage 1: Edit vs Inspect vs Avoid

### Prefer To Inspect, Not Edit

- `src/gateway/server.impl.ts`
- `src/gateway/server-runtime-state.ts`
- `src/gateway/server-http.ts`
- `src/gateway/server/ws-connection.ts`
- `src/gateway/server/ws-connection/message-handler.ts`

These are important reference points, but poor first edit points because they are central and easy to destabilize.

### Clean Stage-1 Edit Points

- `src/gateway/protocol/client-info.ts`
- `src/gateway/server-startup.ts`

Use `client-info.ts` for:

- adding `intentive-expo` as a first-class client identity if needed
- later adding `intentive-api` as a backend client identity

Use `server-startup.ts` for:

- runtime feature flags such as `OPENCLAW_SKIP_CHANNELS=1`
- an optional `INTENTIVE_EXPO_ONLY=1` mode that skips browser control, Gmail watcher, hooks, plugin services, and channels when not needed

### Optional, Minimal Stage-1 Touch

- `src/gateway/server/ws-connection.ts`

Only if useful for:

- clearer logging for Expo connections
- dev-only handshake logging
- non-behavioral observability improvements

Avoid changing handshake semantics here unless absolutely necessary.

## Build Outside OpenClaw In Stage 1

Build the Expo-side integration in your own app, for example:

- `src/lib/openclawWs.ts`
- `src/lib/openclawFrames.ts`
- `src/lib/openclawEventMapper.ts`

Responsibilities:

- open the WebSocket to the gateway
- receive `connect.challenge`
- send `connect`
- parse `hello-ok`
- send request frames
- map raw protocol events into Intentive UI events

Rule:

- Expo screens should not depend directly on raw OpenClaw event shapes
- keep a local mapper from raw protocol to Intentive UI events even in Stage 1
- keep transport, frame parsing, and event mapping as their own deep modules instead of scattering protocol logic through UI screens

## Runtime Data Layout

Keep writable runtime data outside the repo in a dedicated runtime-data area.

Preferred shape:

```text
/runtime-data/
  sandboxes/
    {tenant_id}/
      {job_id}/
        input/
        work/
        output/
        metadata.json
  caches/
  logs/
```

Pattern:

- source repo remains code, config, and durable logic
- `/runtime-data/sandboxes` holds disposable per-job writable workspaces
- tenant and job scoping are part of the path, not just metadata
- caches and logs stay outside the repo and outside durable product code

Do not:

- write sandbox files into the source tree
- let one job reuse another job's writable workspace
- treat runtime output folders as durable product state

## Stage 2: Adapter Placement

Do not primarily add the adapter inside `src/gateway/server-http.ts`.

That file already owns too much:

- hooks
- tool invocation
- session history and kill
- OpenAI-compatible HTTP
- plugin HTTP
- Control UI
- probes
- upgrade handling

The correct Stage-2 move is to add a sibling app:

- `apps/intentive-api/src/server.ts`
- `apps/intentive-api/src/routes/chat.ts`
- `apps/intentive-api/src/routes/routines.ts`
- `apps/intentive-api/src/realtime/ws.ts`
- `packages/openclaw-bridge/src/client.ts`
- `packages/openclaw-bridge/src/mappers.ts`
- `packages/openclaw-bridge/src/sessionMap.ts`

Responsibilities:

- expose clean HTTP routes to Expo
- expose Intentive-owned realtime WebSocket
- keep an internal WebSocket connection to OpenClaw Gateway
- translate app actions to OpenClaw request frames through `packages/openclaw-bridge`
- translate OpenClaw events back to app-facing events through `packages/openclaw-bridge`

## If You Must Add Internal Intentive Routes

Not recommended as the main path.

If forced, the least-bad place is:

- `src/gateway/server-http.ts`

Even then:

- add a tight namespace such as `/api/intentive/*`
- add one clear request stage
- keep domain logic out of generic gateway auth and upgrade logic

## Stage 3: Pruning Order

Do not delete leaves before cutting roots.

### First

Edit `package.json` so scripts stop pointing at code you plan to remove.

### Then Remove In Order

1. Native apps you do not need:

- `apps/android/`
- `apps/ios/`
- `apps/macos/`
- likely shared native kit code if only those targets use it

2. UI and control surfaces you no longer need:

- `ui/`
- Control UI asset and build references

Do this only after Stage 2, because Control UI may still help early debugging.

3. Channel boot path and registration:

- gate startup in `src/gateway/server-startup.ts`
- then prune registration in `src/channels/plugins/registry.ts`
- only then delete actual channel implementations

4. Sidecars:

- browser control
- Gmail watcher
- internal hooks
- plugin services
- generic memory startup, if replaced

Convert them to flags first, then remove the ones you never use.

## Stage Summary

### Stage 1

Edit:

- `src/gateway/protocol/client-info.ts`
- `src/gateway/server-startup.ts`

Inspect but preferably do not edit:

- `src/gateway/server.impl.ts`
- `src/gateway/server-runtime-state.ts`
- `src/gateway/server-http.ts`
- `src/gateway/server/ws-connection.ts`
- `src/gateway/server/ws-connection/message-handler.ts`

Build outside OpenClaw:

- Expo WebSocket client
- frame parser and serializer
- local event mapper

### Stage 2

Add:

- `apps/intentive-api/*`
- `packages/openclaw-bridge/*`

Optionally edit:

- `src/gateway/protocol/client-info.ts`
- `src/gateway/server-startup.ts`

Avoid:

- stuffing product API into gateway core
- mixing Intentive domain logic into gateway auth or upgrade logic

### Stage 3

Prune only after:

- package scripts are updated
- startup roots are gated
- registration roots are gated
- Stage-2 boundaries are already real
