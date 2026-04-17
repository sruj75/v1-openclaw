import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { resolveChannelRouting } from "../dist/db/routing.js";
import {
  SeedValidationError,
  seedRoutingAssignments,
  validateRoutingSeed
} from "../dist/db/seed.js";

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

test("seed validation rejects assignments with unknown references", () => {
  assert.throws(
    () =>
      validateRoutingSeed({
        ...seed,
        userAssignments: [
          {
            ...seed.userAssignments[0],
            userId: "missing_user"
          }
        ]
      }),
    (error) =>
      error instanceof SeedValidationError &&
      error.errors.includes(
        "assignment assignment_local_alex_private_channel references unknown user missing_user"
      )
  );
});

test("seed upserts are repeatable and routing lookup reads SQLite", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-routing-"));
  const database = new DatabaseSync(join(tempDir, "routing.sqlite"));

  try {
    seedRoutingAssignments(database, seed);
    seedRoutingAssignments(database, {
      ...seed,
      users: [
        {
          ...seed.users[0],
          displayName: "Alex Demo Updated"
        }
      ]
    });

    const counts = database
      .prepare(
        `
        SELECT
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM experts) AS experts,
          (SELECT COUNT(*) FROM agents) AS agents,
          (SELECT COUNT(*) FROM user_assignments) AS assignments
        `
      )
      .get();

    assert.deepEqual({ ...counts }, {
      users: 1,
      experts: 1,
      agents: 1,
      assignments: 1
    });

    assert.deepEqual(resolveChannelRouting(database, "discord-channel-private-alex"), {
      assignmentId: "assignment_local_alex_private_channel",
      discordChannelId: "discord-channel-private-alex",
      user: {
        id: "user_local_alex",
        discordUserId: "discord-user-local-alex",
        displayName: "Alex Demo Updated"
      },
      expert: {
        id: "expert_local_river",
        discordUserId: "discord-expert-local-river",
        displayName: "River Expert"
      },
      agent: {
        id: "agent_local_alex",
        openClawAgentId: "openclaw-agent-local-alex",
        workspacePath: "/tmp/openclaw/workspaces/alex-demo"
      }
    });

    assert.equal(resolveChannelRouting(database, "unknown-channel"), null);
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("phase 1 migrations apply cleanly in sequence", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "intentive-migrations-"));
  const database = new DatabaseSync(join(tempDir, "migrations.sqlite"));

  try {
    for (const migration of [
      "migrations/001_phase1_persistence.sql",
      "migrations/002_message_routing_audit.sql",
      "migrations/003_agent_reply_link.sql"
    ]) {
      database.exec(await readFile(migration, { encoding: "utf8" }));
    }

    const columns = database
      .prepare("PRAGMA table_info(messages)")
      .all()
      .map((column) => column.name);

    assert.deepEqual(
      [
        "originating_message_id",
        "routing_metadata_json",
        "openclaw_status",
        "openclaw_trace_id",
        "openclaw_provider_response_id"
      ].every((column) => columns.includes(column)),
      true
    );
  } finally {
    database.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
