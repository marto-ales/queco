import Database from "better-sqlite3";
import path from "path";
import { SCHEMA_SQL } from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "queco.db");

declare global {
  var __quecoDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__quecoDb) return global.__quecoDb;

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);

  global.__quecoDb = db;
  return db;
}

export function isSeeded(db: Database.Database): boolean {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM supermarket_sections").get() as { cnt: number };
  return row.cnt > 0;
}
