import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { persistClassifiedMessage } from "../dist/db/messages.js";
import { resolveChannelRouting } from "../dist/db/routing.js";
import { seedRoutingAssignments } from "../dist/db/seed.js";
import { normalizeDiscordMessagePayload } from "../dist/discord/index.js";
import { classifyDiscordMessage } from "../dist/relay/classification.js";
import { processDiscordMessagePayload } from "../dist/relay/discord.js";

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
    assert.equal(message.shouldForwardToOpenClaw, false);

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
      async sendMessage() {
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
      SELECT discord_message_id, user_id, expert_id, agent_id, role, message_type, raw_event_json
      FROM messages
      WHERE discord_message_id = ?
      `
    )
    .get(discordMessageId);
}
