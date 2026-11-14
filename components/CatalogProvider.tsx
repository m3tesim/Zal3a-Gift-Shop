"use client";

import { createContext, useContext, useEffect } from "react";
import { maxQty, plantOf, productOf, type Catalog } from "@/lib/catalog";
import { useShop, type CartLine } from "@/lib/store";

const CatalogContext = createContext<Catalog>({ products: [], plants: [], tags: [], care: [], ratings: {} });

/** How many of a cart line can still be bought (0 = remove it). */
export function lineLimit(catalog: Catalog, line: CartLine) {
  const product = productOf(catalog, line.id);
  if (!product || line.plants.length !== product.slots.length || line.plants.some((id) => !plantOf(catalog, id))) return 0;
  return maxQty(catalog, product, line.plants);
}

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  const hydrated = useShop((state) => state.hydrated);
  const prune = useShop((state) => state.prune);

  // Saved carts can outlive the catalog (pot hidden, plant sold out…): tidy them up.
  useEffect(() => {
    if (hydrated) prune((line) => lineLimit(catalog, line));
  }, [hydrated, catalog, prune]);

  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
