// SQLite via Node's built-in driver. All SQL lives in lib/server/*-repo.ts, users.ts and customers.ts,
// so moving to Postgres later means rewriting those files only.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CARE, DEFAULT_PLANT_VIBES, DEFAULT_TAGS, LEVEL_TO_OPTION } from "./seed-data";

// turbopackIgnore: the data folder is created at runtime and must not be traced into the build output.
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "data"));

const NOW = `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** v1: catalog, admins, orders. */
const V1 = `
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
  created_at TEXT NOT NULL DEFAULT ${NOW}
);
`;

/** v2: editable tags + care options, customer accounts, order tracking, reviews, email. */
const V2 = `
CREATE TABLE tags (
  kind TEXT NOT NULL, id TEXT NOT NULL,
  label TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '', line TEXT NOT NULL DEFAULT '{"en":"","ar":""}',
  visible INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, id)
);
CREATE TABLE care_options (
  kind TEXT NOT NULL, id TEXT NOT NULL,
  label TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, id)
);
ALTER TABLE plants ADD COLUMN vibes TEXT NOT NULL DEFAULT '[]';
ALTER TABLE plants ADD COLUMN sun_option TEXT;
ALTER TABLE plants ADD COLUMN water_option TEXT;

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  email_verified INTEGER NOT NULL DEFAULT 0,
  marketing INTEGER NOT NULL DEFAULT 0,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT ${NOW}
);
CREATE TABLE customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE customer_tokens (
  token_hash TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN email TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN phone TEXT NOT NULL DEFAULT '';
CREATE INDEX orders_customer ON orders(customer_id);
CREATE TABLE order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT ${NOW}
);
CREATE INDEX order_events_number ON order_events(order_number);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  reply TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'en',
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT ${NOW},
  updated_at TEXT NOT NULL DEFAULT ${NOW},
  UNIQUE (product_id, customer_id)
);

CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT NOT NULL DEFAULT '',
  order_number TEXT,
  campaign_id INTEGER,
  created_at TEXT NOT NULL DEFAULT ${NOW}
);
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT NOT NULL,
  cta_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'sending',
  recipients INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT ${NOW}
);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

function upgradeToV2(db: DatabaseSync) {
  db.exec(V2);
  const tag = db.prepare("INSERT INTO tags (kind, id, label, emoji, line, sort) VALUES (?, ?, ?, ?, ?, ?)");
  DEFAULT_TAGS.forEach((t, i) => tag.run(t.kind, t.id, JSON.stringify(t.label), t.emoji, JSON.stringify(t.line), i + 1));
  const care = db.prepare("INSERT INTO care_options (kind, id, label, level, sort) VALUES (?, ?, ?, ?, ?)");
  DEFAULT_CARE.forEach((c, i) => care.run(c.kind, c.id, JSON.stringify(c.label), c.level, i + 1));

  // Existing plants: 0–3 care levels become options, and the seeded ones get starter vibes.
  const plants = db.prepare("SELECT id, sun, water FROM plants").all() as { id: string; sun: number; water: number }[];
  const upd = db.prepare("UPDATE plants SET sun_option = ?, water_option = ?, vibes = ? WHERE id = ?");
  for (const p of plants) {
    upd.run(LEVEL_TO_OPTION.sun[p.sun] ?? null, LEVEL_TO_OPTION.water[p.water] ?? null, JSON.stringify(DEFAULT_PLANT_VIBES[p.id] ?? []), p.id);
  }
  db.exec("ALTER TABLE plants DROP COLUMN sun; ALTER TABLE plants DROP COLUMN water;");

  // Existing orders: copy contact details out for lookups and start their timeline.
  db.exec(`
    UPDATE orders SET email = COALESCE(json_extract(data, '$.contact.email'), ''), phone = COALESCE(json_extract(data, '$.contact.phone'), '');
    INSERT INTO order_events (order_number, status, at) SELECT number, status, created_at FROM orders WHERE number IS NOT NULL;
  `);
}

/** v3: optional banner image on offer emails. */
const V3 = `ALTER TABLE campaigns ADD COLUMN image TEXT;`;

const MIGRATIONS: ((db: DatabaseSync) => void)[] = [(db) => db.exec(V1), upgradeToV2, (db) => db.exec(V3)];

function migrate(db: DatabaseSync) {
  const version = () => (db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version;
  if (version() >= MIGRATIONS.length) return;
  db.exec("BEGIN IMMEDIATE");
  try {
    // Re-read inside the lock: another process may have just migrated.
    for (let v = version(); v < MIGRATIONS.length; v++) {
      MIGRATIONS[v](db);
      db.exec(`PRAGMA user_version = ${v + 1}`);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

const g = globalThis as unknown as { __zal3aDb?: DatabaseSync; __zal3aDbVersion?: number };

/** One shared connection (kept on globalThis so dev hot-reloads don't open more). */
export function getDb() {
  if (g.__zal3aDb && g.__zal3aDbVersion === MIGRATIONS.length) return g.__zal3aDb;
  let db = g.__zal3aDb;
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new DatabaseSync(path.join(DATA_DIR, "zal3a.db"));
    db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  }
  migrate(db);
  g.__zal3aDb = db;
  g.__zal3aDbVersion = MIGRATIONS.length;
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

/** Small key/value store, e.g. the secret used to sign order-tracking links. */
export function setting(key: string, init: () => string) {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  if (row) return row.value;
  const value = init();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, value);
  return (db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string }).value;
}
