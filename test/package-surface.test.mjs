import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public package surface centers on OpenClaw apply instead of relay runtime scripts", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.deepEqual(Object.keys(packageJson.scripts).sort(), ["build", "openclaw:apply", "test"]);
  assert.match(packageJson.scripts["openclaw:apply"], /dist\/openclaw\/apply\.js/);

  const serializedScripts = JSON.stringify(packageJson.scripts);
  assert.doesNotMatch(serializedScripts, /relay|discord|sqlite|seed:local|smoke:phase1|context:set|dist\/main|dist\/seed|dist\/context/i);
});

test("repo narrative names OpenClaw built-in channels as the runtime path", async () => {
  const readme = await readFile("README.md", "utf8");
  const phase3Note = await readFile("docs/phase3-relay-retirement.md", "utf8");
  const discordRuntimeDoc = await readFile("docs/phase3-openclaw-discord-runtime.md", "utf8");
  const phase4PilotDoc = await readFile("docs/phase4-productized-manual-pilot.md", "utf8");

  assert.match(readme, /OpenClaw\s+built-in Discord is the current path/);
  assert.match(readme, /productized manual pilot/);
  assert.match(readme, /Future WhatsApp/);
  assert.match(readme, /phase3-openclaw-discord-runtime\.md/);
  assert.match(readme, /phase4-productized-manual-pilot\.md/);
  assert.match(phase3Note, /Parent PRD: #31/);
  assert.match(phase3Note, /retires the custom Intentive relay runtime/);
  assert.match(discordRuntimeDoc, /Child issue: #38/);
  assert.match(discordRuntimeDoc, /Do not commit Discord tokens/);
  assert.match(discordRuntimeDoc, /Bind exactly one Discord pilot channel to exactly one OpenClaw user workspace/);
  assert.match(discordRuntimeDoc, /Expert presence must not become agent input/);
  assert.match(discordRuntimeDoc, /OpenRouter Broadcast then\s+sends traces to Langfuse/);
  assert.match(discordRuntimeDoc, /Discord message evidence:/);
  assert.match(discordRuntimeDoc, /OpenClaw reply evidence:/);
  assert.match(discordRuntimeDoc, /Langfuse trace lookup:/);
  assert.match(phase4PilotDoc, /Parent PRD: #42/);
  assert.match(phase4PilotDoc, /Child issue: #43/);
  assert.match(phase4PilotDoc, /two-user pilot week/);
  assert.match(phase4PilotDoc, /one shared expert/);
  assert.match(phase4PilotDoc, /Proactive heartbeat\/check-in behavior is required/);
  assert.match(phase4PilotDoc, /No direct workspace edit path/);
  assert.match(phase4PilotDoc, /not a direct workspace edit/);
  assert.match(phase4PilotDoc, /No custom note allocator/);
  assert.match(phase4PilotDoc, /Langfuse traces, annotation queues where useful, dataset seeds/);
  assert.match(phase4PilotDoc, /experiments where useful/);
  assert.match(phase4PilotDoc, /Live pilot message timestamp:/);
  assert.match(phase4PilotDoc, /Prompt version or label:/);
  assert.match(phase4PilotDoc, /Workspace label:/);
  assert.match(phase4PilotDoc, /Private message content omitted:/);
  assert.match(phase4PilotDoc, /OpenRouter Broadcast to Langfuse confirmed:/);
  assert.match(phase4PilotDoc, /Experiment candidate added: yes\/no\/not useful/);
  assert.match(phase4PilotDoc, /Do not commit or paste private pilot material/);
  assert.match(phase4PilotDoc, /Founder Acceptance Review/);

  const activeRuntimeDocs = `${readme}\n${phase3Note}\n${discordRuntimeDoc}\n${phase4PilotDoc}`;
  assert.match(activeRuntimeDocs, /--langfuse-label production/);
  assert.match(activeRuntimeDocs, /--langfuse-version <number>/);
  assert.match(activeRuntimeDocs, /OpenRouter Broadcast then\s+sends traces to Langfuse/);
  assert.match(activeRuntimeDocs, /Do not add\s+direct Langfuse SDK tracing/);
  assert.doesNotMatch(activeRuntimeDocs, /SQLite relay routing as the product runtime/i);
  assert.doesNotMatch(activeRuntimeDocs, /custom Discord ingress as the product runtime/i);
  assert.doesNotMatch(activeRuntimeDocs, /Braintrust-managed|BRAINTRUST_|--braintrust-|Braintrust trace lookup|Resolved Braintrust version/);
});
