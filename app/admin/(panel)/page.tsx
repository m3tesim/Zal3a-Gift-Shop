import Link from "next/link";
import { readCatalog } from "@/lib/server/catalog-repo";
import { listOrders, orderStats } from "@/lib/server/orders-repo";
import { soldOut } from "@/lib/catalog";
import { formatPrice } from "@/lib/i18n";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { Panel } from "@/components/admin/ui";

export const metadata = { title: "Overview" };

function Stat({ label, value, tone, href }: { label: string; value: React.ReactNode; tone: string; href: string }) {
  return (
    <Link href={href} className={`grid gap-1 rounded-3xl border-[3px] border-ink p-5 shadow-pop-sm transition-transform hover:-translate-y-0.5 ${tone}`}>
      <span className="text-sm font-bold opacity-80">{label}</span>
      <b className="font-head text-4xl tabular-nums">{value}</b>
    </Link>
  );
}

export default function AdminHome() {
  const c = readCatalog({ includeHidden: true });
  const { byStatus, revenue } = orderStats();
  const recent = listOrders().slice(0, 5);
  const items = [
    ...c.products.map((p) => ({ kind: "Pot", href: `/admin/pots/${p.id}`, name: p.name.en, stock: p.stock, visible: p.visible })),
    ...c.plants.map((p) => ({ kind: "Plant", href: `/admin/plants/${p.id}`, name: p.name.en, stock: p.stock, visible: p.visible })),
  ];
  const out = items.filter((i) => soldOut(i));
  const low = items.filter((i) => i.stock !== null && i.stock > 0 && i.stock <= 3);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Hello! 👋</h1>
        <p className="text-ink-soft">Here&apos;s how the shop is doing.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New orders" value={byStatus.new ?? 0} tone="bg-pink text-white" href="/admin/orders?status=new" />
        <Stat label="Sales (not cancelled)" value={formatPrice(revenue, "en")} tone="bg-lime" href="/admin/orders" />
        <Stat label="Pots on the shop" value={`${c.products.filter((p) => p.visible).length}/${c.products.length}`} tone="bg-sky" href="/admin/pots" />
        <Stat label="Sold out" value={out.length} tone="bg-sun" href="/admin/pots" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Needs attention" sub="Sold out and low-stock items. Click to restock.">
          {out.length + low.length === 0 ? (
            <p className="font-bold text-ink-soft">All stocked up ✿</p>
          ) : (
            <ul className="grid gap-2">
              {[...out, ...low].map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-line px-3 py-2 hover:border-ink">
                    <span>
                      <span className="text-xs font-extrabold text-ink-soft uppercase">{i.kind}</span> <b>{i.name}</b>
                      {!i.visible && <span className="text-sm text-ink-soft"> (hidden)</span>}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-sm font-extrabold ${i.stock === 0 ? "bg-pink text-white" : "bg-sun"}`}>
                      {i.stock === 0 ? "Sold out" : `${i.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Latest orders">
          {recent.length === 0 ? (
            <p className="font-bold text-ink-soft">No orders yet. They&apos;ll show up here.</p>
          ) : (
            <ul className="grid gap-2">
              {recent.map((o) => (
                <li key={o.number} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-line px-3 py-2">
                  <Link href={`/admin/orders/${o.number}`} className="font-bold hover:text-pink">
                    {o.number} · {o.contact.name}
                  </Link>
                  <span className="flex items-center gap-2">
                    <b className="tabular-nums">{formatPrice(o.total, "en")}</b>
                    <StatusSelect number={o.number} status={o.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
