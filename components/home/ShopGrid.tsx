import { getDict, type Locale } from "@/lib/i18n";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "../ProductCard";

export function ShopGrid({ locale, products }: { locale: Locale; products: Product[] }) {
  const t = getDict(locale);
  return (
    <section id="shop" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-3">
          <span className="eyebrow">{t.shop.eyebrow}</span>
          <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{t.shop.title}</h2>
        </div>
        <p className="max-w-[38ch] text-lg text-ink-soft">{t.shop.sub}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
