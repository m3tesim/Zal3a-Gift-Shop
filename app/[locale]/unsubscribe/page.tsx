import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { UnsubscribeButton } from "@/components/account/AccountWidgets";
import { PlantIcon } from "@/components/icons";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export const metadata: Metadata = { robots: { index: false } };

// A button (not an automatic GET) so mail scanners that open links don't unsubscribe people by accident.
export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { t: token = "" } = await searchParams;
  const t = getDict(locale);
  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="sticker grid justify-items-center gap-4 p-8 text-center">
        <PlantIcon icon="pot" className="size-24" />
        <h1 className="font-head text-3xl font-extrabold">{t.unsubscribe.title}</h1>
        <p className="text-ink-soft">{t.unsubscribe.text}</p>
        {token ? <UnsubscribeButton token={token} /> : <p className="font-bold">{t.unsubscribe.bad}</p>}
      </div>
    </section>
  );
}
