import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { productOf } from "@/lib/catalog";
import { readCatalog } from "@/lib/server/catalog-repo";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { productReviews } from "@/lib/server/reviews-repo";

type Props = { params: Promise<{ locale: string; id: string }> };

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
      <ProductReviews productId={id} reviews={productReviews(id)} locale={locale} />
      {mates.length > 0 && (
        <section className="mx-4 rounded-[40px] border-[3px] border-ink bg-lilac-soft py-10 sm:mx-6">
          <div className="mx-auto mb-6 grid max-w-6xl justify-items-center gap-3 px-4 text-center">
            <span className="eyebrow">{t.product.shelfEyebrow}</span>
            <h2 className="font-head text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold">{t.product.shelfTitle}</h2>
          </div>
          <div className="no-scrollbar snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pt-2 pb-4 sm:scroll-px-6 sm:px-6">
            {/* w-max + mx-auto: centred when the cards fit, scrolls from the first card when they don't */}
            <div className="mx-auto flex w-max gap-5">
              {mates.map((p, i) => (
                <div key={p.id} className="grid w-[min(78vw,280px)] shrink-0 snap-start">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
