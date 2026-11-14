import Link from "next/link";
import { readCatalog } from "@/lib/server/catalog-repo";
import { PotForm } from "@/components/admin/PotForm";

export const metadata = { title: "New pot" };

const TITLES: Record<number, { title: string; sub: string }> = {
  1: { title: "New pot", sub: "After creating it you can add a photo for each plant combination." },
  2: { title: "New combo (2 pots)", sub: "A set of 2 pots sold together, like the Gossip Duo. Customers pick a plant for each pot." },
  3: { title: "New triple (3 pots)", sub: "A set of 3 pots sold together. Customers pick a plant for each pot." },
};

export default async function NewPotPage({ searchParams }: { searchParams: Promise<{ pots?: string }> }) {
  const potCount = Math.min(3, Math.max(1, Number((await searchParams).pots) || 1));
  const { plants, tags } = readCatalog({ includeHidden: true });
  return (
    <div className="grid gap-6">
      <header>
        <Link href="/admin/pots" className="text-sm font-bold text-ink-soft hover:text-pink">
          ← All pots
        </Link>
        <h1 className="font-head text-4xl font-extrabold">{TITLES[potCount].title}</h1>
        <p className="text-ink-soft">{TITLES[potCount].sub}</p>
      </header>
      <PotForm key={potCount} product={null} plants={plants} tags={tags} potsInSet={potCount} />
    </div>
  );
}
