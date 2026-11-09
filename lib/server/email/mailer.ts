// Sends email over SMTP (any provider: Gmail, Zoho, Brevo, Resend, SES…) and keeps a copy of
// every message in the `emails` table. Without SMTP settings, emails are saved as "not sent"
// so they can still be previewed in /admin/emails.
import nodemailer, { type Transporter } from "nodemailer";
import { getDb } from "../db";

export type EmailKind = "order" | "account" | "offer" | "test";
export type EmailStatus = "sent" | "failed" | "skipped";

export const emailConfigured = () => !!(process.env.SMTP_HOST && process.env.MAIL_FROM);

/** Public address of the shop, for links and images inside emails (read at runtime). */
export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

let transport: Transporter | null = null;
function transporter() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

const toText = (html: string) =>
  html
    .replace(/<(style|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h\d)>/gi, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function sendEmail(m: {
  to: string;
  subject: string;
  html: string;
  kind: EmailKind;
  orderNumber?: string;
  campaignId?: number;
  unsubscribeUrl?: string;
}): Promise<EmailStatus> {
  let status: EmailStatus = "skipped";
  let error = emailConfigured() ? "" : "Email isn't set up yet (add SMTP settings to .env.local)";
  if (emailConfigured()) {
    try {
      await transporter().sendMail({
        from: process.env.MAIL_FROM,
        to: m.to,
        subject: m.subject,
        html: m.html,
        text: toText(m.html),
        headers: m.unsubscribeUrl ? { "List-Unsubscribe": `<${m.unsubscribeUrl}>` } : undefined,
      });
      status = "sent";
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
      console.error("Email failed", m.to, error);
    }
  }
  getDb()
    .prepare("INSERT INTO emails (to_addr, subject, html, kind, status, error, order_number, campaign_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(m.to, m.subject, m.html, m.kind, status, error, m.orderNumber ?? null, m.campaignId ?? null);
  return status;
}

export type EmailRow = {
  id: number;
  to: string;
  subject: string;
  kind: EmailKind;
  status: EmailStatus;
  error: string;
  orderNumber: string | null;
  createdAt: string;
};

export function listEmails({ orderNumber, limit = 100 }: { orderNumber?: string; limit?: number } = {}) {
  const cols = "id, to_addr AS \"to\", subject, kind, status, error, order_number AS orderNumber, created_at AS createdAt";
  const rows = orderNumber
    ? getDb().prepare(`SELECT ${cols} FROM emails WHERE order_number = ? ORDER BY id DESC`).all(orderNumber)
    : getDb().prepare(`SELECT ${cols} FROM emails ORDER BY id DESC LIMIT ?`).all(limit);
  return (rows as unknown as EmailRow[]).map((r) => ({ ...r }));
}

export function emailHtml(id: number) {
  return (getDb().prepare("SELECT html FROM emails WHERE id = ?").get(id) as { html: string } | undefined)?.html ?? null;
}
