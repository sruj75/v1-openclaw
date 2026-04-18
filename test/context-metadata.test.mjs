import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { runContextSetCommand } from "../dist/context.js";
import { ContextMetadataError, resolveContextMetadata } from "../dist/db/context.js";
import { seedRoutingAssignments } from "../dist/db/seed.js";

const seed = {
  users: [
    {
      id: "user_local_alex",
      discordUserId: "discord-user-local-alex",
      displayName: "Alex Demo"
    }
  ],
  experts: [
    {
      id: "expert_local_river",
      discordUserId: "discord-expert-local-river",
      displayName: "River Expert"
    }
  ],
  agents: [
    {
      id: "agent_local_alex",
      openClawAgentId: "openclaw-agent-local-alex",
      workspacePath: "/tmp/openclaw/workspaces/alex-demo"
    }
  ],
  userAssignments: [
    {
      id: "assignment_local_alex_private_channel",
      userId: "user_local_alex",
      expertId: "expert_local_river",
      agentId: "agent_local_alex",
      discordChannelId: "discord-channel-private-alex"
    }
  ]
};

test("manual context metadata can be recorded for an agent", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-context-"));
  const databasePath = join(tempDir, "context.sqlite");
  const database = new DatabaseSync(databasePath);

  try {
    seedRoutingAssignments(database, seed);

    const result = await runContextSetCommand(
      [
        "--agent-id",
        "agent_local_alex",
        "--context-version",
        "alex-week-2026-04-17",
        "--updated-by",
        "Srujan"
      ],
      {
        DATABASE_PATH: databasePath
      }
    );

    assert.equal(result.targetType, "agent");
    assert.equal(result.agentId, "agent_local_alex");
    assert.equal(result.contextVersion, "alex-week-2026-04-17");
    assert.equal(result.contextUpdateMode, "manual_ssh");
    assert.equal(result.contextUpdatedBy, "Srujan");
    assert.equal(typeof result.contextUpdatedAt, "string");
    assert.notEqual(result.contextUpdatedAt.trim(), "");

    const row = database
      .prepare(
        `
        SELECT
          context_version,
          context_update_mode,
          context_updated_at,
          context_updated_by
        FROM agents
        WHERE id = ?
        `
      )
      .get("agent_local_alex");

    assert.deepEqual(
      { ...row },
      {
        context_version: "alex-week-2026-04-17",
        context_update_mode: "manual_ssh",
        context_updated_at: row.context_updated_at,
        context_updated_by: "Srujan"
      }
    );
    assert.equal(typeof row.context_updated_at, "string");
    assert.notEqual(row.context_updated_at.trim(), "");
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("manual context metadata updates overwrite the previous label", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-context-repeat-"));
  const databasePath = join(tempDir, "context.sqlite");
  const database = new DatabaseSync(databasePath);

  try {
    seedRoutingAssignments(database, seed);

    await runContextSetCommand(
      [
        "--assignment-id",
        "assignment_local_alex_private_channel",
        "--context-version",
        "alex-week-2026-04-17",
        "--updated-by",
        "Srujan"
      ],
      {
        DATABASE_PATH: databasePath
      }
    );

    const secondResult = await runContextSetCommand(
      [
        "--assignment-id",
        "assignment_local_alex_private_channel",
        "--context-version",
        "alex-week-2026-04-18",
        "--updated-by",
        "Srujan Day 2"
      ],
      {
        DATABASE_PATH: databasePath
      }
    );

    assert.equal(secondResult.targetType, "assignment");
    assert.equal(secondResult.agentId, "agent_local_alex");
    assert.equal(secondResult.contextVersion, "alex-week-2026-04-18");
    assert.equal(secondResult.contextUpdateMode, "manual_ssh");
    assert.equal(secondResult.contextUpdatedBy, "Srujan Day 2");

    const counts = database
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM agents
        `
      )
      .get();

    assert.equal(counts.count, 1);

    const row = database
      .prepare(
        `
        SELECT
          context_version,
          context_update_mode,
          context_updated_by
        FROM agents
        WHERE id = ?
        `
      )
      .get("agent_local_alex");

    assert.deepEqual({ ...row }, {
      context_version: "alex-week-2026-04-18",
      context_update_mode: "manual_ssh",
      context_updated_by: "Srujan Day 2"
    });
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("manual context metadata rejects an empty context version", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-context-empty-"));
  const databasePath = join(tempDir, "context.sqlite");
  const database = new DatabaseSync(databasePath);

  try {
    seedRoutingAssignments(database, seed);

    await assert.rejects(
      () =>
        runContextSetCommand(
          [
            "--agent-id",
            "agent_local_alex",
            "--context-version",
            "   ",
            "--updated-by",
            "Srujan"
          ],
          {
            DATABASE_PATH: databasePath
          }
        ),
      /context-version is required\./
    );

    const row = database
      .prepare(
        `
        SELECT
          context_version,
          context_update_mode,
          context_updated_at,
          context_updated_by
        FROM agents
        WHERE id = ?
        `
      )
      .get("agent_local_alex");

    assert.deepEqual({ ...row }, {
      context_version: null,
      context_update_mode: null,
      context_updated_at: null,
      context_updated_by: null
    });
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("manual context metadata rejects unknown agent and assignment ids", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-context-missing-"));
  const databasePath = join(tempDir, "context.sqlite");
  const database = new DatabaseSync(databasePath);

  try {
    seedRoutingAssignments(database, seed);

    await assert.rejects(
      () =>
        runContextSetCommand(
          [
            "--agent-id",
            "agent_missing",
            "--context-version",
            "alex-week-2026-04-17"
          ],
          {
            DATABASE_PATH: databasePath
          }
        ),
      /Unknown agent id agent_missing\./
    );

    await assert.rejects(
      () =>
        runContextSetCommand(
          [
            "--assignment-id",
            "assignment_missing",
            "--context-version",
            "alex-week-2026-04-17"
          ],
          {
            DATABASE_PATH: databasePath
          }
        ),
      /Unknown active assignment id assignment_missing\./
    );
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("missing context metadata resolves to null with a stable error code", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-context-resolve-"));
  const database = new DatabaseSync(join(tempDir, "context.sqlite"));

  try {
    seedRoutingAssignments(database, seed);

    assert.equal(resolveContextMetadata(database, "agent_local_alex"), null);
    assert.throws(
      () => resolveContextMetadata(database, "agent_missing"),
      (error) =>
        error instanceof ContextMetadataError &&
        error.code === "unknown_agent" &&
        /Unknown agent id agent_missing\./.test(error.message)
    );
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
