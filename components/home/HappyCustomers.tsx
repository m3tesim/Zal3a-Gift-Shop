import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { productOf, type Catalog } from "@/lib/catalog";
import type { Review } from "@/lib/server/reviews-repo";
import { ReviewCard } from "../reviews/ProductReviews";

/** Best recent reviews. Hidden until there's at least one. */
export function HappyCustomers({ locale, reviews, catalog }: { locale: Locale; reviews: Review[]; catalog: Catalog }) {
  const t = getDict(locale);
  const shown = reviews.filter((r) => productOf(catalog, r.productId));
  if (!shown.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8 grid justify-items-center gap-3 text-center">
        <span className="eyebrow">{t.reviews.eyebrow}</span>
        <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{t.reviews.homeTitle}</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((r, i) => {
          const p = productOf(catalog, r.productId)!;
          return (
            <Link
              key={r.id}
              href={`/${locale}/pots/${p.id}#reviews`}
              className={`grid transition-transform hover:-translate-y-1 ${["md:-rotate-1", "md:rotate-1", "md:-rotate-[0.5deg]"][i % 3]}`}
            >
              <ReviewCard r={r} locale={locale} pot={p.name[locale]} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
