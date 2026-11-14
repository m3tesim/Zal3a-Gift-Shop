"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { savePotAction, deletePotAction, type PotInput } from "@/app/admin/actions";
import { Chips, ImageUpload, LInput, Labeled, Notice, NumberInput, Panel, Select, TextInput, Toggle } from "./ui";
import { TINT, TINTS, applySale, type L, type Plant, type Product, type Tag } from "@/lib/catalog";
import { formatPrice } from "@/lib/i18n";

const blank: L = { en: "", ar: "" };
export const toSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Starting values for a new single pot, combo (2) or triple (3). */
function newPot(potCount: number, firstPlant: string): PotInput {
  const set = potCount > 1;
  return {
    isNew: true,
    id: "",
    name: blank,
    kind: set ? { en: `Set of ${potCount}`, ar: `طقم ${potCount}` } : blank,
    desc: blank,
    badge: potCount === 2 ? { en: "Combo deal", ar: "عرض كومبو" } : potCount === 3 ? { en: "Triple deal", ar: "عرض التلاتة" } : blank,
    styled: blank,
    price: 0, salePercent: 0, stock: 10,
    slots: set ? Array.from({ length: potCount }, (_slot, index) => ({ en: `Pot ${index + 1}`, ar: `القصرية ${index + 1}` })) : [{ en: "Pot", ar: "القصرية" }],
    defaultPlants: Array(potCount).fill(firstPlant),
    tint: "pink", image: "", pos: "50% 50%",
    vibes: [], recipients: [],
    specs: [
      { label: { en: "Height", ar: "الطول" }, value: blank },
      ...(set
        ? [{
            label: { en: "In the box", ar: "في العلبة" },
            value: {
              en: `${potCount} pots, ${potCount} plants, care card`,
              ar: potCount === 2 ? "قصريتين، زرعتين، كارت عناية" : `${potCount} قصاري، ${potCount} زرعات، كارت عناية`,
            },
          }]
        : []),
    ],
    visible: true, featured: false,
  };
}

function initial(product: Product | null, plants: Plant[], potsInSet: number): PotInput {
  const firstPlant = plants.find((plant) => !plant.potOnly)?.id ?? plants[0]?.id ?? "";
  if (!product) return newPot(potsInSet, firstPlant);
  const { variants: _variants, sort: _sort, ...rest } = product;
  return { ...rest, isNew: false };
}

