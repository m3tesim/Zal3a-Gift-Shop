import Image from "next/image";
import Link from "next/link";
import { formatPrice, getDict, type Locale } from "@/lib/i18n";
import { PRODUCT_BY_ID } from "@/lib/products";
import { ArrowIcon, CheckIcon, FlowerShape, GiftIcon, StarShape } from "../icons";

const PERK_BG = ["bg-sun-soft -rotate-2", "bg-sky-soft rotate-1", "bg-lime-soft -rotate-1"];

export function Hero({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const duo = PRODUCT_BY_ID.duo;

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:pt-14 md:grid-cols-[1.1fr_1fr]">
        <div className="grid min-w-0 animate-rise gap-6">
          <span className="sticker inline-flex w-fit -rotate-2 items-center gap-2 bg-lilac-soft px-4 py-1.5 font-extrabold">
            <GiftIcon className="text-pink" />
            {t.hero.sticker}
          </span>
          <h1 className="font-head text-[clamp(3rem,8.5vw,6.2rem)] font-extrabold">
            {t.hero.titleA}{" "}
            <span className="inline-block -rotate-2 rounded-2xl border-[3px] border-ink bg-lime px-3 shadow-pop">
              {t.hero.grow}
            </span>{" "}
            {t.hero.and}
            {locale === "ar" ? "" : " "}
            <span className="squiggle text-pink">{t.hero.giggle}</span>
          </h1>
          <p className="max-w-[40ch] text-lg text-ink-soft sm:text-xl">{t.hero.sub}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}#matcher`} className="btn btn-pink">
              {t.hero.ctaMatch}
              <ArrowIcon className="rtl:-scale-x-100" />
            </Link>
            <Link href={`/${locale}#shop`} className="btn btn-white">
              {t.hero.ctaShop}
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2">
            {t.hero.perks.map((perk, i) => (
              <li
                key={perk}
                className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${PERK_BG[i]}`}
              >
                <CheckIcon width={14} height={14} className="text-pink" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative isolate mx-auto aspect-square w-full max-w-[520px]">
          <div className="absolute -start-[8%] -bottom-[6%] -z-10 aspect-square w-[46%] rounded-full bg-sun" />
          <div className="absolute -end-[5%] -top-[5%] -z-10 aspect-square w-[30%] rounded-full bg-sky" />
          <div className="absolute inset-0 animate-rise overflow-hidden rounded-[58%_42%_50%_50%/46%_52%_48%_54%] border-[3px] border-ink bg-paper shadow-pop">
            <Image
              src={duo.img}
              alt={locale === "ar" ? "قصريتين على شكل قطط، واحدة مخضوضة وواحدة بتضحك، وطالع من راسهم زرع صغير" : "Two white ceramic cat pots on a sunny table, one wide-eyed and one laughing, each with a small plant growing from its head"}
              fill
              priority
              sizes="(min-width: 768px) 520px, 92vw"
              className="object-cover"
            />
          </div>

          <StarShape className="absolute -top-2 start-[6%] size-14 animate-float text-sun [--r:-12deg]" />
          <FlowerShape className="absolute bottom-[14%] -start-3 size-12 animate-float text-pink [animation-delay:-2s]" />
          <StarShape className="absolute end-[18%] -bottom-3 size-9 animate-float text-lilac [animation-delay:-1s] [--r:18deg]" />

          <span className="absolute end-[6%] top-[14%] animate-wiggle rounded-[18px_18px_18px_4px] border-[3px] border-ink bg-pink px-3 py-1 font-head text-xl text-white rtl:rounded-[18px_18px_4px_18px]">
            {t.hero.hello}
          </span>

          <Link
            href={`/${locale}/pots/duo`}
            className="sticker absolute start-[2%] top-[38%] -rotate-6 px-4 py-2 font-extrabold transition-transform hover:rotate-0"
          >
            {duo.name[locale]}
            <small className="block font-semibold text-ink-soft">{t.hero.tagSmall(formatPrice(duo.price, locale))}</small>
          </Link>

          <div
            aria-hidden="true"
            className="absolute -end-[2%] bottom-[4%] grid aspect-square w-[clamp(104px,24%,130px)] place-items-center rounded-full border-[3px] border-ink bg-pink text-white shadow-pop"
          >
            <svg viewBox="0 0 100 100" direction="ltr" className="absolute inset-1.5 animate-spin-slow">
              <defs>
                <path id="circ" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0" />
              </defs>
              <text className={`fill-white font-extrabold ${locale === "ar" ? "font-arbody text-[12px]" : "text-[10.5px] tracking-[0.16em] uppercase"}`}>
                <textPath href="#circ">{t.hero.spin}</textPath>
              </text>
            </svg>
            <span lang="ar" className="font-ar text-2xl">
              زلعة
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
