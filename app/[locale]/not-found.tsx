"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { PlantIcon } from "@/components/icons";

export default function NotFound() {
  const { locale, t } = useI18n();
  return (
    <section className="grid min-h-[60vh] place-content-center justify-items-center gap-5 px-4 text-center">
      <PlantIcon plant="empty" className="size-32 animate-wiggle" />
      <h1 className="font-head text-4xl font-extrabold">{t.common.notFound}</h1>
      <Link href={`/${locale}`} className="btn btn-pink">
        {t.common.goHome}
      </Link>
    </section>
  );
}
