import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { fontVars } from "../fonts";
import { LOCALES, dirOf, getDict, isLocale } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18nProvider";
import { CatalogProvider } from "@/components/CatalogProvider";
import { readCatalog } from "@/lib/server/catalog-repo";
import { Header } from "@/components/Header";
import { Marquee } from "@/components/Marquee";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { Toast } from "@/components/Toast";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t.meta.title, template: `%s · zal3a` },
    description: t.meta.description,
    alternates: { languages: { en: "/en", ar: "/ar" } },
    openGraph: { title: t.meta.title, description: t.meta.description, images: ["/img/duo.webp"] },
  };
}

export const viewport: Viewport = { themeColor: "#ffc72c", viewportFit: "cover" };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const catalog = readCatalog();

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={fontVars}
    >
      <body>
        <I18nProvider locale={locale}>
          <CatalogProvider catalog={catalog}>
            <Marquee locale={locale} />
            <Header />
            <main>{children}</main>
            <Footer locale={locale} />
            <CartDrawer />
            <Toast />
          </CatalogProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
