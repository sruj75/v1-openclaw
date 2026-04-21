import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { applyBraintrustBundleFileSections } from "../dist/openclaw/managed-file-apply.js";

test("applies a bundle file section while preserving content outside the managed block", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-managed-"));

  try {
    await writeFile(
      join(root, "AGENTS.md"),
      [
        "# Agent workspace",
        "",
        "Operator note before the managed block.",
        "",
        "<!-- INTENTIVE_MANAGED_START bundle_slug=\"old\" bundle_version=\"old\" applied_at=\"2026-01-01T00:00:00.000Z\" file=\"AGENTS.md\" -->",
        "Old runtime instructions.",
        "<!-- INTENTIVE_MANAGED_END -->",
        "",
        "Operator note after the managed block.",
        ""
      ].join("\n"),
      "utf8"
    );

    await applyBraintrustBundleFileSections({
      bundle: {
        slug: "intentive-runtime",
        resolvedVersionId: "bt-version-7",
        content: ["## File: AGENTS.md", "", "New runtime instructions.", ""].join("\n")
      },
      workspaces: [root],
      appliedAt: new Date("2026-04-20T10:30:00.000Z")
    });

    assert.equal(
      await readFile(join(root, "AGENTS.md"), "utf8"),
      [
        "# Agent workspace",
        "",
        "Operator note before the managed block.",
        "",
        "<!-- INTENTIVE_MANAGED_START bundle_slug=\"intentive-runtime\" bundle_version=\"bt-version-7\" applied_at=\"2026-04-20T10:30:00.000Z\" file=\"AGENTS.md\" -->",
        "New runtime instructions.",
        "<!-- INTENTIVE_MANAGED_END -->",
        "",
        "Operator note after the managed block.",
        ""
      ].join("\n")
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("inserts a managed block into an existing workspace file that has no managed block yet", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-managed-"));

  try {
    await writeFile(
      join(root, "runtime.md"),
      ["# Runtime", "", "Human-authored setup notes.", ""].join("\n"),
      "utf8"
    );

    await applyBraintrustBundleFileSections({
      bundle: {
        slug: "intentive-runtime",
        resolvedVersionId: "bt-version-8",
        content: ["## File: runtime.md", "", "Managed runtime defaults.", ""].join("\n")
      },
      workspaces: [root],
      appliedAt: new Date("2026-04-20T11:00:00.000Z")
    });

    assert.equal(
      await readFile(join(root, "runtime.md"), "utf8"),
      [
        "# Runtime",
        "",
        "Human-authored setup notes.",
        "",
        "<!-- INTENTIVE_MANAGED_START bundle_slug=\"intentive-runtime\" bundle_version=\"bt-version-8\" applied_at=\"2026-04-20T11:00:00.000Z\" file=\"runtime.md\" -->",
        "Managed runtime defaults.",
        "<!-- INTENTIVE_MANAGED_END -->",
        ""
      ].join("\n")
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("preserves Markdown headings inside bundle file sections", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-managed-"));

  try {
    await writeFile(join(root, "AGENTS.md"), ["# Agents", ""].join("\n"), "utf8");
    await writeFile(join(root, "runtime.md"), ["# Runtime", ""].join("\n"), "utf8");

    await applyBraintrustBundleFileSections({
      bundle: {
        slug: "intentive-runtime",
        resolvedVersionId: "bt-version-8b",
        content: [
          "## File: AGENTS.md",
          "",
          "Shared runtime guidance.",
          "",
          "## Operating rules",
          "",
          "- Preserve this heading and list.",
          "",
          "## File: runtime.md",
          "",
          "Runtime managed defaults.",
          ""
        ].join("\n")
      },
      workspaces: [root],
      appliedAt: new Date("2026-04-20T11:30:00.000Z")
    });

    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    const runtime = await readFile(join(root, "runtime.md"), "utf8");

    assert.match(agents, /Shared runtime guidance/);
    assert.match(agents, /## Operating rules/);
    assert.match(agents, /- Preserve this heading and list\./);
    assert.doesNotMatch(agents, /Runtime managed defaults/);
    assert.match(runtime, /Runtime managed defaults/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails before writes when a targeted file is missing from any workspace", async () => {
  const firstRoot = await mkdtemp(join(tmpdir(), "openclaw-managed-"));
  const secondRoot = await mkdtemp(join(tmpdir(), "openclaw-managed-"));
  const original = [
    "# Existing",
    "",
    "<!-- INTENTIVE_MANAGED_START bundle_slug=\"old\" bundle_version=\"old\" applied_at=\"2026-01-01T00:00:00.000Z\" file=\"AGENTS.md\" -->",
    "Old managed text.",
    "<!-- INTENTIVE_MANAGED_END -->",
    ""
  ].join("\n");

  try {
    await writeFile(join(firstRoot, "AGENTS.md"), original, "utf8");

    await assert.rejects(
      applyBraintrustBundleFileSections({
        bundle: {
          slug: "intentive-runtime",
          resolvedVersionId: "bt-version-9",
          content: ["## File: AGENTS.md", "", "New managed text.", ""].join("\n")
        },
        workspaces: [firstRoot, secondRoot],
        appliedAt: new Date("2026-04-20T12:00:00.000Z")
      }),
      /Targeted bundle file AGENTS\.md must already exist in every workspace/
    );

    assert.equal(await readFile(join(firstRoot, "AGENTS.md"), "utf8"), original);
  } finally {
    await rm(firstRoot, { recursive: true, force: true });
    await rm(secondRoot, { recursive: true, force: true });
  }
});

test("rejects unsafe or duplicate bundle file sections before writes", async () => {
  const cases = [
    {
      name: "absolute path",
      content: ["## File: /tmp/AGENTS.md", "", "Managed text.", ""].join("\n"),
      message: /Bundle file path must be relative/
    },
    {
      name: "path traversal",
      content: ["## File: ../AGENTS.md", "", "Managed text.", ""].join("\n"),
      message: /Bundle file path must stay inside the workspace/
    },
    {
      name: "duplicate section",
      content: [
        "## File: AGENTS.md",
        "",
        "First managed text.",
        "",
        "## File: AGENTS.md",
        "",
        "Second managed text.",
        ""
      ].join("\n"),
      message: /Duplicate bundle file section/
    }
  ];

  for (const unsafeCase of cases) {
    const root = await mkdtemp(join(tmpdir(), "openclaw-managed-"));
    const original = [
      "# Existing",
      "",
      "<!-- INTENTIVE_MANAGED_START bundle_slug=\"old\" bundle_version=\"old\" applied_at=\"2026-01-01T00:00:00.000Z\" file=\"AGENTS.md\" -->",
      "Old managed text.",
      "<!-- INTENTIVE_MANAGED_END -->",
      ""
    ].join("\n");

    try {
      await writeFile(join(root, "AGENTS.md"), original, "utf8");

      await assert.rejects(
        applyBraintrustBundleFileSections({
          bundle: {
            slug: "intentive-runtime",
            resolvedVersionId: "bt-version-10",
            content: unsafeCase.content
          },
          workspaces: [root],
          appliedAt: new Date("2026-04-20T13:00:00.000Z")
        }),
        unsafeCase.message,
        unsafeCase.name
      );

      assert.equal(await readFile(join(root, "AGENTS.md"), "utf8"), original);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("rejects malformed managed markers before writing any workspace file", async () => {
  const validRoot = await mkdtemp(join(tmpdir(), "openclaw-managed-"));
  const malformedRoot = await mkdtemp(join(tmpdir(), "openclaw-managed-"));
  const validOriginal = [
    "# Valid",
    "",
    "<!-- INTENTIVE_MANAGED_START bundle_slug=\"old\" bundle_version=\"old\" applied_at=\"2026-01-01T00:00:00.000Z\" file=\"AGENTS.md\" -->",
    "Old valid text.",
    "<!-- INTENTIVE_MANAGED_END -->",
    ""
  ].join("\n");
  const malformedOriginal = [
    "# Malformed",
    "",
    "<!-- INTENTIVE_MANAGED_END -->",
    "Marker order is wrong.",
    "<!-- INTENTIVE_MANAGED_START bundle_slug=\"old\" bundle_version=\"old\" applied_at=\"2026-01-01T00:00:00.000Z\" file=\"AGENTS.md\" -->",
    ""
  ].join("\n");

  try {
    await writeFile(join(validRoot, "AGENTS.md"), validOriginal, "utf8");
    await writeFile(join(malformedRoot, "AGENTS.md"), malformedOriginal, "utf8");

    await assert.rejects(
      applyBraintrustBundleFileSections({
        bundle: {
          slug: "intentive-runtime",
          resolvedVersionId: "bt-version-11",
          content: ["## File: AGENTS.md", "", "New managed text.", ""].join("\n")
        },
        workspaces: [validRoot, malformedRoot],
        appliedAt: new Date("2026-04-20T14:00:00.000Z")
      }),
      /malformed INTENTIVE_MANAGED markers/
    );

    assert.equal(await readFile(join(validRoot, "AGENTS.md"), "utf8"), validOriginal);
    assert.equal(await readFile(join(malformedRoot, "AGENTS.md"), "utf8"), malformedOriginal);
  } finally {
    await rm(validRoot, { recursive: true, force: true });
    await rm(malformedRoot, { recursive: true, force: true });
  }
});

test("applies multiple bundle file sections to existing files in a workspace", async () => {
  const root = await mkdtemp(join(tmpdir(), "openclaw-managed-"));

  try {
    await writeFile(join(root, "AGENTS.md"), ["# Agents", ""].join("\n"), "utf8");
    await writeFile(join(root, "runtime.md"), ["# Runtime", ""].join("\n"), "utf8");

    await applyBraintrustBundleFileSections({
      bundle: {
        slug: "intentive-runtime",
        resolvedVersionId: "bt-version-12",
        content: [
          "## File: AGENTS.md",
          "",
          "Agent managed text.",
          "",
          "## File: runtime.md",
          "",
          "Runtime managed text.",
          ""
        ].join("\n")
      },
      workspaces: [root],
      appliedAt: new Date("2026-04-20T15:00:00.000Z")
    });

    assert.match(await readFile(join(root, "AGENTS.md"), "utf8"), /Agent managed text/);
    assert.match(await readFile(join(root, "runtime.md"), "utf8"), /Runtime managed text/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
