import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { parseOpenClawApplyArgs, runOpenClawApply } from "../dist/openclaw/apply.js";

test("parses the public openclaw:apply Langfuse label, latest, and pinned command shapes", () => {
  assert.deepEqual(
    parseOpenClawApplyArgs(["--langfuse-prompt", "intentive-runtime-bundle", "--langfuse-label", "production"]),
    {
      langfusePrompt: "intentive-runtime-bundle",
      langfuseLabel: "production"
    }
  );

  assert.deepEqual(
    parseOpenClawApplyArgs(["--langfuse-prompt", "intentive-runtime-bundle", "--latest"]),
    {
      langfusePrompt: "intentive-runtime-bundle",
      latest: true
    }
  );

  assert.deepEqual(
    parseOpenClawApplyArgs([
      "--langfuse-prompt",
      "intentive-runtime-bundle",
      "--langfuse-version",
      "37"
    ]),
    {
      langfusePrompt: "intentive-runtime-bundle",
      langfuseVersion: "37"
    }
  );

  assert.throws(
    () => parseOpenClawApplyArgs(["--braintrust-slug", "intentive-runtime-bundle", "--latest"]),
    /Unknown openclaw:apply argument: --braintrust-slug/
  );
  assert.throws(
    () => parseOpenClawApplyArgs(["--langfuse-prompt", "intentive-runtime-bundle"]),
    /openclaw:apply requires exactly one of --langfuse-label, --latest, or --langfuse-version/
  );
  assert.throws(
    () =>
      parseOpenClawApplyArgs([
        "--langfuse-prompt",
        "intentive-runtime-bundle",
        "--langfuse-label",
        "production",
        "--latest"
      ]),
    /openclaw:apply requires exactly one of --langfuse-label, --latest, or --langfuse-version/
  );
  assert.throws(
    () => parseOpenClawApplyArgs(["--langfuse-prompt", " ", "--langfuse-label", "production"]),
    /openclaw:apply requires --langfuse-prompt <prompt-name>/
  );
});

