import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { checkTrackingToken, getOrder, orderEvents } from "@/lib/server/orders-repo";
import { OrderTracking } from "@/components/account/OrderTracking";
import { TrackForm } from "@/components/account/AccountWidgets";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ order?: string; t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDict(locale).track.title, robots: { index: false } } : {};
}

export default async function TrackPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { order: number = "", t: token = "" } = await searchParams;
  // Links in emails carry a signature, so they open straight to the order.
  const order = number && token && checkTrackingToken(number, token) ? getOrder(number) : null;
  const t = getDict(locale);

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
      <h1 className="font-head text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold">
        {t.track.title}
        <span className="text-pink">.</span>
      </h1>
      {order ? <OrderTracking order={order} events={orderEvents(order.number)} locale={locale} /> : <TrackForm initialNumber={number} />}
    </section>
  );
}
