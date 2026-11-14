"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "../I18nProvider";
import { useCatalog } from "../CatalogProvider";
import { useMe } from "../account/useMe";
import { Price } from "../Price";
import { BackIcon, GiftIcon, PlantIcon } from "../icons";
import { ChoiceCard, Field } from "./Field";
import { useShop } from "@/lib/store";
import { TINT, cartSubtotal, linePrice, plantsSummary, productOf, variantImage } from "@/lib/catalog";
import { EG_MOBILE, EMAIL, PAYMENTS, WRAPS, cleanPhone, type PaymentKey, type WrapKey } from "@/lib/orders";
import { placeOrderAction } from "@/app/[locale]/checkout/actions";
import { DELIVERY, deliveryFee, type Governorate } from "@/lib/site";
import { formatPrice } from "@/lib/i18n";

const NOTE_MAX = 200;
const GOVS: Governorate[] = ["cairo", "giza", "alexandria", "other"];
const WRAP_SWATCH: Record<WrapKey, string> = {
  kraft: "bg-orange-soft",
  confetti: "bg-[conic-gradient(var(--color-pink)_0_25%,var(--color-sun)_0_50%,var(--color-sky)_0_75%,var(--color-lime)_0)]",
  ribbon: "bg-pink",
};


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
  const today = new Date();
  today.setDate(today.getDate() + daysFromNow);
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function Step({ stepNumber, title, color, children }: { stepNumber: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <fieldset className="sticker grid gap-5 p-5 sm:p-6">
      <legend className="float-left w-full">
        <span className="flex items-center gap-3 font-head text-2xl font-extrabold">
          <span className={`grid size-10 shrink-0 place-items-center rounded-full border-[3px] border-ink font-logo text-xl font-normal ${color}`}>
            {stepNumber}
          </span>
          {title}
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

export function CheckoutForm() {
  const { locale, dictionary } = useI18n();
  const checkoutCopy = dictionary.checkout;
  const router = useRouter();
  const hydrated = useShop((state) => state.hydrated);
  const lines = useShop((state) => state.lines);
  const placeOrder = useShop((state) => state.placeOrder);
  const catalog = useCatalog();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");
  const me = useMe();

  const [form, setForm] = useState<Form>(INITIAL);
  const [tried, setTried] = useState(false);
  const [placing, setPlacing] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (me) setForm((previous) => ({ ...previous, name: previous.name || me.name, phone: previous.phone || me.phone, email: previous.email || me.email }));
  }, [me]);

  const subtotal = cartSubtotal(catalog, lines);
  const fee = deliveryFee(form.governorate, subtotal);
  const total = subtotal + fee;

  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.name.trim()) errors.name = checkoutCopy.errors.name;
  if (!EG_MOBILE.test(cleanPhone(form.phone))) errors.phone = checkoutCopy.errors.phone;
  if (form.email.trim() && !EMAIL.test(form.email.trim())) errors.email = checkoutCopy.errors.email;
  if (form.isGift && !form.recipientName.trim()) errors.recipientName = checkoutCopy.errors.recipientName;
  if (form.isGift && !EG_MOBILE.test(cleanPhone(form.recipientPhone))) errors.recipientPhone = checkoutCopy.errors.recipientPhone;
  if (!form.area.trim()) errors.area = checkoutCopy.errors.area;
  if (!form.street.trim()) errors.street = checkoutCopy.errors.address;
  const shown = tried ? errors : {};

  const input = (key: keyof Form) => ({
    id: `co-${key}`,
    "aria-invalid": shown[key] ? true : undefined,
    "aria-describedby": `co-${key}-msg`,
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    const firstBad = (Object.keys(errors) as (keyof Form)[])[0];
    if (firstBad) {
      document.getElementById(`co-${firstBad}`)?.focus();
      return;
    }
    setServerError("");
    startTransition(async () => {
      const result = await placeOrderAction({
        locale,
        lines,
        contact: { name: form.name, phone: form.phone, email: form.email },
        gift: form.isGift
          ? { name: form.recipientName, phone: form.recipientPhone, wrap: form.wrap, note: form.note, hidePrices: form.hidePrices }
          : null,
        address: { governorate: form.governorate, area: form.area, street: form.street, apartment: form.apartment, date: form.date, notes: form.notes },
        payment: form.payment,
      });
      if (result.ok) {
        setPlacing(true);
        placeOrder(result.order);
        router.push(`/${locale}/checkout/thanks`);
        return;
      }
      const item = result.item ?? "";
      setServerError(
        result.error === "stock" ? checkoutCopy.errors.stock(item) : result.error === "unavailable" ? checkoutCopy.errors.unavailable(item) : checkoutCopy.errors.server,
      );
      // Pull fresh stock/prices; the catalog provider then trims the bag to what's available.
      router.refresh();
    });
  }

  if (!hydrated || placing) {
    return (
      <div className="grid min-h-[50vh] place-content-center justify-items-center gap-4 text-center">
        <PlantIcon icon="cactus" className="size-24 animate-wiggle" />
        {placing && <p className="font-head text-2xl">{checkoutCopy.placing}</p>}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="sticker mx-auto grid max-w-md justify-items-center gap-4 p-10 text-center">
        <PlantIcon icon="pot" className="size-28 animate-wiggle" />
        <h2 className="font-head text-3xl font-extrabold">{checkoutCopy.emptyTitle}</h2>
        <p className="text-ink-soft">{checkoutCopy.emptyText}</p>
        <Link href={`/${locale}#shop`} className="btn btn-pink">
          {checkoutCopy.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
      <div className="grid gap-7">
        {me ? (
          <p className="rounded-3xl border-[3px] border-ink bg-lime-soft px-5 py-3 font-bold">✓ {checkoutCopy.signedInAs(me.email)}</p>
        ) : (
          me === null && (
            <p className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-[3px] border-dashed border-ink bg-paper px-5 py-3 font-bold">
              {checkoutCopy.signInNudge}
              <Link href={`/${locale}/account/login?next=/${locale}/checkout`} className="rounded-full border-2 border-ink bg-sun px-4 py-1 font-extrabold hover:-rotate-2">
                {checkoutCopy.signIn}
              </Link>
            </p>
          )
        )}
        <Step stepNumber={1} title={checkoutCopy.s1} color="bg-sun">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="co-name" label={checkoutCopy.name} error={shown.name}>
              <input {...input("name")} className="field" autoComplete="name" value={form.name} onChange={(event) => set("name", event.target.value)} />
            </Field>
            <Field id="co-phone" label={checkoutCopy.phone} error={shown.phone} hint={checkoutCopy.phoneHint}>
              <input
                {...input("phone")}
                className="field"
                type="tel"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                placeholder="01X XXXX XXXX"
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
              />
            </Field>
            <Field id="co-email" label={checkoutCopy.email} error={shown.email} hint={checkoutCopy.emailHint} optional className="sm:col-span-2">
              <input
                {...input("email")}
                className="field"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
              />
            </Field>
          </div>
        </Step>

        <Step stepNumber={2} title={checkoutCopy.s2} color="bg-pink text-white">
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              name="gift"
              value="yes"
              checked={form.isGift}
              onChange={() => set("isGift", true)}
              title={checkoutCopy.giftYes}
              sub={checkoutCopy.giftYesSub}
              icon={<GiftIcon className="shrink-0 text-pink" />}
              onClass="bg-pink-soft"
            />
            <ChoiceCard
              name="gift"
              value="no"
              checked={!form.isGift}
              onChange={() => set("isGift", false)}
              title={checkoutCopy.giftNo}
              sub={checkoutCopy.giftNoSub}
              icon={<PlantIcon icon="cactus" className="size-7 shrink-0" />}
              onClass="bg-lime-soft"
            />
          </div>

          {form.isGift && (
            <div className="grid animate-rise gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="co-recipientName" label={checkoutCopy.recipientName} error={shown.recipientName}>
                  <input {...input("recipientName")} className="field" value={form.recipientName} onChange={(event) => set("recipientName", event.target.value)} />
                </Field>
                <Field id="co-recipientPhone" label={checkoutCopy.recipientPhone} error={shown.recipientPhone}>
                  <input
                    {...input("recipientPhone")}
                    className="field"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    placeholder="01X XXXX XXXX"
                    value={form.recipientPhone}
                    onChange={(event) => set("recipientPhone", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-2">
                <span className="font-bold">{checkoutCopy.wrap}</span>
                <div className="grid gap-3">
                  {WRAPS.map((wrap) => (
                    <ChoiceCard
                      key={wrap}
                      name="wrap"
                      value={wrap}
                      checked={form.wrap === wrap}
                      onChange={() => set("wrap", wrap)}
                      title={checkoutCopy.wraps[wrap].title}
                      sub={checkoutCopy.wraps[wrap].sub}
                      icon={<span aria-hidden="true" className={`size-7 shrink-0 rounded-lg border-2 border-ink ${WRAP_SWATCH[wrap]}`} />}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-ink-soft">{checkoutCopy.free} ✿</span>
              </div>

              <Field id="co-note" label={checkoutCopy.note} hint={`${checkoutCopy.noteHint} · ${form.note.length}/${NOTE_MAX}`} optional>
                <textarea
                  {...input("note")}
                  className="field min-h-28 resize-y bg-sun-soft/50 font-semibold"
                  maxLength={NOTE_MAX}
                  placeholder={checkoutCopy.notePlaceholder}
                  value={form.note}
                  onChange={(event) => set("note", event.target.value)}
                />
              </Field>

              <label className="flex w-fit cursor-pointer items-center gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={form.hidePrices}
                  onChange={(event) => set("hidePrices", event.target.checked)}
                  className="size-6 accent-pink"
                />
                {checkoutCopy.hidePrices}
              </label>
            </div>
          )}
        </Step>

        <Step stepNumber={3} title={checkoutCopy.s3} color="bg-sky">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="co-governorate" label={checkoutCopy.governorate} hint={checkoutCopy.days(DELIVERY[form.governorate].days)} className="sm:col-span-2">
              <select
                {...input("governorate")}
                className="field appearance-none bg-[length:20px] bg-[position:right_1rem_center] bg-no-repeat rtl:bg-[position:left_1rem_center]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233d1a5b' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                }}
                value={form.governorate}
                onChange={(event) => set("governorate", event.target.value as Governorate)}
              >
                {GOVS.map((governorate) => (
                  <option key={governorate} value={governorate}>
                    {checkoutCopy.govs[governorate]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="co-area" label={checkoutCopy.area} error={shown.area}>
              <input {...input("area")} className="field" autoComplete="address-level2" value={form.area} onChange={(event) => set("area", event.target.value)} />
            </Field>
            <Field id="co-street" label={checkoutCopy.address} error={shown.street}>
              <input {...input("street")} className="field" autoComplete="address-line1" value={form.street} onChange={(event) => set("street", event.target.value)} />
            </Field>
            <Field id="co-apartment" label={checkoutCopy.apartment} optional>
              <input {...input("apartment")} className="field" autoComplete="address-line2" value={form.apartment} onChange={(event) => set("apartment", event.target.value)} />
            </Field>
            <Field id="co-date" label={checkoutCopy.date} optional>
              <input
                {...input("date")}
                className="field"
                type="date"
                min={isoDate(form.governorate === "cairo" || form.governorate === "giza" ? 2 : 3)}
                value={form.date}
                onChange={(event) => set("date", event.target.value)}
              />
            </Field>
            <Field id="co-notes" label={checkoutCopy.notes} optional className="sm:col-span-2">
              <input {...input("notes")} className="field" placeholder={checkoutCopy.notesPlaceholder} value={form.notes} onChange={(event) => set("notes", event.target.value)} />
            </Field>
          </div>
        </Step>

        <Step stepNumber={4} title={checkoutCopy.s4} color="bg-lime">
          <div className="grid gap-3">
            {PAYMENTS.map((payment) => (
              <ChoiceCard
                key={payment}
                name="payment"
                value={payment}
                checked={form.payment === payment}
                onChange={() => set("payment", payment)}
                title={checkoutCopy.pay[payment].title}
                sub={checkoutCopy.pay[payment].sub}
                onClass="bg-lime-soft"
              />
            ))}
          </div>
        </Step>
      </div>

      <aside className="sticker grid gap-4 bg-paper p-5 lg:sticky lg:top-24">
        <h2 className="font-head text-2xl font-extrabold">{checkoutCopy.summary}</h2>
        <ul className="grid max-h-[40vh] gap-3 overflow-y-auto">
          {lines.map((line) => {
            const product = productOf(catalog, line.id);
            if (!product) return null;
            const price = linePrice(catalog, product, line.plants);
            const photo = variantImage(product, line.plants);
            return (
              <li key={`${line.id}-${line.plants.join("+")}`} className="flex items-center gap-3">
                <span className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink ${TINT[product.tint].soft}`}>
                  <Image src={photo ?? product.image} alt="" fill sizes="56px" className="object-cover" style={{ objectPosition: photo ? "50% 50%" : product.pos }} />
                  <span className="absolute -end-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-pink text-[11px] font-extrabold text-white">
                    {line.qty}
                  </span>
                </span>
                <span className="grid min-w-0 flex-1">
                  <b className="truncate">{product.name[locale]}</b>
                  <small className="text-ink-soft">{plantsSummary(catalog, line.plants, locale)}</small>
                </span>
                <span className="font-bold whitespace-nowrap tabular-nums">
                  <Price full={price.full * line.qty} unit={price.unit * line.qty} locale={locale} />
                </span>
              </li>
            );
          })}
        </ul>
        <dl className="grid gap-2 border-t-[3px] border-dashed border-line pt-4 tabular-nums">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{checkoutCopy.subtotal}</dt>
            <dd className="font-bold">{formatPrice(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {checkoutCopy.delivery} · {checkoutCopy.govs[form.governorate]}
            </dt>
            <dd className="font-bold">{fee === 0 ? <span className="rounded-full bg-lime px-2">{checkoutCopy.freeDelivery}</span> : formatPrice(fee, locale)}</dd>
          </div>
          <div className="mt-1 flex justify-between text-2xl font-extrabold">
            <dt>{checkoutCopy.total}</dt>
            <dd>{formatPrice(total, locale)}</dd>
          </div>
        </dl>
        {serverError && (
          <p role="alert" className="rounded-2xl border-2 border-pink bg-pink-soft px-4 py-2 text-sm font-bold">
            {serverError}
          </p>
        )}
        {tried && Object.keys(errors).length > 0 && (
          <p role="alert" className="rounded-2xl bg-pink-soft px-4 py-2 text-sm font-bold">
            {checkoutCopy.fixErrors}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-pink w-full text-xl">
          {pending ? checkoutCopy.placing : checkoutCopy.place}
        </button>
        <Link href={`/${locale}#shop`} className="inline-flex items-center justify-center gap-1.5 text-sm font-bold text-ink-soft hover:text-pink">
          <BackIcon width={16} height={16} className="rtl:-scale-x-100" />
          {checkoutCopy.back}
        </Link>
      </aside>
    </form>
  );
}
