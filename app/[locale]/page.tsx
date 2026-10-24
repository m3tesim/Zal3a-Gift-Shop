import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { Hero } from "@/components/home/Hero";
import { ShopGrid } from "@/components/home/ShopGrid";
import { GiftMatcher } from "@/components/home/GiftMatcher";
import { GiftSteps } from "@/components/home/GiftSteps";
import { Roommates } from "@/components/home/Roommates";
import { SocialSection } from "@/components/home/SocialSection";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <Hero locale={locale} />
      <ShopGrid locale={locale} />
      <GiftMatcher />
      <GiftSteps locale={locale} />
      <Roommates locale={locale} />
      <SocialSection locale={locale} />
    </>
  );
}
