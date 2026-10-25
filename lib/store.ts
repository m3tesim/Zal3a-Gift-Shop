import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MAX_QTY, comboKey } from "./catalog";
import type { Order } from "./orders";

/** One cart line = a pot with a plant chosen for each of its slots. */
export type CartLine = { id: string; plants: string[]; qty: number };

const sameLine = (l: CartLine, id: string, plants: string[]) => l.id === id && comboKey(l.plants) === comboKey(plants);

type ShopState = {
  hydrated: boolean;
  lines: CartLine[];
  lastOrder: Order | null;
  cartOpen: boolean;
  toast: { id: number; message: string } | null;

  add: (id: string, plants: string[], qty?: number, max?: number) => void;
  setQty: (index: number, qty: number, max?: number) => void;
  remove: (index: number) => void;
  /** Drop lines the shop can't sell any more, and clamp quantities to stock. */
  prune: (check: (line: CartLine) => number) => void;
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

      add: (id, plants, qty = 1, max = MAX_QTY) =>
        set((s) => {
          const i = s.lines.findIndex((l) => sameLine(l, id, plants));
          if (i === -1) return { lines: [...s.lines, { id, plants, qty: Math.min(qty, max) }] };
          return { lines: s.lines.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + qty, max) } : l)) };
        }),
      setQty: (index, qty, max = MAX_QTY) =>
        set((s) => ({
          lines:
            qty < 1
              ? s.lines.filter((_, j) => j !== index)
              : s.lines.map((l, j) => (j === index ? { ...l, qty: Math.min(qty, max) } : l)),
        })),
      remove: (index) => set((s) => ({ lines: s.lines.filter((_, j) => j !== index) })),
      prune: (check) =>
        set((s) => {
          const lines = s.lines.map((l) => ({ ...l, qty: Math.min(l.qty, check(l)) })).filter((l) => l.qty > 0);
          const changed = lines.length !== s.lines.length || lines.some((l, i) => l.qty !== s.lines[i].qty);
          return changed ? { lines } : s;
        }),
      placeOrder: (order) => set({ lastOrder: order, lines: [], cartOpen: false }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      showToast: (message) => set({ toast: { id: Date.now(), message } }),
      hideToast: () => set({ toast: null }),
    }),
    {
      name: "zal3a-shop",
      version: 2, // v1 carts had a single plant per line; they're dropped on upgrade
      storage: createJSONStorage(() => window.localStorage), // throws on the server, which persist treats as "no storage"
      skipHydration: true, // rehydrated by I18nProvider after mount, so SSR markup matches
      partialize: (s) => ({ lines: s.lines, lastOrder: s.lastOrder }),
      migrate: () => ({ lines: [], lastOrder: null }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ShopState>;
        const lines = (p.lines ?? []).filter((l) => typeof l.id === "string" && Array.isArray(l.plants) && l.qty > 0);
        return { ...current, lines, lastOrder: p.lastOrder?.items ? p.lastOrder : null };
      },
      onRehydrateStorage: () => () => useShop.setState({ hydrated: true }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
