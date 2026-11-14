import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { SOCIALS } from "@/lib/site";
import { Logo } from "./Logo";
import { SocialIcon } from "./icons";
import { LangSwitch } from "./LangSwitch";

export function Footer({ locale }: { locale: Locale }) {
  const dictionary = getDict(locale);
  return (
    <footer className="relative mt-20">
      {/* wavy top edge */}
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-10 w-full sm:h-14" aria-hidden="true">
        <path
          d="M0 40 C120 0 240 0 360 30 S600 60 720 30 960 0 1080 30 1320 60 1440 30 V60 H0Z"
          className="fill-sun"
          stroke="var(--color-ink)"
          strokeWidth="3"
        />
      </svg>
      <div className="-mt-px bg-sun">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="grid gap-4">
            <Logo size="xl" />
            <p className="font-head text-2xl">{dictionary.footer.tagline}</p>
            <p className="max-w-[42ch] text-ink/80">{dictionary.footer.about}</p>
          </div>
          <div className="grid content-start gap-3">
            <h2 className="font-head text-xl">{dictionary.footer.shop}</h2>
            <Link href={`/${locale}#shop`} className="w-fit font-bold underline-offset-4 hover:underline">
              {dictionary.nav.shop}
            </Link>
            <Link href={`/${locale}#matcher`} className="w-fit font-bold underline-offset-4 hover:underline">
              {dictionary.nav.matcher}
            </Link>
            <Link href={`/${locale}#plants`} className="w-fit font-bold underline-offset-4 hover:underline">
              {dictionary.nav.plants}
            </Link>
            <Link href={`/${locale}/track`} className="w-fit font-bold underline-offset-4 hover:underline">
              {dictionary.footer.track}
            </Link>
            <Link href={`/${locale}/account`} className="w-fit font-bold underline-offset-4 hover:underline">
              {dictionary.footer.account}
            </Link>
            <LangSwitch className="mt-2 w-fit bg-paper" />
          </div>
          <div className="grid content-start gap-3">
            <h2 className="font-head text-xl">{dictionary.footer.follow}</h2>
            <ul className="flex flex-wrap gap-3">
              {SOCIALS.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="grid size-12 place-items-center rounded-full border-[3px] border-ink bg-paper shadow-pop-sm transition-transform hover:-translate-y-1 hover:rotate-6 hover:bg-pink hover:text-white"
                  >
                    <SocialIcon id={social.id} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t-[3px] border-dashed border-ink/25">
          <p className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-sm font-bold text-ink/80">
            <span>{dictionary.footer.made}</span>
            <span dir="ltr">© {new Date().getFullYear()} zal3a</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
