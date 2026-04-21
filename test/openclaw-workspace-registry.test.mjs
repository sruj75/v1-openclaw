import assert from "node:assert/strict";
import test from "node:test";

import { loadOpenClawWorkspaceRegistry } from "../dist/openclaw/workspace-registry.js";

test("loads the committed OpenClaw workspace registry for Phase 3 rollout", async () => {
  const registry = await loadOpenClawWorkspaceRegistry("openclaw-workspaces.json");

  assert.deepEqual(registry, {
    workspaces: [
      "/home/openclaw/.openclaw/agents/alex/workspace",
      "/home/openclaw/.openclaw/agents/mia/workspace"
    ],
    config: "/home/openclaw/.openclaw/openclaw.json"
  });

  assert.equal(new Set(registry.workspaces).size, registry.workspaces.length);
  assert.ok(registry.workspaces.every((workspace) => workspace.endsWith("/workspace")));
  assert.ok(
    registry.workspaces.every((workspace) => workspace.startsWith("/home/openclaw/.openclaw/agents/"))
  );
  assert.ok(registry.config.endsWith("/openclaw.json"));

  const serializedRegistry = JSON.stringify(registry).toLowerCase();
  assert.doesNotMatch(serializedRegistry, /token|secret|discord|phone|therapist|note/);
});
