"use server";

import { placeOrder } from "@/lib/server/orders-repo";
import { revalidateStore } from "@/lib/server/revalidate";
import type { CheckoutInput, PlaceOrderResult } from "@/lib/orders";

export async function placeOrderAction(input: CheckoutInput): Promise<PlaceOrderResult> {
  try {
    const result = placeOrder(input);
    // Stock moved (or turned out to be stale): refresh the pre-rendered shop pages.
    if (result.ok || result.error === "stock") revalidateStore();
    return result;
  } catch (e) {
    console.error("placeOrder failed", e);
    return { ok: false, error: "invalid" };
  }
}
