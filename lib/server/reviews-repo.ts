import { getDb } from "./db";
import type { Locale } from "@/lib/i18n";

export type Review = {
  id: number;
  productId: string;
  customerId: number | null;
  author: string;
  rating: number;
  body: string;
  reply: string;
  locale: Locale;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

type Row = Record<string, unknown>;
const toReview = (row: Row): Review => ({
  id: row.id as number,
  productId: row.product_id as string,
  customerId: (row.customer_id as number) ?? null,
  author: row.author as string,
  rating: row.rating as number,
  body: row.body as string,
  reply: row.reply as string,
  locale: row.locale as Locale,
  visible: !!row.visible,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

/** "Mona Adel" -> "Mona A." */
export const authorName = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

export const productReviews = (productId: string) =>
  (getDb().prepare("SELECT * FROM reviews WHERE product_id = ? AND visible = 1 ORDER BY created_at DESC").all(productId) as Row[]).map(toReview);

/** Best recent reviews for the home page. */
export const featuredReviews = (limit = 6) =>
  (getDb().prepare("SELECT * FROM reviews WHERE visible = 1 AND rating >= 4 AND length(body) >= 20 ORDER BY created_at DESC LIMIT ?").all(limit) as Row[]).map(toReview);

export function customerReview(customerId: number, productId: string) {
  const row = getDb().prepare("SELECT * FROM reviews WHERE customer_id = ? AND product_id = ?").get(customerId, productId) as Row | undefined;
  return row ? toReview(row) : null;
}

/** One review per customer per pot; posting again updates it (visibility stays as the admin left it). */
export function upsertReview(review: { productId: string; customerId: number; author: string; rating: number; body: string; locale: Locale }) {
  getDb()
    .prepare(
      `INSERT INTO reviews (product_id, customer_id, author, rating, body, locale) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(product_id, customer_id) DO UPDATE SET rating = excluded.rating, body = excluded.body, locale = excluded.locale,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    )
    .run(review.productId, review.customerId, review.author, review.rating, review.body, review.locale);
}

export function adminReviews(filter: { visible?: boolean; productId?: string } = {}) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (filter.visible !== undefined) {
    where.push("visible = ?");
    args.push(filter.visible ? 1 : 0);
  }
  if (filter.productId) {
    where.push("product_id = ?");
    args.push(filter.productId);
  }
  const sql = `SELECT * FROM reviews ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
  return (getDb().prepare(sql).all(...args) as Row[]).map(toReview);
}

export function updateReview(id: number, changes: { author: string; rating: number; body: string; reply: string; visible: boolean }) {
  getDb()
    .prepare("UPDATE reviews SET author = ?, rating = ?, body = ?, reply = ?, visible = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
    .run(changes.author, changes.rating, changes.body, changes.reply, changes.visible ? 1 : 0, id);
}

export function deleteReview(id: number) {
  getDb().prepare("DELETE FROM reviews WHERE id = ?").run(id);
}
