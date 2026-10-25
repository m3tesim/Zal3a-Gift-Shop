import { revalidatePath } from "next/cache";

/** Storefront pages are pre-rendered; call this after any catalog/stock change so visitors see it. */
export function revalidateStore() {
  revalidatePath("/[locale]", "layout");
}
