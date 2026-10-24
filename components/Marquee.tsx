import { getDict, dirOf, type Locale } from "@/lib/i18n";

export function Marquee({ locale }: { locale: Locale }) {
  const items = [...getDict(locale).marquee, ...getDict(locale).marquee]; // long enough for wide screens
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((m, i) => (
        <li key={i} dir={dirOf(locale)} className="flex items-center gap-4 px-4 whitespace-nowrap">
          <span className={i % 2 ? "text-pink" : "text-lilac"} aria-hidden="true">
            ✿
          </span>
          {m}
        </li>
      ))}
    </ul>
  );
  // dir=ltr keeps the -50% loop maths the same in Arabic; the reverse direction reads naturally there.
  return (
    <div dir="ltr" className="overflow-hidden border-b-[3px] border-ink bg-sun py-2 text-sm font-extrabold text-ink">
      <div className={`flex w-max animate-marquee ${locale === "ar" ? "[animation-direction:reverse]" : ""}`}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
