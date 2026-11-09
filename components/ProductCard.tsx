"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { useCatalog } from "./CatalogProvider";
import { useAddToBag } from "./useAddToBag";
import { Price } from "./Price";
import { PlusIcon } from "./icons";
import { Stars } from "./reviews/Stars";
import { TINT, defaultPlantsFor, linePrice, maxQty, plantsSummary, variantImage, type Product } from "@/lib/catalog";

const TILT = ["hover:-rotate-2", "hover:rotate-2", "hover:-rotate-1"];

export function ProductCard({ product: p, index = 0, plants: forced }: { product: Product; index?: number; plants?: string[] }) {
  const { locale, t } = useI18n();
  const catalog = useCatalog();
  const addToBag = useAddToBag();
  const tint = TINT[p.tint];
  const name = p.name[locale];
  const plants = forced ?? defaultPlantsFor(catalog, p);
  const { full, unit } = linePrice(catalog, p, plants);
  const out = maxQty(catalog, p, plants) === 0;
  const href = `/${locale}/pots/${p.id}${forced ? `?plants=${plants.join(",")}` : ""}`;
  const photo = (forced && variantImage(p, plants)) || p.image;
  const rating = catalog.ratings[p.id];

  return (
    <article
      className={`group relative grid gap-3 rounded-[28px] border-[3px] border-ink p-3 pb-4 shadow-pop transition-transform duration-300 ease-[cubic-bezier(.3,1.5,.5,1)] hover:-translate-y-1.5 ${TILT[index % 3]} ${tint.soft}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border-[3px] border-ink bg-paper">
        <Image
          src={photo}
          alt={`${name}, ${p.kind[locale]}`}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${out ? "opacity-60 grayscale-[.6]" : ""}`}
          style={{ objectPosition: p.pos }}
        />
        <span
          className={`absolute start-3 top-3 -rotate-6 rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold ${out ? "bg-paper text-ink" : `${tint.solid} ${tint.text}`}`}
        >
          {out ? t.shop.soldOut : p.badge[locale]}
        </span>
        {p.salePercent > 0 && !out && (
          <span className="absolute end-3 top-3 rotate-6 rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-extrabold">
            {t.shop.off(p.salePercent)}
          </span>
        )}
        {!out && (
          <button
            type="button"
            onClick={() => addToBag(p.id, plants)}
            aria-label={t.shop.quickAdd(name)}
            className="absolute end-3 bottom-3 z-[2] grid size-12 place-items-center rounded-full border-[3px] border-ink bg-pink text-white shadow-pop-sm transition-transform duration-200 hover:scale-110 hover:rotate-90"
          >
            <PlusIcon />
          </button>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="font-head text-2xl font-extrabold">{name}</h3>
          <p className="text-sm text-ink-soft">
            {p.kind[locale]} · {t.shop.with(plantsSummary(catalog, plants, locale))}
          </p>
          {rating && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
              <Stars value={rating.avg} size={16} label={t.reviews.stars(rating.avg)} />
              <span className="text-ink-soft">({rating.count})</span>
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full border-2 border-ink bg-paper px-3 py-1 font-extrabold whitespace-nowrap tabular-nums">
          <Price full={full} unit={unit} locale={locale} />
        </span>
      </div>
      <Link href={href} aria-label={t.shop.view(name)} className="absolute inset-0 z-[1] rounded-[28px]" />
    </article>
  );
}
