import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { PolicyPage, policyMetadata } from "@/components/PolicyPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? policyMetadata("shipping", locale) : {};
}

export default async function ShippingPolicyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PolicyPage id="shipping" locale={locale} />;
}
