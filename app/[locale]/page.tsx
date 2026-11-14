import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { defaultPlantsFor, linePrice } from "@/lib/catalog";
import { readCatalog } from "@/lib/server/catalog-repo";
import { Hero } from "@/components/home/Hero";
import { ShopGrid } from "@/components/home/ShopGrid";
import { GiftMatcher } from "@/components/home/GiftMatcher";
import { GiftSteps } from "@/components/home/GiftSteps";
import { Roommates } from "@/components/home/Roommates";
import { SocialSection } from "@/components/home/SocialSection";
import { HappyCustomers } from "@/components/home/HappyCustomers";
import { featuredReviews } from "@/lib/server/reviews-repo";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const catalog = readCatalog();
  const featured = catalog.products.find((product) => product.featured) ?? catalog.products[0];
  const heroPrice = featured ? linePrice(catalog, featured, defaultPlantsFor(catalog, featured)).unit : 0;

  return (
    <>
      <Hero locale={locale} featured={featured} price={heroPrice} />
      <ShopGrid locale={locale} products={catalog.products} />
      <GiftMatcher />
      <GiftSteps locale={locale} />
      <HappyCustomers locale={locale} reviews={featuredReviews()} catalog={catalog} />
      <Roommates locale={locale} catalog={catalog} />
      <SocialSection locale={locale} />
    </>
  );
}
