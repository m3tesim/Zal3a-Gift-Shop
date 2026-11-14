import { getDict, type Locale } from "@/lib/i18n";
import { CheckIcon, PlantIcon } from "../icons";

/** Playful two-panel layout for sign in / register / password pages. */
export function AuthShell({ locale, title, children }: { locale: Locale; title: string; children: React.ReactNode }) {
  const dictionary = getDict(locale);
  return (
    <section className="mx-auto grid max-w-5xl items-start gap-8 px-4 py-10 md:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden rounded-[36px] border-[3px] border-ink bg-sun-soft p-8 shadow-pop md:grid md:gap-6">
        <div className="flex gap-3">
          <PlantIcon icon="cactus" className="size-20 animate-wiggle" />
          <PlantIcon icon="echeveria" className="size-20 animate-wiggle [animation-delay:-.8s]" />
          <PlantIcon icon="haworthia" className="size-20 animate-wiggle [animation-delay:-1.6s]" />
        </div>
        <h2 className="font-head text-3xl font-extrabold">{dictionary.account.registerTitle}</h2>
        <ul className="grid gap-3">
          {dictionary.account.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-3 font-bold">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime">
                <CheckIcon width={14} height={14} />
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </div>
      <div className="sticker grid gap-6 p-6 sm:p-8">
        <h1 className="font-head text-[clamp(2rem,5vw,2.8rem)] font-extrabold">{title}</h1>
        {children}
      </div>
    </section>
  );
}
