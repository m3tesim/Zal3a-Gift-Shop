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
const phone = z.string().transform(cleanPhone).refine((value) => value === "" || EG_MOBILE.test(value));

const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
const toMe = (customer: { name: string; email: string; phone: string; emailVerified: boolean; marketing: boolean }): Me => ({
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  verified: customer.emailVerified,
  marketing: customer.marketing,
});

export async function meAction(): Promise<Me | null> {
  const customer = await currentCustomer();
  return customer ? toMe(customer) : null;
}

export async function registerAction(input: {
  locale: Locale;
  name: string;
  email: string;
  phone: string;
  password: string;
  marketing: boolean;
}): Promise<AccountResult> {
  const validLocale = locale.parse(input.locale);
  if (!input.name.trim() || input.name.length > 80) return { ok: false, error: "name" };
  const emailResult = email.safeParse(input.email.trim());
  if (!emailResult.success) return { ok: false, error: "email" };
  const phoneResult = phone.safeParse(input.phone);
  if (!phoneResult.success) return { ok: false, error: "phone" };
  if (!password.safeParse(input.password).success) return { ok: false, error: "password" };

  const key = `register|${await ip()}`;
  if (loginBlocked(key)) return { ok: false, error: "tooMany" };
  loginFailed(key); // counts sign-ups per IP, too
  if (customerEmailTaken(emailResult.data)) return { ok: false, error: "exists" };

  const id = await createCustomer({ name: input.name.trim(), email: emailResult.data, phone: phoneResult.data, password: input.password, locale: validLocale, marketing: input.marketing });
  await startCustomerSession(id);
  const customer = getCustomer(id)!;
  after(() => sendVerifyEmail(customer, validLocale));
  return { ok: true };
}

export async function loginCustomerAction(input: { email: string; password: string }): Promise<AccountResult> {
  const key = `customer|${await ip()}|${input.email.trim().toLowerCase()}`;
  if (loginBlocked(key)) return { ok: false, error: "tooMany" };
  const customer = await checkCustomerCredentials(input.email, input.password);
  if (!customer) {
    loginFailed(key);
    return { ok: false, error: "login" };
  }
  loginSucceeded(key);
  await startCustomerSession(customer.id);
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
  const customer = email.safeParse(input.email.trim()).success ? findCustomerByEmail(input.email) : null;
  if (customer) after(() => sendResetEmail(customer, locale.parse(input.locale)));
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
  const customer = await currentCustomer();
  if (!customer) return { ok: false, error: "generic" };
  if (!input.name.trim() || input.name.length > 80) return { ok: false, error: "name" };
  const phoneResult = phone.safeParse(input.phone);
  if (!phoneResult.success) return { ok: false, error: "phone" };
  updateCustomer(customer.id, { name: input.name.trim(), phone: phoneResult.data, marketing: input.marketing, locale: locale.parse(input.locale) });
  return { ok: true };
}

export async function resendVerifyAction(input: { locale: Locale }): Promise<AccountResult> {
  const customer = await currentCustomer();
  if (!customer || customer.emailVerified) return { ok: true };
  const key = `verify|${customer.id}`;
  if (loginBlocked(key)) return { ok: false, error: "tooMany" };
  loginFailed(key);
  after(() => sendVerifyEmail(customer, locale.parse(input.locale)));
  return { ok: true };
}

/* ───────────── reviews ───────────── */

export type ReviewState =
  | { state: "guest" }
  | { state: "wait" }
  | { state: "ok"; review: { rating: number; body: string; visible: boolean } | null };

export async function reviewStateAction(productId: string): Promise<ReviewState> {
  const customer = await currentCustomer();
  if (!customer) return { state: "guest" };
  if (!hasReceived(customer.id, productId)) return { state: "wait" };
  const review = customerReview(customer.id, productId);
  return { state: "ok", review: review ? { rating: review.rating, body: review.body, visible: review.visible } : null };
}

export async function submitReviewAction(input: { locale: Locale; productId: string; rating: number; body: string }): Promise<{ ok: boolean }> {
  const customer = await currentCustomer();
  const rating = z.number().int().min(1).max(5).safeParse(input.rating);
  const body = z.string().trim().min(10).max(2000).safeParse(input.body);
  if (!customer || !rating.success || !body.success || !getProduct(input.productId)) return { ok: false };
  if (!hasReceived(customer.id, input.productId)) return { ok: false };
  upsertReview({ productId: input.productId, customerId: customer.id, author: authorName(customer.name), rating: rating.data, body: body.data, locale: locale.parse(input.locale) });
  revalidateStore();
  return { ok: true };
}

/* ───────────── tracking ───────────── */

export async function trackOrderAction(input: { number: string; phone: string }): Promise<{ order: Order; events: OrderEvent[] } | null> {
  const key = `track|${await ip()}`;
  if (loginBlocked(key)) return null;
  const order = findOrderByPhone(input.number, input.phone);
  if (!order) {
    loginFailed(key);
    return null;
  }
  return { order, events: orderEvents(order.number) };
}

/* ───────────── unsubscribe ───────────── */

export async function unsubscribeAction(token: string): Promise<{ ok: boolean }> {
  const customer = customerByUnsubscribeToken(token);
  if (!customer) return { ok: false };
  setMarketing(customer.id, false);
  return { ok: true };
}
