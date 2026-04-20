import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { applyBraintrustBundleOpenClawConfig } from "../dist/openclaw/config-apply.js";

test("applies an allowlisted heartbeat config section through the workspace registry config path", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-config-"));

  try {
    const registryPath = join(root, "openclaw-workspaces.json");
    const configPath = join(root, "openclaw.json");

    await writeFile(
      registryPath,
      JSON.stringify({
        workspaces: [join(root, "agents", "alex", "workspace")],
        config: configPath
      }),
      "utf8"
    );
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
        },
        auth: {
          token: "operator-owned"
        }
      }),
      "utf8"
    );

    await applyBraintrustBundleOpenClawConfig({
      bundle: {
        slug: "intentive-runtime",
        resolvedVersionId: "bt-version-13",
        content: [
          "## Config: openclaw",
          "",
          JSON.stringify(
            {
              agents: {
                defaults: {
                  heartbeat: {
                    enabled: true,
                    cadence: "30m",
                    activeHours: {
                      start: "09:00",
                      end: "21:00",
                      timezone: "Asia/Kolkata"
                    },
                    prompt: "Check in with warmth.",
                    policy: {
                      skipWhenUserActive: true
                    }
                  }
                }
              }
            },
            null,
            2
          )
        ].join("\n")
      },
      registryPath
    });

    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")), {
      agents: {
        defaults: {
          model: "unchanged",
          heartbeat: {
            enabled: true,
            cadence: "30m",
            activeHours: {
              start: "09:00",
              end: "21:00",
              timezone: "Asia/Kolkata"
            },
            prompt: "Check in with warmth.",
            policy: {
              skipWhenUserActive: true
            }
          }
        }
      },
      auth: {
        token: "operator-owned"
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects disallowed OpenClaw config keys before writing", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-config-"));

  try {
    const registryPath = join(root, "openclaw-workspaces.json");
    const configPath = join(root, "openclaw.json");
    const originalConfig = JSON.stringify({
      agents: {
        defaults: {
          heartbeat: {
            enabled: false
          }
        }
      },
      auth: {
        token: "operator-owned"
      }
    });

    await writeFile(
      registryPath,
      JSON.stringify({
        workspaces: [join(root, "agents", "alex", "workspace")],
        config: configPath
      }),
      "utf8"
    );
    await writeFile(configPath, originalConfig, "utf8");

    await assert.rejects(
      applyBraintrustBundleOpenClawConfig({
        bundle: {
          slug: "intentive-runtime",
          resolvedVersionId: "bt-version-14",
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
              },
              auth: {
                token: "bundle-owned"
              }
            })
          ].join("\n")
        },
        registryPath
      }),
      /OpenClaw config patch contains disallowed sensitive key: auth/
    );

    assert.equal(await readFile(configPath, "utf8"), originalConfig);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects secret and routing shaped keys inside the allowlisted heartbeat subtree", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-config-"));

  try {
    const registryPath = join(root, "openclaw-workspaces.json");
    const configPath = join(root, "openclaw.json");
    const originalConfig = JSON.stringify({
      agents: {
        defaults: {
          heartbeat: {
            enabled: false
          }
        }
      }
    });

    await writeFile(
      registryPath,
      JSON.stringify({
        workspaces: [join(root, "agents", "alex", "workspace")],
        config: configPath
      }),
      "utf8"
    );
    await writeFile(configPath, originalConfig, "utf8");

    await assert.rejects(
      applyBraintrustBundleOpenClawConfig({
        bundle: {
          slug: "intentive-runtime",
          resolvedVersionId: "bt-version-15",
          content: [
            "## Config: openclaw",
            "",
            JSON.stringify({
              agents: {
                defaults: {
                  heartbeat: {
                    enabled: true,
                    credentials: {
                      token: "bundle-owned"
                    }
                  }
                }
              }
            })
          ].join("\n")
        },
        registryPath
      }),
      /OpenClaw config patch contains disallowed sensitive key: agents.defaults.heartbeat.credentials/
    );

    assert.equal(await readFile(configPath, "utf8"), originalConfig);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects invalid or duplicate OpenClaw config sections before writing", async () => {
  const cases = [
    {
      name: "invalid JSON",
      content: ["## Config: openclaw", "", "{ not json"].join("\n"),
      message: /Braintrust openclaw config section must be valid JSON/
    },
    {
      name: "duplicate config sections",
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
        }),
        "",
        "## Config: openclaw",
        "",
        JSON.stringify({
          agents: {
            defaults: {
              heartbeat: {
                enabled: false
              }
            }
          }
        })
      ].join("\n"),
      message: /duplicate ## Config: openclaw sections/
    },
    {
      name: "non-object heartbeat patch",
      content: [
        "## Config: openclaw",
        "",
        JSON.stringify({
          agents: {
            defaults: {
              heartbeat: true
            }
          }
        })
      ].join("\n"),
      message: /OpenClaw config patch requires agents\.defaults\.heartbeat to be a JSON object/
    }
  ];

  for (const invalidCase of cases) {
    const root = await mkdtemp(join(tmpdir(), "openclaw-config-"));

    try {
      const registryPath = join(root, "openclaw-workspaces.json");
      const configPath = join(root, "openclaw.json");
      const originalConfig = JSON.stringify({
        agents: {
          defaults: {
            heartbeat: {
              enabled: false
            }
          }
        }
      });

      await writeFile(
        registryPath,
        JSON.stringify({
          workspaces: [join(root, "agents", "alex", "workspace")],
          config: configPath
        }),
        "utf8"
      );
      await writeFile(configPath, originalConfig, "utf8");

      await assert.rejects(
        applyBraintrustBundleOpenClawConfig({
          bundle: {
            slug: "intentive-runtime",
            resolvedVersionId: "bt-version-15",
            content: invalidCase.content
          },
          registryPath
        }),
        invalidCase.message,
        invalidCase.name
      );

      assert.equal(await readFile(configPath, "utf8"), originalConfig);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("rejects a registry without an OpenClaw config path", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-config-"));

  try {
    const registryPath = join(root, "openclaw-workspaces.json");

    await writeFile(
      registryPath,
      JSON.stringify({
        workspaces: [join(root, "agents", "alex", "workspace")]
      }),
      "utf8"
    );

    await assert.rejects(
      applyBraintrustBundleOpenClawConfig({
        bundle: {
          slug: "intentive-runtime",
          resolvedVersionId: "bt-version-16",
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
        },
        registryPath
      }),
      /OpenClaw config path is required/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
