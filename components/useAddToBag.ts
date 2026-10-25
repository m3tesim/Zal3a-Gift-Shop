"use client";

import { useI18n } from "./I18nProvider";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "@/lib/store";
import { maxQty, productOf } from "@/lib/catalog";

export function useAddToBag() {
  const { locale, t } = useI18n();
  const catalog = useCatalog();
  const add = useShop((s) => s.add);
  const showToast = useShop((s) => s.showToast);
  return (id: string, plants: string[], qty = 1) => {
    const p = productOf(catalog, id);
    if (!p) return;
    add(id, plants, qty, maxQty(catalog, p, plants));
    showToast(t.cart.added(p.name[locale]));
  };
}
