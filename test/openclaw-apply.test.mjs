import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { parseOpenClawApplyArgs, runOpenClawApply } from "../dist/openclaw/apply.js";

test("parses the public openclaw:apply latest and pinned command shapes", () => {
  assert.deepEqual(
    parseOpenClawApplyArgs(["--braintrust-slug", "intentive-runtime-bundle", "--latest"]),
    {
      braintrustSlug: "intentive-runtime-bundle",
      latest: true
    }
  );

  assert.deepEqual(
    parseOpenClawApplyArgs([
      "--braintrust-slug",
      "intentive-runtime-bundle",
      "--braintrust-version",
      "version-pinned-37"
    ]),
    {
      braintrustSlug: "intentive-runtime-bundle",
      braintrustVersion: "version-pinned-37"
    }
  );
});

test("fetches the latest bundle and applies it to every registry workspace and config target", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-apply-"));

  try {
    const firstWorkspace = join(root, "agents", "alex", "workspace");
    const secondWorkspace = join(root, "agents", "mia", "workspace");
    const registryPath = join(root, "openclaw-workspaces.json");
    const configPath = join(root, "openclaw.json");
    const calls = [];
    const output = [];

    await mkdir(firstWorkspace, { recursive: true });
    await mkdir(secondWorkspace, { recursive: true });
    await writeFile(registryPath, JSON.stringify({ workspaces: [firstWorkspace, secondWorkspace], config: configPath }), "utf8");
    await writeFile(join(firstWorkspace, "AGENTS.md"), ["# Alex", ""].join("\n"), "utf8");
    await writeFile(join(secondWorkspace, "AGENTS.md"), ["# Mia", ""].join("\n"), "utf8");
    await writeFile(
      configPath,
      JSON.stringify({
        agents: {
          defaults: {
            model: "unchanged",
            heartbeat: {
              enabled: false
            }
          }
        }
      }),
      "utf8"
    );

    const result = await runOpenClawApply(
      {
        braintrustSlug: "intentive-runtime-bundle",
        latest: true,
        registryPath,
        appliedAt: new Date("2026-04-20T09:00:00.000Z"),
        env: {
          BRAINTRUST_API_KEY: "test-api-key"
        }
      },
      {
        client: {
          async fetchLatestBundle(request) {
            calls.push(request);
            return {
              slug: "intentive-runtime-bundle",
              versionId: "version-latest-37",
              content: [
                "## File: AGENTS.md",
                "",
                "Shared runtime guidance.",
                "",
                "## Config: openclaw",
                "",
                JSON.stringify({
                  agents: {
                    defaults: {
                      heartbeat: {
                        enabled: true,
                        cadence: "30m"
                      }
                    }
                  }
                })
              ].join("\n")
            };
          }
        },
        writeLine(line) {
          output.push(line);
        }
      }
    );

    assert.deepEqual(calls, [
      {
        apiKey: "test-api-key",
        slug: "intentive-runtime-bundle"
      }
    ]);
    assert.equal(result.resolvedVersionId, "version-latest-37");
    assert.match(await readFile(join(firstWorkspace, "AGENTS.md"), "utf8"), /Shared runtime guidance/);
    assert.match(await readFile(join(secondWorkspace, "AGENTS.md"), "utf8"), /Shared runtime guidance/);
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")).agents.defaults.heartbeat, {
      enabled: true,
      cadence: "30m"
    });
    assert.deepEqual(output, [
      "Resolved Braintrust version: version-latest-37",
      `changed file: ${join(firstWorkspace, "AGENTS.md")}`,
      `changed file: ${join(secondWorkspace, "AGENTS.md")}`,
      `changed config: ${configPath}`
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fetches a pinned bundle version and allows config-only bundles", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-apply-"));

  try {
    const workspace = join(root, "agents", "alex", "workspace");
    const registryPath = join(root, "openclaw-workspaces.json");
    const configPath = join(root, "openclaw.json");
    const calls = [];

    await mkdir(workspace, { recursive: true });
    await writeFile(registryPath, JSON.stringify({ workspaces: [workspace], config: configPath }), "utf8");
    await writeFile(join(workspace, "AGENTS.md"), ["# Alex", ""].join("\n"), "utf8");
    await writeFile(
      configPath,
      JSON.stringify({
        agents: {
          defaults: {
            heartbeat: {
              enabled: false
            }
          }
        }
      }),
      "utf8"
    );

    const result = await runOpenClawApply(
      {
        braintrustSlug: "intentive-runtime-bundle",
        braintrustVersion: "version-pinned-37",
        registryPath,
        env: {
          BRAINTRUST_API_KEY: "test-api-key"
        }
      },
      {
        client: {
          async fetchVersionedBundle(request) {
            calls.push(request);
            return {
              slug: "intentive-runtime-bundle",
              versionId: "version-pinned-37",
              content: [
                "## Config: openclaw",
                "",
                JSON.stringify({
                  agents: {
                    defaults: {
                      heartbeat: {
                        enabled: true
                      }
                    }
                  }
                })
              ].join("\n")
            };
          }
        },
        writeLine() {}
      }
    );

    assert.deepEqual(calls, [
      {
        apiKey: "test-api-key",
        slug: "intentive-runtime-bundle",
        versionId: "version-pinned-37"
      }
    ]);
    assert.deepEqual(result.targets, [
      {
        kind: "config",
        path: configPath,
        changed: true
      }
    ]);
    assert.equal(await readFile(join(workspace, "AGENTS.md"), "utf8"), ["# Alex", ""].join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validates every file and config target before writing any changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-apply-"));

  try {
    const workspace = join(root, "agents", "alex", "workspace");
    const registryPath = join(root, "openclaw-workspaces.json");
    const configPath = join(root, "openclaw.json");
    const originalAgents = ["# Alex", ""].join("\n");
    const originalConfig = JSON.stringify({
      agents: {
        defaults: {
          heartbeat: {
            enabled: false
          }
        }
      }
    });

    await mkdir(workspace, { recursive: true });
    await writeFile(registryPath, JSON.stringify({ workspaces: [workspace], config: configPath }), "utf8");
    await writeFile(join(workspace, "AGENTS.md"), originalAgents, "utf8");
    await writeFile(configPath, originalConfig, "utf8");

    await assert.rejects(
      runOpenClawApply(
        {
          braintrustSlug: "intentive-runtime-bundle",
          latest: true,
          registryPath,
          appliedAt: new Date("2026-04-20T09:00:00.000Z"),
          env: {
            BRAINTRUST_API_KEY: "test-api-key"
          }
        },
        {
          client: {
            async fetchLatestBundle() {
              return {
                slug: "intentive-runtime-bundle",
                versionId: "version-invalid-37",
                content: [
                  "## File: AGENTS.md",
                  "",
                  "This must not be written.",
                  "",
                  "## Config: openclaw",
                  "",
                  JSON.stringify({
                    agents: {
                      defaults: {
                        heartbeat: {
                          enabled: true,
                          token: "not-allowed"
                        }
                      }
                    }
                  })
                ].join("\n")
              };
            }
          },
          writeLine() {}
        }
      ),
      /disallowed sensitive key/
    );

    assert.equal(await readFile(join(workspace, "AGENTS.md"), "utf8"), originalAgents);
    assert.equal(await readFile(configPath, "utf8"), originalConfig);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
