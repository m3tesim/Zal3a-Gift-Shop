import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { ThankYou } from "@/components/checkout/ThankYou";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDict(locale).thanks.eyebrow, robots: { index: false } } : {};
}

export default async function ThanksPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <section className="px-4 pt-10 pb-12">
      <ThankYou />
    </section>
  );
}
