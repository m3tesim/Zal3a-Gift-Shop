import { CareDots } from "./CareDots";
import { careOf, tagsOf, type Catalog, type Plant } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";

/** Sun + water meters (from the editable care options) and the plant's "best for" / vibe tags. */
export function PlantCare({
  plant,
  catalog,
  locale,
  labels,
  showTags = true,
}: {
  plant: Plant;
  catalog: Catalog;
  locale: Locale;
  labels: { sun: string; water: string; bestFor: string; vibe: string };
  showTags?: boolean;
}) {
  const sun = careOf(catalog, "sun", plant.sun);
  const water = careOf(catalog, "water", plant.water);
  const groups = showTags
    ? [
        { label: labels.bestFor, tags: tagsOf(catalog, "who").filter((tag) => plant.recipients.includes(tag.id)), tone: "bg-pink-soft" },
        { label: labels.vibe, tags: tagsOf(catalog, "vibe").filter((tag) => plant.vibes.includes(tag.id)), tone: "bg-sky-soft" },
      ].filter((group) => group.tags.length)
    : [];

  return (
    <div className="grid gap-4">
      {(sun || water) && (
        <div className="grid grid-cols-2 gap-4">
          {sun && <CareDots kind="sun" level={sun.level} label={labels.sun} hint={sun.label[locale]} />}
          {water && <CareDots kind="water" level={water.level} label={labels.water} hint={water.label[locale]} />}
        </div>
      )}
      {groups.map((group) => (
        <div key={group.label} className="grid gap-1.5">
          <span className="text-xs font-extrabold tracking-wider text-ink-soft uppercase rtl:tracking-normal">{group.label}</span>
          <ul className="flex flex-wrap gap-1.5">
            {group.tags.map((tag) => (
              <li key={tag.id} className={`rounded-full border-2 border-ink px-2.5 py-0.5 text-sm font-bold ${group.tone}`}>
                <span aria-hidden="true">{tag.emoji}</span> {tag.label[locale]}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
