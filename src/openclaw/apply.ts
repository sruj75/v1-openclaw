import { pathToFileURL } from "node:url";

import { fetchBraintrustRuntimeBundle, type BraintrustBundleClient } from "./braintrust-bundle.js";
import {
  commitBraintrustBundleOpenClawConfigPlan,
  planBraintrustBundleOpenClawConfig,
  type BraintrustBundleOpenClawConfigPlan
} from "./config-apply.js";
import {
  commitBraintrustBundleFileSectionPlan,
  planBraintrustBundleFileSections,
  type BraintrustBundleFileSectionPlan
} from "./managed-file-apply.js";
import { loadOpenClawWorkspaceRegistry } from "./workspace-registry.js";

export type OpenClawApplyOptions = {
  braintrustSlug: string;
  latest?: boolean;
  braintrustVersion?: string;
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
  client?: BraintrustBundleClient;
  writeLine?: (line: string) => void;
};

const defaultRegistryPath = "openclaw-workspaces.json";
const fileSectionPattern = /^## File:\s*(.+?)\s*$/m;
const configSectionPattern = /^## Config:\s*openclaw\s*$/m;
const braintrustFetchTimeoutMs = 30_000;

export async function runOpenClawApply(
  options: OpenClawApplyOptions,
  dependencies: OpenClawApplyDependencies = {}
): Promise<OpenClawApplyResult> {
  const registryPath = options.registryPath ?? defaultRegistryPath;
  const client = dependencies.client ?? createBraintrustRestBundleClient(options.env ?? process.env);
  const bundle = await fetchBraintrustRuntimeBundle(
    {
      slug: options.braintrustSlug,
      latest: options.latest,
      braintrustVersion: options.braintrustVersion,
      env: options.env
    },
    { client }
  );
  const registry = await loadOpenClawWorkspaceRegistry(registryPath);
  const content = requireBundleMarkdown(bundle.content);
  const hasFileSections = fileSectionPattern.test(content);
  const hasConfigSection = configSectionPattern.test(content);

  if (!hasFileSections && !hasConfigSection) {
    throw new Error("Braintrust bundle must include at least one supported section (## File: ... or ## Config: openclaw).");
  }

  const filePlan = hasFileSections
    ? await planBraintrustBundleFileSections({
        bundle,
        workspaces: registry.workspaces,
        appliedAt: options.appliedAt
      })
    : emptyFilePlan();
  const configPlan = hasConfigSection
    ? await planBraintrustBundleOpenClawConfig({
        bundle,
        registryPath
      })
    : undefined;

  await commitBraintrustBundleFileSectionPlan(filePlan);
  if (configPlan !== undefined) {
    await commitBraintrustBundleOpenClawConfigPlan(configPlan);
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

    if (arg === "--braintrust-slug") {
      options.braintrustSlug = readFlagValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--latest") {
      options.latest = true;
      continue;
    }
    if (arg === "--braintrust-version") {
      options.braintrustVersion = readFlagValue(argv, index, arg);
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

  if (options.braintrustSlug === undefined || options.braintrustSlug.trim() === "") {
    throw new Error("openclaw:apply requires --braintrust-slug <slug>.");
  }
  if (options.latest === true && options.braintrustVersion !== undefined) {
    throw new Error("openclaw:apply accepts either --latest or --braintrust-version <version-id>, not both.");
  }
  if (options.latest !== true && options.braintrustVersion === undefined) {
    throw new Error("openclaw:apply requires --latest or --braintrust-version <version-id>.");
  }

  return options as OpenClawApplyOptions;
}

function createBraintrustRestBundleClient(env: Record<string, string | undefined>): BraintrustBundleClient {
  return {
    async fetchLatestBundle(request) {
      return fetchBraintrustFunctionBundle({
        apiKey: request.apiKey,
        slug: request.slug,
        env
      });
    },
    async fetchVersionedBundle(request) {
      return fetchBraintrustFunctionBundle({
        apiKey: request.apiKey,
        slug: request.slug,
        version: request.versionId,
        env
      });
    }
  };
}

async function fetchBraintrustFunctionBundle(options: {
  apiKey: string;
  slug: string;
  version?: string;
  env: Record<string, string | undefined>;
}): Promise<{ slug: string; versionId: string; content: string }> {
  const apiBase = (options.env.BRAINTRUST_API_URL ?? "https://api.braintrust.dev").replace(/\/$/, "");
  const url = new URL(`${apiBase}/v1/function`);
  const projectId = options.env.BRAINTRUST_PROJECT_ID;
  const projectName = options.env.BRAINTRUST_PROJECT_NAME;

  if (projectId === undefined && projectName === undefined) {
    throw new Error("Braintrust project requires BRAINTRUST_PROJECT_ID or BRAINTRUST_PROJECT_NAME.");
  }

  url.searchParams.set("slug", options.slug);
  url.searchParams.set("limit", "1");
  if (projectId !== undefined) {
    url.searchParams.set("project_id", projectId);
  } else if (projectName !== undefined) {
    url.searchParams.set("project_name", projectName);
  }
  if (options.version !== undefined) {
    url.searchParams.set("version", options.version);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${options.apiKey}`
      },
      signal: AbortSignal.timeout(braintrustFetchTimeoutMs)
    });
  } catch (error) {
    if (isAbortTimeoutError(error)) {
      throw new Error(`Braintrust bundle fetch timed out after ${braintrustFetchTimeoutMs}ms.`);
    }

    throw error;
  }

  if (!response.ok) {
    throw new Error(`Braintrust bundle fetch failed with HTTP ${response.status}.`);
  }

  const payload = await response.json();
  const functions = readObjectArray(readObject(payload).objects, "Braintrust function list");
  if (functions.length !== 1) {
    throw new Error(`Braintrust bundle slug ${options.slug} resolved to ${functions.length} functions.`);
  }

  const fn = readObject(functions[0]);
  const promptData = readObject(fn.prompt_data);
  const origin = readObject(promptData.origin);
  const versionId = readOptionalString(origin.prompt_version) ?? readRequiredString(fn._xact_id, "Braintrust function version");

  return {
    slug: readOptionalString(fn.slug) ?? options.slug,
    versionId,
    content: extractPromptMarkdown(promptData)
  };
}

function extractPromptMarkdown(promptData: Record<string, unknown>): string {
  const prompt = readObject(promptData.prompt);
  const messages = readObjectArray(prompt.messages, "Braintrust prompt messages");
  const text = messages
    .map((message) => readOptionalString(readObject(message).content))
    .filter((content): content is string => content !== undefined)
    .join("\n");

  if (text.trim() === "") {
    throw new Error("Braintrust bundle prompt content is required.");
  }

  return text;
}

function summarizeTargets(
  filePlan: BraintrustBundleFileSectionPlan,
  configPlan: BraintrustBundleOpenClawConfigPlan | undefined
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
  const lines = [`Resolved Braintrust version: ${versionId}`];

  if (targets.length === 0) {
    lines.push("No file or config targets changed.");
    return lines.join("\n");
  }

  for (const target of targets) {
    lines.push(`${target.changed ? "changed" : "unchanged"} ${target.kind}: ${target.path}`);
  }

  return lines.join("\n");
}

function emptyFilePlan(): BraintrustBundleFileSectionPlan {
  return { targets: [] };
}

function requireBundleMarkdown(content: unknown): string {
  if (typeof content !== "string") {
    throw new Error("Braintrust runtime bundle content must be Markdown text.");
  }

  return content;
}

function readFlagValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function readObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readObjectArray(value: unknown, label: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || !value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
    throw new Error(`${label} must be an array.`);
  }

  return value as Record<string, unknown>[];
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readRequiredString(value: unknown, label: string): string {
  const text = readOptionalString(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }

  return text;
}

function isAbortTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
