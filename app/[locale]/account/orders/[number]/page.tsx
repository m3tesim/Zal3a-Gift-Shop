import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { currentCustomer } from "@/lib/server/customer-auth";
import { getOrder, orderEvents } from "@/lib/server/orders-repo";
import { OrderTracking } from "@/components/account/OrderTracking";
import { BackIcon } from "@/components/icons";

type Props = { params: Promise<{ locale: string; number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  return { title: number, robots: { index: false } };
}

export default async function MyOrderPage({ params }: Props) {
  const { locale, number } = await params;
  if (!isLocale(locale)) notFound();
  const me = await currentCustomer();
  if (!me) redirect(`/${locale}/account/login?next=/${locale}/account/orders/${number}`);
  const order = getOrder(number);
  if (!order || order.customerId !== me.id) notFound();
  const t = getDict(locale);

  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
      <Link href={`/${locale}/account`} className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold hover:bg-sun-soft">
        <BackIcon width={16} height={16} className="rtl:-scale-x-100" />
        {t.account.backToOrders}
      </Link>
      <OrderTracking order={order} events={orderEvents(order.number)} locale={locale} reviewLinks />
    </section>
  );
}
