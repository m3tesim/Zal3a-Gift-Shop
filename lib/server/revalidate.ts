import { revalidatePath } from "next/cache";

/** Call after any catalog/stock/review change so open pages in the browser refresh their data. */
export function revalidateStore() {
  revalidatePath("/[locale]", "layout");
}
