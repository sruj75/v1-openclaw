import type { SqliteDatabase } from "./sqlite.js";

export type ContextTarget = {
  agentId?: string;
  assignmentId?: string;
};

export type SetContextMetadataInput = ContextTarget & {
  contextVersion: string;
  updatedBy?: string;
};

export type ContextMetadataRecord = {
  targetType: "agent" | "assignment";
  agentId: string;
  contextVersion: string;
  contextUpdateMode: string;
  contextUpdatedAt: string;
  contextUpdatedBy: string | null;
};

export class ContextMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContextMetadataError";
  }
}

export function applyContextMetadataSchema(database: SqliteDatabase): void {
  ensureColumn(database, "agents", "context_version", "TEXT");
  ensureColumn(database, "agents", "context_update_mode", "TEXT");
  ensureColumn(database, "agents", "context_updated_at", "TEXT");
  ensureColumn(database, "agents", "context_updated_by", "TEXT");
}

export function setContextMetadata(
  database: SqliteDatabase,
  input: SetContextMetadataInput
): ContextMetadataRecord {
  const contextVersion = normalizeRequiredText(input.contextVersion, "context-version");
  const updatedBy = normalizeOptionalText(input.updatedBy);
  const target = resolveContextTarget(database, input);

  database
    .prepare(
      `
      UPDATE agents
      SET
        context_version = ?,
        context_update_mode = ?,
        context_updated_at = CURRENT_TIMESTAMP,
        context_updated_by = ?
      WHERE id = ?
      `
    )
    .run(contextVersion, "manual_ssh", updatedBy, target.agentId);

  return getContextMetadata(database, target.agentId, target.targetType);
}

export function getContextMetadata(
  database: SqliteDatabase,
  agentId: string,
  targetType: "agent" | "assignment" = "agent"
): ContextMetadataRecord {
  const row = database
    .prepare(
      `
      SELECT
        id,
        context_version,
        context_update_mode,
        context_updated_at,
        context_updated_by
      FROM agents
      WHERE id = ?
      LIMIT 1
      `
    )
    .get(agentId) as ContextMetadataRow | undefined;

  if (!row) {
    throw new ContextMetadataError(`Unknown agent id ${agentId}.`);
  }

  if (
    typeof row.context_version !== "string" ||
    row.context_version.trim() === "" ||
    typeof row.context_update_mode !== "string" ||
    row.context_update_mode.trim() === "" ||
    typeof row.context_updated_at !== "string" ||
    row.context_updated_at.trim() === ""
  ) {
    throw new ContextMetadataError(`Agent ${agentId} does not have recorded context metadata.`);
  }

  return {
    targetType,
    agentId: row.id,
    contextVersion: row.context_version,
    contextUpdateMode: row.context_update_mode,
    contextUpdatedAt: row.context_updated_at,
    contextUpdatedBy: normalizeOptionalText(row.context_updated_by)
  };
}

export function resolveContextMetadata(
  database: SqliteDatabase,
  agentId: string,
  targetType: "agent" | "assignment" = "agent"
): ContextMetadataRecord | null {
  try {
    return getContextMetadata(database, agentId, targetType);
  } catch (error) {
    if (
      error instanceof ContextMetadataError &&
      error.message === `Agent ${agentId} does not have recorded context metadata.`
    ) {
      return null;
    }

    throw error;
  }
}

type ContextMetadataRow = {
  id: string;
  context_version: string | null;
  context_update_mode: string | null;
  context_updated_at: string | null;
  context_updated_by: string | null;
};

type AssignmentTargetRow = {
  id: string;
  agent_id: string;
  active: number;
};

function resolveContextTarget(
  database: SqliteDatabase,
  input: ContextTarget
): { agentId: string; targetType: "agent" | "assignment" } {
  const hasAgentId = normalizeOptionalText(input.agentId) !== null;
  const hasAssignmentId = normalizeOptionalText(input.assignmentId) !== null;

  if (hasAgentId === hasAssignmentId) {
    throw new ContextMetadataError("Provide exactly one of --agent-id or --assignment-id.");
  }

  if (hasAgentId) {
    const agentId = normalizeOptionalText(input.agentId) as string;
    const row = database
      .prepare(
        `
        SELECT id
        FROM agents
        WHERE id = ?
        LIMIT 1
        `
      )
      .get(agentId) as { id: string } | undefined;

    if (!row) {
      throw new ContextMetadataError(`Unknown agent id ${agentId}.`);
    }

    return { agentId: row.id, targetType: "agent" };
  }

  const assignmentId = normalizeOptionalText(input.assignmentId) as string;
  const row = database
    .prepare(
      `
      SELECT id, agent_id, active
      FROM user_assignments
      WHERE id = ? AND active = 1
      LIMIT 1
      `
    )
    .get(assignmentId) as AssignmentTargetRow | undefined;

  if (!row) {
    throw new ContextMetadataError(`Unknown active assignment id ${assignmentId}.`);
  }

  return { agentId: row.agent_id, targetType: "assignment" };
}

function normalizeRequiredText(value: string, label: string): string {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    throw new ContextMetadataError(`${label} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value: string | undefined | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function ensureColumn(
  database: SqliteDatabase,
  tableName: string,
  columnName: string,
  columnType: string
): void {
  const hasColumn = database
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  if (hasColumn.some((column) => column.name === columnName)) {
    return;
  }

  database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType};`);
}
