import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { seedRoutingAssignments } from "../dist/db/seed.js";
import {
  DISCORD_DIRECT_MESSAGES_INTENT,
  DISCORD_GUILD_MESSAGES_INTENT,
  DISCORD_MESSAGE_CONTENT_INTENT,
  createDiscordBotAdapter
} from "../dist/discord/index.js";
import { processNormalizedDiscordEvent } from "../dist/relay/discord.js";

const seed = {
  users: [
    {
      id: "user_local_alex",
      discordUserId: "discord-user-local-alex",
      displayName: "Alex Demo"
    }
  ],
  experts: [
    {
      id: "expert_local_river",
      discordUserId: "discord-expert-local-river",
      displayName: "River Expert"
    }
  ],
  agents: [
    {
      id: "agent_local_alex",
      openClawAgentId: "openclaw-agent-local-alex",
      workspacePath: "/tmp/openclaw/workspaces/alex-demo"
    }
  ],
  userAssignments: [
    {
      id: "assignment_local_alex_private_channel",
      userId: "user_local_alex",
      expertId: "expert_local_river",
      agentId: "agent_local_alex",
      discordChannelId: "discord-channel-private-alex"
    }
  ]
};

test("Discord bot adapter normalizes private messages and posts relay replies to the same channel", async (t) => {
  await withDatabase(async (database) => {
    const sockets = [];
    const restCalls = [];
    const adapter = createDiscordBotAdapter(
      {
        token: "test-bot-token",
        selfUserId: "discord-bot-self",
        gatewayUrl: "wss://discord.test/gateway",
        apiBaseUrl: "https://discord.test/api/v10"
      },
      {
        createWebSocket(url) {
          const socket = new FakeGatewaySocket(url);
          sockets.push(socket);
          return socket;
        },
        fetch: async (url, init) => {
          restCalls.push({ url, init });

          return new Response(
            JSON.stringify({
              id: "discord-agent-reply-live-1",
              channel_id: "discord-channel-private-alex"
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        },
        logger: silentLogger
      }
    );

    t.after(() => adapter.close());

    const processed = [];
    const openClaw = {
      async sendUserMessage(request) {
        processed.push(request);
        return {
          status: "ok",
          traceId: "trace-discord-smoke-1",
          reply: {
            content: "Open the smallest file first."
          }
        };
      }
    };

    await adapter.connect({
      onMessage: async (event) => {
        await processNormalizedDiscordEvent(event, { database, openClaw, discord: adapter });
      }
    });

    const socket = sockets[0];
    assert.equal(socket.url, "wss://discord.test/gateway");

    await socket.emitGatewayMessage({
      op: 10,
      d: { heartbeat_interval: 45_000 }
    });

    assert.equal(socket.sentMessages[0].op, 2);
    assert.equal(socket.sentMessages[0].d.token, "test-bot-token");
    assert.deepEqual(socket.sentMessages[0].d.properties, {
      os: "node",
      browser: "v1-openclaw",
      device: "v1-openclaw"
    });
    assert.equal(
      socket.sentMessages[0].d.intents,
      DISCORD_GUILD_MESSAGES_INTENT | DISCORD_DIRECT_MESSAGES_INTENT | DISCORD_MESSAGE_CONTENT_INTENT
    );

    await socket.emitGatewayMessage({
      op: 0,
      t: "READY",
      s: 1,
      d: {
        session_id: "discord-session-1",
        resume_gateway_url: "wss://discord.test/resume",
        user: {
          id: "discord-bot-self"
        }
      }
    });
    await socket.emitGatewayMessage({
      op: 1
    });
    assert.deepEqual(socket.sentMessages.at(-1), {
      op: 1,
      d: 1
    });
    await socket.emitGatewayMessage({
      op: 11
    });

    await socket.emitGatewayMessage({
      op: 0,
      t: "MESSAGE_CREATE",
      s: 2,
      d: {
        id: "discord-message-live-1",
        channel_id: "discord-channel-private-alex",
        author: { id: "discord-user-local-alex" },
        content: "I need a tiny first step.",
        timestamp: "2026-04-16T00:10:00.000Z"
      }
    });

    await socket.emitGatewayMessage({
      op: 0,
      t: "MESSAGE_CREATE",
      s: 3,
      d: {
        id: "discord-message-self-loop-1",
        channel_id: "discord-channel-private-alex",
        author: { id: "discord-bot-self", bot: true },
        content: "Open the smallest file first.",
        timestamp: "2026-04-16T00:10:01.000Z"
      }
    });

    assert.equal(processed.length, 1);
    assert.equal(processed[0].message, "I need a tiny first step.");
    assert.equal(processed[0].agentId, "openclaw-agent-local-alex");
    assert.equal(
      processed[0].sessionKey,
      "discord:discord-channel-private-alex:agent:openclaw-agent-local-alex"
    );
    assert.equal(restCalls.length, 1);
    assert.equal(restCalls[0].url, "https://discord.test/api/v10/channels/discord-channel-private-alex/messages");
    assert.equal(restCalls[0].init.method, "POST");
    assert.equal(restCalls[0].init.headers.authorization, "Bot test-bot-token");
    assert.deepEqual(JSON.parse(restCalls[0].init.body), {
      content: "Open the smallest file first.",
      allowed_mentions: { parse: [] }
    });

    assert.equal(selectStoredMessage(database, "discord-message-live-1").message_type, "user_message");
    const reply = selectStoredMessage(database, "discord-agent-reply-live-1");
    assert.equal(reply.channel_id, "discord-channel-private-alex");
    assert.equal(reply.role, "agent");
    assert.equal(reply.content, "Open the smallest file first.");
  });
});

test("Discord bot adapter resumes when the gateway requests reconnect", async (t) => {
  const sockets = [];
  const adapter = createDiscordBotAdapter(
    {
      token: "test-bot-token",
      selfUserId: "discord-bot-self",
      gatewayUrl: "wss://discord.test/gateway",
      apiBaseUrl: "https://discord.test/api/v10"
    },
    {
      createWebSocket(url) {
        const socket = new FakeGatewaySocket(url);
        sockets.push(socket);
        return socket;
      },
      fetch: async () => {
        throw new Error("REST should not be called in reconnect test");
      },
      logger: silentLogger
    }
  );

  t.after(() => adapter.close());

  await adapter.connect({
    onMessage() {}
  });

  const firstSocket = sockets[0];
  await firstSocket.emitGatewayMessage({
    op: 10,
    d: { heartbeat_interval: 45_000 }
  });
  assert.equal(firstSocket.sentMessages[0].op, 2);

  await firstSocket.emitGatewayMessage({
    op: 0,
    t: "READY",
    s: 10,
    d: {
      session_id: "discord-session-resume-1",
      resume_gateway_url: "wss://discord.test/resume",
      user: {
        id: "discord-bot-self"
      }
    }
  });
  await firstSocket.emitGatewayMessage({
    op: 7,
    s: 11
  });

  assert.equal(firstSocket.closed, true);
  assert.equal(sockets.length, 2);
  const secondSocket = sockets[1];
  assert.equal(secondSocket.url, "wss://discord.test/resume");

  await secondSocket.emitGatewayMessage({
    op: 10,
    d: { heartbeat_interval: 45_000 }
  });

  assert.deepEqual(secondSocket.sentMessages[0], {
    op: 6,
    d: {
      token: "test-bot-token",
      session_id: "discord-session-resume-1",
      seq: 11
    }
  });
});

class FakeGatewaySocket {
  constructor(url) {
    this.url = url;
    this.sentMessages = [];
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  send(data) {
    this.sentMessages.push(JSON.parse(data));
  }

  close() {
    this.closed = true;
  }

  async emitGatewayMessage(payload) {
    for (const listener of this.listeners.get("message") ?? []) {
      await listener({ data: JSON.stringify(payload) });
    }
  }
}

const silentLogger = {
  info() {},
  warn() {},
  error() {}
};

async function withDatabase(fn) {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-discord-adapter-"));
  const database = new DatabaseSync(join(tempDir, "messages.sqlite"));

  try {
    seedRoutingAssignments(database, seed);
    await fn(database);
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

function selectStoredMessage(database, discordMessageId) {
  return database
    .prepare(
      `
      SELECT discord_message_id, channel_id, role, message_type, content
      FROM messages
      WHERE discord_message_id = ?
      `
    )
    .get(discordMessageId);
}
