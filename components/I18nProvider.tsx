"use client";

import { createContext, useContext, useEffect } from "react";
import { getDict, dirOf, type Locale } from "@/lib/i18n";
import { useShop } from "@/lib/store";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  useEffect(() => {
    // Cart lives in localStorage; load it once we're in the browser so SSR markup matches.
    useShop.persist.rehydrate();
  }, []);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  return { locale, t: getDict(locale), dir: dirOf(locale), rtl: locale === "ar" };
}
