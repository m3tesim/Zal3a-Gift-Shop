import { getDict, type Locale } from "@/lib/i18n";
import { SOCIALS, type SocialId } from "@/lib/site";
import { ArrowIcon, SocialIcon } from "../icons";

const TILE: Record<SocialId, string> = {
  instagram: "bg-pink text-white hover:-rotate-2",
  tiktok: "bg-sky text-ink hover:rotate-2",
  facebook: "bg-lilac text-white hover:-rotate-1",
  whatsapp: "bg-lime text-ink hover:rotate-1",
};

export function SocialSection({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8 grid justify-items-center gap-3 text-center">
        <span className="eyebrow">{t.social.eyebrow}</span>
        <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{t.social.title}</h2>
        <p className="max-w-[46ch] text-lg text-ink-soft">{t.social.sub}</p>
      </div>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SOCIALS.map((s) => (
          <li key={s.id}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`grid h-full gap-6 rounded-[28px] border-[3px] border-ink p-5 shadow-pop transition-transform duration-300 hover:-translate-y-1 ${TILE[s.id]}`}
            >
              <span className="grid size-14 place-items-center rounded-full border-[3px] border-ink bg-paper text-ink">
                <SocialIcon id={s.id} width={28} height={28} />
              </span>
              <span className="grid gap-0.5">
                <b className="font-head text-2xl">{s.label}</b>
                <span dir="ltr" className="w-fit text-sm font-bold opacity-90">
                  {s.handle}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-extrabold">
                {s.id === "whatsapp" ? t.social.chat : t.social.follow}
                <ArrowIcon width={18} height={18} className="rtl:-scale-x-100" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
