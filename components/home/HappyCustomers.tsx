import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { productOf, type Catalog } from "@/lib/catalog";
import type { Review } from "@/lib/server/reviews-repo";
import { ReviewCard } from "../reviews/ProductReviews";

/** Best recent reviews. Hidden until there's at least one. */
export function HappyCustomers({ locale, reviews, catalog }: { locale: Locale; reviews: Review[]; catalog: Catalog }) {
  const dictionary = getDict(locale);
  const shown = reviews.filter((review) => productOf(catalog, review.productId));
  if (!shown.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8 grid justify-items-center gap-3 text-center">
        <span className="eyebrow">{dictionary.reviews.eyebrow}</span>
        <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{dictionary.reviews.homeTitle}</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((review, index) => {
          const product = productOf(catalog, review.productId)!;
          return (
            <Link
              key={review.id}
              href={`/${locale}/pots/${product.id}#reviews`}
              className={`grid transition-transform hover:-translate-y-1 ${["md:-rotate-1", "md:rotate-1", "md:-rotate-[0.5deg]"][index % 3]}`}
            >
              <ReviewCard review={review} locale={locale} pot={product.name[locale]} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
