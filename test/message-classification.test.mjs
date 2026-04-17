import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { persistClassifiedMessage } from "../dist/db/messages.js";
import { resolveChannelRouting } from "../dist/db/routing.js";
import { seedRoutingAssignments } from "../dist/db/seed.js";
import { createRecordingDiscordAdapter } from "../dist/discord/index.js";
import { normalizeDiscordMessagePayload } from "../dist/discord/index.js";
import { classifyDiscordMessage } from "../dist/relay/classification.js";
import {
  OPENCLAW_FAILURE_FALLBACK_REPLY,
  processDiscordMessagePayload
} from "../dist/relay/discord.js";

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

test("classifies and persists user messages from mapped channels", async () => {
  await withDatabase((database) => {
    const message = classifyAndPersist(database, {
      id: "discord-message-user-1",
      channelId: "discord-channel-private-alex",
      author: { id: "discord-user-local-alex" },
      content: "I need help starting.",
      timestamp: "2026-04-16T00:00:00.000Z"
    });

    assert.equal(message.messageType, "user_message");
    assert.equal(message.role, "user");
    assert.equal(message.shouldForwardToOpenClaw, true);

    const stored = selectStoredMessage(database, "discord-message-user-1");
    assert.equal(stored.message_type, "user_message");
    assert.equal(stored.role, "user");
    assert.equal(stored.user_id, "user_local_alex");
    assert.equal(stored.agent_id, "agent_local_alex");
  });
});

test("expert replies are persisted only and do not call OpenClaw", async () => {
  await withDatabase((database) => {
    const message = classifyAndPersist(database, {
      id: "discord-message-expert-1",
      channelId: "discord-channel-private-alex",
      author: { id: "discord-expert-local-river" },
      content: "That sounds like a good next step.",
      timestamp: "2026-04-16T00:01:00.000Z"
    });

    assert.equal(message.messageType, "expert_reply");
    assert.equal(message.role, "expert");
    assert.equal(message.shouldForwardToOpenClaw, false);
    assert.equal(selectStoredMessage(database, "discord-message-expert-1").expert_id, "expert_local_river");
  });
});

test("expert annotation tags are classified separately and persisted only", async () => {
  await withDatabase((database) => {
    const message = classifyAndPersist(database, {
      id: "discord-message-annotation-1",
      channelId: "discord-channel-private-alex",
      author: { id: "discord-expert-local-river" },
      content: "#better_response Ask one smaller question first.",
      timestamp: "2026-04-16T00:02:00.000Z"
    });

    assert.equal(message.messageType, "expert_annotation");
    assert.equal(message.role, "expert");
    assert.equal(message.shouldForwardToOpenClaw, false);
    assert.equal(
      selectStoredMessage(database, "discord-message-annotation-1").message_type,
      "expert_annotation"
    );
  });
});

test("relay processing persists expert messages without calling OpenClaw", async () => {
  await withDatabase(async (database) => {
    let openClawCalls = 0;
    const openClaw = {
      async sendUserMessage() {
        openClawCalls += 1;
        return { status: "not_configured", message: "should not be called" };
      }
    };

    const expertReply = await processDiscordMessagePayload(
      {
        id: "discord-message-process-expert-1",
        channelId: "discord-channel-private-alex",
        author: { id: "discord-expert-local-river" },
        content: "Try the two-minute version.",
        timestamp: "2026-04-16T00:02:30.000Z"
      },
      { database, openClaw }
    );

    const expertAnnotation = await processDiscordMessagePayload(
      {
        id: "discord-message-process-annotation-1",
        channelId: "discord-channel-private-alex",
        author: { id: "discord-expert-local-river" },
        content: "#wrong_timing Too soon after the user said they were overloaded.",
        timestamp: "2026-04-16T00:02:45.000Z"
      },
      { database, openClaw }
    );

    assert.equal(expertReply.classified.messageType, "expert_reply");
    assert.equal(expertAnnotation.classified.messageType, "expert_annotation");
    assert.equal(expertReply.openClaw, null);
    assert.equal(expertAnnotation.openClaw, null);
    assert.equal(openClawCalls, 0);
  });
});

