import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatPrice, getDict, isLocale } from "@/lib/i18n";
import { currentCustomer } from "@/lib/server/customer-auth";
import { customerOrders } from "@/lib/server/orders-repo";
import { ProfileForm, SignOutButton, VerifyBanner } from "@/components/account/AccountWidgets";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ verified?: string }> };

const STATUS_TONE = { new: "bg-pink text-white", confirmed: "bg-sky", shipped: "bg-lilac text-white", delivered: "bg-lime", cancelled: "bg-line" } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDict(locale).account.title, robots: { index: false } } : {};
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await currentCustomer();
  if (!me) redirect(`/${locale}/account/login?next=/${locale}/account`);
  const { verified } = await searchParams;
  const t = getDict(locale);
  const orders = customerOrders(me.id);
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">{t.account.title}</span>
          <h1 className="mt-2 font-head text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold">{t.account.hello(me.name.split(" ")[0])}</h1>
        </div>
        <SignOutButton />
      </header>
      {verified && <p className="rounded-3xl border-[3px] border-ink bg-lime-soft px-5 py-3 font-bold">✓ {t.account.verified}</p>}
      {!me.emailVerified && !verified && <VerifyBanner />}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-3">
          <h2 className="font-head text-2xl font-extrabold">{t.account.orders}</h2>
          {orders.length === 0 ? (
            <div className="sticker grid justify-items-start gap-3 p-6">
              <p className="font-bold">{t.account.noOrders}</p>
              <Link href={`/${locale}#shop`} className="btn btn-pink">
                {t.checkout.emptyCta}
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3">
              {orders.map((o) => (
                <li key={o.number}>
                  <Link
                    href={`/${locale}/account/orders/${o.number}`}
                    className="sticker flex flex-wrap items-center gap-x-5 gap-y-2 p-4 transition-transform hover:-translate-y-0.5 hover:-rotate-[0.5deg]"
                  >
                    <span dir="ltr" className="font-logo text-xl">
                      {o.number}
                    </span>
                    <span className={`rounded-full border-2 border-ink px-3 py-0.5 text-sm font-extrabold ${STATUS_TONE[o.status]}`}>{t.status[o.status]}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                      {t.account.orderPlaced(date(o.createdAt))} · {o.items.map((i) => `${i.qty}× ${i.name[locale]}`).join(", ")}
                    </span>
                    <b className="tabular-nums">{formatPrice(o.total, locale)}</b>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="sticker grid gap-4 p-5">
          <h2 className="font-head text-2xl font-extrabold">{t.account.details}</h2>
          <ProfileForm initial={{ name: me.name, email: me.email, phone: me.phone, marketing: me.marketing }} />
        </div>
      </div>
    </section>
  );
}
