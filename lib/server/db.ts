// SQLite via Node's built-in driver. All SQL lives in lib/server/*-repo.ts and users.ts,
// so moving to Postgres later means rewriting those files only.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// turbopackIgnore: the data folder is created at runtime and must not be traced into the build output.
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "data"));

const SCHEMA = `
CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, latin TEXT NOT NULL, blurb TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sun INTEGER NOT NULL DEFAULT 0, water INTEGER NOT NULL DEFAULT 0,
  tint TEXT NOT NULL DEFAULT 'lime', icon TEXT NOT NULL DEFAULT 'leafy',
  image TEXT,
  stock INTEGER,
  visible INTEGER NOT NULL DEFAULT 1,
  pot_only INTEGER NOT NULL DEFAULT 0,
  recipients TEXT NOT NULL DEFAULT '[]',
  sort INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, kind TEXT NOT NULL, description TEXT NOT NULL, badge TEXT NOT NULL, styled TEXT NOT NULL,
  price INTEGER NOT NULL,
  sale_percent INTEGER NOT NULL DEFAULT 0,
  stock INTEGER,
  slots TEXT NOT NULL, default_plants TEXT NOT NULL,
  tint TEXT NOT NULL DEFAULT 'pink',
  image TEXT NOT NULL, pos TEXT NOT NULL DEFAULT '50% 50%',
  vibes TEXT NOT NULL DEFAULT '[]', recipients TEXT NOT NULL DEFAULT '[]',
  specs TEXT NOT NULL DEFAULT '[]',
  visible INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS variants (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  combo TEXT NOT NULL,
  image TEXT NOT NULL,
  PRIMARY KEY (product_id, combo)
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'new',
  total INTEGER NOT NULL,
  customer TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`;

const g = globalThis as unknown as { __zal3aDb?: DatabaseSync };

/** One shared connection (kept on globalThis so dev hot-reloads don't open more). */
export function getDb() {
  if (g.__zal3aDb) return g.__zal3aDb;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "zal3a.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  g.__zal3aDb = db;
  return db;
}

/** Run fn inside a write transaction. */
export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export const json = <T>(s: unknown, fallback: T): T => {
  try {
    return typeof s === "string" ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};
