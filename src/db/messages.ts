import type { ClassifiedDiscordMessage } from "../relay/classification.js";
import type { SqliteDatabase } from "./sqlite.js";

export type PersistedMessage = {
  id: string;
  discordMessageId: string;
  messageType: string;
  role: string;
};

export function persistClassifiedMessage(
  database: SqliteDatabase,
  message: ClassifiedDiscordMessage
): PersistedMessage {
  const messageId = `discord_${message.event.id}`;
  const routing = message.routing;

  database
    .prepare(
      `
      INSERT INTO messages (
        id,
        discord_message_id,
        channel_id,
        user_id,
        expert_id,
        agent_id,
        session_id,
        role,
        message_type,
        content,
        raw_event_json
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
      ON CONFLICT(discord_message_id) DO UPDATE SET
        channel_id = excluded.channel_id,
        user_id = excluded.user_id,
        expert_id = excluded.expert_id,
        agent_id = excluded.agent_id,
        role = excluded.role,
        message_type = excluded.message_type,
        content = excluded.content,
        raw_event_json = excluded.raw_event_json
      `
    )
    .run(
      messageId,
      message.event.id,
      message.event.channelId,
      message.role === "user" ? routing?.user.id ?? null : null,
      message.role === "expert" ? routing?.expert.id ?? null : null,
      routing?.agent.id ?? null,
      message.role,
      message.messageType,
      message.event.content,
      JSON.stringify({
        normalized: message.event,
        raw: message.event.rawEvent
      })
    );

  return {
    id: messageId,
    discordMessageId: message.event.id,
    messageType: message.messageType,
    role: message.role
  };
}
