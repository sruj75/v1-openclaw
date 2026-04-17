import assert from "node:assert/strict";
import test from "node:test";

import { createOpenClawGatewayClient } from "../dist/openclaw/index.js";

const signedAtMs = 1_710_000_000_000;

test("OpenClaw client waits for connect.challenge and signs device connect", async () => {
  const identity = await createDeviceIdentity();
  const sockets = [];
  const client = createOpenClawGatewayClient(
    {
      gatewayUrl: "wss://openclaw.test/gateway",
      authToken: "shared-test-token",
      deviceIdentityJwk: identity.privateJwk,
      clientVersion: "0.1.0",
      clientPlatform: " Node ",
      clientId: " CLI ",
      clientMode: " Operator ",
      deviceFamily: " Relay ",
      locale: "en-US",
      userAgent: "v1-openclaw-test/0.1.0"
    },
    {
      createWebSocket(url) {
        const socket = new FakeOpenClawSocket(url);
        sockets.push(socket);
        return socket;
      },
      now: () => signedAtMs
    }
  );

  const responsePromise = client.sendUserMessage(openClawRequest());
  const socket = sockets[0];
  assert.equal(socket.url, "wss://openclaw.test/gateway");
  assert.equal(socket.sentFrames.length, 0);

  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "connect.challenge",
    payload: { nonce: "challenge-nonce-1" }
  });

  await waitFor(() => socket.sentFrames.length === 1);
  const connectFrame = socket.sentFrames[0];
  assert.equal(connectFrame.type, "req");
  assert.equal(connectFrame.method, "connect");
  assert.equal(connectFrame.params.minProtocol, 3);
  assert.equal(connectFrame.params.maxProtocol, 3);
  assert.deepEqual(connectFrame.params.client, {
    id: "cli",
    version: "0.1.0",
    platform: "node",
    deviceFamily: "relay",
    mode: "operator"
  });
  assert.equal(connectFrame.params.role, "operator");
  assert.deepEqual(connectFrame.params.scopes, ["operator.read", "operator.write"]);
  assert.deepEqual(connectFrame.params.caps, []);
  assert.deepEqual(connectFrame.params.commands, []);
  assert.deepEqual(connectFrame.params.permissions, {});
  assert.equal(connectFrame.params.auth.token, "shared-test-token");
  assert.equal(connectFrame.params.locale, "en-US");
  assert.equal(connectFrame.params.userAgent, "v1-openclaw-test/0.1.0");

  const deviceAuth = connectFrame.params.device;
  assert.equal(deviceAuth.id, identity.deviceId);
  assert.equal(deviceAuth.publicKey, identity.publicJwk.x);
  assert.equal(deviceAuth.signedAt, signedAtMs);
  assert.equal(deviceAuth.nonce, "challenge-nonce-1");

  const signaturePayload = [
    "v3",
    identity.deviceId,
    "cli",
    "operator",
    "operator",
    "operator.read,operator.write",
    String(signedAtMs),
    "shared-test-token",
    "challenge-nonce-1",
    "node",
    "relay"
  ].join("|");
  assert.equal(
    await crypto.subtle.verify(
      "Ed25519",
      identity.publicKey,
      base64UrlToBytes(deviceAuth.signature),
      new TextEncoder().encode(signaturePayload)
    ),
    true
  );

  await socket.emitGatewayMessage(responseFrame(connectFrame.id, { connected: true }));
  await waitFor(() => socket.sentFrames.length === 3);
  await answerHistoryFrame(socket, 1);
  const chatSendFrame = socket.sentFrames[2];
  assert.equal(chatSendFrame.method, "chat.send");
  assert.deepEqual(chatSendFrame.params, {
    sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
    message: "Give me one next step.",
    idempotencyKey: "discord-message-1"
  });

  await socket.emitGatewayMessage(responseFrame(chatSendFrame.id, { runId: "run-1" }));
  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "chat",
    payload: {
      runId: "run-1",
      sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
      state: "final",
      traceId: "trace-1",
      providerResponseId: "provider-response-1",
      message: {
        id: "runtime-message-1",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Open the smallest file first."
          }
        ]
      }
    }
  });

  assert.deepEqual(await responsePromise, {
    status: "ok",
    reply: {
      content: "Open the smallest file first.",
      runtimeMessageId: "runtime-message-1"
    },
    traceId: "trace-1",
    providerResponseId: "provider-response-1"
  });

  client.close();
});

