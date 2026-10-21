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

  // Migration: prep_tasks.completed added in Phase 5
  const prepCols = db.prepare("PRAGMA table_info(prep_tasks)").all() as { name: string }[];
  if (!prepCols.some((c) => c.name === "completed")) {
    db.exec("ALTER TABLE prep_tasks ADD COLUMN completed INTEGER NOT NULL DEFAULT 0");
  }

  global.__quecoDb = db;
  return db;
}

export function isSeeded(db: Database.Database): boolean {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM supermarket_sections").get() as { cnt: number };
  return row.cnt > 0;
}
