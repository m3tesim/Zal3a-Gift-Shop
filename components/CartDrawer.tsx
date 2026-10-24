"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useI18n } from "./I18nProvider";
import { QtyStepper } from "./QtyStepper";
import { CloseIcon, PlantIcon } from "./icons";
import { cartSubtotal, useShop } from "@/lib/store";
import { PLANTS, PRODUCT_BY_ID, TINT, unitPrice } from "@/lib/products";
import { FREE_DELIVERY_OVER } from "@/lib/site";
import { formatPrice } from "@/lib/i18n";

export function CartDrawer() {
  const { locale, t } = useI18n();
  const open = useShop((s) => s.cartOpen);
  const lines = useShop((s) => s.lines);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setQty = useShop((s) => s.setQty);
  const remove = useShop((s) => s.remove);
  const closeRef = useRef<HTMLButtonElement>(null);

  const subtotal = cartSubtotal(lines);
  const toFree = Math.max(0, FREE_DELIVERY_OVER - subtotal);
  const close = () => setCartOpen(false);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, setCartOpen]);

  return (
    <>
      <div
        onClick={close}
        className={`fixed inset-0 z-50 bg-pink/25 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.cart.title}
        inert={!open}
        className={`fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s-[3px] border-ink bg-cream transition-transform duration-[400ms] ease-[cubic-bezier(.3,1.2,.5,1)] ${open ? "translate-x-0" : "ltr:translate-x-[105%] rtl:-translate-x-[105%]"}`}
      >
        <div className="flex items-center justify-between border-b-[3px] border-dashed border-line px-5 py-4">
          <h2 className="font-head text-3xl font-extrabold">{t.cart.title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={t.cart.close}
            className="grid size-11 place-items-center rounded-full border-[3px] border-ink bg-paper transition-transform hover:rotate-90 hover:bg-pink-soft"
          >
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="grid flex-1 place-content-center justify-items-center gap-4 p-8 text-center">
            <PlantIcon plant="empty" className="size-28 animate-wiggle" />
            <p className="max-w-[24ch] text-lg font-bold">{t.cart.empty}</p>
            <Link href={`/${locale}#shop`} onClick={close} className="btn btn-pink">
              {t.cart.emptyCta}
            </Link>
          </div>
        ) : (
          <ul className="grid flex-1 content-start gap-3 overflow-y-auto p-5">
            {lines.map((l, i) => {
              const p = PRODUCT_BY_ID[l.id];
              return (
                <li key={`${l.id}-${l.plant}`} className="flex gap-3 rounded-3xl border-[3px] border-ink bg-paper p-2.5">
                  <Link
                    href={`/${locale}/pots/${p.id}`}
                    onClick={close}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-2xl ${TINT[p.tint].soft}`}
                  >
                    <Image src={p.img} alt="" fill sizes="80px" className="object-cover" style={{ objectPosition: p.pos }} />
                  </Link>
                  <div className="grid min-w-0 flex-1 gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <b className="block leading-tight">{p.name[locale]}</b>
                        <small className="text-ink-soft">{PLANTS[l.plant].name[locale]}</small>
                      </div>
                      <span className="font-extrabold whitespace-nowrap tabular-nums">
                        {formatPrice(unitPrice(l.id, l.plant) * l.qty, locale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <QtyStepper
                        size="sm"
                        value={l.qty}
                        onChange={(n) => setQty(i, n)}
                        labels={{ group: t.product.qty, fewer: t.cart.decrease, more: t.cart.increase }}
                      />
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="rounded-full px-2 py-1 text-sm font-bold text-ink-soft underline underline-offset-2 hover:text-pink"
                      >
                        {t.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="grid gap-3 border-t-[3px] border-dashed border-line bg-paper/60 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="grid gap-1.5">
              <p className="text-sm font-bold">{toFree === 0 ? t.cart.freeUnlocked : t.cart.toFree(formatPrice(toFree, locale))}</p>
              <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-paper">
                <div
                  className="h-full rounded-full bg-lime transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_OVER) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xl font-extrabold tabular-nums">
              <span>{t.cart.subtotal}</span>
              <span>{formatPrice(subtotal, locale)}</span>
            </div>
            <Link href={`/${locale}/checkout`} onClick={close} className="btn btn-pink w-full">
              {t.cart.checkout}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
