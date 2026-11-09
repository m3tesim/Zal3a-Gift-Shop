import Link from "next/link";
import { adminReviews } from "@/lib/server/reviews-repo";
import { readCatalog } from "@/lib/server/catalog-repo";
import { ReviewEditor } from "@/components/admin/ReviewEditor";

export const metadata = { title: "Reviews" };

export default async function ReviewsAdminPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const visible = show === "hidden" ? false : show === "shown" ? true : undefined;
  const reviews = adminReviews({ visible });
  const all = adminReviews();
  const { products } = readCatalog({ includeHidden: true });
  const potName = (id: string) => products.find((p) => p.id === id)?.name.en ?? id;
  const tabs = [
    { key: undefined, label: "All", n: all.length },
    { key: "shown", label: "Shown", n: all.filter((r) => r.visible).length },
    { key: "hidden", label: "Hidden", n: all.filter((r) => !r.visible).length },
  ];

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Reviews</h1>
        <p className="text-ink-soft">
          Only customers whose order with that pot was marked <b>delivered</b> can post. They go live straight away. Edit, hide, reply or delete here.
        </p>
      </header>
      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.key ? `/admin/reviews?show=${t.key}` : "/admin/reviews"}
            className={`rounded-full border-2 px-3 py-1 font-bold ${show === t.key ? "border-ink bg-sun" : "border-line bg-paper hover:border-ink"}`}
          >
            {t.label} <span className="text-ink-soft">{t.n}</span>
          </Link>
        ))}
      </nav>
      {reviews.length === 0 ? (
        <p className="rounded-3xl border-[3px] border-dashed border-ink/30 p-8 text-center font-bold text-ink-soft">No reviews here yet.</p>
      ) : (
        <ul className="grid gap-4">
          {reviews.map((r) => (
            <ReviewEditor
              key={r.id}
              review={{ id: r.id, author: r.author, rating: r.rating, body: r.body, reply: r.reply, visible: r.visible }}
              pot={potName(r.productId)}
              date={new Date(r.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
              href={`/${r.locale}/pots/${r.productId}#reviews`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
