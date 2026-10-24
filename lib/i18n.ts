import { en, type Dict } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");
export const otherLocale = (l: Locale): Locale => (l === "ar" ? "en" : "ar");

const DICTS: Record<Locale, Dict> = { en, ar };
export const getDict = (l: Locale) => DICTS[l];

export function formatPrice(n: number, l: Locale) {
  const num = Math.abs(n).toLocaleString("en-US");
  const sign = n < 0 ? "−" : "";
  return l === "ar" ? `${sign}${num} ج.م` : `${sign}EGP ${num}`;
}
