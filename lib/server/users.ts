import { getDb } from "./db";
import { hashPassword, newToken, sha256, verifyPassword } from "./password";

export type AdminUser = { id: number; email: string };

const SESSION_DAYS = 7;

export const countUsers = () => (getDb().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;

export const listUsers = () =>
  (getDb().prepare("SELECT id, email, created_at AS createdAt FROM users ORDER BY id").all() as (AdminUser & { createdAt: string })[]).map((u) => ({ ...u }));

export async function createUser(email: string, password: string) {
  const hash = await hashPassword(password);
  getDb().prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email.trim().toLowerCase(), hash);
}

export async function setPassword(userId: number, password: string) {
  const hash = await hashPassword(password);
  const db = getDb();
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
}

export function deleteUser(userId: number) {
  getDb().prepare("DELETE FROM users WHERE id = ?").run(userId);
}

/** Returns the user when email + password match. */
export async function checkCredentials(email: string, password: string) {
  const row = getDb()
    .prepare("SELECT id, email, password_hash AS hash FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as (AdminUser & { hash: string }) | undefined;
  // Always run a hash so a wrong email takes as long as a wrong password.
  const ok = await verifyPassword(password, row?.hash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  return ok && row ? { id: row.id, email: row.email } : null;
}

export async function checkPassword(userId: number, password: string) {
  const row = getDb().prepare("SELECT password_hash AS hash FROM users WHERE id = ?").get(userId) as { hash: string } | undefined;
  return !!row && (await verifyPassword(password, row.hash));
}

export function createSession(userId: number) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), userId, expires);
  return { token, expires: new Date(expires) };
}

export function sessionUser(token: string): AdminUser | null {
  const row = getDb()
    .prepare("SELECT u.id, u.email, s.expires_at AS exp FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?")
    .get(sha256(token)) as (AdminUser & { exp: number }) | undefined;
  if (!row || row.exp < Date.now()) return null;
  return { id: row.id, email: row.email };
}

export function deleteSession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
}

export function deleteOtherSessions(userId: number, keepToken: string) {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").run(userId, sha256(keepToken));
}
