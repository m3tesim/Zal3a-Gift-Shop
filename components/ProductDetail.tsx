"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";
import { useCatalog } from "./CatalogProvider";
import { useAddToBag } from "./useAddToBag";
import { QtyStepper } from "./QtyStepper";
import { PlantCare } from "./PlantCare";
import { Price } from "./Price";
import { BackIcon, GiftIcon, PlantIcon, TruckIcon } from "./icons";
import { Stars } from "./reviews/Stars";
import {
  TINT, defaultPlantsFor, linePrice, maxQty, plantOf, productOf, soldOut, variantImage,
  type Catalog, type Product,
} from "@/lib/catalog";
import { useShop } from "@/lib/store";
import { formatPrice } from "@/lib/i18n";

/** Reads ?plants=a,b so links from plant pages / the matchmaker open with that combo picked. */
function PlantsFromQuery({ catalog, product, onPick }: { catalog: Catalog; product: Product; onPick: (p: string[]) => void }) {
  const q = useSearchParams().get("plants");
  useEffect(() => {
    const ids = q?.split(",") ?? [];
    if (ids.length === product.slots.length && ids.every((id) => plantOf(catalog, id) && !soldOut(plantOf(catalog, id)!))) onPick(ids);
  }, [q, catalog, product, onPick]);
  return null;
}