export function PotForm({
  product,
  plants,
  tags,
  potsInSet = 1,
}: {
  product: Product | null;
  plants: Plant[];
  tags: Tag[];
  potsInSet?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PotInput>(() => initial(product, plants, potsInSet));
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = <K extends keyof PotInput>(key: K, value: PotInput[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  const [posX, posY] = form.pos.split(" ").map((part) => parseInt(part));
  const plantPrice = (id: string) => plants.find((plant) => plant.id === id)?.price ?? 0;
  const full = form.price + form.defaultPlants.reduce((total, id) => total + plantPrice(id), 0);
  const slotsChanged = !!product && product.slots.length !== form.slots.length;

  function save() {
    setMsg(null);
    start(async () => {
      const result = await savePotAction(form);
      if (!result.ok) return setMsg({ kind: "error", text: result.error });
      if (form.isNew) router.push(`/admin/pots/${result.id}?created=1`);
      else setMsg({ kind: "ok", text: "Saved! The shop is updated." });
    });
  }

  function remove() {
    if (!product || !confirm(`Delete “${product.name.en}” and all its photos? This can't be undone.`)) return;
    start(async () => {
      const result = await deletePotAction(product.id);
      if (result.ok) router.push("/admin/pots");
      else setMsg({ kind: "error", text: result.error });
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="grid gap-5"
    >
      <Panel title="Basics">
        <LInput
          label="Name"
          required
          value={form.name}
          onChange={(name) => {
            setForm((previous) => ({ ...previous, name, id: slugTouched ? previous.id : toSlug(name.en) }));
          }}
        />
        <Labeled label="Link name" hint={form.isNew ? `Shop link: /en/pots/${form.id || "…"}  (can't be changed later)` : `Shop link: /en/pots/${form.id}`}>
          <TextInput
            value={form.id}
            disabled={!form.isNew}
            onChange={(event) => {
              setSlugTouched(true);
              set("id", toSlug(event.target.value));
            }}
          />
        </Labeled>
        <LInput label="Type of pot" required hint="Shown under the name, e.g. “Cat pot” or “Cat pots · set of 2”" value={form.kind} onChange={(value) => set("kind", value)} />
        <LInput label="Badge" hint="Little sticker on the photo, e.g. “New” or “Best seller”. Leave empty for none." value={form.badge} onChange={(value) => set("badge", value)} />
        <LInput label="Description" required multiline value={form.desc} onChange={(value) => set("desc", value)} />
      </Panel>

      <Panel title="Main photo" sub="Used on cards and as the product photo when a plant combo has no photo of its own.">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <ImageUpload value={form.image || null} onChange={(url) => set("image", url ?? "")} label="Upload photo" emptyText="Drop a photo here" />
          <div className="grid content-start gap-4">
            <div className="grid gap-2">
              <span className="text-sm font-bold">Focus point (how the photo is cropped on cards)</span>
              <label className="flex items-center gap-3 text-sm">
                ↔
                <input type="range" min={0} max={100} value={posX} onChange={(event) => set("pos", `${event.target.value}% ${posY}%`)} className="flex-1 accent-pink" />
              </label>
              <label className="flex items-center gap-3 text-sm">
                ↕
                <input type="range" min={0} max={100} value={posY} onChange={(event) => set("pos", `${posX}% ${event.target.value}%`)} className="flex-1 accent-pink" />
              </label>
              {form.image && (
                <div className="relative aspect-[4/5] w-28 overflow-hidden rounded-xl border-2 border-ink">
                  <Image src={form.image} alt="Card preview" fill sizes="112px" className="object-cover" style={{ objectPosition: form.pos }} />
                </div>
              )}
            </div>
            <LInput label="What's in the photo" hint="Shown as “Photo shows the pot styled with …”" value={form.styled} onChange={(value) => set("styled", value)} />
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-bold">Card colour</legend>
              <div className="flex gap-2">
                {TINTS.map((tint) => (
                  <button
                    key={tint}
                    type="button"
                    aria-label={tint}
                    aria-pressed={form.tint === tint}
                    onClick={() => set("tint", tint)}
                    className={`size-9 rounded-full border-[3px] ${TINT[tint].solid} ${form.tint === tint ? "border-ink ring-4 ring-pink-soft" : "border-paper"}`}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </Panel>

      <Panel title="Price & stock">
        <div className="grid gap-4 sm:grid-cols-3">
          <Labeled
            label={form.slots.length > 1 ? `Price for all ${form.slots.length} pots (EGP)` : "Pot price (EGP)"}
            hint={form.slots.length > 1 ? "For the whole set, pots only. Each pot's plant price is added on top." : "For the pot only. The plant price is added on top."}
          >
            <NumberInput value={form.price} onChange={(price) => set("price", price ?? 0)} />
          </Labeled>
          <Labeled label="Sale (% off)" hint="0 = no sale. Applies to pot + plants.">
            <NumberInput value={form.salePercent} max={90} onChange={(percent) => set("salePercent", Math.min(90, percent ?? 0))} />
          </Labeled>
          <div className="grid content-start gap-2">
            <Toggle label="Track stock" checked={form.stock !== null} onChange={(tracked) => set("stock", tracked ? 10 : null)} />
            {form.stock !== null && (
              <Labeled label="In stock" hint="0 = sold out">
                <NumberInput value={form.stock} onChange={(stock) => set("stock", stock ?? 0)} />
              </Labeled>
            )}
          </div>
        </div>
        <p className="rounded-2xl bg-cream px-4 py-2 font-bold">
          Customers see:{" "}
          {form.salePercent > 0 && <s className="me-1 text-ink-soft">{formatPrice(full, "en")}</s>}
          {formatPrice(applySale(full, form.salePercent), "en")} with the default plants
        </p>
      </Panel>

      <Panel title="Pots in this set" sub="One row per pot. Customers pick a plant for each one, like the two cats in the Gossip Duo.">
        <ol className="grid gap-4">
          {form.slots.map((slot, slotIndex) => (
            <li key={slotIndex} className="grid gap-3 rounded-2xl border-2 border-line p-3">
              <div className="flex items-center justify-between">
                <b>Pot {slotIndex + 1}</b>
                {form.slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm((previous) => ({ ...previous, slots: previous.slots.filter((_slot, index) => index !== slotIndex), defaultPlants: previous.defaultPlants.filter((_plant, index) => index !== slotIndex) }))}
                    className="text-sm font-bold text-ink-soft underline hover:text-pink"
                  >
                    Remove
                  </button>
                )}
              </div>
              <LInput
                label="Label"
                required
                hint="Used in “Who lives in …?”, e.g. “the laughing cat”"
                value={slot}
                onChange={(label) => setForm((previous) => ({ ...previous, slots: previous.slots.map((existing, index) => (index === slotIndex ? label : existing)) }))}
              />
              <Labeled label="Default plant">
                <Select
                  value={form.defaultPlants[slotIndex]}
                  onChange={(event) => setForm((previous) => ({ ...previous, defaultPlants: previous.defaultPlants.map((existing, index) => (index === slotIndex ? event.target.value : existing)) }))}
                >
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name.en} (+{formatPrice(plant.price, "en")}){plant.visible ? "" : " · hidden"}
                    </option>
                  ))}
                </Select>
              </Labeled>
            </li>
          ))}
        </ol>
        {form.slots.length < 4 && (
          <button
            type="button"
            onClick={() => setForm((previous) => ({ ...previous, slots: [...previous.slots, { en: `Pot ${previous.slots.length + 1}`, ar: `القصرية ${previous.slots.length + 1}` }], defaultPlants: [...previous.defaultPlants, previous.defaultPlants[0]] }))}
            className="w-fit rounded-full border-2 border-ink bg-lime-soft px-4 py-1.5 font-bold hover:bg-lime"
          >
            + Add another pot to the set
          </button>
        )}
        {slotsChanged && <Notice kind="error">Changing the number of pots deletes this pot&apos;s combo photos when you save.</Notice>}
      </Panel>

      <Panel title="Gift matchmaker" sub="The matchmaker on the home page ranks pots by these tags: vibe first, then who it's for.">
        <Chips
          label="Vibe"
          options={tags.filter((tag) => tag.kind === "vibe").map((tag) => ({ key: tag.id, label: `${tag.emoji} ${tag.label.en}` }))}
          value={form.vibes}
          onChange={(vibes) => set("vibes", vibes)}
        />
        <Chips
          label="Best for"
          options={tags.filter((tag) => tag.kind === "who").map((tag) => ({ key: tag.id, label: `${tag.emoji} ${tag.label.en}` }))}
          value={form.recipients}
          onChange={(recipients) => set("recipients", recipients)}
        />
        <p className="text-sm text-ink-soft">Add more options under Tags &amp; care.</p>
      </Panel>

      <Panel title="Plant tag details" sub="The spec list on the product page. Rows with no label are skipped.">
        <ul className="grid gap-3">
          {form.specs.map((spec, specIndex) => (
            <li key={specIndex} className="grid gap-2 rounded-2xl border-2 border-line p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <LInput label="Label" value={spec.label} onChange={(label) => setForm((previous) => ({ ...previous, specs: previous.specs.map((existing, index) => (index === specIndex ? { ...existing, label } : existing)) }))} />
              <LInput label="Value" value={spec.value} onChange={(specValue) => setForm((previous) => ({ ...previous, specs: previous.specs.map((existing, index) => (index === specIndex ? { ...existing, value: specValue } : existing)) }))} />
              <button
                type="button"
                onClick={() => setForm((previous) => ({ ...previous, specs: previous.specs.filter((_spec, index) => index !== specIndex) }))}
                className="h-fit rounded-full border-2 border-line px-3 py-1 text-sm font-bold hover:border-pink hover:text-pink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setForm((previous) => ({ ...previous, specs: [...previous.specs, { label: blank, value: blank }] }))}
          className="w-fit rounded-full border-2 border-ink bg-lime-soft px-4 py-1.5 font-bold hover:bg-lime"
        >
          + Add row
        </button>
      </Panel>

      <Panel title="On the website">
        <div className="flex flex-wrap gap-6">
          <Toggle label="Show on the shop" checked={form.visible} onChange={(checked) => set("visible", checked)} />
          <Toggle label="Feature in the home page hero" checked={form.featured} onChange={(checked) => set("featured", checked)} />
        </div>
      </Panel>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-3xl border-[3px] border-ink bg-sun p-3 shadow-pop">
        <button type="submit" disabled={pending} className="btn btn-pink">
          {pending ? "Saving…" : form.isNew ? "Create pot" : "Save changes"}
        </button>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        {product && (
          <button type="button" onClick={remove} disabled={pending} className="ms-auto rounded-full border-2 border-ink bg-paper px-4 py-2 font-bold hover:bg-pink hover:text-white">
            Delete pot
          </button>
        )}
      </div>
    </form>
  );
}