test("fetches a Langfuse prompt by label and applies every file and config target across registered workspaces", async () => {
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
    await writeFile(join(firstWorkspace, "HEARTBEAT.md"), ["# Alex heartbeat", ""].join("\n"), "utf8");
    await writeFile(join(secondWorkspace, "AGENTS.md"), ["# Mia", ""].join("\n"), "utf8");
    await writeFile(join(secondWorkspace, "HEARTBEAT.md"), ["# Mia heartbeat", ""].join("\n"), "utf8");
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
        langfusePrompt: "intentive-runtime-bundle",
        langfuseLabel: "production",
        registryPath,
        appliedAt: new Date("2026-04-20T09:00:00.000Z"),
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {
          async fetchPromptByLabel(request) {
            calls.push(request);
            return {
              name: "intentive-runtime-bundle",
              version: 37,
              prompt: [
                "## File: AGENTS.md",
                "",
                "Shared runtime guidance.",
                "",
                "## File: HEARTBEAT.md",
                "",
                "Shared proactive guidance.",
                "",
                "## Config: openclaw",
                "",
                JSON.stringify({
                  agents: {
                    defaults: {
                      heartbeat: {
                        prompt: "Use HEARTBEAT.md for proactive guidance."
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
        publicKey: "test-public-key",
        secretKey: "test-secret-key",
        promptName: "intentive-runtime-bundle",
        label: "production"
      }
    ]);
    assert.equal(result.resolvedVersionId, "37");
    const firstAgents = await readFile(join(firstWorkspace, "AGENTS.md"), "utf8");
    const firstHeartbeat = await readFile(join(firstWorkspace, "HEARTBEAT.md"), "utf8");
    const secondAgents = await readFile(join(secondWorkspace, "AGENTS.md"), "utf8");
    const secondHeartbeat = await readFile(join(secondWorkspace, "HEARTBEAT.md"), "utf8");
    assert.match(firstAgents, /Shared runtime guidance/);
    assert.match(secondAgents, /Shared runtime guidance/);
    assert.match(firstHeartbeat, /Shared proactive guidance/);
    assert.match(secondHeartbeat, /Shared proactive guidance/);
    assert.doesNotMatch(firstAgents, /## Config: openclaw/);
    assert.doesNotMatch(firstHeartbeat, /## Config: openclaw/);
    assert.doesNotMatch(secondAgents, /## Config: openclaw/);
    assert.doesNotMatch(secondHeartbeat, /## Config: openclaw/);
    assert.doesNotMatch(firstAgents, /Use HEARTBEAT\.md for proactive guidance/);
    assert.doesNotMatch(firstHeartbeat, /Use HEARTBEAT\.md for proactive guidance/);
    assert.doesNotMatch(secondAgents, /Use HEARTBEAT\.md for proactive guidance/);
    assert.doesNotMatch(secondHeartbeat, /Use HEARTBEAT\.md for proactive guidance/);
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")).agents.defaults.heartbeat, {
      enabled: false,
      prompt: "Use HEARTBEAT.md for proactive guidance."
    });
    assert.deepEqual(result.targets, [
      {
        kind: "file",
        path: join(firstWorkspace, "AGENTS.md"),
        changed: true
      },
      {
        kind: "file",
        path: join(firstWorkspace, "HEARTBEAT.md"),
        changed: true
      },
      {
        kind: "file",
        path: join(secondWorkspace, "AGENTS.md"),
        changed: true
      },
      {
        kind: "file",
        path: join(secondWorkspace, "HEARTBEAT.md"),
        changed: true
      },
      {
        kind: "config",
        path: configPath,
        changed: true
      }
    ]);
    assert.deepEqual(output, [
      "Resolved Langfuse prompt version: 37",
      `changed file: ${join(firstWorkspace, "AGENTS.md")}`,
      `changed file: ${join(firstWorkspace, "HEARTBEAT.md")}`,
      `changed file: ${join(secondWorkspace, "AGENTS.md")}`,
      `changed file: ${join(secondWorkspace, "HEARTBEAT.md")}`,
      `changed config: ${configPath}`
    ]);

    const secondOutput = [];
    const secondResult = await runOpenClawApply(
      {
        langfusePrompt: "intentive-runtime-bundle",
        langfuseLabel: "production",
        registryPath,
        appliedAt: new Date("2026-04-20T09:00:00.000Z"),
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {
          async fetchPromptByLabel() {
            return {
              name: "intentive-runtime-bundle",
              version: 37,
              prompt: [
                "## File: AGENTS.md",
                "",
                "Shared runtime guidance.",
                "",
                "## File: HEARTBEAT.md",
                "",
                "Shared proactive guidance.",
                "",
                "## Config: openclaw",
                "",
                JSON.stringify({
                  agents: {
                    defaults: {
                      heartbeat: {
                        prompt: "Use HEARTBEAT.md for proactive guidance."
                      }
                    }
                  }
                })
              ].join("\n")
            };
          }
        },
        writeLine(line) {
          secondOutput.push(line);
        }
      }
    );

    assert.deepEqual(
      secondResult.targets.map((target) => target.changed),
      [false, false, false, false, false]
    );
    assert.deepEqual(secondOutput, [
      "Resolved Langfuse prompt version: 37",
      `unchanged file: ${join(firstWorkspace, "AGENTS.md")}`,
      `unchanged file: ${join(firstWorkspace, "HEARTBEAT.md")}`,
      `unchanged file: ${join(secondWorkspace, "AGENTS.md")}`,
      `unchanged file: ${join(secondWorkspace, "HEARTBEAT.md")}`,
      `unchanged config: ${configPath}`
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fetches a pinned Langfuse prompt version and allows config-only bundles", async () => {
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
        langfusePrompt: "intentive-runtime-bundle",
        langfuseVersion: "37",
        registryPath,
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {
          async fetchPromptByVersion(request) {
            calls.push(request);
            return {
              name: "intentive-runtime-bundle",
              version: 37,
              prompt: [
                "## Config: openclaw",
                "",
                JSON.stringify({
                  agents: {
                    defaults: {
                      heartbeat: {
                        prompt: "Use HEARTBEAT.md for proactive guidance."
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
        publicKey: "test-public-key",
        secretKey: "test-secret-key",
        promptName: "intentive-runtime-bundle",
        version: "37"
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

test("rejects Markdown bundles without supported section headers before writing", async () => {
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
          langfusePrompt: "intentive-runtime-bundle",
          latest: true,
          registryPath,
          env: {
            LANGFUSE_PUBLIC_KEY: "test-public-key",
            LANGFUSE_SECRET_KEY: "test-secret-key"
          }
        },
        {
          client: {
            async fetchPromptByLabel() {
              return {
                name: "intentive-runtime-bundle",
                version: 37,
                prompt: ["# Runtime bundle", "", "No supported rollout sections here."].join("\n")
              };
            }
          },
          writeLine() {}
        }
      ),
      /Runtime bundle must include at least one supported section/
    );

    assert.equal(await readFile(join(workspace, "AGENTS.md"), "utf8"), originalAgents);
    assert.equal(await readFile(configPath, "utf8"), originalConfig);
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
          langfusePrompt: "intentive-runtime-bundle",
          latest: true,
          registryPath,
          appliedAt: new Date("2026-04-20T09:00:00.000Z"),
          env: {
            LANGFUSE_PUBLIC_KEY: "test-public-key",
            LANGFUSE_SECRET_KEY: "test-secret-key"
          }
        },
        {
          client: {
            async fetchPromptByLabel() {
              return {
                name: "intentive-runtime-bundle",
                version: 37,
                prompt: [
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
                          prompt: "Use HEARTBEAT.md for proactive guidance.",
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

test("times out Langfuse REST prompt fetches instead of hanging", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input, init) => {
    calls.push({
      url: String(input),
      signal: init?.signal
    });
    const error = new Error("expired");
    error.name = "TimeoutError";
    throw error;
  };

  try {
    await assert.rejects(
      runOpenClawApply({
        langfusePrompt: "intentive-runtime-bundle",
        langfuseLabel: "production",
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      }),
      /Langfuse prompt fetch timed out after 30000ms/
    );

    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.includes("/api/public/v2/prompts/intentive-runtime-bundle?label=production"));
    assert.ok(calls[0].signal instanceof AbortSignal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
