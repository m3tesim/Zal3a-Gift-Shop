"use client";

import { useState } from "react";
import { setVariantAction } from "@/app/admin/actions";
import { ImageUpload, Panel } from "./ui";
import { PlantIcon } from "../icons";
import { comboKey, type Plant, type Product } from "@/lib/catalog";

/** Every way to fill the pot's slots with the plants: [[a,a],[a,b],[b,a],[b,b]] */
function combos(ids: string[], slots: number): string[][] {
  return slots === 0 ? [[]] : combos(ids, slots - 1).flatMap((combo) => ids.map((id) => [...combo, id]));
}

export function VariantGrid({ product, plants }: { product: Product; plants: Plant[] }) {
  const [error, setError] = useState("");
  const all = combos(
    plants.map((plant) => plant.id),
    product.slots.length,
  );
  const have = all.filter((combo) => product.variants[comboKey(combo)]).length;
  const byId = Object.fromEntries(plants.map((plant) => [plant.id, plant]));

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
          {all.map((combo) => {
            const key = comboKey(combo);
            return (
              <li key={key} className="grid content-start gap-2">
                <div className="flex flex-wrap items-center gap-1 text-sm font-bold">
                  {combo.map((id, index) => (
                    <span key={index} className="inline-flex items-center gap-1">
                      {index > 0 && <span className="text-ink-soft">+</span>}
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
                    const result = await setVariantAction(product.id, key, url);
                    setError(result.ok ? "" : result.error);
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
