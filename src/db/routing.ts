import type { SqliteDatabase } from "./sqlite.js";

export type ChannelRoutingAssignment = {
  assignmentId: string;
  discordChannelId: string;
  user: {
    id: string;
    discordUserId: string;
    displayName: string;
  };
  expert: {
    id: string;
    discordUserId: string;
    displayName: string;
  };
  agent: {
    id: string;
    openClawAgentId: string;
    workspacePath: string;
  };
};

type ChannelRoutingRow = {
  assignment_id: string;
  discord_channel_id: string;
  user_id: string;
  user_discord_user_id: string;
  user_display_name: string;
  expert_id: string;
  expert_discord_user_id: string;
  expert_display_name: string;
  agent_id: string;
  openclaw_agent_id: string;
  workspace_path: string;
};

export function resolveChannelRouting(
  database: SqliteDatabase,
  discordChannelId: string
): ChannelRoutingAssignment | null {
  const row = database
    .prepare(
      `
      SELECT
        ua.id AS assignment_id,
        ua.discord_channel_id,
        u.id AS user_id,
        u.discord_user_id AS user_discord_user_id,
        u.display_name AS user_display_name,
        e.id AS expert_id,
        e.discord_user_id AS expert_discord_user_id,
        e.display_name AS expert_display_name,
        a.id AS agent_id,
        a.openclaw_agent_id,
        a.workspace_path
      FROM user_assignments ua
      JOIN users u ON u.id = ua.user_id
      JOIN experts e ON e.id = ua.expert_id
      JOIN agents a ON a.id = ua.agent_id
      WHERE ua.discord_channel_id = ? AND ua.active = 1
      LIMIT 1
      `
    )
    .get(discordChannelId) as ChannelRoutingRow | undefined;

  if (!row) {
    return null;
  }

  return {
    assignmentId: row.assignment_id,
    discordChannelId: row.discord_channel_id,
    user: {
      id: row.user_id,
      discordUserId: row.user_discord_user_id,
      displayName: row.user_display_name
    },
    expert: {
      id: row.expert_id,
      discordUserId: row.expert_discord_user_id,
      displayName: row.expert_display_name
    },
    agent: {
      id: row.agent_id,
      openClawAgentId: row.openclaw_agent_id,
      workspacePath: row.workspace_path
    }
  };
}
