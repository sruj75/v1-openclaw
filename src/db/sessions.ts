import type { ChannelRoutingAssignment } from "./routing.js";
import type { SqliteDatabase } from "./sqlite.js";

export type ConversationSession = {
  id: string;
  userId: string;
  agentId: string;
  discordChannelId: string;
  openClawSessionKey: string;
};

type ConversationSessionRow = {
  id: string;
  user_id: string;
  agent_id: string;
  discord_channel_id: string;
  openclaw_session_key: string;
};

export function getOrCreateConversationSession(
  database: SqliteDatabase,
  routing: ChannelRoutingAssignment
): ConversationSession {
  const sessionId = stableSessionId(routing.discordChannelId, routing.agent.id);
  const sessionKey = `discord:${routing.discordChannelId}:agent:${routing.agent.id}`;

  database
    .prepare(
      `
      INSERT INTO conversation_sessions (
        id,
        user_id,
        agent_id,
        discord_channel_id,
        openclaw_session_key
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        last_seen_at = CURRENT_TIMESTAMP
      `
    )
    .run(sessionId, routing.user.id, routing.agent.id, routing.discordChannelId, sessionKey);

  const row = database
    .prepare(
      `
      SELECT id, user_id, agent_id, discord_channel_id, openclaw_session_key
      FROM conversation_sessions
      WHERE id = ?
      `
    )
    .get(sessionId) as ConversationSessionRow | undefined;

  if (!row) {
    throw new Error(`Failed to create conversation session ${sessionId}`);
  }

  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    discordChannelId: row.discord_channel_id,
    openClawSessionKey: row.openclaw_session_key
  };
}

function stableSessionId(discordChannelId: string, agentId: string): string {
  return `session_${sanitize(discordChannelId)}_${sanitize(agentId)}`;
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
