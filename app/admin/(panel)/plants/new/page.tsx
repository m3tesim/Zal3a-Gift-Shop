import Link from "next/link";
import { PlantForm } from "@/components/admin/PlantForm";
import { readCare, readTags } from "@/lib/server/catalog-repo";

export const metadata = { title: "New plant" };

export default function NewPlantPage() {
  return (
    <div className="grid gap-6">
      <header>
        <Link href="/admin/plants" className="text-sm font-bold text-ink-soft hover:text-pink">
          ← All plants
        </Link>
        <h1 className="font-head text-4xl font-extrabold">New plant</h1>
        <p className="text-ink-soft">It becomes an option on every pot. Add combo photos for it on each pot&apos;s page afterwards.</p>
      </header>
      <PlantForm plant={null} tags={readTags()} care={readCare()} />
    </div>
  );
}
