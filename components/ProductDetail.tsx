"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "./I18nProvider";
import { useAddToBag } from "./useAddToBag";
import { QtyStepper } from "./QtyStepper";
import { CareDots } from "./CareDots";
import { BackIcon, GiftIcon, PlantIcon, TruckIcon } from "./icons";
import { PLANT_KEYS, PLANTS, PRODUCT_BY_ID, TINT, type PlantKey } from "@/lib/products";
import { useShop } from "@/lib/store";
import { formatPrice } from "@/lib/i18n";

export function ProductDetail({ id }: { id: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const addToBag = useAddToBag();
  const add = useShop((s) => s.add);
  const p = PRODUCT_BY_ID[id];
  const [plant, setPlant] = useState<PlantKey>(p.plant);
  const [qty, setQty] = useState(1);
  const pl = PLANTS[plant];
  const tint = TINT[p.tint];

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 pb-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={`/${locale}#shop`}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1.5 font-bold transition-colors hover:bg-sun-soft"
        >
          <BackIcon width={16} height={16} className="rtl:-scale-x-100" />
          {t.product.allPots}
        </Link>
        <span aria-hidden="true" className="text-ink-soft">
          /
        </span>
        <span className="font-bold text-ink-soft">{p.name[locale]}</span>
      </nav>

      <div className="grid items-start gap-10 md:grid-cols-[1.05fr_1fr]">
        <div className={`relative aspect-square overflow-hidden rounded-[36px] border-[3px] border-ink shadow-pop md:sticky md:top-24 ${tint.soft}`}>
          <Image
            key={p.id}
            src={p.img}
            alt={`${p.name[locale]}, ${p.kind[locale]}`}
            fill
            priority
            sizes="(min-width: 768px) 560px, 92vw"
            className="animate-rise object-cover"
            style={{ objectPosition: p.pos }}
          />
          <span className={`absolute start-4 top-4 -rotate-6 rounded-full border-2 border-ink px-3 py-1 text-sm font-extrabold ${tint.solid} ${tint.text}`}>
            {p.badge[locale]}
          </span>
          <p className="absolute inset-x-4 bottom-4 rounded-2xl border-2 border-ink bg-paper/90 px-4 py-2 text-sm text-ink-soft backdrop-blur">
            {t.product.styled(p.styled[locale])}
          </p>
        </div>

        <div className="grid min-w-0 gap-6">
          <div className="grid gap-2">
            <span className="eyebrow">{p.kind[locale]}</span>
            <h1 className="font-head text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold">{p.name[locale]}</h1>
            {locale === "en" && (
              <span lang="ar" className="font-ar text-2xl text-pink">
                {p.name.ar}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <strong className="font-head text-4xl font-extrabold tabular-nums">{formatPrice(p.price + pl.delta, locale)}</strong>
            <span className="text-ink-soft">{plant === "empty" ? t.product.potOnly : t.product.withPlant(pl.name[locale])}</span>
          </div>

          <p className="max-w-[52ch] text-lg text-ink-soft">{p.desc[locale]}</p>

          <fieldset className="grid gap-3">
            <legend className="mb-3 font-head text-xl">{t.product.whoInside}</legend>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              {PLANT_KEYS.map((k) => {
                const o = PLANTS[k];
                const d = o.delta - PLANTS[p.plant].delta;
                return (
                  <label
                    key={k}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[3px] p-3 transition-all duration-200 has-focus-visible:outline-3 has-focus-visible:outline-pink ${plant === k ? `border-ink ${TINT[o.tint].soft} -rotate-1 shadow-pop-sm` : "border-line bg-paper hover:-translate-y-0.5 hover:border-ink"}`}
                  >
                    <input type="radio" name="plant" value={k} checked={plant === k} onChange={() => setPlant(k)} className="sr-only" />
                    <PlantIcon plant={k} className="size-11 shrink-0" />
                    <span className="grid">
                      <b className="leading-tight">{o.name[locale]}</b>
                      <small className="text-ink-soft tabular-nums">
                        {d === 0 ? t.product.included : `${d > 0 ? "+" : ""}${formatPrice(d, locale)}`}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <QtyStepper value={qty} onChange={setQty} labels={{ group: t.product.qty, fewer: t.product.fewer, more: t.product.more }} />
            <button type="button" className="btn btn-pink min-w-[180px] flex-1" onClick={() => addToBag(p.id, plant, qty)}>
              {t.product.add}
            </button>
            <button
              type="button"
              className="btn btn-sun w-full sm:w-auto"
              onClick={() => {
                add(p.id, plant, qty);
                router.push(`/${locale}/checkout`);
              }}
            >
              {t.product.buyNow}
            </button>
          </div>

          <ul className="grid gap-2 text-ink-soft">
            <li className="flex items-center gap-2">
              <TruckIcon className="shrink-0 text-sky" /> {t.product.ship}
            </li>
            <li className="flex items-center gap-2">
              <GiftIcon className="shrink-0 text-pink" /> {t.product.gift}
            </li>
          </ul>

          <div className="sticker relative p-5">
            <span className="absolute end-5 top-5 size-4 rounded-full border-[3px] border-ink bg-cream" aria-hidden="true" />
            <h2 className="mb-3 font-head text-xl font-extrabold">{t.product.tag}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
              {p.specs.map(([k, v]) => (
                <div key={k.en} className="contents">
                  <dt className="text-ink-soft">{k[locale]}</dt>
                  <dd className="font-bold">{v[locale]}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t-[3px] border-dashed border-line pt-4">
              <CareDots kind="sun" level={pl.sun} label={t.product.sun} hint={t.product.sunLevels[pl.sun]} />
              <CareDots kind="water" level={pl.water} label={t.product.water} hint={t.product.waterLevels[pl.water]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