test("OpenClaw client falls back to chat.history after terminal event without assistant text", async () => {
  const identity = await createDeviceIdentity();
  const sockets = [];
  const client = createOpenClawGatewayClient(
    {
      gatewayUrl: "wss://openclaw.test/gateway",
      deviceIdentityJwk: identity.privateJwk,
      requestTimeoutMs: 500
    },
    {
      createWebSocket(url) {
        const socket = new FakeOpenClawSocket(url);
        sockets.push(socket);
        return socket;
      },
      now: () => signedAtMs
    }
  );

  const responsePromise = client.sendUserMessage(openClawRequest());
  const socket = sockets[0];

  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "connect.challenge",
    payload: { nonce: "challenge-nonce-2" }
  });
  await waitFor(() => socket.sentFrames.length === 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[0].id, { connected: true }));

  await waitFor(() => socket.sentFrames.length === 3);
  await answerHistoryFrame(socket, 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[2].id, { runId: "run-history-1" }));
  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "chat.aborted",
    payload: {
      runId: "run-history-1",
      sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
      reason: "stream ended before final text"
    }
  });

  await waitFor(() => socket.sentFrames.length === 4);
  const historyFrame = socket.sentFrames[3];
  assert.equal(historyFrame.method, "chat.history");
  assert.deepEqual(historyFrame.params, {
    sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1"
  });

  await socket.emitGatewayMessage(
    responseFrame(historyFrame.id, {
      messages: [
        { id: "user-message-1", role: "user", content: "Give me one next step." },
        { id: "assistant-message-1", role: "assistant", content: "Use the history answer." }
      ]
    })
  );

  assert.deepEqual(await responsePromise, {
    status: "ok",
    reply: {
      content: "Use the history answer.",
      runtimeMessageId: "assistant-message-1"
    },
    providerResponseId: "assistant-message-1"
  });

  client.close();
});

test("OpenClaw client polls chat.history when terminal events are not delivered", async () => {
  const identity = await createDeviceIdentity();
  const sockets = [];
  const client = createOpenClawGatewayClient(
    {
      gatewayUrl: "wss://openclaw.test/gateway",
      deviceIdentityJwk: identity.privateJwk,
      requestTimeoutMs: 1_500
    },
    {
      createWebSocket(url) {
        const socket = new FakeOpenClawSocket(url);
        sockets.push(socket);
        return socket;
      },
      now: () => signedAtMs
    }
  );

  const responsePromise = client.sendUserMessage(openClawRequest());
  const socket = sockets[0];

  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "connect.challenge",
    payload: { nonce: "challenge-nonce-4" }
  });
  await waitFor(() => socket.sentFrames.length === 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[0].id, { connected: true }));

  await waitFor(() => socket.sentFrames.length === 3);
  await answerHistoryFrame(socket, 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[2].id, { runId: "run-history-poll-1" }));

  await waitFor(() => socket.sentFrames.length === 4, 1_300);
  const historyFrame = socket.sentFrames[3];
  assert.equal(historyFrame.method, "chat.history");
  await socket.emitGatewayMessage(
    responseFrame(historyFrame.id, {
      messages: [
        { id: "user-message-1", role: "user", content: "Give me one next step." },
        { id: "assistant-message-2", role: "assistant", content: "Use the polled answer." }
      ]
    })
  );

  assert.deepEqual(await responsePromise, {
    status: "ok",
    reply: {
      content: "Use the polled answer.",
      runtimeMessageId: "assistant-message-2"
    }
  });

  client.close();
});