/** Warm the cache for every combo one click away, so swapping photos feels instant. */
function usePreloadNeighbours(product: Product, plants: string[], catalog: Catalog) {
  useEffect(() => {
    const urls = new Set<string>();
    plants.forEach((_, slot) =>
      catalog.plants.forEach((pl) => {
        const next = plants.map((id, i) => (i === slot ? pl.id : id));
        const url = variantImage(product, next);
        if (url) urls.add(url);
      }),
    );
    urls.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [product, plants, catalog]);
}

export function ProductDetail({ id }: { id: string }) {
  const { locale, t } = useI18n();
  const catalog = useCatalog();
  const router = useRouter();
  const addToBag = useAddToBag();
  const add = useShop((s) => s.add);
  const p = productOf(catalog, id)!;
  const [plants, setPlants] = useState<string[]>(() => defaultPlantsFor(catalog, p));
  const [qty, setQty] = useState(1);
  usePreloadNeighbours(p, plants, catalog);

  const tint = TINT[p.tint];
  const max = maxQty(catalog, p, plants);
  const { full, unit } = linePrice(catalog, p, plants);
  const combo = variantImage(p, plants);
  const defaults = p.defaultPlants;
  const options = catalog.plants;
  const firstPlant = plantOf(catalog, plants[0]);

  useEffect(() => setQty((q) => Math.max(1, Math.min(q, max))), [max]);

  const pickFor = (slot: number, plantId: string) => setPlants((cur) => cur.map((x, i) => (i === slot ? plantId : x)));

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 pb-12">
      <Suspense fallback={null}>
        <PlantsFromQuery catalog={catalog} product={p} onPick={setPlants} />
      </Suspense>
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
            key={combo ?? p.image}
            src={combo ?? p.image}
            alt={`${p.name[locale]}, ${p.kind[locale]}`}
            fill
            priority
            sizes="(min-width: 768px) 560px, 92vw"
            className="animate-fade object-cover"
            style={{ objectPosition: combo ? "50% 50%" : p.pos }}
          />
          <span className={`absolute start-4 top-4 -rotate-6 rounded-full border-2 border-ink px-3 py-1 text-sm font-extrabold ${tint.solid} ${tint.text}`}>
            {p.badge[locale]}
          </span>
          {p.salePercent > 0 && (
            <span className="absolute end-4 top-4 rotate-6 rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-extrabold">
              {t.shop.off(p.salePercent)}
            </span>
          )}
          {combo ? (
            <span className="absolute start-4 bottom-4 rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-extrabold">
              ✿ {t.product.combo}
            </span>
          ) : (
            <>
              {/* No photo for this combo yet: show which plants are picked as stickers */}
              <div className={`absolute end-4 flex flex-col items-end gap-2 ${p.styled[locale] ? "bottom-20" : "bottom-4"}`}>
                {plants.map((id, i) => {
                  const pl = plantOf(catalog, id);
                  return pl ? (
                    <span key={`${i}-${id}`} className="flex animate-rise items-center gap-1.5 rounded-full border-2 border-ink bg-paper py-1 ps-1 pe-3 text-sm font-bold shadow-pop-sm">
                      <PlantIcon icon={pl.icon} className="size-8" />
                      {pl.name[locale]}
                    </span>
                  ) : null;
                })}
              </div>
              {p.styled[locale] && (
                <p className="absolute inset-x-4 bottom-4 rounded-2xl border-2 border-ink bg-paper/90 px-4 py-2 text-sm text-ink-soft backdrop-blur">
                  {t.product.styled(p.styled[locale])}
                </p>
              )}
            </>
          )}
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
            {catalog.ratings[p.id] && (
              <a href="#reviews" className="flex w-fit items-center gap-2 font-bold hover:text-pink">
                <Stars value={catalog.ratings[p.id].avg} label={t.reviews.stars(catalog.ratings[p.id].avg)} />
                {catalog.ratings[p.id].avg.toFixed(1)} · {t.reviews.count(catalog.ratings[p.id].count)}
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <strong className="font-head text-4xl font-extrabold tabular-nums">
              <Price full={full} unit={unit} locale={locale} />
            </strong>
            {p.slots.length === 1 && firstPlant && (
              <span className="text-ink-soft">{firstPlant.potOnly ? t.product.potOnly : t.product.withPlant(firstPlant.name[locale])}</span>
            )}
          </div>

          <p className="max-w-[52ch] text-lg text-ink-soft">{p.desc[locale]}</p>

          {p.slots.map((slot, si) => {
            const base = plantOf(catalog, defaults[si])?.price ?? 0;
            return (
              <fieldset key={si} className="grid gap-3">
                <legend className="mb-3 font-head text-xl">
                  {p.slots.length > 1 ? t.product.whoInsideSlot(slot[locale]) : t.product.whoInside}
                </legend>
                <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                  {options.map((o) => {
                    const d = o.price - base;
                    const out = soldOut(o);
                    const on = plants[si] === o.id;
                    return (
                      <label
                        key={o.id}
                        className={`flex items-center gap-3 rounded-2xl border-[3px] p-3 transition-all duration-200 has-focus-visible:outline-3 has-focus-visible:outline-pink ${
                          out
                            ? "cursor-not-allowed border-line bg-paper/60 opacity-50"
                            : on
                              ? `cursor-pointer border-ink ${TINT[o.tint].soft} -rotate-1 shadow-pop-sm`
                              : "cursor-pointer border-line bg-paper hover:-translate-y-0.5 hover:border-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`plant-${si}`}
                          value={o.id}
                          checked={on}
                          disabled={out}
                          onChange={() => pickFor(si, o.id)}
                          className="sr-only"
                        />
                        <PlantIcon icon={o.icon} className="size-11 shrink-0" />
                        <span className="grid">
                          <b className="leading-tight">{o.name[locale]}</b>
                          <small className="text-ink-soft tabular-nums">
                            {out ? t.product.soldOut : d === 0 ? t.product.included : `${d > 0 ? "+" : ""}${formatPrice(d, locale)}`}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {max > 0 && max <= 3 && <p className="w-fit -rotate-1 rounded-full bg-sun px-3 py-1 font-extrabold">{t.product.onlyLeft(max)}</p>}

          <div className="flex flex-wrap gap-3">
            {max > 0 && (
              <QtyStepper value={qty} max={max} onChange={setQty} labels={{ group: t.product.qty, fewer: t.product.fewer, more: t.product.more }} />
            )}
            <button
              type="button"
              disabled={max === 0}
              className="btn btn-pink min-w-[180px] flex-1"
              onClick={() => addToBag(p.id, plants, qty)}
            >
              {max === 0 ? t.product.soldOut : t.product.add}
            </button>
            {max > 0 && (
              <button
                type="button"
                className="btn btn-sun w-full sm:w-auto"
                onClick={() => {
                  add(p.id, plants, qty, max);
                  router.push(`/${locale}/checkout`);
                }}
              >
                {t.product.buyNow}
              </button>
            )}
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
              {p.specs.filter((s) => s.label[locale] && s.value[locale]).map((s, i) => (
                <div key={i} className="contents">
                  <dt className="text-ink-soft">{s.label[locale]}</dt>
                  <dd className="font-bold">{s.value[locale]}</dd>
                </div>
              ))}
            </dl>
            {[...new Set(plants)].map((id) => {
              const pl = plantOf(catalog, id);
              if (!pl || pl.potOnly) return null;
              return (
                <div key={id} className="mt-4 grid gap-3 border-t-[3px] border-dashed border-line pt-4">
                  {p.slots.length > 1 && (
                    <b className="flex items-center gap-2">
                      <PlantIcon icon={pl.icon} className="size-7" />
                      {pl.name[locale]}
                    </b>
                  )}
                  <PlantCare
                    plant={pl}
                    catalog={catalog}
                    locale={locale}
                    labels={{ sun: t.product.sun, water: t.product.water, bestFor: t.plants.bestFor, vibe: t.plants.vibe }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
