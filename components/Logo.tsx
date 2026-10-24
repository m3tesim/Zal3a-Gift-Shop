export function Logo({ size = "md" }: { size?: "md" | "xl" }) {
  const big = size === "xl";
  return (
    <span className="inline-flex items-baseline gap-2" dir="ltr">
      <b className={`font-logo font-normal leading-none text-ink ${big ? "text-7xl sm:text-8xl" : "text-3xl"}`}>
        zal<span className="inline-block -translate-y-0.5 -rotate-12 text-pink">3</span>a
      </b>
      <span lang="ar" className={`font-ar text-pink ${big ? "text-4xl" : "text-xl"}`}>
        زلعة
      </span>
    </span>
  );
}
