import { readCare, readTags } from "@/lib/server/catalog-repo";
import { CareList, TagList } from "@/components/admin/TaxonomyEditor";

export const metadata = { title: "Tags & care" };

export default function TagsPage() {
  const tags = readTags();
  const care = readCare();
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Tags &amp; care</h1>
        <p className="text-ink-soft">The options you pick from when editing pots and plants. Changes show on the shop straight away.</p>
      </header>
      <div className="grid gap-5 xl:grid-cols-2">
        <TagList
          kind="who"
          tags={tags}
          title="Best for"
          sub="Who a pot or plant suits. These are the “Who's it for?” buttons in the gift matchmaker, and the “Best for” chips on plant care cards."
        />
        <TagList kind="vibe" tags={tags} title="Vibes" sub="Personality tags for pots and plants. These are the “What's their vibe?” buttons in the gift matchmaker." />
        <CareList kind="water" options={care} title="Watering" sub="How often a plant needs water. The meter shows as water drops." />
        <CareList kind="sun" options={care} title="Sun" sub="How much light a plant likes. The meter shows as suns." />
      </div>
    </div>
  );
}
