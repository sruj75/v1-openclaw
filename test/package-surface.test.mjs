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

  assert.match(readme, /OpenClaw\s+built-in Discord is the current path/);
  assert.match(readme, /Future WhatsApp/);
  assert.match(phase3Note, /Parent PRD: #31/);
  assert.match(phase3Note, /retires the custom Intentive relay runtime/);

  const activeRuntimeDocs = `${readme}\n${phase3Note}`;
  assert.doesNotMatch(activeRuntimeDocs, /SQLite relay routing as the product runtime/i);
  assert.doesNotMatch(activeRuntimeDocs, /custom Discord ingress as the product runtime/i);
});
