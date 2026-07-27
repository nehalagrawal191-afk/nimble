import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { NewsletterBrief } from "@/lib/types";

const dbPath = join(process.cwd(), "data", "signals.db");

function getDb() {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS briefs (
      id TEXT PRIMARY KEY,
      generated_at TEXT NOT NULL,
      title TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  return db;
}

export function saveBrief(brief: NewsletterBrief) {
  const db = getDb();
  const statement = db.prepare(`
    INSERT OR REPLACE INTO briefs (id, generated_at, title, payload)
    VALUES (@id, @generatedAt, @title, @payload)
  `);

  statement.run({
    id: brief.id,
    generatedAt: brief.generatedAt,
    title: brief.title,
    payload: JSON.stringify(brief)
  });
  db.close();
}
