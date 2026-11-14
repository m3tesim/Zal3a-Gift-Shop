import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MAX_QTY, comboKey } from "./catalog";
import type { Order } from "./orders";

/** The signed-in shopper as shown in the UI. undefined = not checked yet. */
export type Me = { name: string; email: string; phone: string; verified: boolean; marketing: boolean };

/** One cart line = a pot with a plant chosen for each of its slots. */
export type CartLine = { id: string; plants: string[]; qty: number };

const sameLine = (line: CartLine, id: string, plants: string[]) => line.id === id && comboKey(line.plants) === comboKey(plants);

type ShopState = {
  hydrated: boolean;
  lines: CartLine[];
  lastOrder: Order | null;
  cartOpen: boolean;
  toast: { id: number; message: string } | null;
  me: Me | null | undefined;

  add: (id: string, plants: string[], qty?: number, max?: number) => void;
  setQty: (index: number, qty: number, max?: number) => void;
  remove: (index: number) => void;
  /** Drop lines the shop can't sell any more, and clamp quantities to stock. */
  prune: (check: (line: CartLine) => number) => void;
  placeOrder: (order: Order) => void;
  setCartOpen: (open: boolean) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
  setMe: (me: Me | null) => void;
};

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      hydrated: false,
      lines: [],
      lastOrder: null,
      cartOpen: false,
      toast: null,
      me: undefined,

      add: (id, plants, qty = 1, max = MAX_QTY) =>
        set((state) => {
          const existingIndex = state.lines.findIndex((line) => sameLine(line, id, plants));
          if (existingIndex === -1) return { lines: [...state.lines, { id, plants, qty: Math.min(qty, max) }] };
          return { lines: state.lines.map((line, lineIndex) => (lineIndex === existingIndex ? { ...line, qty: Math.min(line.qty + qty, max) } : line)) };
        }),
      setQty: (index, qty, max = MAX_QTY) =>
        set((state) => ({
          lines:
            qty < 1
              ? state.lines.filter((_line, lineIndex) => lineIndex !== index)
              : state.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, qty: Math.min(qty, max) } : line)),
        })),
      remove: (index) => set((state) => ({ lines: state.lines.filter((_line, lineIndex) => lineIndex !== index) })),
      prune: (check) =>
        set((state) => {
          const lines = state.lines.map((line) => ({ ...line, qty: Math.min(line.qty, check(line)) })).filter((line) => line.qty > 0);
          const changed = lines.length !== state.lines.length || lines.some((line, lineIndex) => line.qty !== state.lines[lineIndex].qty);
          return changed ? { lines } : state;
        }),
      placeOrder: (order) => set({ lastOrder: order, lines: [], cartOpen: false }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      showToast: (message) => set({ toast: { id: Date.now(), message } }),
      hideToast: () => set({ toast: null }),
      setMe: (me) => set({ me }),
    }),
    {
      name: "zal3a-shop",
      version: 2, // v1 carts had a single plant per line; they're dropped on upgrade
      storage: createJSONStorage(() => window.localStorage), // throws on the server, which persist treats as "no storage"
      skipHydration: true, // rehydrated by I18nProvider after mount, so SSR markup matches
      partialize: (state) => ({ lines: state.lines, lastOrder: state.lastOrder }),
      migrate: () => ({ lines: [], lastOrder: null }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ShopState>;
        const lines = (saved.lines ?? []).filter((line) => typeof line.id === "string" && Array.isArray(line.plants) && line.qty > 0);
        return { ...current, lines, lastOrder: saved.lastOrder?.items ? saved.lastOrder : null };
      },
      onRehydrateStorage: () => () => useShop.setState({ hydrated: true }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((total, line) => total + line.qty, 0);
