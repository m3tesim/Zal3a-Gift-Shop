import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlant } from "@/lib/server/catalog-repo";
import { PlantForm } from "@/components/admin/PlantForm";
import { Notice } from "@/components/admin/ui";

export const metadata = { title: "Edit plant" };

export default async function EditPlantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const plant = getPlant(id);
  if (!plant) notFound();

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/plants" className="text-sm font-bold text-ink-soft hover:text-pink">
            ← All plants
          </Link>
          <h1 className="font-head text-4xl font-extrabold">{plant.name.en}</h1>
        </div>
        {plant.visible && !plant.potOnly && (
          <a href={`/en/plants/${plant.id}`} target="_blank" className="font-bold underline underline-offset-4 hover:text-pink">
            View on shop ↗
          </a>
        )}
      </header>
      {created && <Notice kind="ok">Plant created! It now shows as an option on every pot.</Notice>}
      <PlantForm key={plant.id} plant={plant} />
    </div>
  );
}
