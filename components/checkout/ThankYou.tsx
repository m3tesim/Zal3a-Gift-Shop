"use client";

import Link from "next/link";
import { useI18n } from "../I18nProvider";
import { PlantIcon, SocialIcon } from "../icons";
import { useShop, type Order } from "@/lib/store";
import { PLANTS, PRODUCT_BY_ID } from "@/lib/products";
import { WHATSAPP_NUMBER } from "@/lib/site";
import { formatPrice, getDict } from "@/lib/i18n";

const COLORS = ["bg-pink", "bg-sun", "bg-sky", "bg-lime", "bg-lilac", "bg-orange"];

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className={`absolute top-0 block border-2 border-ink ${COLORS[i % COLORS.length]} ${i % 3 ? "h-4 w-2.5 rounded-sm" : "size-3 rounded-full"}`}
          style={{
            left: `${(i * 37) % 100}%`,
            animation: `confetti ${2.6 + (i % 5) * 0.5}s ${(i % 7) * 0.18}s cubic-bezier(.3,.6,.6,1) both`,
          }}
        />
      ))}
    </div>
  );
}

// The message is written in the order's language so the shop sees what the customer saw.
function whatsappText(o: Order) {
  const t = getDict(o.locale);
  const L = o.locale;
  const rows = [
    t.thanks.msgIntro(o.number),
    "",
    ...o.lines.map((l) => `• ${l.qty} × ${PRODUCT_BY_ID[l.id]?.name[L]} (${PLANTS[l.plant].name[L]}) = ${formatPrice(l.unit * l.qty, L)}`),
    `${t.checkout.delivery}: ${o.delivery ? formatPrice(o.delivery, L) : t.checkout.freeDelivery}`,
    `${t.checkout.total}: ${formatPrice(o.total, L)}`,
    "",
    `${t.thanks.from}: ${o.contact.name} · ${o.contact.phone}`,
    `${t.thanks.to}: ${t.checkout.govs[o.address.governorate]}, ${o.address.area}, ${o.address.street}${o.address.apartment ? `, ${o.address.apartment}` : ""}`,
  ];
  if (o.address.date) rows.push(`${t.checkout.date}: ${o.address.date}`);
  if (o.address.notes) rows.push(`${t.checkout.notes}: ${o.address.notes}`);
  if (o.gift) {
    rows.push(
      "",
      `${t.thanks.gift}: ${o.gift.name} · ${o.gift.phone}`,
      `${t.thanks.wrap}: ${t.checkout.wraps[o.gift.wrap].title}`,
    );
    if (o.gift.note) rows.push(`${t.checkout.note}: "${o.gift.note}"`);
    if (o.gift.hidePrices) rows.push(t.checkout.hidePrices);
  }
  rows.push(`${t.thanks.payment}: ${t.checkout.pay[o.payment].title}`);
  return rows.join("\n");
}

export function ThankYou() {
  const { locale, t } = useI18n();
  const hydrated = useShop((s) => s.hydrated);
  const order = useShop((s) => s.lastOrder);

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (!order) {
    return (
      <div className="sticker mx-auto mt-10 grid max-w-md justify-items-center gap-4 p-10 text-center">
        <PlantIcon plant="empty" className="size-24" />
        <p className="font-head text-2xl">{t.thanks.none}</p>
        <Link href={`/${locale}#shop`} className="btn btn-pink">
          {t.thanks.keep}
        </Link>
      </div>
    );
  }

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText(order))}`;

  return (
    <>
      <Confetti />
      <div className="mx-auto grid max-w-3xl gap-6">
        <div className="sticker relative grid animate-rise justify-items-center gap-4 bg-sun-soft p-8 text-center sm:p-12">
          <PlantIcon plant="cactus" className="size-28 animate-wiggle" />
          <span className="eyebrow">{t.thanks.eyebrow}</span>
          <h1 className="font-head text-[clamp(2.4rem,6vw,4rem)] font-extrabold">{t.thanks.title(order.contact.name.split(" ")[0])}</h1>
          <p className="text-lg text-ink-soft">{t.thanks.sub}</p>
          <p className="grid gap-1">
            <span className="text-sm font-bold text-ink-soft">{t.thanks.number}</span>
            <span dir="ltr" className="-rotate-2 rounded-2xl border-[3px] border-ink bg-paper px-5 py-2 font-logo text-3xl shadow-pop-sm">
              {order.number}
            </span>
          </p>
          <p className="mt-2 max-w-[44ch] font-bold">{t.thanks.whatsappHint}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-lime text-ink">
              <SocialIcon id="whatsapp" />
              {t.thanks.whatsapp}
            </a>
            <Link href={`/${locale}`} className="btn btn-white">
              {t.thanks.keep}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sticker grid content-start gap-1 bg-sky-soft p-5">
            <b className="font-head text-lg">{t.thanks.to}</b>
            <p>{order.gift ? order.gift.name : order.contact.name}</p>
            <p className="text-ink-soft">
              {order.address.street}
              {order.address.apartment && `, ${order.address.apartment}`}
              <br />
              {order.address.area}, {t.checkout.govs[order.address.governorate]}
            </p>
          </div>
          <div className="sticker grid content-start gap-1 bg-pink-soft p-5">
            {order.gift && (
              <>
                <b className="font-head text-lg">{t.thanks.gift}</b>
                <p>
                  {order.gift.name} · {t.checkout.wraps[order.gift.wrap].title}
                </p>
                {order.gift.note && <p className="mb-2 text-ink-soft italic">“{order.gift.note}”</p>}
              </>
            )}
            <b className="font-head text-lg">{t.thanks.payment}</b>
            <p>{t.checkout.pay[order.payment].title}</p>
          </div>
        </div>

        <div className="sticker grid gap-3 p-5">
          <ul className="grid gap-2">
            {order.lines.map((l) => (
              <li key={`${l.id}-${l.plant}`} className="flex justify-between gap-3">
                <span>
                  {l.qty} × {PRODUCT_BY_ID[l.id]?.name[locale]} <small className="text-ink-soft">({PLANTS[l.plant].name[locale]})</small>
                </span>
                <span className="font-bold tabular-nums">{formatPrice(l.unit * l.qty, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t-[3px] border-dashed border-line pt-3 tabular-nums">
            <span className="text-ink-soft">{t.checkout.delivery}</span>
            <span className="font-bold">{order.delivery ? formatPrice(order.delivery, locale) : t.checkout.freeDelivery}</span>
          </div>
          <div className="flex justify-between text-xl font-extrabold tabular-nums">
            <span>{t.checkout.total}</span>
            <span>{formatPrice(order.total, locale)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
