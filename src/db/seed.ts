import type { SqliteDatabase } from "./sqlite.js";
import { PHASE_1_SCHEMA_SQL } from "./schema.js";

export type SeedUser = {
  id: string;
  discordUserId: string;
  displayName: string;
  status?: string;
};

export type SeedExpert = {
  id: string;
  discordUserId: string;
  displayName: string;
  status?: string;
};

export type SeedAgent = {
  id: string;
  openClawAgentId: string;
  workspacePath: string;
  status?: string;
};

export type SeedUserAssignment = {
  id: string;
  userId: string;
  expertId: string;
  agentId: string;
  discordChannelId: string;
  active?: boolean;
};

export type RoutingSeedInput = {
  users: SeedUser[];
  experts: SeedExpert[];
  agents: SeedAgent[];
  userAssignments: SeedUserAssignment[];
};

export class SeedValidationError extends Error {
  constructor(readonly errors: string[]) {
    super(`Invalid routing seed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
    this.name = "SeedValidationError";
  }
}

export function parseRoutingSeed(json: string): RoutingSeedInput {
  const value = JSON.parse(json) as unknown;
  validateRoutingSeed(value);
  return value;
}

export function validateRoutingSeed(value: unknown): asserts value is RoutingSeedInput {
  const errors: string[] = [];
  const seed = value as Partial<RoutingSeedInput>;

  validateList("users", seed.users, ["id", "discordUserId", "displayName"], errors);
  validateList("experts", seed.experts, ["id", "discordUserId", "displayName"], errors);
  validateList("agents", seed.agents, ["id", "openClawAgentId", "workspacePath"], errors);
  validateList(
    "userAssignments",
    seed.userAssignments,
    ["id", "userId", "expertId", "agentId", "discordChannelId"],
    errors
  );

  if (errors.length === 0) {
    validateUnique("users.id", seed.users?.map((user) => user.id), errors);
    validateUnique("users.discordUserId", seed.users?.map((user) => user.discordUserId), errors);
    validateUnique("experts.id", seed.experts?.map((expert) => expert.id), errors);
    validateUnique(
      "experts.discordUserId",
      seed.experts?.map((expert) => expert.discordUserId),
      errors
    );
    validateUnique("agents.id", seed.agents?.map((agent) => agent.id), errors);
    validateUnique(
      "agents.openClawAgentId",
      seed.agents?.map((agent) => agent.openClawAgentId),
      errors
    );
    validateUnique(
      "userAssignments.id",
      seed.userAssignments?.map((assignment) => assignment.id),
      errors
    );
    validateUnique(
      "userAssignments.discordChannelId",
      seed.userAssignments?.map((assignment) => assignment.discordChannelId),
      errors
    );
    validateAssignmentReferences(seed as RoutingSeedInput, errors);
  }

  if (errors.length > 0) {
    throw new SeedValidationError(errors);
  }
}

export function applyPhase1Schema(database: SqliteDatabase): void {
  database.exec(PHASE_1_SCHEMA_SQL);
}

export function seedRoutingAssignments(database: SqliteDatabase, seed: RoutingSeedInput): void {
  validateRoutingSeed(seed);
  applyPhase1Schema(database);

  const insertUser = database.prepare(`
    INSERT INTO users (id, discord_user_id, display_name, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      discord_user_id = excluded.discord_user_id,
      display_name = excluded.display_name,
      status = excluded.status
  `);

  const insertExpert = database.prepare(`
    INSERT INTO experts (id, discord_user_id, display_name, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      discord_user_id = excluded.discord_user_id,
      display_name = excluded.display_name,
      status = excluded.status
  `);

  const insertAgent = database.prepare(`
    INSERT INTO agents (id, openclaw_agent_id, workspace_path, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      openclaw_agent_id = excluded.openclaw_agent_id,
      workspace_path = excluded.workspace_path,
      status = excluded.status
  `);

  const insertAssignment = database.prepare(`
    INSERT INTO user_assignments (
      id,
      user_id,
      expert_id,
      agent_id,
      discord_channel_id,
      active
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      expert_id = excluded.expert_id,
      agent_id = excluded.agent_id,
      discord_channel_id = excluded.discord_channel_id,
      active = excluded.active
  `);

  database.exec("BEGIN;");
  try {
    for (const user of seed.users) {
      insertUser.run(user.id, user.discordUserId, user.displayName, user.status ?? "active");
    }

    for (const expert of seed.experts) {
      insertExpert.run(expert.id, expert.discordUserId, expert.displayName, expert.status ?? "active");
    }

    for (const agent of seed.agents) {
      insertAgent.run(agent.id, agent.openClawAgentId, agent.workspacePath, agent.status ?? "active");
    }

    for (const assignment of seed.userAssignments) {
      insertAssignment.run(
        assignment.id,
        assignment.userId,
        assignment.expertId,
        assignment.agentId,
        assignment.discordChannelId,
        assignment.active === false ? 0 : 1
      );
    }

    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
}

function validateList(
  listName: string,
  value: unknown,
  requiredFields: string[],
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${listName} must be a non-empty array`);
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${listName}[${index}] must be an object`);
      return;
    }

    for (const field of requiredFields) {
      const fieldValue = item[field];
      if (typeof fieldValue !== "string" || fieldValue.trim() === "") {
        errors.push(`${listName}[${index}].${field} must be a non-empty string`);
      }
    }
  });
}

function validateUnique(label: string, values: string[] | undefined, errors: string[]): void {
  const seen = new Set<string>();

  for (const value of values ?? []) {
    if (seen.has(value)) {
      errors.push(`${label} contains duplicate value ${value}`);
    }

    seen.add(value);
  }
}

function validateAssignmentReferences(seed: RoutingSeedInput, errors: string[]): void {
  const userIds = new Set(seed.users.map((user) => user.id));
  const expertIds = new Set(seed.experts.map((expert) => expert.id));
  const agentIds = new Set(seed.agents.map((agent) => agent.id));

  for (const assignment of seed.userAssignments) {
    if (!userIds.has(assignment.userId)) {
      errors.push(`assignment ${assignment.id} references unknown user ${assignment.userId}`);
    }

    if (!expertIds.has(assignment.expertId)) {
      errors.push(`assignment ${assignment.id} references unknown expert ${assignment.expertId}`);
    }

    if (!agentIds.has(assignment.agentId)) {
      errors.push(`assignment ${assignment.id} references unknown agent ${assignment.agentId}`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
