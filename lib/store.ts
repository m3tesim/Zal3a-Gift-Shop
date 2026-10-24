import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PLANTS, PRODUCT_BY_ID, unitPrice, type PlantKey } from "./products";
import type { Governorate } from "./site";
import type { Locale } from "./i18n";

export type CartLine = { id: string; plant: PlantKey; qty: number };
export type WrapKey = "kraft" | "confetti" | "ribbon";
export type PaymentKey = "cod" | "card" | "wallet";

export type Order = {
  number: string;
  createdAt: string;
  locale: Locale;
  lines: (CartLine & { unit: number })[];
  subtotal: number;
  delivery: number;
  total: number;
  contact: { name: string; phone: string; email: string };
  gift: null | { name: string; phone: string; wrap: WrapKey; note: string; hidePrices: boolean };
  address: { governorate: Governorate; area: string; street: string; apartment: string; date: string; notes: string };
  payment: PaymentKey;
};

export const MAX_QTY = 9;

type ShopState = {
  hydrated: boolean;
  lines: CartLine[];
  lastOrder: Order | null;
  cartOpen: boolean;
  toast: { id: number; message: string } | null;

  add: (id: string, plant: PlantKey, qty?: number) => void;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  placeOrder: (order: Order) => void;
  setCartOpen: (open: boolean) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
};

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      hydrated: false,
      lines: [],
      lastOrder: null,
      cartOpen: false,
      toast: null,

      add: (id, plant, qty = 1) =>
        set((s) => {
          const i = s.lines.findIndex((l) => l.id === id && l.plant === plant);
          if (i === -1) return { lines: [...s.lines, { id, plant, qty: Math.min(qty, MAX_QTY) }] };
          return {
            lines: s.lines.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l)),
          };
        }),
      setQty: (index, qty) =>
        set((s) => ({
          lines:
            qty < 1
              ? s.lines.filter((_, j) => j !== index)
              : s.lines.map((l, j) => (j === index ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)),
        })),
      remove: (index) => set((s) => ({ lines: s.lines.filter((_, j) => j !== index) })),
      placeOrder: (order) => set({ lastOrder: order, lines: [], cartOpen: false }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      showToast: (message) => set({ toast: { id: Date.now(), message } }),
      hideToast: () => set({ toast: null }),
    }),
    {
      name: "zal3a-shop",
      version: 1,
      storage: createJSONStorage(() => window.localStorage), // throws on the server, which persist treats as "no storage"
      skipHydration: true, // rehydrated by I18nProvider after mount, so SSR markup matches
      partialize: (s) => ({ lines: s.lines, lastOrder: s.lastOrder }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ShopState>;
        const lines = (p.lines ?? []).filter((l) => PRODUCT_BY_ID[l.id] && PLANTS[l.plant] && l.qty > 0);
        return { ...current, lines, lastOrder: p.lastOrder ?? null };
      },
      onRehydrateStorage: () => () => useShop.setState({ hydrated: true }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + unitPrice(l.id, l.plant) * l.qty, 0);
