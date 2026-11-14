import { requireAdmin } from "@/lib/server/auth";
import { marketingAudience } from "@/lib/server/customers";
import { listCampaigns } from "@/lib/server/campaigns";
import { emailConfigured, listEmails, siteUrl } from "@/lib/server/email/mailer";
import { OfferComposer } from "@/components/admin/OfferComposer";
import { Panel } from "@/components/admin/ui";

export const metadata = { title: "Emails" };

const STATUS = {
  sent: "bg-lime",
  failed: "bg-pink text-white",
  skipped: "bg-line",
} as const;

export default async function EmailsPage() {
  const me = await requireAdmin();
  const configured = emailConfigured();
  const campaigns = listCampaigns();
  const outbox = listEmails({ limit: 60 });
  const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Emails</h1>
        <p className="text-ink-soft">
          Customers get an email automatically when you change an order&apos;s status (received, confirmed, on its way, delivered, cancelled). Send offers below.
        </p>
      </header>

      {configured ? (
        <p className="rounded-3xl border-[3px] border-ink bg-lime-soft px-5 py-3 font-bold">
          ✓ Email is set up. Sending as {process.env.MAIL_FROM}. Links in emails point to {siteUrl()}.
        </p>
      ) : (
        <Panel title="Email isn't set up yet" className="bg-sun-soft">
          <p>
            Until then, every email is still created and saved in the <b>outbox</b> below so you can preview it, but nothing is sent. Add these lines to{" "}
            <code className="rounded bg-paper px-1.5">.env.local</code> and restart the site. Any email provider with SMTP works (Gmail with an app password, Zoho, Brevo, Resend, Amazon SES…):
          </p>
          <pre className="overflow-x-auto rounded-2xl border-2 border-ink bg-paper p-4 text-sm" dir="ltr">{`SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=you@zal3a.com
SMTP_PASS=your-smtp-password
MAIL_FROM="zal3a <hello@zal3a.com>"
SITE_URL=https://zal3a.com`}</pre>
        </Panel>
      )}

      <OfferComposer audience={marketingAudience().length} configured={configured} adminEmail={me.email} />

      {campaigns.length > 0 && (
        <Panel title="Offer history">
          <ul className="grid gap-2">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-line px-4 py-2">
                <span>
                  <b>{campaign.subject.en}</b> <span className="text-sm text-ink-soft">· {fmt(campaign.createdAt)}</span>
                </span>
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span className={`rounded-full px-2 py-0.5 ${campaign.status === "sent" ? "bg-lime" : "bg-sun"}`}>{campaign.status === "sent" ? "Done" : "Sending…"}</span>
                  {campaign.sent}/{campaign.recipients} sent{campaign.failed > 0 && <span className="text-pink"> · {campaign.failed} failed</span>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Outbox" sub="The latest emails the shop sent or tried to send. Click one to see exactly what the customer got.">
        {outbox.length === 0 ? (
          <p className="font-bold text-ink-soft">Nothing yet.</p>
        ) : (
          <ul className="grid gap-2">
            {outbox.map((email) => (
              <li key={email.id}>
                <a
                  href={`/api/admin/emails/${email.id}`}
                  target="_blank"
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border-2 border-line px-4 py-2 hover:border-ink"
                  title={email.error || undefined}
                >
                  <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${STATUS[email.status]}`}>{email.status === "skipped" ? "not sent" : email.status}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">{email.subject}</span>
                  <span className="text-sm text-ink-soft">
                    {email.kind}
                    {email.orderNumber && ` · ${email.orderNumber}`} · {email.to} · {fmt(email.createdAt)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
