import {
  findPersistedMessageByDiscordId,
  persistAgentReplyMessage,
  persistClassifiedMessage,
  type PersistedMessage,
  type RuntimePersistenceMetadata
} from "../db/messages.js";
import { resolveContextMetadata } from "../db/context.js";
import { resolveChannelRouting } from "../db/routing.js";
import { getOrCreateConversationSession, type ConversationSession } from "../db/sessions.js";
import type { SqliteDatabase } from "../db/sqlite.js";
import { type DiscordOutboundAdapter, normalizeDiscordMessagePayload } from "../discord/index.js";
import type { NormalizedDiscordEvent } from "../discord/index.js";
import { classifyDiscordMessage, type ClassifiedDiscordMessage } from "./classification.js";

export type AgentRuntimeReply = {
  status: "ok" | "not_configured" | "failed";
  message?: string;
  reply?: {
    content: string;
    runtimeMessageId?: string;
  };
  traceId?: string;
  providerResponseId?: string;
};

export type AgentRuntimeRequest = {
  agentId: string;
  sessionKey: string;
  message: string;
  metadata: AgentRuntimeRequestMetadata;
};

export type AgentRuntimeRequestMetadata = {
  discordMessageId: string;
  discordChannelId: string;
  userId: string;
  expertId: string;
  assignmentId: string;
  environment?: string | null;
  context_version?: string | null;
  context_update_mode?: string | null;
  session_id?: string | null;
  user_id?: string | null;
  expert_id?: string | null;
  agent_id?: string | null;
  assignment_id?: string | null;
  discord_channel_id?: string | null;
};

export type AgentRuntimeClient = {
  sendUserMessage(request: AgentRuntimeRequest): Promise<AgentRuntimeReply>;
};

export type ProcessDiscordMessageDependencies = {
  database: SqliteDatabase;
  openClaw: AgentRuntimeClient;
  discord?: DiscordOutboundAdapter;
  discordSelfUserId?: string;
  environment?: string;
};

export type ProcessedDiscordMessage = {
  classified: ClassifiedDiscordMessage;
  persisted: PersistedMessage;
  agentReply: PersistedMessage | null;
  session: ConversationSession | null;
  openClaw: AgentRuntimeReply | null;
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
  const contextMetadata = classified.shouldForwardToOpenClaw && routing
    ? resolveContextMetadata(dependencies.database, routing.agent.id)
    : null;
  const environment = dependencies.environment ?? process.env.NODE_ENV ?? "test";
  const persisted = persistClassifiedMessage(dependencies.database, classified, {
    session,
    contextMetadata,
    environment
  });
  const openClaw = classified.shouldForwardToOpenClaw && routing && session
    ? await sendToOpenClawWithFailureCapture(dependencies.openClaw, {
        agentId: routing.agent.openClawAgentId,
        sessionKey: session.openClawSessionKey,
        message: event.content,
        metadata: {
          discordMessageId: event.id,
          discordChannelId: event.channelId,
          userId: routing.user.id,
          expertId: routing.expert.id,
          assignmentId: routing.assignmentId,
          environment: dependencies.environment ?? process.env.NODE_ENV ?? "test",
          context_version: contextMetadata?.contextVersion ?? null,
          context_update_mode: contextMetadata?.contextUpdateMode ?? null,
          session_id: session.id,
          user_id: routing.user.id,
          expert_id: routing.expert.id,
          agent_id: routing.agent.id,
          assignment_id: routing.assignmentId,
          discord_channel_id: event.channelId
        }
      })
    : null;
  const updatedPersisted = openClaw
    ? persistClassifiedMessage(dependencies.database, classified, {
        session,
        runtime: toRuntimePersistenceMetadata(openClaw),
        contextMetadata,
        environment
      })
    : persisted;
  const agentReply = openClaw?.reply && routing && session && dependencies.discord
    ? await postAndPersistAgentReply({
        database: dependencies.database,
        discord: dependencies.discord,
        routingAgentId: routing.agent.id,
        channelId: event.channelId,
        originatingDiscordMessageId: event.id,
        originatingMessageId: updatedPersisted.id,
        session,
        openClaw
      })
    : null;

  return {
    classified,
    persisted: updatedPersisted,
    agentReply,
    session,
    openClaw,
    duplicate: false
  };
}

async function sendToOpenClawWithFailureCapture(
  openClaw: AgentRuntimeClient,
  request: AgentRuntimeRequest
): Promise<AgentRuntimeReply> {
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

function withFallbackReply(reply: AgentRuntimeReply): AgentRuntimeReply {
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
  discord: DiscordOutboundAdapter;
  routingAgentId: string;
  channelId: string;
  originatingDiscordMessageId: string;
  originatingMessageId: string;
  session: ConversationSession;
  openClaw: AgentRuntimeReply;
}): Promise<PersistedMessage> {
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
    runtime: toRuntimePersistenceMetadata(input.openClaw)
  });
}

function toRuntimePersistenceMetadata(reply: AgentRuntimeReply): RuntimePersistenceMetadata {
  return {
    status: reply.status,
    message: reply.message,
    replyContent: reply.reply?.content,
    runtimeMessageId: reply.reply?.runtimeMessageId,
    traceId: reply.traceId,
    providerResponseId: reply.providerResponseId
  };
}
