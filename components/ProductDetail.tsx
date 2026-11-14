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
function PlantsFromQuery({ catalog, product, onPick }: { catalog: Catalog; product: Product; onPick: (plants: string[]) => void }) {
  const plantsParam = useSearchParams().get("plants");
  useEffect(() => {
    const ids = plantsParam?.split(",") ?? [];
    if (ids.length === product.slots.length && ids.every((id) => plantOf(catalog, id) && !soldOut(plantOf(catalog, id)!))) onPick(ids);
  }, [plantsParam, catalog, product, onPick]);
  return null;
}

/** Warm the cache for every combo one click away, so swapping photos feels instant. */
function usePreloadNeighbours(product: Product, plants: string[], catalog: Catalog) {
  useEffect(() => {
    const urls = new Set<string>();
    plants.forEach((_plant, slot) =>
      catalog.plants.forEach((plant) => {
        const next = plants.map((id, slotIndex) => (slotIndex === slot ? plant.id : id));
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
  const { locale, dictionary } = useI18n();
  const catalog = useCatalog();
  const router = useRouter();
  const addToBag = useAddToBag();
  const add = useShop((state) => state.add);
  const product = productOf(catalog, id)!;
  const [plants, setPlants] = useState<string[]>(() => defaultPlantsFor(catalog, product));
  const [qty, setQty] = useState(1);
  usePreloadNeighbours(product, plants, catalog);

  const tint = TINT[product.tint];
  const max = maxQty(catalog, product, plants);
  const { full, unit } = linePrice(catalog, product, plants);
  const combo = variantImage(product, plants);
  const defaults = product.defaultPlants;
  const options = catalog.plants;
  const firstPlant = plantOf(catalog, plants[0]);

  useEffect(() => setQty((current) => Math.max(1, Math.min(current, max))), [max]);

  const pickFor = (slot: number, plantId: string) => setPlants((cur) => cur.map((currentId, slotIndex) => (slotIndex === slot ? plantId : currentId)));

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 pb-12">
      <Suspense fallback={null}>
        <PlantsFromQuery catalog={catalog} product={product} onPick={setPlants} />
      </Suspense>
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={`/${locale}#shop`}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1.5 font-bold transition-colors hover:bg-sun-soft"
        >
          <BackIcon width={16} height={16} className="rtl:-scale-x-100" />
          {dictionary.product.allPots}
        </Link>
        <span aria-hidden="true" className="text-ink-soft">
          /
        </span>
        <span className="font-bold text-ink-soft">{product.name[locale]}</span>
      </nav>

      <div className="grid items-start gap-10 md:grid-cols-[1.05fr_1fr]">
        <div className={`relative aspect-square overflow-hidden rounded-[36px] border-[3px] border-ink shadow-pop md:sticky md:top-24 ${tint.soft}`}>
          <Image
            key={combo ?? product.image}
            src={combo ?? product.image}
            alt={`${product.name[locale]}, ${product.kind[locale]}`}
            fill
            priority
            sizes="(min-width: 768px) 560px, 92vw"
            className="animate-fade object-cover"
            style={{ objectPosition: combo ? "50% 50%" : product.pos }}
          />
          <span className={`absolute start-4 top-4 -rotate-6 rounded-full border-2 border-ink px-3 py-1 text-sm font-extrabold ${tint.solid} ${tint.text}`}>
            {product.badge[locale]}
          </span>
          {product.salePercent > 0 && (
            <span className="absolute end-4 top-4 rotate-6 rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-extrabold">
              {dictionary.shop.off(product.salePercent)}
            </span>
          )}
          {combo ? (
            <span className="absolute start-4 bottom-4 rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-extrabold">
              ✿ {dictionary.product.combo}
            </span>
          ) : (
            <>
              {/* No photo for this combo yet: show which plants are picked as stickers */}
              <div className={`absolute end-4 flex flex-col items-end gap-2 ${product.styled[locale] ? "bottom-20" : "bottom-4"}`}>
                {plants.map((id, slotIndex) => {
                  const plant = plantOf(catalog, id);
                  return plant ? (
                    <span key={`${slotIndex}-${id}`} className="flex animate-rise items-center gap-1.5 rounded-full border-2 border-ink bg-paper py-1 ps-1 pe-3 text-sm font-bold shadow-pop-sm">
                      <PlantIcon icon={plant.icon} className="size-8" />
                      {plant.name[locale]}
                    </span>
                  ) : null;
                })}
              </div>
              {product.styled[locale] && (
                <p className="absolute inset-x-4 bottom-4 rounded-2xl border-2 border-ink bg-paper/90 px-4 py-2 text-sm text-ink-soft backdrop-blur">
                  {dictionary.product.styled(product.styled[locale])}
                </p>
              )}
            </>
          )}
        </div>

        <div className="grid min-w-0 gap-6">
          <div className="grid gap-2">
            <span className="eyebrow">{product.kind[locale]}</span>
            <h1 className="font-head text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold">{product.name[locale]}</h1>
            {locale === "en" && (
              <span lang="ar" className="font-ar text-2xl text-pink">
                {product.name.ar}
              </span>
            )}
            {catalog.ratings[product.id] && (
              <a href="#reviews" className="flex w-fit items-center gap-2 font-bold hover:text-pink">
                <Stars value={catalog.ratings[product.id].avg} label={dictionary.reviews.stars(catalog.ratings[product.id].avg)} />
                {catalog.ratings[product.id].avg.toFixed(1)} · {dictionary.reviews.count(catalog.ratings[product.id].count)}
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <strong className="font-head text-4xl font-extrabold tabular-nums">
              <Price full={full} unit={unit} locale={locale} />
            </strong>
            {product.slots.length === 1 && firstPlant && (
              <span className="text-ink-soft">{firstPlant.potOnly ? dictionary.product.potOnly : dictionary.product.withPlant(firstPlant.name[locale])}</span>
            )}
          </div>

          <p className="max-w-[52ch] text-lg text-ink-soft">{product.desc[locale]}</p>

          {product.slots.map((slot, slotIndex) => {
            const base = plantOf(catalog, defaults[slotIndex])?.price ?? 0;
            return (
              <fieldset key={slotIndex} className="grid gap-3">
                <legend className="mb-3 font-head text-xl">
                  {product.slots.length > 1 ? dictionary.product.whoInsideSlot(slot[locale]) : dictionary.product.whoInside}
                </legend>
                <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                  {options.map((option) => {
                    const difference = option.price - base;
                    const out = soldOut(option);
                    const on = plants[slotIndex] === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-3 rounded-2xl border-[3px] p-3 transition-all duration-200 has-focus-visible:outline-3 has-focus-visible:outline-pink ${
                          out
                            ? "cursor-not-allowed border-line bg-paper/60 opacity-50"
                            : on
                              ? `cursor-pointer border-ink ${TINT[option.tint].soft} -rotate-1 shadow-pop-sm`
                              : "cursor-pointer border-line bg-paper hover:-translate-y-0.5 hover:border-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`plant-${slotIndex}`}
                          value={option.id}
                          checked={on}
                          disabled={out}
                          onChange={() => pickFor(slotIndex, option.id)}
                          className="sr-only"
                        />
                        <PlantIcon icon={option.icon} className="size-11 shrink-0" />
                        <span className="grid">
                          <b className="leading-tight">{option.name[locale]}</b>
                          <small className="text-ink-soft tabular-nums">
                            {out ? dictionary.product.soldOut : difference === 0 ? dictionary.product.included : `${difference > 0 ? "+" : ""}${formatPrice(difference, locale)}`}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {max > 0 && max <= 3 && <p className="w-fit -rotate-1 rounded-full bg-sun px-3 py-1 font-extrabold">{dictionary.product.onlyLeft(max)}</p>}

          <div className="flex flex-wrap gap-3">
            {max > 0 && (
              <QtyStepper value={qty} max={max} onChange={setQty} labels={{ group: dictionary.product.qty, fewer: dictionary.product.fewer, more: dictionary.product.more }} />
            )}
            <button
              type="button"
              disabled={max === 0}
              className="btn btn-pink min-w-[180px] flex-1"
              onClick={() => addToBag(product.id, plants, qty)}
            >
              {max === 0 ? dictionary.product.soldOut : dictionary.product.add}
            </button>
            {max > 0 && (
              <button
                type="button"
                className="btn btn-sun w-full sm:w-auto"
                onClick={() => {
                  add(product.id, plants, qty, max);
                  router.push(`/${locale}/checkout`);
                }}
              >
                {dictionary.product.buyNow}
              </button>
            )}
          </div>

          <ul className="grid gap-2 text-ink-soft">
            <li className="flex items-center gap-2">
              <TruckIcon className="shrink-0 text-sky" /> {dictionary.product.ship}
            </li>
            <li className="flex items-center gap-2">
              <GiftIcon className="shrink-0 text-pink" /> {dictionary.product.gift}
            </li>
          </ul>

          <div className="sticker relative p-5">
            <span className="absolute end-5 top-5 size-4 rounded-full border-[3px] border-ink bg-cream" aria-hidden="true" />
            <h2 className="mb-3 font-head text-xl font-extrabold">{dictionary.product.tag}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
              {product.specs.filter((spec) => spec.label[locale] && spec.value[locale]).map((spec, index) => (
                <div key={index} className="contents">
                  <dt className="text-ink-soft">{spec.label[locale]}</dt>
                  <dd className="font-bold">{spec.value[locale]}</dd>
                </div>
              ))}
            </dl>
            {[...new Set(plants)].map((id) => {
              const plant = plantOf(catalog, id);
              if (!plant || plant.potOnly) return null;
              return (
                <div key={id} className="mt-4 grid gap-3 border-t-[3px] border-dashed border-line pt-4">
                  {product.slots.length > 1 && (
                    <b className="flex items-center gap-2">
                      <PlantIcon icon={plant.icon} className="size-7" />
                      {plant.name[locale]}
                    </b>
                  )}
                  <PlantCare
                    plant={plant}
                    catalog={catalog}
                    locale={locale}
                    labels={{ sun: dictionary.product.sun, water: dictionary.product.water, bestFor: dictionary.plants.bestFor, vibe: dictionary.plants.vibe }}
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
