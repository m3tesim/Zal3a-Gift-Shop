import { getDict, type Locale } from "@/lib/i18n";
import type { Review } from "@/lib/server/reviews-repo";
import { Stars } from "./Stars";
import { ReviewForm } from "./ReviewForm";

export const reviewDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ReviewCard({ review, locale, pot }: { review: Review; locale: Locale; pot?: string }) {
  const dictionary = getDict(locale);
  return (
    <article className="grid content-start gap-2 rounded-3xl border-[3px] border-ink bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars value={review.rating} label={dictionary.reviews.stars(review.rating)} />
        <time dateTime={review.createdAt} className="text-sm text-ink-soft">
          {reviewDate(review.createdAt, locale)}
        </time>
      </div>
      <p dir="auto" className="text-lg whitespace-pre-line">
        {review.body}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <b>{review.author}</b>
        <span className="rounded-full bg-lime-soft px-2 py-0.5 text-xs font-extrabold">✓ {dictionary.reviews.verified}</span>
        {pot && <span className="text-ink-soft">{dictionary.reviews.on(pot)}</span>}
      </p>
      {review.reply && (
        <div className="mt-1 rounded-2xl border-s-4 border-pink bg-pink-soft/50 px-4 py-2">
          <b className="text-sm">{dictionary.reviews.reply}</b>
          <p dir="auto" className="whitespace-pre-line">
            {review.reply}
          </p>
        </div>
      )}
    </article>
  );
}

/** Rating summary, the review list and the "write a review" box for one pot. */
export function ProductReviews({ productId, reviews, locale }: { productId: string; reviews: Review[]; locale: Locale }) {
  const dictionary = getDict(locale);
  const count = reviews.length;
  const avg = count ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / count) * 10) / 10 : 0;

  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
      <div className="mb-8 grid gap-3">
        <span className="eyebrow">{dictionary.reviews.eyebrow}</span>
        <h2 className="font-head text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold">{dictionary.reviews.title}</h2>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
        <div className="sticker grid gap-4 bg-sun-soft p-5 lg:sticky lg:top-24">
          {count ? (
            <>
              <div className="flex items-end gap-3">
                <b className="font-head text-6xl leading-none">{avg.toFixed(1)}</b>
                <span className="grid gap-1 pb-1">
                  <Stars value={avg} size={22} label={dictionary.reviews.stars(avg)} />
                  <span className="text-sm font-bold text-ink-soft">{dictionary.reviews.count(count)}</span>
                </span>
              </div>
              <ul className="grid gap-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const matching = reviews.filter((review) => review.rating === stars).length;
                  return (
                    <li key={stars} className="flex items-center gap-2 text-sm font-bold">
                      <span className="w-3 tabular-nums">{stars}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-paper">
                        <span className="block h-full bg-sun" style={{ width: `${(matching / count) * 100}%` }} />
                      </span>
                      <span className="w-5 text-end text-ink-soft tabular-nums">{matching}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="font-bold">{dictionary.reviews.none}</p>
          )}
        </div>
        <div className="grid gap-4">
          <ReviewForm productId={productId} />
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
