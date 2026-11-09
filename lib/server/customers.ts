// Shopper accounts (separate from admin users in users.ts).
import { getDb, tx } from "./db";
import { hashPassword, newToken, sha256, verifyPassword } from "./password";
import type { Locale } from "@/lib/i18n";

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  locale: Locale;
  emailVerified: boolean;
  marketing: boolean;
  unsubscribeToken: string;
  createdAt: string;
};

type Row = Record<string, unknown>;
const toCustomer = (r: Row): Customer => ({
  id: r.id as number,
  name: r.name as string,
  email: r.email as string,
  phone: r.phone as string,
  locale: (r.locale as Locale) ?? "en",
  emailVerified: !!r.email_verified,
  marketing: !!r.marketing,
  unsubscribeToken: r.unsubscribe_token as string,
  createdAt: r.created_at as string,
});

const SESSION_DAYS = 30;

export async function createCustomer(c: { name: string; email: string; phone: string; password: string; locale: Locale; marketing: boolean }) {
  const hash = await hashPassword(c.password);
  const { lastInsertRowid } = getDb()
    .prepare("INSERT INTO customers (name, email, phone, password_hash, locale, marketing, unsubscribe_token) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(c.name, c.email.trim().toLowerCase(), c.phone, hash, c.locale, c.marketing ? 1 : 0, newToken());
  return Number(lastInsertRowid);
}

export const customerEmailTaken = (email: string) =>
  !!getDb().prepare("SELECT 1 FROM customers WHERE email = ?").get(email.trim().toLowerCase());

export function getCustomer(id: number) {
  const r = getDb().prepare("SELECT * FROM customers WHERE id = ?").get(id) as Row | undefined;
  return r ? toCustomer(r) : null;
}

export function findCustomerByEmail(email: string) {
  const r = getDb().prepare("SELECT * FROM customers WHERE email = ?").get(email.trim().toLowerCase()) as Row | undefined;
  return r ? toCustomer(r) : null;
}

export async function checkCustomerCredentials(email: string, password: string) {
  const r = getDb().prepare("SELECT * FROM customers WHERE email = ?").get(email.trim().toLowerCase()) as Row | undefined;
  const ok = await verifyPassword(password, (r?.password_hash as string) ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  return ok && r ? toCustomer(r) : null;
}

export function updateCustomer(id: number, c: { name: string; phone: string; marketing: boolean; locale: Locale }) {
  getDb().prepare("UPDATE customers SET name = ?, phone = ?, marketing = ?, locale = ? WHERE id = ?").run(c.name, c.phone, c.marketing ? 1 : 0, c.locale, id);
}

export async function setCustomerPassword(id: number, password: string) {
  getDb().prepare("UPDATE customers SET password_hash = ? WHERE id = ?").run(await hashPassword(password), id);
}

export function markVerified(id: number) {
  getDb().prepare("UPDATE customers SET email_verified = 1 WHERE id = ?").run(id);
}

/* sessions */

export function createCustomerSession(customerId: number) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  const db = getDb();
  db.prepare("DELETE FROM customer_sessions WHERE expires_at < ?").run(Date.now());
  db.prepare("INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), customerId, expires);
  return { token, expires: new Date(expires) };
}

export function customerFromSession(token: string) {
  const r = getDb()
    .prepare("SELECT c.*, s.expires_at AS exp FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = ?")
    .get(sha256(token)) as Row | undefined;
  if (!r || (r.exp as number) < Date.now()) return null;
  return toCustomer(r);
}

export function deleteCustomerSession(token: string) {
  getDb().prepare("DELETE FROM customer_sessions WHERE token_hash = ?").run(sha256(token));
}

export function deleteOtherCustomerSessions(customerId: number, keepToken: string) {
  getDb().prepare("DELETE FROM customer_sessions WHERE customer_id = ? AND token_hash != ?").run(customerId, sha256(keepToken));
}

/* one-time tokens for email links */

export type TokenPurpose = "verify" | "reset";

export function createCustomerToken(customerId: number, purpose: TokenPurpose, ttlHours: number) {
  const token = newToken();
  const db = getDb();
  db.prepare("DELETE FROM customer_tokens WHERE expires_at < ? OR (customer_id = ? AND purpose = ?)").run(Date.now(), customerId, purpose);
  db.prepare("INSERT INTO customer_tokens (token_hash, customer_id, purpose, expires_at) VALUES (?, ?, ?, ?)").run(
    sha256(token), customerId, purpose, Date.now() + ttlHours * 3600_000,
  );
  return token;
}

/** Returns the customer id and burns the token, or null if it's unknown/expired. */
export function consumeCustomerToken(token: string, purpose: TokenPurpose) {
  return tx(() => {
    const db = getDb();
    const r = db.prepare("SELECT customer_id AS id, expires_at AS exp FROM customer_tokens WHERE token_hash = ? AND purpose = ?").get(sha256(token), purpose) as
      | { id: number; exp: number }
      | undefined;
    if (!r) return null;
    db.prepare("DELETE FROM customer_tokens WHERE token_hash = ?").run(sha256(token));
    return r.exp >= Date.now() ? r.id : null;
  });
}

/* marketing */

export function customerByUnsubscribeToken(token: string) {
  const r = getDb().prepare("SELECT * FROM customers WHERE unsubscribe_token = ?").get(token) as Row | undefined;
  return r ? toCustomer(r) : null;
}

export function setMarketing(id: number, on: boolean) {
  getDb().prepare("UPDATE customers SET marketing = ? WHERE id = ?").run(on ? 1 : 0, id);
}

/** Customers who said yes to offers and confirmed their email address. */
export const marketingAudience = () =>
  (getDb().prepare("SELECT * FROM customers WHERE marketing = 1 AND email_verified = 1 ORDER BY id").all() as Row[]).map(toCustomer);

export function listCustomers() {
  const rows = getDb()
    .prepare(
      `SELECT c.*, COUNT(o.id) AS orders, COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0) AS spent
       FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.id DESC`,
    )
    .all() as Row[];
  return rows.map((r) => ({ ...toCustomer(r), orders: r.orders as number, spent: r.spent as number }));
}
