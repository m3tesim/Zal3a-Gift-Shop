"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { useAddToBag } from "./useAddToBag";
import { PlusIcon } from "./icons";
import { PLANTS, TINT, unitPrice, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/i18n";

const TILT = ["hover:-rotate-2", "hover:rotate-2", "hover:-rotate-1"];

export function ProductCard({ product: p, index = 0 }: { product: Product; index?: number }) {
  const { locale, t } = useI18n();
  const addToBag = useAddToBag();
  const tint = TINT[p.tint];
  const name = p.name[locale];

  return (
    <article
      className={`group relative grid gap-3 rounded-[28px] border-[3px] border-ink p-3 pb-4 shadow-pop transition-transform duration-300 ease-[cubic-bezier(.3,1.5,.5,1)] hover:-translate-y-1.5 ${TILT[index % 3]} ${tint.soft}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border-[3px] border-ink bg-paper">
        <Image
          src={p.img}
          alt={`${name}, ${p.kind[locale]}`}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: p.pos }}
        />
        <span
          className={`absolute start-3 top-3 -rotate-6 rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold ${tint.solid} ${tint.text}`}
        >
          {p.badge[locale]}
        </span>
        <button
          type="button"
          onClick={() => addToBag(p.id, p.plant)}
          aria-label={t.shop.quickAdd(name)}
          className="absolute end-3 bottom-3 z-[2] grid size-12 place-items-center rounded-full border-[3px] border-ink bg-pink text-white shadow-pop-sm transition-transform duration-200 hover:scale-110 hover:rotate-90"
        >
          <PlusIcon />
        </button>
      </div>
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="font-head text-2xl font-extrabold">{name}</h3>
          <p className="text-sm text-ink-soft">
            {p.kind[locale]} · {t.shop.with(PLANTS[p.plant].name[locale])}
          </p>
        </div>
        <span className="shrink-0 rounded-full border-2 border-ink bg-paper px-3 py-1 font-extrabold whitespace-nowrap tabular-nums">
          {formatPrice(unitPrice(p.id, p.plant), locale)}
        </span>
      </div>
      <Link href={`/${locale}/pots/${p.id}`} aria-label={t.shop.view(name)} className="absolute inset-0 z-[1] rounded-[28px]" />
    </article>
  );
}
