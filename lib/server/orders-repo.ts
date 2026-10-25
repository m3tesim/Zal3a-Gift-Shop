import { z } from "zod";
import { getDb, json, tx } from "./db";
import { readCatalog } from "./catalog-repo";
import { MAX_QTY, linePrice, plantOf, productOf, soldOut } from "@/lib/catalog";
import { deliveryFee } from "@/lib/site";
import {
  EG_MOBILE, EMAIL, ORDER_STATUSES, PAYMENTS, WRAPS, cleanPhone,
  type Order, type OrderStatus, type PlaceOrderResult,
} from "@/lib/orders";

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);
const phone = z.string().transform(cleanPhone).refine((v) => EG_MOBILE.test(v));

const CheckoutSchema = z.object({
  locale: z.enum(["en", "ar"]),
  lines: z
    .array(z.object({ id: text(64), plants: z.array(text(64)).min(1).max(6), qty: z.number().int().min(1).max(MAX_QTY) }))
    .min(1)
    .max(30),
  contact: z.object({ name: required(80), phone, email: text(120).refine((v) => !v || EMAIL.test(v)) }),
  gift: z
    .object({ name: required(80), phone, wrap: z.enum(WRAPS), note: text(200), hidePrices: z.boolean() })
    .nullable(),
  address: z.object({
    governorate: z.enum(["cairo", "giza", "alexandria", "other"]),
    area: required(120),
    street: required(200),
    apartment: text(120),
    date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
    notes: text(300),
  }),
  payment: z.enum(PAYMENTS),
});

/** Validates against live prices + stock, decrements stock and saves the order, all in one transaction. */
export function placeOrder(raw: unknown): PlaceOrderResult {
  const parsed = CheckoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const L = input.locale;

  return tx((): PlaceOrderResult => {
    const c = readCatalog();
    const items: Order["items"] = [];
    const needPots = new Map<string, number>();
    const needPlants = new Map<string, number>();

    for (const line of input.lines) {
      const p = productOf(c, line.id);
      const plants = line.plants.map((id) => plantOf(c, id));
      if (!p || line.plants.length !== p.slots.length || plants.some((x) => !x)) {
        return { ok: false, error: "unavailable", item: p?.name[L] ?? line.id };
      }
      needPots.set(p.id, (needPots.get(p.id) ?? 0) + line.qty);
      for (const id of line.plants) needPlants.set(id, (needPlants.get(id) ?? 0) + line.qty);
      items.push({
        productId: p.id,
        name: p.name,
        plants: plants.map((x) => ({ id: x!.id, name: x!.name })),
        qty: line.qty,
        unit: linePrice(c, p, line.plants).unit,
      });
    }

    for (const [id, n] of needPots) {
      const p = productOf(c, id)!;
      if (soldOut(p) || (p.stock !== null && p.stock < n)) return { ok: false, error: "stock", item: p.name[L] };
    }
    for (const [id, n] of needPlants) {
      const p = plantOf(c, id)!;
      if (soldOut(p) || (p.stock !== null && p.stock < n)) return { ok: false, error: "stock", item: p.name[L] };
    }

    const db = getDb();
    const decPot = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL");
    const decPlant = db.prepare("UPDATE plants SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL");
    needPots.forEach((n, id) => decPot.run(n, id));
    needPlants.forEach((n, id) => decPlant.run(n, id));

    const subtotal = items.reduce((s, i) => s + i.unit * i.qty, 0);
    const delivery = deliveryFee(input.address.governorate, subtotal);
    const order: Order = {
      number: "",
      createdAt: new Date().toISOString(),
      status: "new",
      locale: L,
      items,
      subtotal,
      delivery,
      total: subtotal + delivery,
      contact: input.contact,
      gift: input.gift,
      address: input.address,
      payment: input.payment,
    };
    const { lastInsertRowid } = db
      .prepare("INSERT INTO orders (total, customer, data, created_at) VALUES (?, ?, '{}', ?)")
      .run(order.total, order.contact.name, order.createdAt);
    order.number = `ZL-${1000 + Number(lastInsertRowid)}`;
    db.prepare("UPDATE orders SET number = ?, data = ? WHERE id = ?").run(order.number, JSON.stringify(order), lastInsertRowid);
    return { ok: true, order };
  });
}

type Row = { number: string; status: OrderStatus; data: string };
const toOrder = (r: Row): Order => ({ ...json<Order>(r.data, {} as Order), number: r.number, status: r.status });

export function listOrders(status?: OrderStatus) {
  const rows = status
    ? getDb().prepare("SELECT number, status, data FROM orders WHERE status = ? ORDER BY id DESC").all(status)
    : getDb().prepare("SELECT number, status, data FROM orders ORDER BY id DESC").all();
  return (rows as Row[]).map(toOrder);
}

export function getOrder(number: string) {
  const r = getDb().prepare("SELECT number, status, data FROM orders WHERE number = ?").get(number) as Row | undefined;
  return r ? toOrder(r) : null;
}

export function setOrderStatus(number: string, status: OrderStatus) {
  if (!ORDER_STATUSES.includes(status)) return;
  getDb().prepare("UPDATE orders SET status = ? WHERE number = ?").run(status, number);
}

export function orderStats() {
  const db = getDb();
  const byStatus = Object.fromEntries(
    (db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all() as { status: string; n: number }[]).map((r) => [r.status, r.n]),
  ) as Partial<Record<OrderStatus, number>>;
  const revenue = (db.prepare("SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE status != 'cancelled'").get() as { s: number }).s;
  return { byStatus, revenue };
}
