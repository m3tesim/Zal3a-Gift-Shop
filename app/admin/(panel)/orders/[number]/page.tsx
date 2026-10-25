import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/server/orders-repo";
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
  const o = getOrder(number);
  if (!o) notFound();
  const t = getDict("en");

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm font-bold text-ink-soft hover:text-pink">
            ← All orders
          </Link>
          <h1 className="font-logo text-4xl">{o.number}</h1>
          <p className="text-ink-soft">
            {new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })} · ordered in {o.locale === "ar" ? "Arabic" : "English"}
          </p>
        </div>
        <StatusSelect number={o.number} status={o.status} />
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Customer">
          <p className="font-bold">{o.contact.name}</p>
          <Phone phone={o.contact.phone} />
          {o.contact.email && (
            <a href={`mailto:${o.contact.email}`} className="underline underline-offset-4">
              {o.contact.email}
            </a>
          )}
        </Panel>

        <Panel title={o.gift ? "🎁 Gift recipient" : "Delivery"}>
          {o.gift && (
            <>
              <p className="font-bold">{o.gift.name}</p>
              <Phone phone={o.gift.phone} />
            </>
          )}
          <p>
            {o.address.street}
            {o.address.apartment && `, ${o.address.apartment}`}
            <br />
            {o.address.area}, {t.checkout.govs[o.address.governorate]}
          </p>
          {o.address.date && <p>Preferred date: <b>{o.address.date}</b></p>}
          {o.address.notes && <p className="rounded-xl bg-cream px-3 py-2">“{o.address.notes}”</p>}
        </Panel>

        {o.gift && (
          <Panel title="Gift wrap & note">
            <p>
              Wrap: <b>{t.checkout.wraps[o.gift.wrap].title}</b>
            </p>
            {o.gift.hidePrices && <p className="font-bold text-pink">Hide prices on the receipt</p>}
            {o.gift.note ? (
              <p dir="auto" className="rounded-2xl bg-sun-soft p-4 text-lg font-semibold">
                “{o.gift.note}”
              </p>
            ) : (
              <p className="text-ink-soft">No note.</p>
            )}
          </Panel>
        )}

        <Panel title="Payment">
          <p className="font-bold">{t.checkout.pay[o.payment].title}</p>
          <p className="text-ink-soft">{t.checkout.pay[o.payment].sub}</p>
        </Panel>
      </div>

      <Panel title="Items">
        <ul className="grid gap-2">
          {o.items.map((i, k) => (
            <li key={k} className="flex flex-wrap justify-between gap-3 border-b-2 border-dashed border-line pb-2">
              <span>
                <b>
                  {i.qty} × {i.name.en}
                </b>
                <span className="text-ink-soft"> · {i.plants.map((p) => p.name.en).join(" + ")}</span>
              </span>
              <span className="font-bold tabular-nums">{formatPrice(i.unit * i.qty, "en")}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-1 tabular-nums">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{formatPrice(o.subtotal, "en")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery</dt>
            <dd>{o.delivery ? formatPrice(o.delivery, "en") : "Free"}</dd>
          </div>
          <div className="flex justify-between text-xl font-extrabold">
            <dt>Total</dt>
            <dd>{formatPrice(o.total, "en")}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
