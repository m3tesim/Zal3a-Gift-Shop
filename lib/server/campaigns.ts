// Offer emails to customers who opted in (and confirmed their email address).
import { getDb, json } from "./db";
import { marketingAudience } from "./customers";
import { sendEmail, siteUrl } from "./email/mailer";
import { offerEmail } from "./email/templates";
import type { L } from "@/lib/catalog";

export type Campaign = {
  id: number;
  subject: L;
  body: L;
  ctaLabel: L;
  ctaUrl: string;
  image: string | null;
  status: "sending" | "sent";
  recipients: number;
  sent: number;
  failed: number;
  createdAt: string;
};

type Row = Record<string, unknown>;
const EMPTY: L = { en: "", ar: "" };
const toCampaign = (r: Row): Campaign => ({
  id: r.id as number,
  subject: json(r.subject, EMPTY),
  body: json(r.body, EMPTY),
  ctaLabel: json(r.cta_label, EMPTY),
  ctaUrl: r.cta_url as string,
  image: (r.image as string) ?? null,
  status: r.status as Campaign["status"],
  recipients: r.recipients as number,
  sent: r.sent as number,
  failed: r.failed as number,
  createdAt: r.created_at as string,
});

export type CampaignInput = Pick<Campaign, "subject" | "body" | "ctaLabel" | "ctaUrl" | "image">;

/** Absolute URLs for links and images inside emails. */
export const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`);

export function renderOffer(c: CampaignInput, locale: "en" | "ar", unsubscribeUrl: string) {
  return offerEmail(
    locale,
    {
      title: c.subject[locale],
      body: c.body[locale],
      ctaLabel: c.ctaLabel[locale],
      ctaUrl: c.ctaUrl ? absolute(c.ctaUrl.replace("{lang}", locale)) : "",
      image: c.image ? absolute(c.image) : null,
    },
    unsubscribeUrl,
  );
}

export function createCampaign(c: CampaignInput) {
  const audience = marketingAudience().length;
  const { lastInsertRowid } = getDb()
    .prepare("INSERT INTO campaigns (subject, body, cta_label, cta_url, image, recipients) VALUES (?, ?, ?, ?, ?, ?)")
    .run(JSON.stringify(c.subject), JSON.stringify(c.body), JSON.stringify(c.ctaLabel), c.ctaUrl, c.image, audience);
  return Number(lastInsertRowid);
}

/** Sends one by one (kind to the mail server) and keeps the counters up to date for the admin page. */
export async function runCampaign(id: number) {
  const db = getDb();
  const c = toCampaign(db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as Row);
  const bump = (col: "sent" | "failed") => db.prepare(`UPDATE campaigns SET ${col} = ${col} + 1 WHERE id = ?`).run(id);
  for (const customer of marketingAudience()) {
    const unsubscribe = `${siteUrl()}/${customer.locale}/unsubscribe?t=${customer.unsubscribeToken}`;
    const status = await sendEmail({
      to: customer.email,
      subject: c.subject[customer.locale],
      html: renderOffer(c, customer.locale, unsubscribe),
      kind: "offer",
      campaignId: id,
      unsubscribeUrl: unsubscribe,
    });
    bump(status === "sent" ? "sent" : "failed");
  }
  db.prepare("UPDATE campaigns SET status = 'sent' WHERE id = ?").run(id);
}

export const listCampaigns = () => (getDb().prepare("SELECT * FROM campaigns ORDER BY id DESC").all() as Row[]).map(toCampaign);
