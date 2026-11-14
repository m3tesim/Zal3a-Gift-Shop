import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, orderEvents } from "@/lib/server/orders-repo";
import { listEmails } from "@/lib/server/email/mailer";
import { getCustomer } from "@/lib/server/customers";
import { formatPrice, getDict } from "@/lib/i18n";
import { waNumber } from "@/lib/orders";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { Panel } from "@/components/admin/ui";

export const metadata = { title: "Order" };

function Phone({ phone }: { phone: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <a href={`tel:${phone}`} className="font-bold tabular-nums underline underline-offset-4">
        {phone}
      </a>
      <a href={`https://wa.me/${waNumber(phone)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-lime px-2 py-0.5 text-xs font-extrabold">
        WhatsApp
      </a>
    </span>
  );
}

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = getOrder(number);
  if (!order) notFound();
  const dictionary = getDict("en");
  const events = orderEvents(order.number);
  const emails = listEmails({ orderNumber: order.number });
  const account = order.customerId ? getCustomer(order.customerId) : null;
  const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm font-bold text-ink-soft hover:text-pink">
            ← All orders
          </Link>
          <h1 className="font-logo text-4xl">{order.number}</h1>
          <p className="text-ink-soft">
            {new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })} · ordered in {order.locale === "ar" ? "Arabic" : "English"}
          </p>
        </div>
        <StatusSelect number={order.number} status={order.status} />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Customer">
          <p className="font-bold">
            {order.contact.name}
            {account && <span className="ms-2 rounded-full bg-lilac-soft px-2 py-0.5 text-xs font-extrabold">has an account</span>}
          </p>
          <Phone phone={order.contact.phone} />
          {order.contact.email && (
            <a href={`mailto:${order.contact.email}`} className="underline underline-offset-4">
              {order.contact.email}
            </a>
          )}
        </Panel>

        <Panel title={order.gift ? "🎁 Gift recipient" : "Delivery"}>
          {order.gift && (
            <>
              <p className="font-bold">{order.gift.name}</p>
              <Phone phone={order.gift.phone} />
            </>
          )}
          <p>
            {order.address.street}
            {order.address.apartment && `, ${order.address.apartment}`}
            <br />
            {order.address.area}, {dictionary.checkout.govs[order.address.governorate]}
          </p>
          {order.address.date && <p>Preferred date: <b>{order.address.date}</b></p>}
          {order.address.notes && <p className="rounded-xl bg-cream px-3 py-2">“{order.address.notes}”</p>}
        </Panel>

        {order.gift && (
          <Panel title="Gift wrap & note">
            <p>
              Wrap: <b>{dictionary.checkout.wraps[order.gift.wrap].title}</b>
            </p>
            {order.gift.hidePrices && <p className="font-bold text-pink">Hide prices on the receipt</p>}
            {order.gift.note ? (
              <p dir="auto" className="rounded-2xl bg-sun-soft p-4 text-lg font-semibold">
                “{order.gift.note}”
              </p>
            ) : (
              <p className="text-ink-soft">No note.</p>
            )}
          </Panel>
        )}

        <Panel title="Payment">
          <p className="font-bold">{dictionary.checkout.pay[order.payment].title}</p>
          <p className="text-ink-soft">{dictionary.checkout.pay[order.payment].sub}</p>
        </Panel>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Timeline" sub="Changing the status above emails the customer.">
          <ol className="grid gap-2">
            {events.map((statusEvent, index) => (
              <li key={index} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3 py-1.5">
                <b className="capitalize">{dictionary.status[statusEvent.status]}</b>
                <span className="text-sm text-ink-soft">{fmt(statusEvent.at)}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Emails to the customer" sub={order.contact.email ? `Sent to ${order.contact.email}` : "No email address on this order, so no updates are sent."}>
          {emails.length === 0 ? (
            <p className="text-ink-soft">None yet.</p>
          ) : (
            <ul className="grid gap-2">
              {emails.map((email) => (
                <li key={email.id}>
                  <a href={`/api/admin/emails/${email.id}`} target="_blank" className="flex items-center justify-between gap-3 rounded-xl border-2 border-line px-3 py-1.5 hover:border-ink">
                    <span className="truncate font-bold">{email.subject}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold ${email.status === "sent" ? "bg-lime" : email.status === "failed" ? "bg-pink text-white" : "bg-line"}`}>
                      {email.status === "skipped" ? "not sent" : email.status}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Items">
        <ul className="grid gap-2">
          {order.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex flex-wrap justify-between gap-3 border-b-2 border-dashed border-line pb-2">
              <span>
                <b>
                  {item.qty} × {item.name.en}
                </b>
                <span className="text-ink-soft"> · {item.plants.map((plant) => plant.name.en).join(" + ")}</span>
              </span>
              <span className="font-bold tabular-nums">{formatPrice(item.unit * item.qty, "en")}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-1 tabular-nums">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatPrice(order.subtotal, "en")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery</dt>
            <dd>{order.delivery ? formatPrice(order.delivery, "en") : "Free"}</dd>
          </div>
          <div className="flex justify-between text-xl font-extrabold">
            <dt>Total</dt>
            <dd>{formatPrice(order.total, "en")}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
