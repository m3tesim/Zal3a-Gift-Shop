import Image from "next/image";
import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { TINT, careOf, soldOut, type Catalog } from "@/lib/catalog";
import { ArrowIcon, PlantIcon } from "../icons";
import { CareDots } from "../CareDots";

export function Roommates({ locale, catalog }: { locale: Locale; catalog: Catalog }) {
  const dictionary = getDict(locale);
  return (
    <section id="plants" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-3">
          <span className="eyebrow">{dictionary.plants.eyebrow}</span>
          <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{dictionary.plants.title}</h2>
        </div>
        <p className="max-w-[38ch] text-lg text-ink-soft">{dictionary.plants.sub}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.plants.filter((plant) => !plant.potOnly).map((plant) => {
          const out = soldOut(plant);
          return (
            <Link
              key={plant.id}
              href={`/${locale}/plants/${plant.id}`}
              className={`group grid content-start gap-3 rounded-[24px] border-[3px] border-ink p-4 shadow-pop transition-transform duration-300 hover:-translate-y-1 hover:-rotate-1 ${TINT[plant.tint].soft}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border-[3px] border-ink bg-paper">
                {plant.image ? (
                  <Image
                    src={plant.image}
                    alt={plant.name[locale]}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                    className={`object-cover transition-transform duration-500 group-hover:scale-105 ${out ? "opacity-60 grayscale-[.6]" : ""}`}
                  />
                ) : (
                  <PlantIcon icon={plant.icon} className="absolute inset-0 m-auto size-2/3" />
                )}
                <span className="absolute start-3 bottom-3 grid size-16 place-items-center rounded-2xl border-[3px] border-ink bg-paper shadow-pop-sm transition-transform group-hover:animate-wiggle">
                  <PlantIcon icon={plant.icon} className="size-12" />
                </span>
                {out && (
                  <span className="absolute end-3 top-3 rotate-6 rounded-full border-2 border-ink bg-paper px-3 py-1 text-xs font-extrabold">
                    {dictionary.shop.soldOut}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-head text-2xl font-extrabold">{plant.name[locale]}</h3>
                <p className={`text-sm text-ink-soft ${locale === "en" ? "italic" : ""}`}>{plant.latin[locale]}</p>
              </div>
              <p className="text-ink-soft">{plant.blurb[locale]}</p>
              <div className="flex flex-wrap items-end justify-between gap-3 border-t-[3px] border-dashed border-ink/20 pt-3">
                <div className="flex gap-5">
                  <CareDots kind="sun" level={careOf(catalog, "sun", plant.sun)?.level ?? 0} label={dictionary.plants.sun} />
                  <CareDots kind="water" level={careOf(catalog, "water", plant.water)?.level ?? 0} label={dictionary.plants.water} />
                </div>
                <span className="inline-flex items-center gap-1.5 font-extrabold text-pink">
                  {dictionary.plants.cta}
                  <ArrowIcon width={18} height={18} className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
