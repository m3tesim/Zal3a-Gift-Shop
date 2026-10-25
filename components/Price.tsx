import { formatPrice, type Locale } from "@/lib/i18n";

/** Shows the sale price with the original struck through when there's a discount. */
export function Price({ full, unit, locale }: { full: number; unit: number; locale: Locale }) {
  if (unit >= full) return <>{formatPrice(unit, locale)}</>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <s className="text-[0.75em] font-semibold text-ink-soft">{formatPrice(full, locale)}</s>
      <span className="text-pink">{formatPrice(unit, locale)}</span>
    </span>
  );
}
