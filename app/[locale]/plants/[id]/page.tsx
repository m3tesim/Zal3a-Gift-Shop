import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { TINT, plantOf, soldOut } from "@/lib/catalog";
import { readCatalog } from "@/lib/server/catalog-repo";
import { ProductCard } from "@/components/ProductCard";
import { CareDots } from "@/components/CareDots";
import { BackIcon, PlantIcon } from "@/components/icons";

type Props = { params: Promise<{ locale: string; id: string }> };

export function generateStaticParams() {
  return readCatalog()
    .plants.filter((p) => !p.potOnly)
    .map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const pl = plantOf(readCatalog(), id);
  if (!isLocale(locale) || !pl) return {};
  return { title: pl.name[locale], description: pl.blurb[locale], openGraph: pl.image ? { images: [pl.image] } : undefined };
}

export default async function PlantPage({ params }: Props) {
  const { locale, id } = await params;
  const catalog = readCatalog();
  const pl = plantOf(catalog, id);
  if (!isLocale(locale) || !pl || pl.potOnly) notFound();
  const t = getDict(locale);
  const out = soldOut(pl);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6 pb-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/${locale}#plants`}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1.5 font-bold transition-colors hover:bg-sun-soft"
          >
            <BackIcon width={16} height={16} className="rtl:-scale-x-100" />
            {t.plants.title}
          </Link>
          <span aria-hidden="true" className="text-ink-soft">
            /
          </span>
          <span className="font-bold text-ink-soft">{pl.name[locale]}</span>
        </nav>

        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className={`relative aspect-square overflow-hidden rounded-[36px] border-[3px] border-ink shadow-pop ${TINT[pl.tint].soft}`}>
            {pl.image ? (
              <Image src={pl.image} alt={pl.name[locale]} fill priority sizes="(min-width: 768px) 520px, 92vw" className="object-cover" />
            ) : (
              <PlantIcon icon={pl.icon} className="absolute inset-0 m-auto size-2/3" />
            )}
            <span className="absolute start-4 bottom-4 grid size-20 animate-wiggle place-items-center rounded-3xl border-[3px] border-ink bg-paper shadow-pop-sm">
              <PlantIcon icon={pl.icon} className="size-16" />
            </span>
            {out && (
              <span className="absolute end-4 top-4 rotate-6 rounded-full border-2 border-ink bg-paper px-3 py-1 font-extrabold">
                {t.shop.soldOut}
              </span>
            )}
          </div>

          <div className="grid gap-5">
            <span className="eyebrow">{t.plantPage.eyebrow}</span>
            <div>
              <h1 className="font-head text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold">{pl.name[locale]}</h1>
              <p className={`text-lg text-ink-soft ${locale === "en" ? "italic" : ""}`}>{pl.latin[locale]}</p>
            </div>
            <p className="max-w-[48ch] text-xl">{pl.blurb[locale]}</p>
            <div className="sticker grid gap-4 p-5">
              <h2 className="font-head text-xl font-extrabold">{t.plantPage.care}</h2>
              <div className="grid grid-cols-2 gap-4">
                <CareDots kind="sun" level={pl.sun} label={t.product.sun} hint={t.product.sunLevels[pl.sun]} />
                <CareDots kind="water" level={pl.water} label={t.product.water} hint={t.product.waterLevels[pl.water]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pots" className="mx-4 scroll-mt-24 rounded-[40px] border-[3px] border-ink bg-sun-soft py-10 sm:mx-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 grid gap-2">
            <h2 className="font-head text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold">{t.plantPage.pickPot}</h2>
            <p className="text-lg text-ink-soft">{t.plantPage.pickPotSub}</p>
          </div>
          {catalog.products.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} plants={p.slots.map(() => pl.id)} />
              ))}
            </div>
          ) : (
            <p className="font-bold">{t.plantPage.noPots}</p>
          )}
        </div>
      </section>
    </>
  );
}
