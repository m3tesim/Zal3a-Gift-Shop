import Image from "next/image";
import Link from "next/link";
import { readCatalog } from "@/lib/server/catalog-repo";
import { formatPrice } from "@/lib/i18n";
import { PlantIcon } from "@/components/icons";
import { MoveButtons, StockInput, VisibleSwitch } from "@/components/admin/RowControls";

export const metadata = { title: "Plants" };

export default function PlantsAdminPage() {
  const c = readCatalog({ includeHidden: true });
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-4xl font-extrabold">Plants</h1>
          <p className="text-ink-soft">The options customers pick for each pot. A plant&apos;s price is added per pot it goes in.</p>
        </div>
        <Link href="/admin/plants/new" className="btn btn-pink">
          + Add plant
        </Link>
      </header>

      <ul className="grid gap-3">
        {c.plants.map((p, i) => (
          <li
            key={p.id}
            className={`grid grid-cols-[72px_1fr] items-center gap-x-4 gap-y-3 rounded-3xl border-[3px] border-ink bg-paper p-3 md:grid-cols-[72px_minmax(0,1fr)_auto_auto_auto_auto] ${p.visible ? "" : "opacity-60"}`}
          >
            <Link href={`/admin/plants/${p.id}`} className="relative grid size-[72px] place-items-center overflow-hidden rounded-2xl border-2 border-ink bg-cream">
              {p.image ? <Image src={p.image} alt="" fill sizes="72px" className="object-cover" /> : <PlantIcon icon={p.icon} className="size-12" />}
            </Link>
            <div className="min-w-0">
              <Link href={`/admin/plants/${p.id}`} className="font-head text-lg font-extrabold hover:text-pink">
                {p.name.en}
              </Link>
              {p.potOnly && <span className="ms-2 rounded-full bg-lilac-soft px-2 py-0.5 text-xs font-extrabold">special option</span>}
              <p className="truncate text-sm text-ink-soft">
                {p.latin.en} · <span lang="ar">{p.name.ar}</span>
              </p>
              <p className="text-sm font-bold tabular-nums">+{formatPrice(p.price, "en")} per pot</p>
            </div>
            <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-3 md:contents">
              <StockInput table="plants" id={p.id} stock={p.stock} />
              <VisibleSwitch table="plants" id={p.id} visible={p.visible} />
              <MoveButtons table="plants" id={p.id} first={i === 0} last={i === c.plants.length - 1} />
              <Link href={`/admin/plants/${p.id}`} className="rounded-full border-2 border-ink bg-sky-soft px-4 py-1.5 font-bold hover:bg-sky">
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
