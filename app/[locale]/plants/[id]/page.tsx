import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { TINT, plantOf, soldOut } from "@/lib/catalog";
import { readCatalog } from "@/lib/server/catalog-repo";
import { ProductCard } from "@/components/ProductCard";
import { PlantCare } from "@/components/PlantCare";
import { BackIcon, PlantIcon } from "@/components/icons";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const plant = plantOf(readCatalog(), id);
  if (!isLocale(locale) || !plant) return {};
  return { title: plant.name[locale], description: plant.blurb[locale], openGraph: plant.image ? { images: [plant.image] } : undefined };
}

export default async function PlantPage({ params }: Props) {
  const { locale, id } = await params;
  const catalog = readCatalog();
  const plant = plantOf(catalog, id);
  if (!isLocale(locale) || !plant || plant.potOnly) notFound();
  const dictionary = getDict(locale);
  const out = soldOut(plant);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6 pb-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/${locale}#plants`}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1.5 font-bold transition-colors hover:bg-sun-soft"
          >
            <BackIcon width={16} height={16} className="rtl:-scale-x-100" />
            {dictionary.plants.title}
          </Link>
          <span aria-hidden="true" className="text-ink-soft">
            /
          </span>
          <span className="font-bold text-ink-soft">{plant.name[locale]}</span>
        </nav>

        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className={`relative aspect-square overflow-hidden rounded-[36px] border-[3px] border-ink shadow-pop ${TINT[plant.tint].soft}`}>
            {plant.image ? (
              <Image src={plant.image} alt={plant.name[locale]} fill priority sizes="(min-width: 768px) 520px, 92vw" className="object-cover" />
            ) : (
              <PlantIcon icon={plant.icon} className="absolute inset-0 m-auto size-2/3" />
            )}
            <span className="absolute start-4 bottom-4 grid size-20 animate-wiggle place-items-center rounded-3xl border-[3px] border-ink bg-paper shadow-pop-sm">
              <PlantIcon icon={plant.icon} className="size-16" />
            </span>
            {out && (
              <span className="absolute end-4 top-4 rotate-6 rounded-full border-2 border-ink bg-paper px-3 py-1 font-extrabold">
                {dictionary.shop.soldOut}
              </span>
            )}
          </div>

          <div className="grid gap-5">
            <span className="eyebrow">{dictionary.plantPage.eyebrow}</span>
            <div>
              <h1 className="font-head text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold">{plant.name[locale]}</h1>
              <p className={`text-lg text-ink-soft ${locale === "en" ? "italic" : ""}`}>{plant.latin[locale]}</p>
            </div>
            <p className="max-w-[48ch] text-xl">{plant.blurb[locale]}</p>
            <div className="sticker grid gap-4 p-5">
              <h2 className="font-head text-xl font-extrabold">{dictionary.plantPage.care}</h2>
              <PlantCare
                plant={plant}
                catalog={catalog}
                locale={locale}
                labels={{ sun: dictionary.product.sun, water: dictionary.product.water, bestFor: dictionary.plants.bestFor, vibe: dictionary.plants.vibe }}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="pots" className="mx-4 scroll-mt-24 rounded-[40px] border-[3px] border-ink bg-sun-soft py-10 sm:mx-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 grid gap-2">
            <h2 className="font-head text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold">{dictionary.plantPage.pickPot}</h2>
            <p className="text-lg text-ink-soft">{dictionary.plantPage.pickPotSub}</p>
          </div>
          {catalog.products.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} plants={product.slots.map(() => plant.id)} />
              ))}
            </div>
          ) : (
            <p className="font-bold">{dictionary.plantPage.noPots}</p>
          )}
        </div>
      </section>
    </>
  );
}
