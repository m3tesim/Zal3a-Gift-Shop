"use client";

import { useI18n } from "./I18nProvider";
import { useShop } from "@/lib/store";
import { PRODUCT_BY_ID, type PlantKey } from "@/lib/products";

export function useAddToBag() {
  const { locale, t } = useI18n();
  const add = useShop((s) => s.add);
  const showToast = useShop((s) => s.showToast);
  return (id: string, plant: PlantKey, qty = 1) => {
    add(id, plant, qty);
    showToast(t.cart.added(PRODUCT_BY_ID[id].name[locale]));
  };
}
