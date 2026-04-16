import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../dist/config/index.js";
import { createInMemoryRelayStore } from "../dist/db/index.js";
import { createSyntheticNormalizedEvent } from "../dist/discord/index.js";
import { createUnconfiguredOpenClawGateway } from "../dist/openclaw/index.js";
import { createIntentiveRelay } from "../dist/relay/index.js";

test("synthetic normalized events can enter the relay without live credentials", async () => {
  const store = createInMemoryRelayStore();
  const relay = createIntentiveRelay({
    config: loadConfig({ NODE_ENV: "test" }),
    store,
    openClaw: createUnconfiguredOpenClawGateway()
  });

  const result = await relay.submitNormalizedEvent(
    createSyntheticNormalizedEvent({ content: "Can you help me restart?" })
  );

  assert.equal(result.accepted, true);
  assert.equal(result.storedMessage.event.authorRole, "user");
  assert.equal(result.storedMessage.event.content, "Can you help me restart?");
  assert.equal(result.openClaw.status, "not_configured");
  assert.equal((await store.listMessages()).length, 1);
});
