import { readFile, writeFile } from "node:fs/promises";

import type { BraintrustRuntimeBundle } from "./braintrust-bundle.js";
import { loadOpenClawWorkspaceRegistry } from "./workspace-registry.js";

export type ApplyBraintrustBundleOpenClawConfigOptions = {
  bundle: BraintrustRuntimeBundle;
  registryPath: string;
};

type BundleConfigSection = {
  config: Record<string, unknown>;
};

const configSectionPattern = /^## Config:\s*openclaw\s*$/gm;
const disallowedKeyPattern =
  /^(auth|authorization|secret|secrets|token|tokens|credential|credentials|password|apiKey|api_key|channel|channels|routing|route|routes|binding|bindings|user|users|discord)$/i;

export async function applyBraintrustBundleOpenClawConfig(
  options: ApplyBraintrustBundleOpenClawConfigOptions
): Promise<void> {
  const registry = await loadOpenClawWorkspaceRegistry(options.registryPath);
  const section = parseOpenClawConfigSection(options.bundle.content);
  const existingConfig = parseJsonObject(
    await readFile(registry.config, { encoding: "utf8" }),
    "OpenClaw config"
  );
  const nextConfig = applyAllowlistedConfigPatch(existingConfig, section.config);

  await writeFile(registry.config, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");
}

function parseOpenClawConfigSection(content: unknown): BundleConfigSection {
  if (typeof content !== "string") {
    throw new Error("Braintrust bundle config section content must be Markdown text.");
  }

  const matches = [...content.matchAll(configSectionPattern)];
  if (matches.length === 0) {
    throw new Error("Braintrust bundle must include one ## Config: openclaw section.");
  }
  if (matches.length > 1) {
    throw new Error("Braintrust bundle must not include duplicate ## Config: openclaw sections.");
  }

  const match = matches[0];
  const sectionStart = match.index + match[0].length;
  const sectionEnd = findNextMarkdownSection(content, sectionStart);
  const sectionText = trimSectionBlankLines(content.slice(sectionStart, sectionEnd));

  return {
    config: parseJsonObject(sectionText, "Braintrust openclaw config section")
  };
}

function applyAllowlistedConfigPatch(
  existingConfig: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  assertNoSensitiveKeys(patch);
  assertOnlyHeartbeatPatch(patch);
  const heartbeatPatch = readRequiredHeartbeatPatch(patch);

  return {
    ...existingConfig,
    agents: {
      ...readObject(existingConfig.agents),
      defaults: {
        ...readObject(readObject(existingConfig.agents).defaults),
        heartbeat: heartbeatPatch
      }
    }
  };
}

function assertNoSensitiveKeys(value: unknown, path = ""): void {
  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (disallowedKeyPattern.test(key)) {
      throw new Error(`OpenClaw config patch contains disallowed sensitive key: ${childPath}`);
    }
    assertNoSensitiveKeys(child, childPath);
  }
}

function assertOnlyHeartbeatPatch(value: unknown, path = ""): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("OpenClaw config patch must be a JSON object.");
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (!isAllowlistedHeartbeatPath(childPath)) {
      throw new Error(`OpenClaw config patch path is not allowlisted: ${childPath}`);
    }

    if (childPath !== "agents.defaults.heartbeat" && isPlainObject(child)) {
      assertOnlyHeartbeatPatch(child, childPath);
    }
  }
}

function isAllowlistedHeartbeatPath(path: string): boolean {
  return path === "agents" || path === "agents.defaults" || path === "agents.defaults.heartbeat";
}

function readRequiredHeartbeatPatch(patch: Record<string, unknown>): Record<string, unknown> {
  const heartbeat = readObject(readObject(patch.agents).defaults).heartbeat;
  if (!isPlainObject(heartbeat)) {
    throw new Error("OpenClaw config patch requires agents.defaults.heartbeat to be a JSON object.");
  }

  return heartbeat;
}

function parseJsonObject(text: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} must be valid JSON.`);
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed;
}

function readObject(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function findNextMarkdownSection(content: string, start: number): number {
  const nextSection = /^##\s+/gm;
  nextSection.lastIndex = start;
  const match = nextSection.exec(content);
  return match?.index ?? content.length;
}

function trimSectionBlankLines(content: string): string {
  return content.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}
