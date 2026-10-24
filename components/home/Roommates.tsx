import { getDict, type Locale } from "@/lib/i18n";
import { PLANT_KEYS, PLANTS, TINT } from "@/lib/products";
import { PlantIcon } from "../icons";
import { CareDots } from "../CareDots";

export function Roommates({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <section id="plants" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-3">
          <span className="eyebrow">{t.plants.eyebrow}</span>
          <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{t.plants.title}</h2>
        </div>
        <p className="max-w-[38ch] text-lg text-ink-soft">{t.plants.sub}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANT_KEYS.map((k) => {
          const pl = PLANTS[k];
          return (
            <article
              key={k}
              className={`group grid content-start gap-2 rounded-[24px] border-[3px] border-ink p-5 transition-transform duration-300 hover:-translate-y-1 hover:-rotate-1 ${TINT[pl.tint].soft}`}
            >
              <PlantIcon plant={k} className="size-20 transition-transform duration-300 group-hover:animate-wiggle" />
              <h3 className="font-head text-2xl font-extrabold">{pl.name[locale]}</h3>
              <p className={`-mt-1 text-sm text-ink-soft ${locale === "en" ? "italic" : ""}`}>{pl.latin[locale]}</p>
              <p className="text-ink-soft">{pl.blurb[locale]}</p>
              {k !== "empty" && (
                <div className="mt-2 flex gap-5 border-t-[3px] border-dashed border-ink/20 pt-3">
                  <CareDots kind="sun" level={pl.sun} label={t.plants.sun} />
                  <CareDots kind="water" level={pl.water} label={t.plants.water} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