test("mapped user messages create a session and call the OpenClaw gateway client", async () => {
  await withDatabase(async (database) => {
    const calls = [];
    const openClaw = {
      async sendUserMessage(request) {
        calls.push(request);
        return {
          status: "ok",
          traceId: "trace-local-1",
          providerResponseId: "provider-response-1"
        };
      }
    };

    const result = await processDiscordMessagePayload(
      {
        id: "discord-message-route-user-1",
        channelId: "discord-channel-private-alex",
        author: { id: "discord-user-local-alex" },
        content: "Please help me pick the first step.",
        timestamp: "2026-04-16T00:02:50.000Z"
      },
      { database, openClaw }
    );

    assert.equal(result.classified.messageType, "user_message");
    assert.equal(
      result.session?.openClawSessionKey,
      "discord:discord-channel-private-alex:agent:openclaw-agent-local-alex"
    );
    assert.deepEqual(calls, [
      {
        agentId: "openclaw-agent-local-alex",
        sessionKey: "discord:discord-channel-private-alex:agent:openclaw-agent-local-alex",
        message: "Please help me pick the first step.",
        metadata: {
          discordMessageId: "discord-message-route-user-1",
          discordChannelId: "discord-channel-private-alex",
          userId: "user_local_alex",
          expertId: "expert_local_river",
          assignmentId: "assignment_local_alex_private_channel"
        }
      }
    ]);

    const stored = selectStoredMessage(database, "discord-message-route-user-1");
    const routingMetadata = JSON.parse(stored.routing_metadata_json);

    assert.equal(stored.session_id, "session_discord-channel-private-alex_openclaw-agent-local-alex");
    assert.equal(stored.openclaw_status, "ok");
    assert.equal(stored.openclaw_trace_id, "trace-local-1");
    assert.equal(stored.openclaw_provider_response_id, "provider-response-1");
    assert.equal(
      routingMetadata.openClawSessionKey,
      "discord:discord-channel-private-alex:agent:openclaw-agent-local-alex"
    );
  });
});

test("mapped user messages persist and post mock agent replies", async () => {
  await withDatabase(async (database) => {
    const sentDiscordMessages = [];
    const discord = createRecordingDiscordAdapter(sentDiscordMessages);
    const openClaw = {
      async sendUserMessage() {
        return {
          status: "ok",
          traceId: "trace-local-reply-1",
          providerResponseId: "provider-response-reply-1",
          reply: {
            content: "Start with opening the document. I will stay with you for the next step.",
            runtimeMessageId: "runtime-message-1"
          }
        };
      }
    };

    const result = await processDiscordMessagePayload(
      {
        id: "discord-message-route-user-with-reply-1",
        channelId: "discord-channel-private-alex",
        author: { id: "discord-user-local-alex" },
        content: "I am frozen.",
        timestamp: "2026-04-16T00:02:55.000Z"
      },
      { database, openClaw, discord }
    );

    assert.equal(result.agentReply?.messageType, "agent_reply");
    assert.deepEqual(sentDiscordMessages, [
      {
        channelId: "discord-channel-private-alex",
        content: "Start with opening the document. I will stay with you for the next step.",
        metadata: {
          originatingDiscordMessageId: "discord-message-route-user-with-reply-1",
          sessionId: "session_discord-channel-private-alex_openclaw-agent-local-alex",
          agentId: "agent_local_alex"
        }
      }
    ]);

    const reply = selectStoredMessage(database, "discord-agent-reply-1");

    assert.equal(reply.role, "agent");
    assert.equal(reply.message_type, "agent_reply");
    assert.equal(reply.session_id, result.session?.id);
    assert.equal(reply.originating_message_id, result.persisted.id);
    assert.equal(reply.openclaw_trace_id, "trace-local-reply-1");
    assert.equal(reply.openclaw_provider_response_id, "provider-response-reply-1");
  });
});

