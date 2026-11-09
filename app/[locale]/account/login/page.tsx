import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";
import { currentCustomer } from "@/lib/server/customer-auth";
import { AuthShell } from "@/components/account/AuthShell";
import { LoginForm } from "@/components/account/AuthForms";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDict(locale).account.signIn, robots: { index: false } } : {};
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  if (await currentCustomer()) redirect(`/${locale}/account`);
  return (
    <AuthShell locale={locale} title={getDict(locale).account.signInTitle}>
      <LoginForm next={next} />
    </AuthShell>
  );
}
