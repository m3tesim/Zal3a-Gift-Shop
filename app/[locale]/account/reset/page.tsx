import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { AuthShell } from "@/components/account/AuthShell";
import { ResetForm } from "@/components/account/AuthForms";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDict(locale).account.resetTitle, robots: { index: false } } : {};
}

export default async function ResetPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { t: token = "" } = await searchParams;
  const t = getDict(locale);
  return (
    <AuthShell locale={locale} title={t.account.resetTitle}>
      {token ? <ResetForm token={token} /> : <p className="font-bold">{t.account.badLink}</p>}
    </AuthShell>
  );
}