test("duplicate Discord message IDs do not repeat routing side effects", async () => {
  await withDatabase(async (database) => {
    let openClawCalls = 0;
    const sentDiscordMessages = [];
    const discord = createRecordingDiscordAdapter(sentDiscordMessages);
    const openClaw = {
      async sendUserMessage() {
        openClawCalls += 1;
        return {
          status: "ok",
          reply: {
            content: "One reply only."
          }
        };
      }
    };
    const payload = {
      id: "discord-message-duplicate-1",
      channelId: "discord-channel-private-alex",
      author: { id: "discord-user-local-alex" },
      content: "Please do not double send this.",
      timestamp: "2026-04-16T00:06:00.000Z"
    };

    const first = await processDiscordMessagePayload(payload, { database, openClaw, discord });
    const second = await processDiscordMessagePayload(payload, { database, openClaw, discord });

    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, true);
    assert.equal(openClawCalls, 1);
    assert.equal(sentDiscordMessages.length, 1);
    assert.equal(countRows(database, "conversation_sessions"), 1);
    assert.equal(countRows(database, "messages"), 2);
  });
});

test("concurrent duplicate Discord message IDs claim idempotency before side effects", async () => {
  await withDatabase(async (database) => {
    const sentDiscordMessages = [];
    const discord = createRecordingDiscordAdapter(sentDiscordMessages);
    const openClawCalls = [];
    let releaseOpenClaw;
    const openClaw = {
      async sendUserMessage(request) {
        openClawCalls.push(request);
        return new Promise((resolve) => {
          releaseOpenClaw = () =>
            resolve({
              status: "ok",
              reply: {
                content: "One concurrent reply only."
              }
            });
        });
      }
    };
    const payload = {
      id: "discord-message-concurrent-duplicate-1",
      channelId: "discord-channel-private-alex",
      author: { id: "discord-user-local-alex" },
      content: "Please claim this before calling OpenClaw.",
      timestamp: "2026-04-16T00:06:30.000Z"
    };

    const firstPromise = processDiscordMessagePayload(payload, { database, openClaw, discord });
    const second = await processDiscordMessagePayload(payload, { database, openClaw, discord });

    assert.equal(second.duplicate, true);
    assert.equal(openClawCalls.length, 1);
    assert.equal(sentDiscordMessages.length, 0);

    releaseOpenClaw();
    const first = await firstPromise;

    assert.equal(first.duplicate, false);
    assert.equal(sentDiscordMessages.length, 1);
    assert.equal(countRows(database, "messages"), 2);
  });
});

test("unknown channels are persisted as unrouteable without OpenClaw calls", async () => {
  await withDatabase(async (database) => {
    let openClawCalls = 0;
    const openClaw = {
      async sendUserMessage() {
        openClawCalls += 1;
        return { status: "ok" };
      }
    };

    const result = await processDiscordMessagePayload(
      {
        id: "discord-message-unknown-channel-1",
        channelId: "discord-channel-missing",
        author: { id: "discord-user-local-alex" },
        content: "Am I mapped?",
        timestamp: "2026-04-16T00:07:00.000Z"
      },
      { database, openClaw }
    );

    const stored = selectStoredMessage(database, "discord-message-unknown-channel-1");

    assert.equal(result.classified.messageType, "unknown_sender");
    assert.equal(result.session, null);
    assert.equal(openClawCalls, 0);
    assert.equal(stored.message_type, "unknown_sender");
    assert.equal(stored.agent_id, null);
  });
});

test("bot and self events persist as system events without OpenClaw calls", async () => {
  await withDatabase(async (database) => {
    let openClawCalls = 0;
    const openClaw = {
      async sendUserMessage() {
        openClawCalls += 1;
        return { status: "ok" };
      }
    };

    const result = await processDiscordMessagePayload(
      {
        id: "discord-message-self-1",
        channelId: "discord-channel-private-alex",
        author: { id: "discord-bot-self" },
        content: "A message we posted ourselves.",
        timestamp: "2026-04-16T00:08:00.000Z"
      },
      { database, openClaw, discordSelfUserId: "discord-bot-self" }
    );

    assert.equal(result.classified.messageType, "system_event");
    assert.equal(result.session, null);
    assert.equal(result.openClaw, null);
    assert.equal(openClawCalls, 0);
    assert.equal(selectStoredMessage(database, "discord-message-self-1").message_type, "system_event");
  });
});

