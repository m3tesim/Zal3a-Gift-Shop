import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { productOf } from "@/lib/catalog";
import { readCatalog } from "@/lib/server/catalog-repo";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";

type Props = { params: Promise<{ locale: string; id: string }> };

export function generateStaticParams() {
  return readCatalog().products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const p = productOf(readCatalog(), id);
  if (!isLocale(locale) || !p) return {};
  return { title: p.name[locale], description: p.desc[locale], openGraph: { images: [p.image] } };
}

export default async function PotPage({ params }: Props) {
  const { locale, id } = await params;
  const catalog = readCatalog();
  if (!isLocale(locale) || !productOf(catalog, id)) notFound();
  const t = getDict(locale);
  const mates = catalog.products.filter((p) => p.id !== id);

  return (
    <>
      <ProductDetail key={id} id={id} />
      {mates.length > 0 && (
        <section className="mx-4 rounded-[40px] border-[3px] border-ink bg-lilac-soft py-10 sm:mx-6">
          <div className="mx-auto mb-6 grid max-w-6xl gap-3 px-4">
            <span className="eyebrow">{t.product.shelfEyebrow}</span>
            <h2 className="font-head text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold">{t.product.shelfTitle}</h2>
          </div>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(1rem,calc((100%-72rem)/2+1rem))] pt-2 pb-4">
            {mates.map((p, i) => (
              <div key={p.id} className="w-[min(78vw,280px)] shrink-0 snap-start">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