test("OpenClaw client surfaces chat error events without waiting for history", async () => {
  const identity = await createDeviceIdentity();
  const sockets = [];
  const client = createOpenClawGatewayClient(
    {
      gatewayUrl: "wss://openclaw.test/gateway",
      deviceIdentityJwk: identity.privateJwk,
      requestTimeoutMs: 500
    },
    {
      createWebSocket(url) {
        const socket = new FakeOpenClawSocket(url);
        sockets.push(socket);
        return socket;
      },
      now: () => signedAtMs
    }
  );

  const responsePromise = client.sendUserMessage(openClawRequest());
  const socket = sockets[0];

  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "connect.challenge",
      payload: { nonce: "challenge-nonce-5" }
  });
  await waitFor(() => socket.sentFrames.length === 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[0].id, { connected: true }));

  await waitFor(() => socket.sentFrames.length === 3);
  await answerHistoryFrame(socket, 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[2].id, { runId: "run-error-1" }));
  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "chat",
    payload: {
      runId: "run-error-1",
      sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
      state: "error",
      traceId: "trace-error-1",
      errorMessage: "LLM error: API key expired"
    }
  });

  assert.deepEqual(await responsePromise, {
    status: "failed",
    message: "LLM error: API key expired",
    traceId: "trace-error-1"
  });
  assert.equal(socket.sentFrames.length, 3);

  client.close();
});

test("OpenClaw client ignores history replies that predate the current send", async () => {
  const identity = await createDeviceIdentity();
  const sockets = [];
  const client = createOpenClawGatewayClient(
    {
      gatewayUrl: "wss://openclaw.test/gateway",
      deviceIdentityJwk: identity.privateJwk,
      requestTimeoutMs: 2_500
    },
    {
      createWebSocket(url) {
        const socket = new FakeOpenClawSocket(url);
        sockets.push(socket);
        return socket;
      },
      now: () => signedAtMs
    }
  );

  const responsePromise = client.sendUserMessage(openClawRequest());
  let settled = false;
  const observedResponse = responsePromise.finally(() => {
    settled = true;
  });
  const socket = sockets[0];

  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "connect.challenge",
    payload: { nonce: "challenge-nonce-stale-history" }
  });
  await waitFor(() => socket.sentFrames.length === 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[0].id, { connected: true }));

  await waitFor(() => socket.sentFrames.length === 3);
  await answerHistoryFrame(socket, 1, [
    { id: "old-assistant-message", role: "assistant", content: "Old answer." }
  ]);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[2].id, { runId: "run-stale-history" }));

  await waitFor(() => socket.sentFrames.length === 4, 1_300);
  await socket.emitGatewayMessage(
    responseFrame(socket.sentFrames[3].id, {
      messages: [
        { id: "old-assistant-message", role: "assistant", content: "Old answer." }
      ]
    })
  );
  await delay(50);
  assert.equal(settled, false);

  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "chat",
    payload: {
      runId: "run-stale-history",
      sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
      state: "final",
      message: {
        id: "runtime-message-fresh",
        role: "assistant",
        content: "Fresh answer."
      }
    }
  });

  assert.deepEqual(await observedResponse, {
    status: "ok",
    reply: {
      content: "Fresh answer.",
      runtimeMessageId: "runtime-message-fresh"
    }
  });

  client.close();
});