test("OpenClaw failures persist metadata and send a fixed fallback reply", async () => {
  await withDatabase(async (database) => {
    const sentDiscordMessages = [];
    const discord = createRecordingDiscordAdapter(sentDiscordMessages);
    const openClaw = {
      async sendUserMessage() {
        throw new Error("gateway timeout");
      }
    };

    const result = await processDiscordMessagePayload(
      {
        id: "discord-message-openclaw-failure-1",
        channelId: "discord-channel-private-alex",
        author: { id: "discord-user-local-alex" },
        content: "Please route this even if OpenClaw fails.",
        timestamp: "2026-04-16T00:09:00.000Z"
      },
      { database, openClaw, discord }
    );

    const userMessage = selectStoredMessage(database, "discord-message-openclaw-failure-1");
    const fallbackReply = selectStoredMessage(database, "discord-agent-reply-1");
    const routingMetadata = JSON.parse(userMessage.routing_metadata_json);

    assert.equal(result.openClaw?.status, "failed");
    assert.equal(userMessage.openclaw_status, "failed");
    assert.equal(routingMetadata.openClawMessage, "gateway timeout");
    assert.deepEqual(sentDiscordMessages, [
      {
        channelId: "discord-channel-private-alex",
        content: OPENCLAW_FAILURE_FALLBACK_REPLY,
        metadata: {
          originatingDiscordMessageId: "discord-message-openclaw-failure-1",
          sessionId: "session_discord-channel-private-alex_openclaw-agent-local-alex",
          agentId: "agent_local_alex"
        }
      }
    ]);
    assert.equal(fallbackReply.content, OPENCLAW_FAILURE_FALLBACK_REPLY);
    assert.equal(fallbackReply.openclaw_status, "failed");
    assert.equal(fallbackReply.originating_message_id, result.persisted.id);
  });
});

test("bot and system events are classified as system events", async () => {
  await withDatabase((database) => {
    const botMessage = classifyAndPersist(database, {
      id: "discord-message-bot-1",
      channelId: "discord-channel-private-alex",
      author: { id: "discord-bot-agent", bot: true },
      content: "Automated response",
      timestamp: "2026-04-16T00:03:00.000Z"
    });

    const systemMessage = classifyAndPersist(database, {
      id: "discord-message-system-1",
      channel_id: "discord-channel-private-alex",
      author: { id: "discord-system" },
      content: "",
      system: true,
      timestamp: "2026-04-16T00:04:00.000Z"
    });

    assert.equal(botMessage.messageType, "system_event");
    assert.equal(systemMessage.messageType, "system_event");
    assert.equal(botMessage.shouldForwardToOpenClaw, false);
    assert.equal(systemMessage.shouldForwardToOpenClaw, false);
  });
});

test("unknown senders are persisted without user or expert assignment", async () => {
  await withDatabase((database) => {
    const message = classifyAndPersist(database, {
      id: "discord-message-unknown-1",
      channelId: "discord-channel-private-alex",
      author: { id: "discord-random-person" },
      content: "Who am I?",
      timestamp: "2026-04-16T00:05:00.000Z"
    });

    const stored = selectStoredMessage(database, "discord-message-unknown-1");

    assert.equal(message.messageType, "unknown_sender");
    assert.equal(message.role, "unknown");
    assert.equal(message.shouldForwardToOpenClaw, false);
    assert.equal(stored.user_id, null);
    assert.equal(stored.expert_id, null);
    assert.equal(stored.agent_id, "agent_local_alex");
  });
});

test("invalid Discord-like payloads fail at the trust boundary", () => {
  assert.throws(
    () => normalizeDiscordMessagePayload({ id: "missing-channel", author: { id: "abc" }, content: "x" }),
    /channelId must be a non-empty string/
  );
});

function classifyAndPersist(database, payload) {
  const event = normalizeDiscordMessagePayload(payload);
  const routing = resolveChannelRouting(database, event.channelId);
  const message = classifyDiscordMessage(event, routing);
  persistClassifiedMessage(database, message);
  return message;
}

async function withDatabase(fn) {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-messages-"));
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
      SELECT discord_message_id, user_id, expert_id, agent_id, role, message_type, content, raw_event_json
        , session_id, originating_message_id, routing_metadata_json, openclaw_status, openclaw_trace_id, openclaw_provider_response_id
      FROM messages
      WHERE discord_message_id = ?
      `
    )
    .get(discordMessageId);
}

function countRows(database, tableName) {
  return database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}
