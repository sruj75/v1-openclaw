import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { loadDiscordBotConfig, loadOpenClawGatewayConfig } from "../dist/config/index.js";
import { seedRoutingAssignments } from "../dist/db/seed.js";
import { openSqliteDatabase } from "../dist/db/sqlite.js";
import { createDiscordBotAdapter, createRecordingDiscordAdapter } from "../dist/discord/index.js";
import {
  createOpenClawGatewayClient,
  createUnconfiguredOpenClawGateway
} from "../dist/openclaw/index.js";
import {
  OPENCLAW_FAILURE_FALLBACK_REPLY,
  processNormalizedDiscordEvent
} from "../dist/relay/discord.js";

const env = process.env;
const startedAt = Date.now();

const dbPath = readEnv("LIVE_SMOKE_DB_PATH", "data/phase1-private-channel-smoke.sqlite");
const discordChannelId = readRequiredEnv("LIVE_SMOKE_DISCORD_CHANNEL_ID");
const discordUserId = readRequiredEnv("LIVE_SMOKE_DISCORD_USER_ID");
const discordExpertUserId = readEnv("LIVE_SMOKE_EXPERT_DISCORD_USER_ID", "phase1-smoke-expert");
const openClawAgentId = readEnv("LIVE_SMOKE_OPENCLAW_AGENT_ID", "main");
const messageId = readEnv("LIVE_SMOKE_DISCORD_MESSAGE_ID", `phase1-smoke-user-${startedAt}`);
const messageContent = readEnv(
  "LIVE_SMOKE_MESSAGE",
  "Phase 1 private-channel smoke: reply with exactly 'phase 1 private channel smoke ok'."
);

const seed = {
  users: [
    {
      id: "user_phase1_smoke",
      discordUserId,
      displayName: "Phase 1 Smoke User"
    }
  ],
  experts: [
    {
      id: "expert_phase1_smoke",
      discordUserId: discordExpertUserId,
      displayName: "Phase 1 Smoke Expert"
    }
  ],
  agents: [
    {
      id: "agent_phase1_smoke",
      openClawAgentId,
      workspacePath: "~/.openclaw/workspace"
    }
  ],
  userAssignments: [
    {
      id: "assignment_phase1_smoke_private_channel",
      userId: "user_phase1_smoke",
      expertId: "expert_phase1_smoke",
      agentId: "agent_phase1_smoke",
      discordChannelId
    }
  ]
};

await mkdir(dirname(dbPath), { recursive: true });
const database = openSqliteDatabase(dbPath);

let openClaw;
let discord;
try {
  seedRoutingAssignments(database, seed);

  discord = createDiscordBotAdapter(loadDiscordBotConfig(env), {
    logger: quietLogger()
  });
  openClaw = await createOpenClawFromEnv();

  const event = normalizedEvent({
    id: messageId,
    channelId: discordChannelId,
    authorId: discordUserId,
    content: messageContent
  });

  const result = await processNormalizedDiscordEvent(event, {
    database,
    openClaw,
    discord,
    discordSelfUserId: env.DISCORD_BOT_USER_ID
  });

  const duplicateResult = await processNormalizedDiscordEvent(event, {
    database,
    openClaw,
    discord,
    discordSelfUserId: env.DISCORD_BOT_USER_ID
  });

  const unknownResult = await processNormalizedDiscordEvent(
    normalizedEvent({
      id: `${messageId}-unknown-channel`,
      channelId: `${discordChannelId}-unknown`,
      authorId: discordUserId,
      content: "This should stay unrouteable."
    }),
    {
      database,
      openClaw,
      discord: createRecordingDiscordAdapter(),
      discordSelfUserId: env.DISCORD_BOT_USER_ID
    }
  );

  const failureSentMessages = [];
  const failureResult = await processNormalizedDiscordEvent(
    normalizedEvent({
      id: `${messageId}-openclaw-failure`,
      channelId: discordChannelId,
      authorId: discordUserId,
      content: "This should exercise the OpenClaw failure fallback."
    }),
    {
      database,
      openClaw: failingOpenClaw(),
      discord: createRecordingDiscordAdapter(failureSentMessages),
      discordSelfUserId: env.DISCORD_BOT_USER_ID
    }
  );

  const verification = verifySmokeRows(database, {
    messageId,
    unknownMessageId: `${messageId}-unknown-channel`,
    failureMessageId: `${messageId}-openclaw-failure`,
    expectedSessionKey: `discord:${discordChannelId}:agent:${openClawAgentId}`,
    replyDiscordMessageId: result.agentReply?.discordMessageId
  });

  assertSmoke(result.classified.messageType === "user_message", "mapped user message was not classified");
  assertSmoke(result.session?.openClawSessionKey === verification.session.openclaw_session_key, "session key mismatch");
  assertSmoke(result.openClaw?.status === "ok", "OpenClaw did not return ok");
  assertSmoke(Boolean(result.agentReply), "agent reply was not persisted");
  assertSmoke(duplicateResult.duplicate, "duplicate message was not detected");
  assertSmoke(unknownResult.classified.messageType === "unknown_sender", "unknown channel was not unrouteable");
  assertSmoke(unknownResult.openClaw === null, "unknown channel called OpenClaw");
  assertSmoke(failureResult.openClaw?.status === "failed", "failure check did not capture failed OpenClaw status");
  assertSmoke(
    failureSentMessages[0]?.content === OPENCLAW_FAILURE_FALLBACK_REPLY,
    "failure check did not produce fallback Discord reply"
  );

  console.log(JSON.stringify({
    ok: true,
    dbPath,
    discordChannelId,
    controlledDiscordMessageId: messageId,
    openClawSessionKey: verification.session.openclaw_session_key,
    openClawStatus: result.openClaw?.status,
    replyDiscordMessageId: result.agentReply?.discordMessageId,
    replyPreview: verification.reply.content.slice(0, 240),
    duplicateVerified: duplicateResult.duplicate,
    unknownChannelVerified: unknownResult.classified.messageType,
    openClawFailureFallbackVerified: failureSentMessages[0]?.content === OPENCLAW_FAILURE_FALLBACK_REPLY,
    rowCounts: {
      sessions: verification.counts.sessions,
      messages: verification.counts.messages,
      agentReplies: verification.counts.agentReplies
    }
  }, null, 2));
} finally {
  openClaw?.close?.();
  discord?.close?.();
  database.close();
}

