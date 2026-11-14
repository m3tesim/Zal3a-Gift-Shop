import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getDb, json, setting, transaction } from "./db";
import type { Customer } from "./customers";
import { readCatalog } from "./catalog-repo";
import { MAX_QTY, linePrice, plantOf, productOf, soldOut } from "@/lib/catalog";
import { deliveryFee } from "@/lib/site";
import {
  EG_MOBILE, EMAIL, ORDER_STATUSES, PAYMENTS, WRAPS, cleanPhone,
  type Order, type OrderEvent, type OrderStatus, type PlaceOrderResult,
} from "@/lib/orders";

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);
const phone = z.string().transform(cleanPhone).refine((value) => EG_MOBILE.test(value));

const CheckoutSchema = z.object({
  locale: z.enum(["en", "ar"]),
  lines: z
    .array(z.object({ id: text(64), plants: z.array(text(64)).min(1).max(6), qty: z.number().int().min(1).max(MAX_QTY) }))
    .min(1)
    .max(30),
  contact: z.object({ name: required(80), phone, email: text(120).refine((value) => !value || EMAIL.test(value)) }),
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
export function placeOrder(raw: unknown, customer: Customer | null = null): PlaceOrderResult {
  const parsed = CheckoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;
  const locale = input.locale;

  return transaction((): PlaceOrderResult => {
    const catalog = readCatalog();
    const items: Order["items"] = [];
    const needPots = new Map<string, number>();
    const needPlants = new Map<string, number>();

    for (const line of input.lines) {
      const product = productOf(catalog, line.id);
      const plants = line.plants.map((id) => plantOf(catalog, id));
      if (!product || line.plants.length !== product.slots.length || plants.some((plant) => !plant)) {
        return { ok: false, error: "unavailable", item: product?.name[locale] ?? line.id };
      }
      needPots.set(product.id, (needPots.get(product.id) ?? 0) + line.qty);
      for (const id of line.plants) needPlants.set(id, (needPlants.get(id) ?? 0) + line.qty);
      items.push({
        productId: product.id,
        name: product.name,
        plants: plants.map((plant) => ({ id: plant!.id, name: plant!.name })),
        qty: line.qty,
        unit: linePrice(catalog, product, line.plants).unit,
      });
    }

    for (const [id, quantity] of needPots) {
      const product = productOf(catalog, id)!;
      if (soldOut(product) || (product.stock !== null && product.stock < quantity)) return { ok: false, error: "stock", item: product.name[locale] };
    }
    for (const [id, quantity] of needPlants) {
      const plant = plantOf(catalog, id)!;
      if (soldOut(plant) || (plant.stock !== null && plant.stock < quantity)) return { ok: false, error: "stock", item: plant.name[locale] };
    }

    const db = getDb();
    const decPot = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL");
    const decPlant = db.prepare("UPDATE plants SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL");
    needPots.forEach((quantity, id) => decPot.run(quantity, id));
    needPlants.forEach((quantity, id) => decPlant.run(quantity, id));

    const subtotal = items.reduce((sum, item) => sum + item.unit * item.qty, 0);
    const delivery = deliveryFee(input.address.governorate, subtotal);
    const order: Order = {
      number: "",
      customerId: customer?.id ?? null,
      createdAt: new Date().toISOString(),
      status: "new",
      locale: locale,
      items,
      subtotal,
      delivery,
      total: subtotal + delivery,
      contact: { ...input.contact, email: input.contact.email || customer?.email || "" },
      gift: input.gift,
      address: input.address,
      payment: input.payment,
    };
    const { lastInsertRowid } = db
      .prepare("INSERT INTO orders (total, customer, data, created_at, customer_id, email, phone) VALUES (?, ?, '{}', ?, ?, ?, ?)")
      .run(order.total, order.contact.name, order.createdAt, order.customerId ?? null, order.contact.email, order.contact.phone);
    order.number = `ZL-${1000 + Number(lastInsertRowid)}`;
    db.prepare("UPDATE orders SET number = ?, data = ? WHERE id = ?").run(order.number, JSON.stringify(order), lastInsertRowid);
    db.prepare("INSERT INTO order_events (order_number, status, at) VALUES (?, 'new', ?)").run(order.number, order.createdAt);
    return { ok: true, order };
  });
}

type Row = { number: string; status: OrderStatus; data: string };
const toOrder = (row: Row): Order => ({ ...json<Order>(row.data, {} as Order), number: row.number, status: row.status });

export function listOrders(status?: OrderStatus) {
  const rows = status
    ? getDb().prepare("SELECT number, status, data FROM orders WHERE status = ? ORDER BY id DESC").all(status)
    : getDb().prepare("SELECT number, status, data FROM orders ORDER BY id DESC").all();
  return (rows as Row[]).map(toOrder);
}

export function getOrder(number: string) {
  const row = getDb().prepare("SELECT number, status, data FROM orders WHERE number = ?").get(number) as Row | undefined;
  return row ? toOrder(row) : null;
}

/** Returns the updated order when the status actually changed (so the caller can email the customer). */
export function setOrderStatus(number: string, status: OrderStatus) {
  if (!ORDER_STATUSES.includes(status)) return null;
  return transaction(() => {
    const before = getOrder(number);
    if (!before || before.status === status) return null;
    const db = getDb();
    db.prepare("UPDATE orders SET status = ? WHERE number = ?").run(status, number);
    db.prepare("INSERT INTO order_events (order_number, status) VALUES (?, ?)").run(number, status);
    return { ...before, status };
  });
}

// node:sqlite rows have a null prototype, which React can't send to the browser, so copy them into plain objects.
export const orderEvents = (number: string): OrderEvent[] =>
  (getDb().prepare("SELECT status, at FROM order_events WHERE order_number = ? ORDER BY id").all(number) as OrderEvent[]).map((statusEvent) => ({
    status: statusEvent.status,
    at: statusEvent.at,
  }));

export function customerOrders(customerId: number) {
  return (getDb().prepare("SELECT number, status, data FROM orders WHERE customer_id = ? ORDER BY id DESC").all(customerId) as Row[]).map(toOrder);
}

/** Guest tracking: the order number plus the phone used at checkout. */
export function findOrderByPhone(number: string, phone: string) {
  const order = getOrder(number.trim().toUpperCase());
  const last9 = (phone: string) => cleanPhone(phone).slice(-9);
  return order && last9(order.contact.phone) === last9(phone) && last9(phone).length === 9 ? order : null;
}

/** Signed links in emails let customers open their tracking page without typing anything. */
const trackingSecret = () => setting("tracking_secret", () => randomBytes(32).toString("hex"));
export const trackingToken = (number: string) => createHmac("sha256", trackingSecret()).update(number).digest("base64url").slice(0, 24);
export function checkTrackingToken(number: string, token: string) {
  const expected = Buffer.from(trackingToken(number));
  const provided = Buffer.from(token);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

/** True when this customer has a delivered order containing the product (= may review it). */
export function hasReceived(customerId: number, productId: string) {
  return customerOrders(customerId).some((order) => order.status === "delivered" && order.items.some((item) => item.productId === productId));
}

export function orderStats() {
  const db = getDb();
  const byStatus = Object.fromEntries(
    (db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all() as { status: string; n: number }[]).map((row) => [row.status, row.n]),
  ) as Partial<Record<OrderStatus, number>>;
  const revenue = (db.prepare("SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE status != 'cancelled'").get() as { s: number }).s;
  return { byStatus, revenue };
}
