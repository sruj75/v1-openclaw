import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { loadConfig } from "./config/index.js";
import { setContextMetadata } from "./db/context.js";
import { applyPhase1Schema } from "./db/seed.js";
import { openSqliteDatabase } from "./db/sqlite.js";

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exit(code?: number): never;
  exitCode?: number;
};

type ContextSetArgs = {
  "agent-id"?: string;
  "assignment-id"?: string;
  "context-version"?: string;
  "updated-by"?: string;
};

export async function runContextSetCommand(
  argv: string[] = process.argv.slice(2),
  env: Record<string, string | undefined> = process.env
) {
  const values = parseContextArgs(argv);
  const config = loadConfig(env);

  if (typeof values["context-version"] !== "string") {
    throw new Error("--context-version is required.");
  }

  await mkdir(dirname(config.databasePath), { recursive: true });
  const database = openSqliteDatabase(config.databasePath);

  try {
    applyPhase1Schema(database);
    return setContextMetadata(database, {
      agentId: values["agent-id"],
      assignmentId: values["assignment-id"],
      contextVersion: values["context-version"],
      updatedBy: values["updated-by"]
    });
  } finally {
    database.close();
  }
}

function parseContextArgs(argv: string[]): ContextSetArgs {
  const values: ContextSetArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--agent-id") {
      values["agent-id"] = argv[++index];
      continue;
    }

    if (arg === "--assignment-id") {
      values["assignment-id"] = argv[++index];
      continue;
    }

    if (arg === "--context-version") {
      values["context-version"] = argv[++index];
      continue;
    }

    if (arg === "--updated-by") {
      values["updated-by"] = argv[++index];
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsageAndExit();
    }

    throw new Error(`Unknown argument ${arg}.`);
  }

  return values;
}

function printUsageAndExit(): never {
  console.log(
    [
      "Usage: npm run context:set -- --agent-id <id> --context-version <label> [--updated-by <name>]",
      "   or: npm run context:set -- --assignment-id <id> --context-version <label> [--updated-by <name>]"
    ].join("\n")
  );
  process.exit(0);
}

async function main() {
  try {
    console.log(JSON.stringify(await runContextSetCommand(), null, 2));
  } catch (error: unknown) {
    console.error(error);
    process.exitCode = 1;
  }
}

if (isMainModule()) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return typeof entrypoint === "string" && import.meta.url === new URL(`file://${entrypoint}`).href;
}
