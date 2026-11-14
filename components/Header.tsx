"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";
import { LangSwitch } from "./LangSwitch";
import { Logo } from "./Logo";
import { BagIcon, UserIcon } from "./icons";
import { useMe } from "./account/useMe";
import { cartCount, useShop } from "@/lib/store";

export function Header() {
  const { locale, dictionary } = useI18n();
  const count = useShop((state) => cartCount(state.lines));
  const setCartOpen = useShop((state) => state.setCartOpen);
  const [scrolled, setScrolled] = useState(false);
  const me = useMe();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: `/${locale}#shop`, label: dictionary.nav.shop },
    { href: `/${locale}#matcher`, label: dictionary.nav.matcher },
    { href: `/${locale}#plants`, label: dictionary.nav.plants },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b-[3px] bg-cream/90 backdrop-blur-md transition-colors ${scrolled ? "border-ink" : "border-transparent"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3">
        <Link href={`/${locale}`} aria-label={dictionary.nav.home} className="me-auto transition-transform hover:-rotate-2">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 font-bold transition-colors hover:bg-pink-soft"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <LangSwitch />
        <Link
          href={`/${locale}/account`}
          aria-label={me ? dictionary.nav.account : dictionary.nav.signIn}
          className="inline-flex h-11 items-center gap-2 rounded-full border-[3px] border-ink bg-paper px-3 font-extrabold transition-transform hover:-rotate-2 hover:bg-lime-soft"
        >
          <UserIcon />
          <span className="hidden max-w-24 truncate lg:inline">{me ? me.name.split(" ")[0] : dictionary.nav.signIn}</span>
        </Link>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`${dictionary.nav.openBag} (${count})`}
          className="inline-flex h-11 items-center gap-2 rounded-full border-[3px] border-ink bg-sun px-3 font-extrabold shadow-pop-sm transition-transform hover:-translate-y-0.5 hover:rotate-2 sm:px-4"
        >
          <BagIcon />
          <span className="hidden sm:inline">{dictionary.nav.bag}</span>
          <span
            key={count}
            className="inline-grid h-6 min-w-6 animate-pop place-items-center rounded-full bg-pink px-1.5 text-sm text-white tabular-nums"
          >
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}
