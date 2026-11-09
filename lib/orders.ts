import type { L } from "./catalog";
import type { Locale } from "./i18n";
import type { Governorate } from "./site";

export type WrapKey = "kraft" | "confetti" | "ribbon";
export type PaymentKey = "cod" | "card" | "wallet";
export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

export const WRAPS: WrapKey[] = ["kraft", "confetti", "ribbon"];
export const PAYMENTS: PaymentKey[] = ["cod", "card", "wallet"];
export const ORDER_STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

/** What the customer fills in at checkout. */
export type CheckoutInput = {
  locale: Locale;
  lines: { id: string; plants: string[]; qty: number }[];
  contact: { name: string; phone: string; email: string };
  gift: null | { name: string; phone: string; wrap: WrapKey; note: string; hidePrices: boolean };
  address: { governorate: Governorate; area: string; street: string; apartment: string; date: string; notes: string };
  payment: PaymentKey;
};

/** A placed order. Item names/prices are snapshots, so later catalog edits don't change history. */
export type Order = Omit<CheckoutInput, "lines"> & {
  number: string;
  customerId?: number | null;
  /** Signature for the tracking link (only sent back to the customer who placed it). */
  trackToken?: string;
  createdAt: string;
  status: OrderStatus;
  items: { productId: string; name: L; plants: { id: string; name: L }[]; qty: number; unit: number }[];
  subtotal: number;
  delivery: number;
  total: number;
};

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: "invalid" | "stock" | "unavailable"; item?: string };

export const EG_MOBILE = /^(?:\+?20|0020)?0?1[0125]\d{8}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const cleanPhone = (v: string) => v.replace(/[\s()-]/g, "");
/** 01012345678 -> 201012345678 for wa.me links */
export const waNumber = (phone: string) => "20" + cleanPhone(phone).replace(/^(?:\+|00)?20/, "").replace(/^0/, "");

export type OrderEvent = { status: OrderStatus; at: string };
/** The happy path shown as a timeline (cancelled is shown on its own). */
export const ORDER_STEPS: OrderStatus[] = ["new", "confirmed", "shipped", "delivered"];