test("OpenClaw client waits for a fresh challenge after reconnect", async () => {
  const identity = await createDeviceIdentity();
  const sockets = [];
  const client = createOpenClawGatewayClient(
    {
      gatewayUrl: "wss://openclaw.test/gateway",
      deviceIdentityJwk: identity.privateJwk,
      requestTimeoutMs: 1_500
    },
    {
      createWebSocket(url) {
        const socket = new FakeOpenClawSocket(url);
        sockets.push(socket);
        return socket;
      },
      now: () => signedAtMs
    }
  );

  const firstResponse = client.sendUserMessage(openClawRequest());
  const firstSocket = sockets[0];
  await completeGatewaySend(firstSocket, "challenge-nonce-reconnect-1", "run-reconnect-1", "First answer.");
  assert.equal((await firstResponse).reply.content, "First answer.");

  await firstSocket.emitClose();

  const secondResponse = client.sendUserMessage({
    ...openClawRequest(),
    message: "Give me the second step.",
    metadata: {
      ...openClawRequest().metadata,
      discordMessageId: "discord-message-2"
    }
  });
  await waitFor(() => sockets.length === 2);
  const secondSocket = sockets[1];
  assert.equal(secondSocket.sentFrames.length, 0);

  await secondSocket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "connect.challenge",
    payload: { nonce: "challenge-nonce-reconnect-2" }
  });
  await waitFor(() => secondSocket.sentFrames.length === 1);
  assert.equal(secondSocket.sentFrames[0].method, "connect");
  assert.equal(secondSocket.sentFrames[0].params.device.nonce, "challenge-nonce-reconnect-2");

  await secondSocket.emitGatewayMessage(responseFrame(secondSocket.sentFrames[0].id, { connected: true }));
  await waitFor(() => secondSocket.sentFrames.length === 3);
  await answerHistoryFrame(secondSocket, 1);
  await secondSocket.emitGatewayMessage(responseFrame(secondSocket.sentFrames[2].id, { runId: "run-reconnect-2" }));
  await secondSocket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "chat",
    payload: {
      runId: "run-reconnect-2",
      sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
      state: "final",
      message: {
        id: "runtime-message-reconnect-2",
        role: "assistant",
        content: "Second answer."
      }
    }
  });
  assert.equal((await secondResponse).reply.content, "Second answer.");

  client.close();
});

class FakeOpenClawSocket {
  constructor(url) {
    this.url = url;
    this.sentFrames = [];
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  send(data) {
    this.sentFrames.push(JSON.parse(data));
  }

  close() {
    this.closed = true;
  }

  async emitClose() {
    this.closed = true;
    for (const listener of this.listeners.get("close") ?? []) {
      await listener({});
    }
  }

  async emitGatewayMessage(payload) {
    for (const listener of this.listeners.get("message") ?? []) {
      await listener({ data: JSON.stringify(payload) });
    }
  }
}

function openClawRequest() {
  return {
    agentId: "openclaw-agent-1",
    sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
    message: "Give me one next step.",
    metadata: {
      discordMessageId: "discord-message-1",
      discordChannelId: "discord-channel-1",
      userId: "user-1",
      expertId: "expert-1",
      assignmentId: "assignment-1"
    }
  };
}

function responseFrame(id, result) {
  return {
    type: "res",
    id,
    ok: true,
    payload: result
  };
}

async function completeGatewaySend(socket, nonce, runId, content) {
  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "connect.challenge",
    payload: { nonce }
  });
  await waitFor(() => socket.sentFrames.length === 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[0].id, { connected: true }));
  await waitFor(() => socket.sentFrames.length === 3);
  await answerHistoryFrame(socket, 1);
  await socket.emitGatewayMessage(responseFrame(socket.sentFrames[2].id, { runId }));
  await socket.emitGatewayMessage({
    v: 3,
    type: "event",
    event: "chat",
    payload: {
      runId,
      sessionKey: "discord:discord-channel-1:agent:openclaw-agent-1",
      state: "final",
      message: {
        id: `${runId}-message`,
        role: "assistant",
        content
      }
    }
  });
}

async function answerHistoryFrame(socket, frameIndex, messages = []) {
  await waitFor(() => socket.sentFrames[frameIndex]?.method === "chat.history");
  const historyFrame = socket.sentFrames[frameIndex];
  await socket.emitGatewayMessage(responseFrame(historyFrame.id, { messages }));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createDeviceIdentity() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  );
  const privateJwk = await crypto.subtle.exportKey("jwk", privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", publicKey);
  const publicKeyBytes = base64UrlToBytes(publicJwk.x);
  const deviceId = bytesToHex(await crypto.subtle.digest("SHA-256", publicKeyBytes));

  return {
    privateJwk,
    publicJwk,
    publicKey,
    deviceId
  };
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToHex(value) {
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function waitFor(predicate, timeoutMs = 1_000) {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for fake gateway interaction");
    }

    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
