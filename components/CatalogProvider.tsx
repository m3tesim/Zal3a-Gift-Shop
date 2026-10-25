"use client";

import { createContext, useContext, useEffect } from "react";
import { maxQty, plantOf, productOf, type Catalog } from "@/lib/catalog";
import { useShop, type CartLine } from "@/lib/store";

const CatalogContext = createContext<Catalog>({ products: [], plants: [] });

/** How many of a cart line can still be bought (0 = remove it). */
export function lineLimit(c: Catalog, l: CartLine) {
  const p = productOf(c, l.id);
  if (!p || l.plants.length !== p.slots.length || l.plants.some((id) => !plantOf(c, id))) return 0;
  return maxQty(c, p, l.plants);
}

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const hydrated = useShop((s) => s.hydrated);
  const prune = useShop((s) => s.prune);

  // Saved carts can outlive the catalog (pot hidden, plant sold out…): tidy them up.
  useEffect(() => {
    if (hydrated) prune((l) => lineLimit(catalog, l));
  }, [hydrated, catalog, prune]);

  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
