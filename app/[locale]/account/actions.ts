"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { currentCustomer, endCustomerSession, startCustomerSession } from "@/lib/server/customer-auth";
import {
  checkCustomerCredentials, consumeCustomerToken, createCustomer, customerByUnsubscribeToken, customerEmailTaken,
  deleteOtherCustomerSessions, findCustomerByEmail, getCustomer, setCustomerPassword, setMarketing, updateCustomer,
} from "@/lib/server/customers";
import { loginBlocked, loginFailed, loginSucceeded } from "@/lib/server/auth";
import { sendResetEmail, sendVerifyEmail } from "@/lib/server/notify";
import { authorName, customerReview, upsertReview } from "@/lib/server/reviews-repo";
import { findOrderByPhone, hasReceived, orderEvents } from "@/lib/server/orders-repo";
import { getProduct } from "@/lib/server/catalog-repo";
import { revalidateStore } from "@/lib/server/revalidate";
import { EG_MOBILE, cleanPhone, type Order, type OrderEvent } from "@/lib/orders";
import type { Locale } from "@/lib/i18n";
import type { Me } from "@/lib/store";

type ErrorKey = "name" | "email" | "password" | "phone" | "exists" | "login" | "tooMany" | "generic";
export type AccountResult = { ok: true } | { ok: false; error: ErrorKey };

const locale = z.enum(["en", "ar"]);
const email = z.email();
const password = z.string().min(8).max(200);
const phone = z.string().transform(cleanPhone).refine((v) => v === "" || EG_MOBILE.test(v));

const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
const toMe = (c: { name: string; email: string; phone: string; emailVerified: boolean; marketing: boolean }): Me => ({
  name: c.name,
  email: c.email,
  phone: c.phone,
  verified: c.emailVerified,
  marketing: c.marketing,
});

export async function meAction(): Promise<Me | null> {
  const c = await currentCustomer();
  return c ? toMe(c) : null;
}

export async function registerAction(input: {
  locale: Locale;
  name: string;
  email: string;
  phone: string;
  password: string;
  marketing: boolean;
}): Promise<AccountResult> {
  const L = locale.parse(input.locale);
  if (!input.name.trim() || input.name.length > 80) return { ok: false, error: "name" };
  const e = email.safeParse(input.email.trim());
  if (!e.success) return { ok: false, error: "email" };
  const ph = phone.safeParse(input.phone);
  if (!ph.success) return { ok: false, error: "phone" };
  if (!password.safeParse(input.password).success) return { ok: false, error: "password" };

  const key = `register|${await ip()}`;
  if (loginBlocked(key)) return { ok: false, error: "tooMany" };
  loginFailed(key); // counts sign-ups per IP, too
  if (customerEmailTaken(e.data)) return { ok: false, error: "exists" };

  const id = await createCustomer({ name: input.name.trim(), email: e.data, phone: ph.data, password: input.password, locale: L, marketing: input.marketing });
  await startCustomerSession(id);
  const c = getCustomer(id)!;
  after(() => sendVerifyEmail(c, L));
  return { ok: true };
}

export async function loginCustomerAction(input: { email: string; password: string }): Promise<AccountResult> {
  const key = `customer|${await ip()}|${input.email.trim().toLowerCase()}`;
  if (loginBlocked(key)) return { ok: false, error: "tooMany" };
  const c = await checkCustomerCredentials(input.email, input.password);
  if (!c) {
    loginFailed(key);
    return { ok: false, error: "login" };
  }
  loginSucceeded(key);
  await startCustomerSession(c.id);
  return { ok: true };
}

export async function logoutCustomerAction() {
  await endCustomerSession();
}

/** Always says "sent" so nobody can use this form to find out who has an account. */
export async function forgotPasswordAction(input: { locale: Locale; email: string }): Promise<AccountResult> {
  const key = `forgot|${await ip()}`;
  if (loginBlocked(key)) return { ok: false, error: "tooMany" };
  loginFailed(key);
  const c = email.safeParse(input.email.trim()).success ? findCustomerByEmail(input.email) : null;
  if (c) after(() => sendResetEmail(c, locale.parse(input.locale)));
  return { ok: true };
}

export async function resetPasswordAction(input: { token: string; password: string }): Promise<AccountResult> {
  if (!password.safeParse(input.password).success) return { ok: false, error: "password" };
  const id = consumeCustomerToken(input.token, "reset");
  if (!id) return { ok: false, error: "generic" };
  await setCustomerPassword(id, input.password);
  const token = await startCustomerSession(id);
  deleteOtherCustomerSessions(id, token); // sign out everywhere else
  return { ok: true };
}

export async function updateProfileAction(input: { locale: Locale; name: string; phone: string; marketing: boolean }): Promise<AccountResult> {
  const c = await currentCustomer();
  if (!c) return { ok: false, error: "generic" };
  if (!input.name.trim() || input.name.length > 80) return { ok: false, error: "name" };
  const ph = phone.safeParse(input.phone);
  if (!ph.success) return { ok: false, error: "phone" };
  updateCustomer(c.id, { name: input.name.trim(), phone: ph.data, marketing: input.marketing, locale: locale.parse(input.locale) });
  return { ok: true };
}

export async function resendVerifyAction(input: { locale: Locale }): Promise<AccountResult> {
  const c = await currentCustomer();
  if (!c || c.emailVerified) return { ok: true };
  const key = `verify|${c.id}`;
  if (loginBlocked(key)) return { ok: false, error: "tooMany" };
  loginFailed(key);
  after(() => sendVerifyEmail(c, locale.parse(input.locale)));
  return { ok: true };
}

/* ───────────── reviews ───────────── */

export type ReviewState =
  | { state: "guest" }
  | { state: "wait" }
  | { state: "ok"; review: { rating: number; body: string; visible: boolean } | null };

export async function reviewStateAction(productId: string): Promise<ReviewState> {
  const c = await currentCustomer();
  if (!c) return { state: "guest" };
  if (!hasReceived(c.id, productId)) return { state: "wait" };
  const r = customerReview(c.id, productId);
  return { state: "ok", review: r ? { rating: r.rating, body: r.body, visible: r.visible } : null };
}

export async function submitReviewAction(input: { locale: Locale; productId: string; rating: number; body: string }): Promise<{ ok: boolean }> {
  const c = await currentCustomer();
  const rating = z.number().int().min(1).max(5).safeParse(input.rating);
  const body = z.string().trim().min(10).max(2000).safeParse(input.body);
  if (!c || !rating.success || !body.success || !getProduct(input.productId)) return { ok: false };
  if (!hasReceived(c.id, input.productId)) return { ok: false };
  upsertReview({ productId: input.productId, customerId: c.id, author: authorName(c.name), rating: rating.data, body: body.data, locale: locale.parse(input.locale) });
  revalidateStore();
  return { ok: true };
}

/* ───────────── tracking ───────────── */

export async function trackOrderAction(input: { number: string; phone: string }): Promise<{ order: Order; events: OrderEvent[] } | null> {
  const key = `track|${await ip()}`;
  if (loginBlocked(key)) return null;
  const o = findOrderByPhone(input.number, input.phone);
  if (!o) {
    loginFailed(key);
    return null;
  }
  return { order: o, events: orderEvents(o.number) };
}

/* ───────────── unsubscribe ───────────── */

export async function unsubscribeAction(token: string): Promise<{ ok: boolean }> {
  const c = customerByUnsubscribeToken(token);
  if (!c) return { ok: false };
  setMarketing(c.id, false);
  return { ok: true };
}
