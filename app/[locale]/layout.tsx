import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Bagel_Fat_One, Baloo_Bhaijaan_2, Bricolage_Grotesque, Figtree, Lalezar } from "next/font/google";
import "../globals.css";
import { LOCALES, dirOf, getDict, isLocale } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18nProvider";
import { Header } from "@/components/Header";
import { Marquee } from "@/components/Marquee";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { Toast } from "@/components/Toast";

const bagel = Bagel_Fat_One({ weight: "400", subsets: ["latin"], variable: "--font-bagel", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const lalezar = Lalezar({ weight: "400", subsets: ["arabic", "latin"], variable: "--font-lalezar", display: "swap" });
const baloo = Baloo_Bhaijaan_2({ subsets: ["arabic", "latin"], variable: "--font-baloo", display: "swap" });

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

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${bagel.variable} ${bricolage.variable} ${figtree.variable} ${lalezar.variable} ${baloo.variable}`}
    >
      <body>
        <I18nProvider locale={locale}>
          <Marquee locale={locale} />
          <Header />
          <main>{children}</main>
          <Footer locale={locale} />
          <CartDrawer />
          <Toast />
        </I18nProvider>
      </body>
    </html>
  );
}
