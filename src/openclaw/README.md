# OpenClaw Gateway Client

`src/openclaw` contains the relay boundary for the real OpenClaw protocol v3
WebSocket gateway.

## Connection Flow

The client waits for the gateway to send `connect.challenge` before sending the
first request. It signs the challenge nonce with an Ed25519 device identity and
then sends a `type: "req"` `connect` request with:

- `minProtocol: 3` and `maxProtocol: 3`
- `client.id`, `client.version`, `client.platform`, `client.deviceFamily`, and `client.mode`
- `role: "operator"`
- `scopes: ["operator.read", "operator.write"]`
- empty `caps`, `commands`, and `permissions`
- optional shared `auth.token`
- signed top-level `device`, `locale`, and `userAgent`

The supported client id and mode default to `cli` and `backend`.

## Device Identity

Set `OPENCLAW_DEVICE_IDENTITY_JWK` to an Ed25519 OKP private JSON Web Key with
both `x` and `d`.

The client computes:

- `device.id`: SHA-256 of the raw public key, hex encoded
- `device.publicKey`: raw Ed25519 public key, base64url without padding
- `device.signature`: Ed25519 signature, base64url without padding

The signed v3 payload is:

```text
["v3", deviceId, clientId, clientMode, role, scopes.join(","), String(signedAtMs), token ?? "", nonce, normalizedPlatform, normalizedDeviceFamily].join("|")
```

`platform` and `deviceFamily` are trimmed and ASCII-lowercased before signing.

## Chat Flow

`sendUserMessage` sends `chat.send` with only:

- `sessionKey`
- `message`
- `idempotencyKey`

Discord message ids are used as idempotency keys. The relay session key embeds
the OpenClaw agent id:

```text
discord:<discordChannelId>:agent:<openClawAgentId>
```

After `chat.send`, the client waits for a matching final, error, or aborted chat
event by `runId` and `sessionKey`. It also polls `chat.history` during the same
window because operator connections may not receive every session-scoped chat
event. If the terminal event does not include assistant text, it calls
`chat.history` and returns the latest assistant or agent message.

## Phase 3 Workspace Registry

`openclaw-workspaces.json` is the committed product-level source of active
OpenClaw workspaces for Phase 3 global runtime rollout. Each path in
`workspaces` is an OpenClaw user workspace that receives the same resolved
Braintrust runtime bundle version during a bundle apply. The top-level `config`
path points to the OpenClaw config file used by future allowlisted config
patching.

The registry may use personal-name-style agent directory names while Phase 3 is
being piloted. Do not put secrets, tokens, Discord IDs, phone numbers, therapist
notes, or private user content in this file.
