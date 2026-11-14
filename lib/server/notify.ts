// Customer emails for order steps and account links.
import type { Order, OrderStatus } from "@/lib/orders";
import type { Locale } from "@/lib/i18n";
import { sendEmail, siteUrl } from "./email/mailer";
import { orderStatusEmail, resetEmail, verifyEmail } from "./email/templates";
import { trackingToken } from "./orders-repo";
import { createCustomerToken, type Customer } from "./customers";

export function trackUrl(order: Pick<Order, "number" | "locale">) {
  return `${siteUrl()}/${order.locale}/track?order=${encodeURIComponent(order.number)}&t=${trackingToken(order.number)}`;
}

/** Emails the customer about their order's new step. Does nothing if they left no email. */
export async function notifyOrderStatus(order: Order, status: OrderStatus) {
  if (!order.contact.email) return;
  const track = trackUrl(order);
  const review = order.customerId ? `${siteUrl()}/${order.locale}/account/orders/${order.number}` : undefined;
  const { subject, html } = orderStatusEmail(order, status, { track, review });
  await sendEmail({ to: order.contact.email, subject, html, kind: "order", orderNumber: order.number });
}

export async function sendVerifyEmail(customer: Customer, locale: Locale = customer.locale) {
  const token = createCustomerToken(customer.id, "verify", 48);
  const { subject, html } = verifyEmail(locale, customer.name, `${siteUrl()}/api/account/verify?t=${token}&l=${locale}`);
  return sendEmail({ to: customer.email, subject, html, kind: "account" });
}

export async function sendResetEmail(customer: Customer, locale: Locale = customer.locale) {
  const token = createCustomerToken(customer.id, "reset", 1);
  const { subject, html } = resetEmail(locale, `${siteUrl()}/${locale}/account/reset?t=${token}`);
  return sendEmail({ to: customer.email, subject, html, kind: "account" });
}
