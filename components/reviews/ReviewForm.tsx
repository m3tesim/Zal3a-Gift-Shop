"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../I18nProvider";
import { StarIcon } from "../icons";
import { reviewStateAction, submitReviewAction, type ReviewState } from "@/app/[locale]/account/actions";

/** Only customers with a delivered order containing this pot can post (checked again on the server). */
export function ReviewForm({ productId }: { productId: string }) {
  const { locale, dictionary } = useI18n();
  const router = useRouter();
  const [state, setState] = useState<ReviewState | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    reviewStateAction(productId).then((reviewState) => {
      setState(reviewState);
      if (reviewState.state === "ok" && reviewState.review) {
        setRating(reviewState.review.rating);
        setBody(reviewState.review.body);
      }
    });
  }, [productId]);

  if (!state) return null;
  if (state.state === "guest")
    return (
      <p className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-[3px] border-dashed border-ink bg-paper px-5 py-4 font-bold">
        {dictionary.reviews.signIn}
        <Link href={`/${locale}/account/login?next=/${locale}/pots/${productId}`} className="rounded-full border-2 border-ink bg-sun px-4 py-1 font-extrabold hover:-rotate-2">
          {dictionary.account.signIn}
        </Link>
      </p>
    );
  if (state.state === "wait") return <p className="rounded-3xl border-[3px] border-dashed border-ink/40 bg-paper px-5 py-4 font-bold text-ink-soft">{dictionary.reviews.notYet}</p>;

  const existing = state.review;
  return (
    <form
      id="review"
      className="sticker grid gap-4 bg-sun-soft p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!rating) return setMsg({ ok: false, text: dictionary.reviews.pickRating });
        if (body.trim().length < 10) return setMsg({ ok: false, text: dictionary.reviews.tooShort });
        start(async () => {
          const result = await submitReviewAction({ locale, productId, rating, body });
          setMsg(result.ok ? { ok: true, text: dictionary.reviews.thanks } : { ok: false, text: dictionary.account.errors.generic });
          if (result.ok) router.refresh();
        });
      }}
    >
      <h3 className="font-head text-2xl font-extrabold">{existing ? dictionary.reviews.edit : dictionary.reviews.write}</h3>
      {existing && !existing.visible && <p className="text-sm font-bold text-ink-soft">{dictionary.reviews.hidden}</p>}
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-bold">{dictionary.reviews.rating}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={dictionary.reviews.stars(star)}
              aria-pressed={rating === star}
              onMouseEnter={() => setHover(star)}
              onClick={() => setRating(star)}
              className={`transition-transform hover:scale-125 ${(hover || rating) >= star ? "text-sun" : "text-line"}`}
            >
              <StarIcon width={36} height={36} />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1.5 font-bold">
        {dictionary.reviews.body}
        <textarea
          dir="auto"
          className="field min-h-28 resize-y font-normal"
          maxLength={2000}
          placeholder={dictionary.reviews.bodyPlaceholder}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      {msg && (
        <p role="status" className={`rounded-2xl px-4 py-2 text-sm font-bold ${msg.ok ? "bg-lime-soft" : "bg-pink-soft"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-pink w-fit">
        {existing ? dictionary.reviews.update : dictionary.reviews.submit}
      </button>
    </form>
  );
}
