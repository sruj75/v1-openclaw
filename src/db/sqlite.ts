import { DatabaseSync } from "node:sqlite";

export type SqliteDatabase = DatabaseSync;

export function openSqliteDatabase(path: string): SqliteDatabase {
  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON;");
  return database;
}
