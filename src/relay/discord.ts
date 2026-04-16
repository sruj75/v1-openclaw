import {
  findPersistedMessageByDiscordId,
  persistAgentReplyMessage,
  persistClassifiedMessage,
  type PersistedMessage
} from "../db/messages.js";
import { resolveChannelRouting } from "../db/routing.js";
import { getOrCreateConversationSession, type ConversationSession } from "../db/sessions.js";
import type { SqliteDatabase } from "../db/sqlite.js";
import { type DiscordOutboundAdapter, normalizeDiscordMessagePayload } from "../discord/index.js";
import type { NormalizedDiscordEvent } from "../discord/index.js";
import type { OpenClawGatewayClient, OpenClawGatewayReply } from "../openclaw/index.js";
import { classifyDiscordMessage, type ClassifiedDiscordMessage } from "./classification.js";

export type ProcessDiscordMessageDependencies = {
  database: SqliteDatabase;
  openClaw: OpenClawGatewayClient;
  discord?: DiscordOutboundAdapter;
  discordSelfUserId?: string;
};

export type ProcessedDiscordMessage = {
  classified: ClassifiedDiscordMessage;
  persisted: PersistedMessage;
  agentReply: PersistedMessage | null;
  session: ConversationSession | null;
  openClaw: OpenClawGatewayReply | null;
  duplicate: boolean;
};

export const OPENCLAW_FAILURE_FALLBACK_REPLY = "I hit a relay hiccup. Please try again in a moment.";

export async function processDiscordMessagePayload(
  payload: unknown,
  dependencies: ProcessDiscordMessageDependencies
): Promise<ProcessedDiscordMessage> {
  const normalizedEvent = normalizeDiscordMessagePayload(payload);
  return processNormalizedDiscordEvent(normalizedEvent, dependencies);
}

export async function processNormalizedDiscordEvent(
  normalizedEvent: NormalizedDiscordEvent,
  dependencies: ProcessDiscordMessageDependencies
): Promise<ProcessedDiscordMessage> {
  const existingMessage = findPersistedMessageByDiscordId(dependencies.database, normalizedEvent.id);
  const event = dependencies.discordSelfUserId === normalizedEvent.authorId
    ? { ...normalizedEvent, isBot: true }
    : normalizedEvent;
  const routing = resolveChannelRouting(dependencies.database, event.channelId);
  const classified = classifyDiscordMessage(event, routing);

  if (existingMessage) {
    return {
      classified,
      persisted: existingMessage,
      agentReply: null,
      session: null,
      openClaw: null,
      duplicate: true
    };
  }

  const session = classified.shouldForwardToOpenClaw && routing
    ? getOrCreateConversationSession(dependencies.database, routing)
    : null;
  const openClaw = classified.shouldForwardToOpenClaw && routing && session
    ? await sendToOpenClawWithFailureCapture(dependencies.openClaw, {
        agentId: routing.agent.id,
        sessionKey: session.openClawSessionKey,
        message: event.content,
        metadata: {
          discordMessageId: event.id,
          discordChannelId: event.channelId,
          userId: routing.user.id,
          expertId: routing.expert.id,
          assignmentId: routing.assignmentId
        }
      })
    : null;
  const persisted = persistClassifiedMessage(dependencies.database, classified, {
    session,
    openClaw
  });
  const agentReply = openClaw?.reply && routing && session
    ? await postAndPersistAgentReply({
        database: dependencies.database,
        discord: dependencies.discord,
        routingAgentId: routing.agent.id,
        channelId: event.channelId,
        originatingDiscordMessageId: event.id,
        originatingMessageId: persisted.id,
        session,
        openClaw
      })
    : null;

  return {
    classified,
    persisted,
    agentReply,
    session,
    openClaw,
    duplicate: false
  };
}

async function sendToOpenClawWithFailureCapture(
  openClaw: OpenClawGatewayClient,
  request: Parameters<OpenClawGatewayClient["sendUserMessage"]>[0]
): Promise<OpenClawGatewayReply> {
  try {
    const reply = await openClaw.sendUserMessage(request);
    if (reply.status === "failed") {
      return withFallbackReply(reply);
    }

    return reply;
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Unknown OpenClaw failure",
      reply: {
        content: OPENCLAW_FAILURE_FALLBACK_REPLY
      }
    };
  }
}

function withFallbackReply(reply: OpenClawGatewayReply): OpenClawGatewayReply {
  if (reply.reply?.content) {
    return reply;
  }

  return {
    ...reply,
    reply: {
      content: OPENCLAW_FAILURE_FALLBACK_REPLY
    }
  };
}

async function postAndPersistAgentReply(input: {
  database: SqliteDatabase;
  discord?: DiscordOutboundAdapter;
  routingAgentId: string;
  channelId: string;
  originatingDiscordMessageId: string;
  originatingMessageId: string;
  session: ConversationSession;
  openClaw: OpenClawGatewayReply;
}): Promise<PersistedMessage> {
  if (!input.discord) {
    throw new Error("Discord outbound adapter is required to post OpenClaw replies");
  }

  const replyContent = input.openClaw.reply?.content;
  if (!replyContent) {
    throw new Error("OpenClaw reply content is required before posting to Discord");
  }

  const sentMessage = await input.discord.sendMessage({
    channelId: input.channelId,
    content: replyContent,
    metadata: {
      originatingDiscordMessageId: input.originatingDiscordMessageId,
      sessionId: input.session.id,
      agentId: input.routingAgentId
    }
  });

  return persistAgentReplyMessage(input.database, {
    discordMessageId: sentMessage.id,
    channelId: sentMessage.channelId,
    agentId: input.routingAgentId,
    session: input.session,
    originatingMessageId: input.originatingMessageId,
    content: replyContent,
    openClaw: input.openClaw
  });
}
