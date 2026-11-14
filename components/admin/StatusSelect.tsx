"use client";

import { useTransition } from "react";
import { setOrderStatusAction } from "@/app/admin/actions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";

export const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-pink text-white",
  confirmed: "bg-sky",
  shipped: "bg-lilac text-white",
  delivered: "bg-lime",
  cancelled: "bg-line text-ink-soft",
};

export function StatusSelect({ number, status }: { number: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={`Status of ${number}`}
      value={status}
      disabled={pending}
      onChange={(event) => start(async () => void (await setOrderStatusAction(number, event.target.value)))}
      className={`rounded-full border-2 border-ink px-3 py-1 font-bold capitalize ${STATUS_STYLE[status]} ${pending ? "opacity-50" : ""}`}
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status} className="bg-paper text-ink">
          {status}
        </option>
      ))}
    </select>
  );
}
