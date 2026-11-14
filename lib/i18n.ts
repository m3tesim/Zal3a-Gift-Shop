import { en, type Dict } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);
export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");
export const otherLocale = (locale: Locale): Locale => (locale === "ar" ? "en" : "ar");

const DICTS: Record<Locale, Dict> = { en, ar };
export const getDict = (locale: Locale) => DICTS[locale];

export function formatPrice(amount: number, locale: Locale) {
  const num = Math.abs(amount).toLocaleString("en-US");
  const sign = amount < 0 ? "−" : "";
  return locale === "ar" ? `${sign}${num} ج.م` : `${sign}EGP ${num}`;
}
