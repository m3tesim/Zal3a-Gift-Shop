import { getDict, type Locale } from "@/lib/i18n";
import type { Review } from "@/lib/server/reviews-repo";
import { Stars } from "./Stars";
import { ReviewForm } from "./ReviewForm";

export const reviewDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ReviewCard({ r, locale, pot }: { r: Review; locale: Locale; pot?: string }) {
  const t = getDict(locale);
  return (
    <article className="grid content-start gap-2 rounded-3xl border-[3px] border-ink bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars value={r.rating} label={t.reviews.stars(r.rating)} />
        <time dateTime={r.createdAt} className="text-sm text-ink-soft">
          {reviewDate(r.createdAt, locale)}
        </time>
      </div>
      <p dir="auto" className="text-lg whitespace-pre-line">
        {r.body}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <b>{r.author}</b>
        <span className="rounded-full bg-lime-soft px-2 py-0.5 text-xs font-extrabold">✓ {t.reviews.verified}</span>
        {pot && <span className="text-ink-soft">{t.reviews.on(pot)}</span>}
      </p>
      {r.reply && (
        <div className="mt-1 rounded-2xl border-s-4 border-pink bg-pink-soft/50 px-4 py-2">
          <b className="text-sm">{t.reviews.reply}</b>
          <p dir="auto" className="whitespace-pre-line">
            {r.reply}
          </p>
        </div>
      )}
    </article>
  );
}

/** Rating summary, the review list and the "write a review" box for one pot. */
export function ProductReviews({ productId, reviews, locale }: { productId: string; reviews: Review[]; locale: Locale }) {
  const t = getDict(locale);
  const count = reviews.length;
  const avg = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;

  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
      <div className="mb-8 grid gap-3">
        <span className="eyebrow">{t.reviews.eyebrow}</span>
        <h2 className="font-head text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold">{t.reviews.title}</h2>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
        <div className="sticker grid gap-4 bg-sun-soft p-5 lg:sticky lg:top-24">
          {count ? (
            <>
              <div className="flex items-end gap-3">
                <b className="font-head text-6xl leading-none">{avg.toFixed(1)}</b>
                <span className="grid gap-1 pb-1">
                  <Stars value={avg} size={22} label={t.reviews.stars(avg)} />
                  <span className="text-sm font-bold text-ink-soft">{t.reviews.count(count)}</span>
                </span>
              </div>
              <ul className="grid gap-1.5">
                {[5, 4, 3, 2, 1].map((n) => {
                  const k = reviews.filter((r) => r.rating === n).length;
                  return (
                    <li key={n} className="flex items-center gap-2 text-sm font-bold">
                      <span className="w-3 tabular-nums">{n}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-paper">
                        <span className="block h-full bg-sun" style={{ width: `${(k / count) * 100}%` }} />
                      </span>
                      <span className="w-5 text-end text-ink-soft tabular-nums">{k}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="font-bold">{t.reviews.none}</p>
          )}
        </div>
        <div className="grid gap-4">
          <ReviewForm productId={productId} />
          {reviews.map((r) => (
            <ReviewCard key={r.id} r={r} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
