import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

import { parseRoutingSeed, seedRoutingAssignments } from "./db/seed.js";
import { openSqliteDatabase } from "./db/sqlite.js";

const DEFAULT_SEED_PATH = "examples/local-routing.seed.example.json";
const DEFAULT_DB_PATH = "data/local.sqlite";

export async function seedFromFile(seedPath: string, dbPath: string): Promise<void> {
  const seed = parseRoutingSeed(await readFile(seedPath, { encoding: "utf8" }));
  await mkdir(dirname(dbPath), { recursive: true });

  const database = openSqliteDatabase(dbPath);
  try {
    seedRoutingAssignments(database, seed);
  } finally {
    database.close();
  }
}

async function main() {
  const seedPath = process.argv[2] ?? DEFAULT_SEED_PATH;
  const dbPath = process.argv[3] ?? DEFAULT_DB_PATH;

  await seedFromFile(seedPath, dbPath);
  console.log(`Seeded routing assignments from ${seedPath} into ${dbPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
