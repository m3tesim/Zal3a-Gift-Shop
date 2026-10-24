import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDict(locale).checkout.title, robots: { index: false } } : {};
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 pb-12">
      <div className="mb-8 grid gap-2">
        <h1 className="font-head text-[clamp(2.6rem,6vw,4.2rem)] font-extrabold">
          {t.checkout.title}
          <span className="text-pink">.</span>
        </h1>
        <p className="text-lg text-ink-soft">{t.checkout.sub}</p>
      </div>
      <CheckoutForm />
    </section>
  );
}
