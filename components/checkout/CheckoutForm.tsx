"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "../I18nProvider";
import { BackIcon, GiftIcon, PlantIcon } from "../icons";
import { ChoiceCard, Field } from "./Field";
import { cartSubtotal, useShop, type Order, type PaymentKey, type WrapKey } from "@/lib/store";
import { PLANTS, PRODUCT_BY_ID, TINT, unitPrice } from "@/lib/products";
import { DELIVERY, deliveryFee, type Governorate } from "@/lib/site";
import { formatPrice } from "@/lib/i18n";

const NOTE_MAX = 200;
const GOVS: Governorate[] = ["cairo", "giza", "alexandria", "other"];
const WRAPS: WrapKey[] = ["kraft", "confetti", "ribbon"];
const PAYMENTS: PaymentKey[] = ["cod", "card", "wallet"];
const WRAP_SWATCH: Record<WrapKey, string> = {
  kraft: "bg-orange-soft",
  confetti: "bg-[conic-gradient(var(--color-pink)_0_25%,var(--color-sun)_0_50%,var(--color-sky)_0_75%,var(--color-lime)_0)]",
  ribbon: "bg-pink",
};

const EG_MOBILE = /^(?:\+?20|0020)?0?1[0125]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanPhone = (v: string) => v.replace(/[\s()-]/g, "");

type Form = {
  name: string;
  phone: string;
  email: string;
  isGift: boolean;
  recipientName: string;
  recipientPhone: string;
  wrap: WrapKey;
  note: string;
  hidePrices: boolean;
  governorate: Governorate;
  area: string;
  street: string;
  apartment: string;
  date: string;
  notes: string;
  payment: PaymentKey;
};

const INITIAL: Form = {
  name: "",
  phone: "",
  email: "",
  isGift: true,
  recipientName: "",
  recipientPhone: "",
  wrap: "confetti",
  note: "",
  hidePrices: true,
  governorate: "cairo",
  area: "",
  street: "",
  apartment: "",
  date: "",
  notes: "",
  payment: "cod",
};

function isoDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Step({ n, title, color, children }: { n: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <fieldset className="sticker grid gap-5 p-5 sm:p-6">
      <legend className="float-left w-full">
        <span className="flex items-center gap-3 font-head text-2xl font-extrabold">
          <span className={`grid size-10 shrink-0 place-items-center rounded-full border-[3px] border-ink font-logo text-xl font-normal ${color}`}>
            {n}
          </span>
          {title}
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

export function CheckoutForm() {
  const { locale, t } = useI18n();
  const c = t.checkout;
  const router = useRouter();
  const hydrated = useShop((s) => s.hydrated);
  const lines = useShop((s) => s.lines);
  const placeOrder = useShop((s) => s.placeOrder);

  const [f, setF] = useState<Form>(INITIAL);
  const [tried, setTried] = useState(false);
  const [placing, setPlacing] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const subtotal = cartSubtotal(lines);
  const fee = deliveryFee(f.governorate, subtotal);
  const total = subtotal + fee;

  const errors: Partial<Record<keyof Form, string>> = {};
  if (!f.name.trim()) errors.name = c.errors.name;
  if (!EG_MOBILE.test(cleanPhone(f.phone))) errors.phone = c.errors.phone;
  if (f.email.trim() && !EMAIL.test(f.email.trim())) errors.email = c.errors.email;
  if (f.isGift && !f.recipientName.trim()) errors.recipientName = c.errors.recipientName;
  if (f.isGift && !EG_MOBILE.test(cleanPhone(f.recipientPhone))) errors.recipientPhone = c.errors.recipientPhone;
  if (!f.area.trim()) errors.area = c.errors.area;
  if (!f.street.trim()) errors.street = c.errors.address;
  const shown = tried ? errors : {};

  const input = (k: keyof Form) => ({
    id: `co-${k}`,
    "aria-invalid": shown[k] ? true : undefined,
    "aria-describedby": `co-${k}-msg`,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    const firstBad = (Object.keys(errors) as (keyof Form)[])[0];
    if (firstBad) {
      document.getElementById(`co-${firstBad}`)?.focus();
      return;
    }
    const order: Order = {
      number: `ZL-${Date.now().toString(36).slice(-5).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      locale,
      lines: lines.map((l) => ({ ...l, unit: unitPrice(l.id, l.plant) })),
      subtotal,
      delivery: fee,
      total,
      contact: { name: f.name.trim(), phone: cleanPhone(f.phone), email: f.email.trim() },
      gift: f.isGift
        ? { name: f.recipientName.trim(), phone: cleanPhone(f.recipientPhone), wrap: f.wrap, note: f.note.trim(), hidePrices: f.hidePrices }
        : null,
      address: {
        governorate: f.governorate,
        area: f.area.trim(),
        street: f.street.trim(),
        apartment: f.apartment.trim(),
        date: f.date,
        notes: f.notes.trim(),
      },
      payment: f.payment,
    };
    setPlacing(true);
    placeOrder(order);
    router.push(`/${locale}/checkout/thanks`);
  }

  if (!hydrated || placing) {
    return (
      <div className="grid min-h-[50vh] place-content-center justify-items-center gap-4 text-center">
        <PlantIcon plant="cactus" className="size-24 animate-wiggle" />
        {placing && <p className="font-head text-2xl">{c.placing}</p>}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="sticker mx-auto grid max-w-md justify-items-center gap-4 p-10 text-center">
        <PlantIcon plant="empty" className="size-28 animate-wiggle" />
        <h2 className="font-head text-3xl font-extrabold">{c.emptyTitle}</h2>
        <p className="text-ink-soft">{c.emptyText}</p>
        <Link href={`/${locale}#shop`} className="btn btn-pink">
          {c.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
      <div className="grid gap-7">
        <Step n={1} title={c.s1} color="bg-sun">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="co-name" label={c.name} error={shown.name}>
              <input {...input("name")} className="field" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field id="co-phone" label={c.phone} error={shown.phone} hint={c.phoneHint}>
              <input
                {...input("phone")}
                className="field"
                type="tel"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                placeholder="01X XXXX XXXX"
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field id="co-email" label={c.email} error={shown.email} optional className="sm:col-span-2">
              <input
                {...input("email")}
                className="field"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>
        </Step>

        <Step n={2} title={c.s2} color="bg-pink text-white">
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              name="gift"
              value="yes"
              checked={f.isGift}
              onChange={() => set("isGift", true)}
              title={c.giftYes}
              sub={c.giftYesSub}
              icon={<GiftIcon className="shrink-0 text-pink" />}
              onClass="bg-pink-soft"
            />
            <ChoiceCard
              name="gift"
              value="no"
              checked={!f.isGift}
              onChange={() => set("isGift", false)}
              title={c.giftNo}
              sub={c.giftNoSub}
              icon={<PlantIcon plant="cactus" className="size-7 shrink-0" />}
              onClass="bg-lime-soft"
            />
          </div>

          {f.isGift && (
            <div className="grid animate-rise gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="co-recipientName" label={c.recipientName} error={shown.recipientName}>
                  <input {...input("recipientName")} className="field" value={f.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
                </Field>
                <Field id="co-recipientPhone" label={c.recipientPhone} error={shown.recipientPhone}>
                  <input
                    {...input("recipientPhone")}
                    className="field"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    placeholder="01X XXXX XXXX"
                    value={f.recipientPhone}
                    onChange={(e) => set("recipientPhone", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-2">
                <span className="font-bold">{c.wrap}</span>
                <div className="grid gap-3">
                  {WRAPS.map((w) => (
                    <ChoiceCard
                      key={w}
                      name="wrap"
                      value={w}
                      checked={f.wrap === w}
                      onChange={() => set("wrap", w)}
                      title={c.wraps[w].title}
                      sub={c.wraps[w].sub}
                      icon={<span aria-hidden="true" className={`size-7 shrink-0 rounded-lg border-2 border-ink ${WRAP_SWATCH[w]}`} />}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-ink-soft">{c.free} ✿</span>
              </div>

              <Field id="co-note" label={c.note} hint={`${c.noteHint} · ${f.note.length}/${NOTE_MAX}`} optional>
                <textarea
                  {...input("note")}
                  className="field min-h-28 resize-y bg-sun-soft/50 font-semibold"
                  maxLength={NOTE_MAX}
                  placeholder={c.notePlaceholder}
                  value={f.note}
                  onChange={(e) => set("note", e.target.value)}
                />
              </Field>

              <label className="flex w-fit cursor-pointer items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={f.hidePrices}
                  onChange={(e) => set("hidePrices", e.target.checked)}
                  className="size-6 accent-pink"
                />
                {c.hidePrices}
              </label>
            </div>
          )}
        </Step>

        <Step n={3} title={c.s3} color="bg-sky">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="co-governorate" label={c.governorate} hint={c.days(DELIVERY[f.governorate].days)} className="sm:col-span-2">
              <select
                {...input("governorate")}
                className="field appearance-none bg-[length:20px] bg-[position:right_1rem_center] bg-no-repeat rtl:bg-[position:left_1rem_center]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233d1a5b' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                }}
                value={f.governorate}
                onChange={(e) => set("governorate", e.target.value as Governorate)}
              >
                {GOVS.map((g) => (
                  <option key={g} value={g}>
                    {c.govs[g]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="co-area" label={c.area} error={shown.area}>
              <input {...input("area")} className="field" autoComplete="address-level2" value={f.area} onChange={(e) => set("area", e.target.value)} />
            </Field>
            <Field id="co-street" label={c.address} error={shown.street}>
              <input {...input("street")} className="field" autoComplete="address-line1" value={f.street} onChange={(e) => set("street", e.target.value)} />
            </Field>
            <Field id="co-apartment" label={c.apartment} optional>
              <input {...input("apartment")} className="field" autoComplete="address-line2" value={f.apartment} onChange={(e) => set("apartment", e.target.value)} />
            </Field>
            <Field id="co-date" label={c.date} optional>
              <input
                {...input("date")}
                className="field"
                type="date"
                min={isoDate(f.governorate === "cairo" || f.governorate === "giza" ? 2 : 3)}
                value={f.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
            <Field id="co-notes" label={c.notes} optional className="sm:col-span-2">
              <input {...input("notes")} className="field" placeholder={c.notesPlaceholder} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </Step>

        <Step n={4} title={c.s4} color="bg-lime">
          <div className="grid gap-3">
            {PAYMENTS.map((p) => (
              <ChoiceCard
                key={p}
                name="payment"
                value={p}
                checked={f.payment === p}
                onChange={() => set("payment", p)}
                title={c.pay[p].title}
                sub={c.pay[p].sub}
                onClass="bg-lime-soft"
              />
            ))}
          </div>
        </Step>
      </div>

      <aside className="sticker grid gap-4 bg-paper p-5 lg:sticky lg:top-24">
        <h2 className="font-head text-2xl font-extrabold">{c.summary}</h2>
        <ul className="grid max-h-[40vh] gap-3 overflow-y-auto">
          {lines.map((l) => {
            const p = PRODUCT_BY_ID[l.id];
            return (
              <li key={`${l.id}-${l.plant}`} className="flex items-center gap-3">
                <span className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink ${TINT[p.tint].soft}`}>
                  <Image src={p.img} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: p.pos }} />
                  <span className="absolute -end-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-pink text-[11px] font-extrabold text-white">
                    {l.qty}
                  </span>
                </span>
                <span className="grid min-w-0 flex-1">
                  <b className="truncate">{p.name[locale]}</b>
                  <small className="text-ink-soft">{PLANTS[l.plant].name[locale]}</small>
                </span>
                <span className="font-bold whitespace-nowrap tabular-nums">{formatPrice(unitPrice(l.id, l.plant) * l.qty, locale)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="grid gap-2 border-t-[3px] border-dashed border-line pt-4 tabular-nums">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{c.subtotal}</dt>
            <dd className="font-bold">{formatPrice(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {c.delivery} · {c.govs[f.governorate]}
            </dt>
            <dd className="font-bold">{fee === 0 ? <span className="rounded-full bg-lime px-2">{c.freeDelivery}</span> : formatPrice(fee, locale)}</dd>
          </div>
          <div className="mt-1 flex justify-between text-2xl font-extrabold">
            <dt>{c.total}</dt>
            <dd>{formatPrice(total, locale)}</dd>
          </div>
        </dl>
        {tried && Object.keys(errors).length > 0 && (
          <p role="alert" className="rounded-2xl bg-pink-soft px-4 py-2 text-sm font-bold">
            {c.fixErrors}
          </p>
        )}
        <button type="submit" className="btn btn-pink w-full text-xl">
          {c.place}
        </button>
        <Link href={`/${locale}#shop`} className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-ink-soft hover:text-pink">
          <BackIcon width={16} height={16} className="rtl:-scale-x-100" />
          {c.back}
        </Link>
      </aside>
    </form>
  );
}
