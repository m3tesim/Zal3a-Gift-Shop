"use client";

import Link from "next/link";
import { useI18n } from "../I18nProvider";
import { PlantIcon, SocialIcon } from "../icons";
import { useShop } from "@/lib/store";
import type { Order } from "@/lib/orders";
import type { Locale } from "@/lib/i18n";
import { WHATSAPP_NUMBER } from "@/lib/site";
import { formatPrice, getDict } from "@/lib/i18n";

const COLORS = ["bg-pink", "bg-sun", "bg-sky", "bg-lime", "bg-lilac", "bg-orange"];

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {Array.from({ length: 36 }, (_piece, index) => (
        <span
          key={index}
          className={`absolute top-0 block border-2 border-ink ${COLORS[index % COLORS.length]} ${index % 3 ? "h-4 w-2.5 rounded-sm" : "size-3 rounded-full"}`}
          style={{
            left: `${(index * 37) % 100}%`,
            animation: `confetti ${2.6 + (index % 5) * 0.5}s ${(index % 7) * 0.18}s cubic-bezier(.3,.6,.6,1) both`,
          }}
        />
      ))}
    </div>
  );
}

const plantNames = (item: Order["items"][number], locale: Locale) => item.plants.map((plant) => plant.name[locale]).join(" + ");

// The message is written in the order's language so the shop sees what the customer saw.
function whatsappText(order: Order) {
  const dictionary = getDict(order.locale);
  const locale = order.locale;
  const rows = [
    dictionary.thanks.msgIntro(order.number),
    "",
    ...order.items.map((item) => `• ${item.qty} × ${item.name[locale]} (${plantNames(item, locale)}) = ${formatPrice(item.unit * item.qty, locale)}`),
    `${dictionary.checkout.delivery}: ${order.delivery ? formatPrice(order.delivery, locale) : dictionary.checkout.freeDelivery}`,
    `${dictionary.checkout.total}: ${formatPrice(order.total, locale)}`,
    "",
    `${dictionary.thanks.from}: ${order.contact.name} · ${order.contact.phone}`,
    `${dictionary.thanks.to}: ${dictionary.checkout.govs[order.address.governorate]}, ${order.address.area}, ${order.address.street}${order.address.apartment ? `, ${order.address.apartment}` : ""}`,
  ];
  if (order.address.date) rows.push(`${dictionary.checkout.date}: ${order.address.date}`);
  if (order.address.notes) rows.push(`${dictionary.checkout.notes}: ${order.address.notes}`);
  if (order.gift) {
    rows.push(
      "",
      `${dictionary.thanks.gift}: ${order.gift.name} · ${order.gift.phone}`,
      `${dictionary.thanks.wrap}: ${dictionary.checkout.wraps[order.gift.wrap].title}`,
    );
    if (order.gift.note) rows.push(`${dictionary.checkout.note}: "${order.gift.note}"`);
    if (order.gift.hidePrices) rows.push(dictionary.checkout.hidePrices);
  }
  rows.push(`${dictionary.thanks.payment}: ${dictionary.checkout.pay[order.payment].title}`);
  return rows.join("\n");
}

export function ThankYou() {
  const { locale, dictionary } = useI18n();
  const hydrated = useShop((state) => state.hydrated);
  const order = useShop((state) => state.lastOrder);

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (!order) {
    return (
      <div className="sticker mx-auto mt-10 grid max-w-md justify-items-center gap-4 p-10 text-center">
        <PlantIcon icon="pot" className="size-24" />
        <p className="font-head text-2xl">{dictionary.thanks.none}</p>
        <Link href={`/${locale}#shop`} className="btn btn-pink">
          {dictionary.thanks.keep}
        </Link>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText(order))}`;

  return (
    <>
      <Confetti />
      <div className="mx-auto grid max-w-3xl gap-6">
        <div className="sticker relative grid animate-rise justify-items-center gap-4 bg-sun-soft p-8 text-center sm:p-12">
          <PlantIcon icon="cactus" className="size-28 animate-wiggle" />
          <span className="eyebrow">{dictionary.thanks.eyebrow}</span>
          <h1 className="font-head text-[clamp(2.4rem,6vw,4rem)] font-extrabold">{dictionary.thanks.title(order.contact.name.split(" ")[0])}</h1>
          <p className="text-lg text-ink-soft">{dictionary.thanks.sub}</p>
          <p className="grid gap-1">
            <span className="text-sm font-bold text-ink-soft">{dictionary.thanks.number}</span>
            <span dir="ltr" className="-rotate-2 rounded-2xl border-[3px] border-ink bg-paper px-5 py-2 font-logo text-3xl shadow-pop-sm">
              {order.number}
            </span>
          </p>
          <p className="mt-2 max-w-[44ch] font-bold">{dictionary.thanks.whatsappHint}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn bg-lime text-ink">
              <SocialIcon id="whatsapp" />
              {dictionary.thanks.whatsapp}
            </a>
            {order.trackToken && (
              <Link href={`/${locale}/track?order=${order.number}&t=${order.trackToken}`} className="btn btn-sun">
                {dictionary.thanks.track}
              </Link>
            )}
            <Link href={`/${locale}`} className="btn btn-white">
              {dictionary.thanks.keep}
            </Link>
          </div>
        </div>

        {!order.customerId && (
          <div className="sticker flex flex-wrap items-center justify-between gap-4 bg-lilac-soft p-5">
            <div className="grid gap-1">
              <b className="font-head text-xl">{dictionary.thanks.joinTitle}</b>
              <p className="text-ink-soft">{dictionary.thanks.joinText}</p>
            </div>
            <Link href={`/${locale}/account/register`} className="btn btn-pink">
              {dictionary.thanks.join}
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sticker grid content-start gap-1 bg-sky-soft p-5">
            <b className="font-head text-lg">{dictionary.thanks.to}</b>
            <p>{order.gift ? order.gift.name : order.contact.name}</p>
            <p className="text-ink-soft">
              {order.address.street}
              {order.address.apartment && `, ${order.address.apartment}`}
              <br />
              {order.address.area}, {dictionary.checkout.govs[order.address.governorate]}
            </p>
          </div>
          <div className="sticker grid content-start gap-1 bg-pink-soft p-5">
            {order.gift && (
              <>
                <b className="font-head text-lg">{dictionary.thanks.gift}</b>
                <p>
                  {order.gift.name} · {dictionary.checkout.wraps[order.gift.wrap].title}
                </p>
                {order.gift.note && <p className="mb-2 text-ink-soft italic">“{order.gift.note}”</p>}
              </>
            )}
            <b className="font-head text-lg">{dictionary.thanks.payment}</b>
            <p>{dictionary.checkout.pay[order.payment].title}</p>
          </div>
        </div>

        <div className="sticker grid gap-3 p-5">
          <ul className="grid gap-2">
            {order.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex justify-between gap-3">
                <span>
                  {item.qty} × {item.name[locale]} <small className="text-ink-soft">({plantNames(item, locale)})</small>
                </span>
                <span className="font-bold tabular-nums">{formatPrice(item.unit * item.qty, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t-[3px] border-dashed border-line pt-3 tabular-nums">
            <span className="text-ink-soft">{dictionary.checkout.delivery}</span>
            <span className="font-bold">{order.delivery ? formatPrice(order.delivery, locale) : dictionary.checkout.freeDelivery}</span>
          </div>
          <div className="flex justify-between text-xl font-extrabold tabular-nums">
            <span>{dictionary.checkout.total}</span>
            <span>{formatPrice(order.total, locale)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
