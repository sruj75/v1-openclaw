import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import type { BraintrustRuntimeBundle } from "./braintrust-bundle.js";

export type ApplyBraintrustBundleFileSectionsOptions = {
  bundle: BraintrustRuntimeBundle;
  workspaces: string[];
  appliedAt?: Date;
};

export type BraintrustBundleFileSectionPlan = {
  targets: BraintrustBundleFileSectionTarget[];
};

export type BraintrustBundleFileSectionTarget = {
  path: string;
  workspace: string;
  bundlePath: string;
  changed: boolean;
  content: string;
};

type BundleFileSection = {
  path: string;
  content: string;
};

const fileSectionPattern = /^## File:\s*(.+?)\s*$/gm;
const bundleSectionPattern = /^##\s+/gm;
const managedStartPattern = /^<!-- INTENTIVE_MANAGED_START\b.* -->$/gm;
const managedEndPattern = /^<!-- INTENTIVE_MANAGED_END -->$/gm;

export async function applyBraintrustBundleFileSections(
  options: ApplyBraintrustBundleFileSectionsOptions
): Promise<void> {
  const plan = await planBraintrustBundleFileSections(options);

  await commitBraintrustBundleFileSectionPlan(plan);
}

export async function planBraintrustBundleFileSections(
  options: ApplyBraintrustBundleFileSectionsOptions
): Promise<BraintrustBundleFileSectionPlan> {
  const sections = parseBundleFileSections(options.bundle.content);
  const appliedAt = (options.appliedAt ?? new Date()).toISOString();
  const targets: BraintrustBundleFileSectionTarget[] = [];

  for (const workspace of options.workspaces) {
    for (const section of sections) {
      const targetPath = resolveWorkspacePath(workspace, section.path);
      const existingContent = await readTargetFile(targetPath, section.path);
      const nextContent = replaceManagedBlock(existingContent, section, options.bundle, appliedAt);

      targets.push({
        path: targetPath,
        workspace,
        bundlePath: section.path,
        changed: nextContent !== existingContent,
        content: nextContent
      });
    }
  }

  return { targets };
}

export async function commitBraintrustBundleFileSectionPlan(
  plan: BraintrustBundleFileSectionPlan
): Promise<void> {
  for (const target of plan.targets) {
    if (target.changed) {
      await writeFile(target.path, target.content, "utf8");
    }
  }
}

async function readTargetFile(targetPath: string, bundlePath: string): Promise<string> {
  try {
    return await readFile(targetPath, { encoding: "utf8" });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new Error(`Targeted bundle file ${bundlePath} must already exist in every workspace.`);
    }

    throw error;
  }
}

function parseBundleFileSections(content: unknown): BundleFileSection[] {
  if (typeof content !== "string") {
    throw new Error("Braintrust bundle file section content must be Markdown text.");
  }

  const matches = [...content.matchAll(fileSectionPattern)];
  if (matches.length === 0) {
    throw new Error("Braintrust bundle must include at least one ## File section.");
  }

  const seenPaths = new Set<string>();

  return matches.map((match, index) => {
    const sectionStart = match.index + match[0].length;
    const sectionEnd = findNextBundleSection(content, sectionStart);
    const path = match[1].trim();

    if (seenPaths.has(path)) {
      throw new Error(`Duplicate bundle file section for ${path}.`);
    }
    seenPaths.add(path);

    return {
      path,
      content: trimSectionBlankLines(content.slice(sectionStart, sectionEnd))
    };
  });
}

function findNextBundleSection(content: string, start: number): number {
  bundleSectionPattern.lastIndex = start;
  const match = bundleSectionPattern.exec(content);

  return match?.index ?? content.length;
}

function replaceManagedBlock(
  existingContent: string,
  section: BundleFileSection,
  bundle: BraintrustRuntimeBundle,
  appliedAt: string
): string {
  const startMatches = [...existingContent.matchAll(managedStartPattern)];
  const endMatches = [...existingContent.matchAll(managedEndPattern)];
  const header = [
    `<!-- INTENTIVE_MANAGED_START bundle_slug="${escapeAttribute(bundle.slug)}"`,
    `bundle_version="${escapeAttribute(bundle.resolvedVersionId)}"`,
    `applied_at="${escapeAttribute(appliedAt)}"`,
    `file="${escapeAttribute(section.path)}" -->`
  ].join(" ");
  const block = [header, section.content, "<!-- INTENTIVE_MANAGED_END -->"].join("\n");

  if (startMatches.length === 0 && endMatches.length === 0) {
    const separator = existingContent.endsWith("\n") ? "\n" : "\n\n";
    return `${existingContent}${separator}${block}\n`;
  }

  if (startMatches.length !== 1 || endMatches.length !== 1) {
    throw new Error(`Target file ${section.path} has malformed INTENTIVE_MANAGED markers.`);
  }

  const startMatch = startMatches[0];
  const endMatch = endMatches[0];
  if (startMatch.index === undefined || endMatch.index === undefined || startMatch.index > endMatch.index) {
    throw new Error(`Target file ${section.path} has malformed INTENTIVE_MANAGED markers.`);
  }

  const blockEnd = endMatch.index + endMatch[0].length;
  return existingContent.slice(0, startMatch.index) + block + existingContent.slice(blockEnd);
}

function resolveWorkspacePath(workspace: string, filePath: string): string {
  if (isAbsolute(filePath)) {
    throw new Error(`Bundle file path must be relative: ${filePath}`);
  }

  const workspaceRoot = resolve(workspace);
  const targetPath = resolve(workspaceRoot, filePath);
  const relativePath = relative(workspaceRoot, targetPath);

  if (relativePath === ".." || relativePath.startsWith(`..${sep}`)) {
    throw new Error(`Bundle file path must stay inside the workspace: ${filePath}`);
  }

  return targetPath;
}

function trimSectionBlankLines(content: string): string {
  return content.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
}

function isNodeError(error: unknown): error is { code: string } {
  return error !== null && typeof error === "object" && "code" in error;
}
