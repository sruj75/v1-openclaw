import { readFile } from "node:fs/promises";

export type OpenClawWorkspaceRegistry = {
  workspaces: string[];
  config: string;
};

export async function loadOpenClawWorkspaceRegistry(
  registryPath: string
): Promise<OpenClawWorkspaceRegistry> {
  const registryText = await readFile(registryPath, { encoding: "utf8" });
  return parseOpenClawWorkspaceRegistry(JSON.parse(registryText));
}

export function parseOpenClawWorkspaceRegistry(value: unknown): OpenClawWorkspaceRegistry {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("OpenClaw workspace registry must be an object.");
  }

  const registry = value as Record<string, unknown>;
  const workspaces = registry.workspaces;
  const config = registry.config;

  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    throw new Error("OpenClaw workspace registry requires at least one workspace.");
  }

  const normalizedWorkspaces = workspaces.map((workspace) =>
    requireNonEmptyString(workspace, "OpenClaw workspace path")
  );

  if (new Set(normalizedWorkspaces).size !== normalizedWorkspaces.length) {
    throw new Error("OpenClaw workspace registry contains duplicate workspace paths.");
  }

  return {
    workspaces: normalizedWorkspaces,
    config: requireNonEmptyString(config, "OpenClaw config path")
  };
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}
