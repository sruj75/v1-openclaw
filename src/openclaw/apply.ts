import { pathToFileURL } from "node:url";

import {
  createLangfuseRuntimeBundleClient,
  fetchRuntimeBundle,
  type RuntimeBundleClient
} from "./runtime-bundle.js";
import {
  commitRuntimeBundleOpenClawConfigPlan,
  planRuntimeBundleOpenClawConfig,
  type RuntimeBundleOpenClawConfigPlan
} from "./config-apply.js";
import {
  commitRuntimeBundleFileSectionPlan,
  planRuntimeBundleFileSections,
  type RuntimeBundleFileSectionPlan
} from "./managed-file-apply.js";
import { loadOpenClawWorkspaceRegistry } from "./workspace-registry.js";

export type OpenClawApplyOptions = {
  langfusePrompt: string;
  latest?: boolean;
  langfuseLabel?: string;
  langfuseVersion?: string;
  registryPath?: string;
  appliedAt?: Date;
  env?: Record<string, string | undefined>;
};

export type OpenClawApplyResult = {
  resolvedVersionId: string;
  targets: OpenClawApplyTargetResult[];
  output: string;
};

export type OpenClawApplyTargetResult = {
  kind: "file" | "config";
  path: string;
  changed: boolean;
};

export type OpenClawApplyDependencies = {
  client?: RuntimeBundleClient;
  writeLine?: (line: string) => void;
};

const defaultRegistryPath = "openclaw-workspaces.json";
const fileSectionPattern = /^## File:\s*(.+?)\s*$/m;
const configSectionPattern = /^## Config:\s*openclaw\s*$/m;

export async function runOpenClawApply(
  options: OpenClawApplyOptions,
  dependencies: OpenClawApplyDependencies = {}
): Promise<OpenClawApplyResult> {
  const registryPath = options.registryPath ?? defaultRegistryPath;
  const client = dependencies.client ?? createLangfuseRuntimeBundleClient(options.env ?? process.env);
  const bundle = await fetchRuntimeBundle(
    {
      promptName: options.langfusePrompt,
      latest: options.latest,
      langfuseLabel: options.langfuseLabel,
      langfuseVersion: options.langfuseVersion,
      env: options.env
    },
    { client }
  );
  const registry = await loadOpenClawWorkspaceRegistry(registryPath);
  const content = requireBundleMarkdown(bundle.content);
  const hasFileSections = fileSectionPattern.test(content);
  const hasConfigSection = configSectionPattern.test(content);

  if (!hasFileSections && !hasConfigSection) {
    throw new Error("Runtime bundle must include at least one supported section (## File: ... or ## Config: openclaw).");
  }

  const filePlan = hasFileSections
    ? await planRuntimeBundleFileSections({
        bundle,
        workspaces: registry.workspaces,
        appliedAt: options.appliedAt
      })
    : emptyFilePlan();
  const configPlan = hasConfigSection
    ? await planRuntimeBundleOpenClawConfig({
        bundle,
        registryPath
      })
    : undefined;

  await commitRuntimeBundleFileSectionPlan(filePlan);
  if (configPlan !== undefined) {
    await commitRuntimeBundleOpenClawConfigPlan(configPlan);
  }

  const targets = summarizeTargets(filePlan, configPlan);
  const output = formatOpenClawApplyOutput(bundle.resolvedVersionId, targets);
  const writeLine = dependencies.writeLine ?? console.log;

  for (const line of output.split("\n")) {
    writeLine(line);
  }

  return {
    resolvedVersionId: bundle.resolvedVersionId,
    targets,
    output
  };
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  try {
    await runOpenClawApply(parseOpenClawApplyArgs(argv));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

export function parseOpenClawApplyArgs(argv: string[]): OpenClawApplyOptions {
  const options: Partial<OpenClawApplyOptions> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--langfuse-prompt") {
      options.langfusePrompt = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--latest") {
      options.latest = true;
      continue;
    }
    if (arg === "--langfuse-label") {
      options.langfuseLabel = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--langfuse-version") {
      options.langfuseVersion = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--registry") {
      options.registryPath = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown openclaw:apply argument: ${arg}`);
  }

  if (options.langfusePrompt === undefined || options.langfusePrompt.trim() === "") {
    throw new Error("openclaw:apply requires --langfuse-prompt <prompt-name>.");
  }
  if (countSelectors(options) !== 1) {
    throw new Error("openclaw:apply requires exactly one of --langfuse-label, --latest, or --langfuse-version.");
  }

  return options as OpenClawApplyOptions;
}

function summarizeTargets(
  filePlan: RuntimeBundleFileSectionPlan,
  configPlan: RuntimeBundleOpenClawConfigPlan | undefined
): OpenClawApplyTargetResult[] {
  const targets: OpenClawApplyTargetResult[] = filePlan.targets.map((target) => ({
    kind: "file" as const,
    path: target.path,
    changed: target.changed
  }));

  if (configPlan !== undefined) {
    targets.push({
      kind: "config",
      path: configPlan.target.path,
      changed: configPlan.target.changed
    });
  }

  return targets;
}

function formatOpenClawApplyOutput(versionId: string, targets: OpenClawApplyTargetResult[]): string {
  const lines = [`Resolved Langfuse prompt version: ${versionId}`];

  if (targets.length === 0) {
    lines.push("No file or config targets changed.");
    return lines.join("\n");
  }

  for (const target of targets) {
    lines.push(`${target.changed ? "changed" : "unchanged"} ${target.kind}: ${target.path}`);
  }

  return lines.join("\n");
}

function emptyFilePlan(): RuntimeBundleFileSectionPlan {
  return { targets: [] };
}

function requireBundleMarkdown(content: unknown): string {
  if (typeof content !== "string") {
    throw new Error("Runtime bundle content must be Markdown text.");
  }

  return content;
}

function countSelectors(options: Partial<OpenClawApplyOptions>): number {
  return [
    options.latest === true,
    options.langfuseLabel !== undefined,
    options.langfuseVersion !== undefined
  ].filter(Boolean).length;
}

function readFlagValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
