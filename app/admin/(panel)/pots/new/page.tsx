import Link from "next/link";
import { readCatalog } from "@/lib/server/catalog-repo";
import { PotForm } from "@/components/admin/PotForm";

export const metadata = { title: "New pot" };

export default function NewPotPage() {
  const { plants } = readCatalog({ includeHidden: true });
  return (
    <div className="grid gap-6">
      <header>
        <Link href="/admin/pots" className="text-sm font-bold text-ink-soft hover:text-pink">
          ← All pots
        </Link>
        <h1 className="font-head text-4xl font-extrabold">New pot</h1>
        <p className="text-ink-soft">After creating it you can add a photo for each plant combination.</p>
      </header>
      <PotForm product={null} plants={plants} />
    </div>
  );
}
