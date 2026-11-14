import Link from "next/link";
import { listOrders, orderStats } from "@/lib/server/orders-repo";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/i18n";
import { StatusSelect } from "@/components/admin/StatusSelect";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q: query = "" } = await searchParams;
  const filter = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const needle = query.trim().toLowerCase();
  const orders = listOrders(filter).filter(
    (order) => !needle || [order.number, order.contact.name, order.contact.phone, order.contact.email, order.gift?.name ?? ""].some((field) => field.toLowerCase().includes(needle)),
  );
  const { byStatus } = orderStats();
  const total = Object.values(byStatus).reduce((sum, count) => sum + (count ?? 0), 0);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Orders</h1>
        <p className="text-ink-soft">Orders placed at checkout. Stock was already taken off when they were placed.</p>
      </header>

      <form className="flex max-w-md gap-2" role="search">
        {filter && <input type="hidden" name="status" value={filter} />}
        <input name="q" defaultValue={query} placeholder="Search number, name, phone or email" aria-label="Search orders" className="field py-2" />
        <button type="submit" className="rounded-full border-2 border-ink bg-sky-soft px-4 font-bold hover:bg-sky">
          Search
        </button>
      </form>

      <nav className="flex flex-wrap gap-2" aria-label="Filter by status">
        {[undefined, ...ORDER_STATUSES].map((status) => (
          <Link
            key={status ?? "all"}
            href={status ? `/admin/orders?status=${status}` : "/admin/orders"}
            className={`rounded-full border-2 px-3 py-1 font-bold capitalize ${filter === status ? "border-ink bg-sun" : "border-line bg-paper hover:border-ink"}`}
          >
            {status ?? "All"} <span className="text-ink-soft">{status ? (byStatus[status] ?? 0) : total}</span>
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-3xl border-[3px] border-dashed border-ink/30 p-8 text-center font-bold text-ink-soft">No orders here yet.</p>
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.number} className="grid gap-3 rounded-3xl border-[3px] border-ink bg-paper p-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center md:gap-6">
              <div>
                <Link href={`/admin/orders/${order.number}`} className="font-logo text-xl hover:text-pink">
                  {order.number}
                </Link>
                <p className="text-sm text-ink-soft">{new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <div className="min-w-0">
                <p className="font-bold">
                  {order.contact.name} · <span className="tabular-nums">{order.contact.phone}</span>
                  {order.gift && <span className="ms-2 rounded-full bg-pink-soft px-2 py-0.5 text-xs font-extrabold">🎁 gift for {order.gift.name}</span>}
                </p>
                <p className="truncate text-sm text-ink-soft">
                  {order.items.map((item) => `${item.qty}× ${item.name.en}`).join(", ")} · {order.address.area}
                </p>
              </div>
              <b className="text-lg tabular-nums">{formatPrice(order.total, "en")}</b>
              <div className="flex items-center gap-3">
                <StatusSelect number={order.number} status={order.status} />
                <Link href={`/admin/orders/${order.number}`} className="rounded-full border-2 border-ink bg-sky-soft px-3 py-1 font-bold hover:bg-sky">
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
