import Link from "next/link";
import { listOrders, orderStats } from "@/lib/server/orders-repo";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/i18n";
import { StatusSelect } from "@/components/admin/StatusSelect";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const orders = listOrders(filter);
  const { byStatus } = orderStats();
  const total = Object.values(byStatus).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Orders</h1>
        <p className="text-ink-soft">Orders placed at checkout. Stock was already taken off when they were placed.</p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            className={`rounded-full border-2 px-3 py-1 font-bold capitalize ${filter === s ? "border-ink bg-sun" : "border-line bg-paper hover:border-ink"}`}
          >
            {s ?? "All"} <span className="text-ink-soft">{s ? (byStatus[s] ?? 0) : total}</span>
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-3xl border-[3px] border-dashed border-ink/30 p-8 text-center font-bold text-ink-soft">No orders here yet.</p>
      ) : (
        <ul className="grid gap-3">
          {orders.map((o) => (
            <li key={o.number} className="grid gap-3 rounded-3xl border-[3px] border-ink bg-paper p-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center md:gap-6">
              <div>
                <Link href={`/admin/orders/${o.number}`} className="font-logo text-xl hover:text-pink">
                  {o.number}
                </Link>
                <p className="text-sm text-ink-soft">{new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <div className="min-w-0">
                <p className="font-bold">
                  {o.contact.name} · <span className="tabular-nums">{o.contact.phone}</span>
                  {o.gift && <span className="ms-2 rounded-full bg-pink-soft px-2 py-0.5 text-xs font-extrabold">🎁 gift for {o.gift.name}</span>}
                </p>
                <p className="truncate text-sm text-ink-soft">
                  {o.items.map((i) => `${i.qty}× ${i.name.en}`).join(", ")} · {o.address.area}
                </p>
              </div>
              <b className="text-lg tabular-nums">{formatPrice(o.total, "en")}</b>
              <div className="flex items-center gap-3">
                <StatusSelect number={o.number} status={o.status} />
                <Link href={`/admin/orders/${o.number}`} className="rounded-full border-2 border-ink bg-sky-soft px-3 py-1 font-bold hover:bg-sky">
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