async function createOpenClawFromEnv() {
  const openClawEnv = { ...env };
  if (openClawEnv.OPENCLAW_GATEWAY_URL && !openClawEnv.OPENCLAW_DEVICE_IDENTITY_JWK) {
    openClawEnv.OPENCLAW_DEVICE_IDENTITY_JWK = await createEphemeralDeviceIdentityJwk();
  }

  const config = loadOpenClawGatewayConfig(openClawEnv);
  return config ? createOpenClawGatewayClient(config) : createUnconfiguredOpenClawGateway();
}

async function createEphemeralDeviceIdentityJwk() {
  const { privateKey } = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  return JSON.stringify(await crypto.subtle.exportKey("jwk", privateKey));
}

function normalizedEvent(input) {
  return {
    id: input.id,
    channelId: input.channelId,
    authorId: input.authorId,
    content: input.content,
    occurredAt: new Date().toISOString(),
    isBot: false,
    isSystem: false,
    rawEvent: {
      smoke: "phase1-private-channel",
      controlled: true
    }
  };
}

function verifySmokeRows(database, input) {
  const session = database.prepare(`
    SELECT id, user_id, agent_id, discord_channel_id, openclaw_session_key
    FROM conversation_sessions
    WHERE openclaw_session_key = ?
  `).get(input.expectedSessionKey);
  assertSmoke(session, "expected conversation session row was not created");

  const userMessage = selectMessage(database, input.messageId);
  assertSmoke(userMessage.message_type === "user_message", "expected user message row was not created");
  assertSmoke(userMessage.session_id === session.id, "user message did not link to session");
  assertSmoke(userMessage.openclaw_status === "ok", "user message did not persist OpenClaw ok status");

  const reply = input.replyDiscordMessageId ? selectMessage(database, input.replyDiscordMessageId) : null;
  assertSmoke(reply, "expected agent reply row was not created");
  assertSmoke(reply.originating_message_id === userMessage.id, "agent reply did not link to originating message");
  assertSmoke(reply.channel_id === input.expectedSessionKey.split(":")[1], "agent reply channel mismatch");

  const unknown = selectMessage(database, input.unknownMessageId);
  assertSmoke(unknown.message_type === "unknown_sender", "unknown-channel row was not persisted");
  assertSmoke(unknown.openclaw_status === null, "unknown-channel row should not have OpenClaw status");

  const failure = selectMessage(database, input.failureMessageId);
  assertSmoke(failure.openclaw_status === "failed", "failure row did not persist failed OpenClaw status");

  return {
    session,
    userMessage,
    reply,
    unknown,
    failure,
    counts: {
      sessions: count(database, "conversation_sessions"),
      messages: count(database, "messages"),
      agentReplies: countWhere(database, "messages", "message_type = 'agent_reply'")
    }
  };
}

function selectMessage(database, discordMessageId) {
  const row = database.prepare(`
    SELECT id, discord_message_id, channel_id, session_id, originating_message_id, role, message_type, content, openclaw_status
    FROM messages
    WHERE discord_message_id = ?
  `).get(discordMessageId);
  assertSmoke(row, `message row not found for ${discordMessageId}`);
  return row;
}

function count(database, tableName) {
  return database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function countWhere(database, tableName, whereClause) {
  return database.prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE ${whereClause}`).get().count;
}

function failingOpenClaw() {
  return {
    async sendUserMessage() {
      return {
        status: "failed",
        message: "controlled smoke failure"
      };
    }
  };
}

function assertSmoke(condition, message) {
  if (!condition) {
    throw new Error(`Phase 1 smoke failed: ${message}`);
  }
}

function readRequiredEnv(name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required for the Phase 1 private-channel smoke`);
  }

  return value.trim();
}

function readEnv(name, fallback) {
  const value = env[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function quietLogger() {
  return {
    info() {},
    warn(message, ...optional) {
      console.warn(message, ...optional);
    },
    error(message, ...optional) {
      console.error(message, ...optional);
    }
  };
}
