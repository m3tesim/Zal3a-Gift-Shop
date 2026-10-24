"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18nProvider";
import { otherLocale } from "@/lib/i18n";

export function LangSwitch({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname() || `/${locale}`;
  const next = otherLocale(locale);
  const href = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${next}`);
  return (
    <Link
      href={href}
      hrefLang={next}
      lang={next}
      aria-label={t.nav.langLabel}
      className={`inline-flex h-11 items-center rounded-full border-[3px] border-ink bg-sky-soft px-4 font-extrabold transition-transform hover:-rotate-3 hover:bg-sky ${next === "ar" ? "font-ar text-lg font-normal" : ""} ${className}`}
    >
      {t.nav.lang}
    </Link>
  );
}
