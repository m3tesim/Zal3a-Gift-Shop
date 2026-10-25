"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { Logo } from "../Logo";

const LINKS = [
  { href: "/admin", label: "Overview", emoji: "🏠" },
  { href: "/admin/pots", label: "Pots", emoji: "🐱" },
  { href: "/admin/plants", label: "Plants", emoji: "🌵" },
  { href: "/admin/orders", label: "Orders", emoji: "📦" },
  { href: "/admin/account", label: "Account", emoji: "🔑" },
];

export function AdminNav({ email, newOrders }: { email: string; newOrders: number }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));

  return (
    <aside className="sticky top-0 z-30 border-b-[3px] border-ink bg-sun lg:h-dvh lg:border-e-[3px] lg:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3 lg:grid lg:h-full lg:content-start lg:gap-6 lg:p-5">
        <Link href="/admin" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Admin" className="no-scrollbar flex flex-1 gap-1 overflow-x-auto lg:grid lg:gap-1.5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 font-bold transition-colors lg:rounded-2xl ${active(l.href) ? "bg-paper shadow-pop-sm ring-[3px] ring-ink" : "hover:bg-paper/60"}`}
            >
              <span aria-hidden="true">{l.emoji}</span>
              {l.label}
              {l.href === "/admin/orders" && newOrders > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1.5 text-xs text-white">{newOrders}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="hidden gap-3 border-t-[3px] border-dashed border-ink/25 pt-4 text-sm lg:grid">
          <a href="/en" target="_blank" className="font-bold underline underline-offset-4 hover:text-pink">
            View shop ↗
          </a>
          <span className="truncate text-ink/70" title={email}>
            {email}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="rounded-full border-2 border-ink bg-paper px-3 py-1 font-bold hover:bg-pink hover:text-white">
              Sign out
            </button>
          </form>
        </div>
        <form action={logoutAction} className="lg:hidden">
          <button type="submit" className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-bold">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
