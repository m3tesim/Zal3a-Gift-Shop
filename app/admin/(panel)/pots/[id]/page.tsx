import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, readCatalog } from "@/lib/server/catalog-repo";
import { PotForm } from "@/components/admin/PotForm";
import { VariantGrid } from "@/components/admin/VariantGrid";
import { Notice } from "@/components/admin/ui";

export const metadata = { title: "Edit pot" };

export default async function EditPotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const product = getProduct(id);
  if (!product) notFound();
  const { plants } = readCatalog({ includeHidden: true });

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/pots" className="text-sm font-bold text-ink-soft hover:text-pink">
            ← All pots
          </Link>
          <h1 className="font-head text-4xl font-extrabold">{product.name.en}</h1>
        </div>
        {product.visible && (
          <a href={`/en/pots/${product.id}`} target="_blank" className="font-bold underline underline-offset-4 hover:text-pink">
            View on shop ↗
          </a>
        )}
      </header>
      {created && <Notice kind="ok">Pot created! Now add photos for its plant combos below.</Notice>}
      <PotForm key={product.id} product={product} plants={plants} />
      <VariantGrid product={product} plants={plants} />
    </div>
  );
}
