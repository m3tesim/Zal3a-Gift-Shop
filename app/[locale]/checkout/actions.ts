"use server";

import { after } from "next/server";
import { placeOrder, trackingToken } from "@/lib/server/orders-repo";
import { currentCustomer } from "@/lib/server/customer-auth";
import { notifyOrderStatus } from "@/lib/server/notify";
import { revalidateStore } from "@/lib/server/revalidate";
import type { CheckoutInput, PlaceOrderResult } from "@/lib/orders";

export async function placeOrderAction(input: CheckoutInput): Promise<PlaceOrderResult> {
  try {
    const result = placeOrder(input, await currentCustomer());
    // Stock moved (or turned out to be stale): refresh the pre-rendered shop pages.
    if (result.ok || result.error === "stock") revalidateStore();
    if (!result.ok) return result;
    const order = result.order;
    after(() => notifyOrderStatus(order, "new"));
    return { ok: true, order: { ...order, trackToken: trackingToken(order.number) } };
  } catch (error) {
    console.error("placeOrder failed", error);
    return { ok: false, error: "invalid" };
  }
}
