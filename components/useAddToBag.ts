"use client";

import { useI18n } from "./I18nProvider";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "@/lib/store";
import { maxQty, productOf } from "@/lib/catalog";

export function useAddToBag() {
  const { locale, dictionary } = useI18n();
  const catalog = useCatalog();
  const add = useShop((state) => state.add);
  const showToast = useShop((state) => state.showToast);
  return (id: string, plants: string[], qty = 1) => {
    const product = productOf(catalog, id);
    if (!product) return;
    add(id, plants, qty, maxQty(catalog, product, plants));
    showToast(dictionary.cart.added(product.name[locale]));
  };
}
