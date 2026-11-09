import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { AuthShell } from "@/components/account/AuthShell";
import { ForgotForm } from "@/components/account/AuthForms";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDict(locale).account.forgotTitle, robots: { index: false } } : {};
}

export default async function ForgotPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <AuthShell locale={locale} title={getDict(locale).account.forgotTitle}>
      <ForgotForm />
    </AuthShell>
  );
}
