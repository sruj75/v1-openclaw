import { persistClassifiedMessage, type PersistedMessage } from "../db/messages.js";
import { resolveChannelRouting } from "../db/routing.js";
import { getOrCreateConversationSession, type ConversationSession } from "../db/sessions.js";
import type { SqliteDatabase } from "../db/sqlite.js";
import { normalizeDiscordMessagePayload } from "../discord/index.js";
import type { OpenClawGatewayClient, OpenClawGatewayReply } from "../openclaw/index.js";
import { classifyDiscordMessage, type ClassifiedDiscordMessage } from "./classification.js";

export type ProcessDiscordMessageDependencies = {
  database: SqliteDatabase;
  openClaw: OpenClawGatewayClient;
};

export type ProcessedDiscordMessage = {
  classified: ClassifiedDiscordMessage;
  persisted: PersistedMessage;
  session: ConversationSession | null;
  openClaw: OpenClawGatewayReply | null;
};

export async function processDiscordMessagePayload(
  payload: unknown,
  dependencies: ProcessDiscordMessageDependencies
): Promise<ProcessedDiscordMessage> {
  const event = normalizeDiscordMessagePayload(payload);
  const routing = resolveChannelRouting(dependencies.database, event.channelId);
  const classified = classifyDiscordMessage(event, routing);
  const session = classified.shouldForwardToOpenClaw && routing
    ? getOrCreateConversationSession(dependencies.database, routing)
    : null;
  const openClaw = classified.shouldForwardToOpenClaw && routing && session
    ? await dependencies.openClaw.sendUserMessage({
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

  return {
    classified,
    persisted,
    session,
    openClaw
  };
}
