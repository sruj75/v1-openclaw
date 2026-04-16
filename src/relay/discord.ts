import { persistClassifiedMessage, type PersistedMessage } from "../db/messages.js";
import { resolveChannelRouting } from "../db/routing.js";
import type { SqliteDatabase } from "../db/sqlite.js";
import { normalizeDiscordMessagePayload } from "../discord/index.js";
import type { OpenClawGatewayReply } from "../openclaw/index.js";
import { classifyDiscordMessage, type ClassifiedDiscordMessage } from "./classification.js";

export type ProcessDiscordMessageDependencies = {
  database: SqliteDatabase;
  openClaw: {
    sendMessage(event: ClassifiedDiscordMessage["event"]): Promise<OpenClawGatewayReply>;
  };
};

export type ProcessedDiscordMessage = {
  classified: ClassifiedDiscordMessage;
  persisted: PersistedMessage;
  openClaw: OpenClawGatewayReply | null;
};

export async function processDiscordMessagePayload(
  payload: unknown,
  dependencies: ProcessDiscordMessageDependencies
): Promise<ProcessedDiscordMessage> {
  const event = normalizeDiscordMessagePayload(payload);
  const routing = resolveChannelRouting(dependencies.database, event.channelId);
  const classified = classifyDiscordMessage(event, routing);
  const persisted = persistClassifiedMessage(dependencies.database, classified);
  const openClaw = classified.shouldForwardToOpenClaw
    ? await dependencies.openClaw.sendMessage(event)
    : null;

  return {
    classified,
    persisted,
    openClaw
  };
}
