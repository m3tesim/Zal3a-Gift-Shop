"use client";

import { useState } from "react";
import { setVariantAction } from "@/app/admin/actions";
import { ImageUpload, Panel } from "./ui";
import { PlantIcon } from "../icons";
import { comboKey, type Plant, type Product } from "@/lib/catalog";

/** Every way to fill the pot's slots with the plants: [[a,a],[a,b],[b,a],[b,b]] */
function combos(ids: string[], slots: number): string[][] {
  return slots === 0 ? [[]] : combos(ids, slots - 1).flatMap((c) => ids.map((id) => [...c, id]));
}

export function VariantGrid({ product, plants }: { product: Product; plants: Plant[] }) {
  const [error, setError] = useState("");
  const all = combos(
    plants.map((p) => p.id),
    product.slots.length,
  );
  const have = all.filter((c) => product.variants[comboKey(c)]).length;
  const byId = Object.fromEntries(plants.map((p) => [p.id, p]));

  return (
    <Panel
      title={`Plant combo photos (${have}/${all.length})`}
      sub="The product photo switches to these when a customer picks plants. Missing ones show the main photo with plant stickers. The seeded ones are marked MOCK. Replace them with real photos."
    >
      {error && <p className="font-bold text-pink">{error}</p>}
      {/* Triples have lots of combos (4 plants → 64), so keep the grid folded until it's wanted. */}
      <details open={all.length <= 16} className="group">
        <summary className="mb-4 w-fit cursor-pointer rounded-full border-2 border-ink bg-sky-soft px-4 py-1.5 font-bold group-open:hidden">
          Show all {all.length} combo photo slots
        </summary>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {all.map((c) => {
            const key = comboKey(c);
            return (
              <li key={key} className="grid content-start gap-2">
                <div className="flex flex-wrap items-center gap-1 text-sm font-bold">
                  {c.map((id, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-ink-soft">+</span>}
                      <PlantIcon icon={byId[id].icon} className="size-6" />
                      {byId[id].name.en}
                    </span>
                  ))}
                </div>
                <ImageUpload
                  value={product.variants[key] ?? null}
                  removable
                  emptyText="Using main photo"
                  onChange={async (url) => {
                    const r = await setVariantAction(product.id, key, url);
                    setError(r.ok ? "" : r.error);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </details>
    </Panel>
  );
}
