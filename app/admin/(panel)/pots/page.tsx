import Image from "next/image";
import Link from "next/link";
import { readCatalog } from "@/lib/server/catalog-repo";
import { defaultPlantsFor, linePrice, plantsSummary } from "@/lib/catalog";
import { formatPrice } from "@/lib/i18n";
import { MoveButtons, SaleInput, StockInput, VisibleSwitch } from "@/components/admin/RowControls";

export const metadata = { title: "Pots" };

export default function PotsAdminPage() {
  const c = readCatalog({ includeHidden: true });
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-4xl font-extrabold">Pots</h1>
          <p className="text-ink-soft">Order here = order on the shop. Hidden pots stay saved but don&apos;t show on the site.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pots/new" className="btn btn-pink">
            + Add pot
          </Link>
          <Link href="/admin/pots/new?pots=2" className="btn btn-sun">
            + Add combo (2 pots)
          </Link>
          <Link href="/admin/pots/new?pots=3" className="btn btn-white">
            + Add triple (3 pots)
          </Link>
        </div>
      </header>

      <ul className="grid gap-3">
        {c.products.map((p, i) => {
          const plants = defaultPlantsFor(c, p);
          const { full, unit } = linePrice(c, p, plants);
          return (
            <li
              key={p.id}
              className={`grid grid-cols-[72px_1fr] items-center gap-x-4 gap-y-3 rounded-3xl border-[3px] border-ink bg-paper p-3 md:grid-cols-[72px_minmax(0,1fr)_auto_auto_auto_auto_auto] ${p.visible ? "" : "opacity-60"}`}
            >
              <Link href={`/admin/pots/${p.id}`} className="relative size-[72px] overflow-hidden rounded-2xl border-2 border-ink">
                <Image src={p.image} alt="" fill sizes="72px" className="object-cover" style={{ objectPosition: p.pos }} />
              </Link>
              <div className="min-w-0">
                <Link href={`/admin/pots/${p.id}`} className="font-head text-lg font-extrabold hover:text-pink">
                  {p.name.en}
                </Link>
                {p.featured && <span className="ms-2 rounded-full bg-sun px-2 py-0.5 text-xs font-extrabold">★ Hero</span>}
                {p.slots.length > 1 && (
                  <span className="ms-2 rounded-full bg-lilac-soft px-2 py-0.5 text-xs font-extrabold">
                    {p.slots.length === 2 ? "Combo" : p.slots.length === 3 ? "Triple" : "Set"} · {p.slots.length} pots
                  </span>
                )}
                <p className="truncate text-sm text-ink-soft">
                  {p.kind.en} · {plantsSummary(c, plants, "en")}
                </p>
                <p className="text-sm font-bold tabular-nums">
                  {unit < full && <s className="me-1.5 text-ink-soft">{formatPrice(full, "en")}</s>}
                  {formatPrice(unit, "en")}
                  <span className="ms-2 font-normal text-ink-soft">{Object.keys(p.variants).length} combo photos</span>
                </p>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-3 md:contents">
                <StockInput table="products" id={p.id} stock={p.stock} />
                <SaleInput id={p.id} pct={p.salePercent} />
                <VisibleSwitch table="products" id={p.id} visible={p.visible} />
                <MoveButtons table="products" id={p.id} first={i === 0} last={i === c.products.length - 1} />
                <Link href={`/admin/pots/${p.id}`} className="rounded-full border-2 border-ink bg-sky-soft px-4 py-1.5 font-bold hover:bg-sky">
                  Edit
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {c.products.length === 0 && <p className="font-bold text-ink-soft">No pots yet. Add your first one!</p>}
    </div>
  );
}
