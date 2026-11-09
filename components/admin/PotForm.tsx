"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { savePotAction, deletePotAction, type PotInput } from "@/app/admin/actions";
import { Chips, ImageUpload, LInput, Labeled, Notice, NumberInput, Panel, Select, TextInput, Toggle } from "./ui";
import { TINT, TINTS, applySale, type L, type Plant, type Product, type Tag } from "@/lib/catalog";
import { formatPrice } from "@/lib/i18n";

const blank: L = { en: "", ar: "" };
export const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** Starting values for a new single pot, combo (2) or triple (3). */
function newPot(n: number, firstPlant: string): PotInput {
  const set = n > 1;
  return {
    isNew: true,
    id: "",
    name: blank,
    kind: set ? { en: `Set of ${n}`, ar: `طقم ${n}` } : blank,
    desc: blank,
    badge: n === 2 ? { en: "Combo deal", ar: "عرض كومبو" } : n === 3 ? { en: "Triple deal", ar: "عرض التلاتة" } : blank,
    styled: blank,
    price: 0, salePercent: 0, stock: 10,
    slots: set ? Array.from({ length: n }, (_, i) => ({ en: `Pot ${i + 1}`, ar: `القصرية ${i + 1}` })) : [{ en: "Pot", ar: "القصرية" }],
    defaultPlants: Array(n).fill(firstPlant),
    tint: "pink", image: "", pos: "50% 50%",
    vibes: [], recipients: [],
    specs: [
      { label: { en: "Height", ar: "الطول" }, value: blank },
      ...(set
        ? [{
            label: { en: "In the box", ar: "في العلبة" },
            value: {
              en: `${n} pots, ${n} plants, care card`,
              ar: n === 2 ? "قصريتين، زرعتين، كارت عناية" : `${n} قصاري، ${n} زرعات، كارت عناية`,
            },
          }]
        : []),
    ],
    visible: true, featured: false,
  };
}

function initial(p: Product | null, plants: Plant[], potsInSet: number): PotInput {
  const firstPlant = plants.find((x) => !x.potOnly)?.id ?? plants[0]?.id ?? "";
  if (!p) return newPot(potsInSet, firstPlant);
  const { variants: _v, sort: _s, ...rest } = p;
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
  const [f, setF] = useState<PotInput>(() => initial(product, plants, potsInSet));
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = <K extends keyof PotInput>(k: K, v: PotInput[K]) => setF((s) => ({ ...s, [k]: v }));

  const [x, y] = f.pos.split(" ").map((v) => parseInt(v));
  const plantPrice = (id: string) => plants.find((p) => p.id === id)?.price ?? 0;
  const full = f.price + f.defaultPlants.reduce((n, id) => n + plantPrice(id), 0);
  const slotsChanged = !!product && product.slots.length !== f.slots.length;

  function save() {
    setMsg(null);
    start(async () => {
      const r = await savePotAction(f);
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      if (f.isNew) router.push(`/admin/pots/${r.id}?created=1`);
      else setMsg({ kind: "ok", text: "Saved! The shop is updated." });
    });
  }

  function remove() {
    if (!product || !confirm(`Delete “${product.name.en}” and all its photos? This can't be undone.`)) return;
    start(async () => {
      const r = await deletePotAction(product.id);
      if (r.ok) router.push("/admin/pots");
      else setMsg({ kind: "error", text: r.error });
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-5"
    >
      <Panel title="Basics">
        <LInput
          label="Name"
          required
          value={f.name}
          onChange={(v) => {
            setF((s) => ({ ...s, name: v, id: slugTouched ? s.id : toSlug(v.en) }));
          }}
        />
        <Labeled label="Link name" hint={f.isNew ? `Shop link: /en/pots/${f.id || "…"}  (can't be changed later)` : `Shop link: /en/pots/${f.id}`}>
          <TextInput
            value={f.id}
            disabled={!f.isNew}
            onChange={(e) => {
              setSlugTouched(true);
              set("id", toSlug(e.target.value));
            }}
          />
        </Labeled>
        <LInput label="Type of pot" required hint="Shown under the name, e.g. “Cat pot” or “Cat pots · set of 2”" value={f.kind} onChange={(v) => set("kind", v)} />
        <LInput label="Badge" hint="Little sticker on the photo, e.g. “New” or “Best seller”. Leave empty for none." value={f.badge} onChange={(v) => set("badge", v)} />
        <LInput label="Description" required multiline value={f.desc} onChange={(v) => set("desc", v)} />
      </Panel>

      <Panel title="Main photo" sub="Used on cards and as the product photo when a plant combo has no photo of its own.">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <ImageUpload value={f.image || null} onChange={(url) => set("image", url ?? "")} label="Upload photo" emptyText="Drop a photo here" />
          <div className="grid content-start gap-4">
            <div className="grid gap-2">
              <span className="text-sm font-bold">Focus point (how the photo is cropped on cards)</span>
              <label className="flex items-center gap-3 text-sm">
                ↔
                <input type="range" min={0} max={100} value={x} onChange={(e) => set("pos", `${e.target.value}% ${y}%`)} className="flex-1 accent-pink" />
              </label>
              <label className="flex items-center gap-3 text-sm">
                ↕
                <input type="range" min={0} max={100} value={y} onChange={(e) => set("pos", `${x}% ${e.target.value}%`)} className="flex-1 accent-pink" />
              </label>
              {f.image && (
                <div className="relative aspect-[4/5] w-28 overflow-hidden rounded-xl border-2 border-ink">
                  <Image src={f.image} alt="Card preview" fill sizes="112px" className="object-cover" style={{ objectPosition: f.pos }} />
                </div>
              )}
            </div>
            <LInput label="What's in the photo" hint="Shown as “Photo shows the pot styled with …”" value={f.styled} onChange={(v) => set("styled", v)} />
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-bold">Card colour</legend>
              <div className="flex gap-2">
                {TINTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-label={t}
                    aria-pressed={f.tint === t}
                    onClick={() => set("tint", t)}
                    className={`size-9 rounded-full border-[3px] ${TINT[t].solid} ${f.tint === t ? "border-ink ring-4 ring-pink-soft" : "border-paper"}`}
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
            label={f.slots.length > 1 ? `Price for all ${f.slots.length} pots (EGP)` : "Pot price (EGP)"}
            hint={f.slots.length > 1 ? "For the whole set, pots only. Each pot's plant price is added on top." : "For the pot only. The plant price is added on top."}
          >
            <NumberInput value={f.price} onChange={(n) => set("price", n ?? 0)} />
          </Labeled>
          <Labeled label="Sale (% off)" hint="0 = no sale. Applies to pot + plants.">
            <NumberInput value={f.salePercent} max={90} onChange={(n) => set("salePercent", Math.min(90, n ?? 0))} />
          </Labeled>
          <div className="grid content-start gap-2">
            <Toggle label="Track stock" checked={f.stock !== null} onChange={(v) => set("stock", v ? 10 : null)} />
            {f.stock !== null && (
              <Labeled label="In stock" hint="0 = sold out">
                <NumberInput value={f.stock} onChange={(n) => set("stock", n ?? 0)} />
              </Labeled>
            )}
          </div>
        </div>
        <p className="rounded-2xl bg-cream px-4 py-2 font-bold">
          Customers see:{" "}
          {f.salePercent > 0 && <s className="me-1 text-ink-soft">{formatPrice(full, "en")}</s>}
          {formatPrice(applySale(full, f.salePercent), "en")} with the default plants
        </p>
      </Panel>

      <Panel title="Pots in this set" sub="One row per pot. Customers pick a plant for each one, like the two cats in the Gossip Duo.">
        <ol className="grid gap-4">
          {f.slots.map((slot, i) => (
            <li key={i} className="grid gap-3 rounded-2xl border-2 border-line p-3">
              <div className="flex items-center justify-between">
                <b>Pot {i + 1}</b>
                {f.slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setF((s) => ({ ...s, slots: s.slots.filter((_, j) => j !== i), defaultPlants: s.defaultPlants.filter((_, j) => j !== i) }))}
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
                onChange={(v) => setF((s) => ({ ...s, slots: s.slots.map((x, j) => (j === i ? v : x)) }))}
              />
              <Labeled label="Default plant">
                <Select
                  value={f.defaultPlants[i]}
                  onChange={(e) => setF((s) => ({ ...s, defaultPlants: s.defaultPlants.map((x, j) => (j === i ? e.target.value : x)) }))}
                >
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.en} (+{formatPrice(p.price, "en")}){p.visible ? "" : " · hidden"}
                    </option>
                  ))}
                </Select>
              </Labeled>
            </li>
          ))}
        </ol>
        {f.slots.length < 4 && (
          <button
            type="button"
            onClick={() => setF((s) => ({ ...s, slots: [...s.slots, { en: `Pot ${s.slots.length + 1}`, ar: `القصرية ${s.slots.length + 1}` }], defaultPlants: [...s.defaultPlants, s.defaultPlants[0]] }))}
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
          options={tags.filter((t) => t.kind === "vibe").map((t) => ({ key: t.id, label: `${t.emoji} ${t.label.en}` }))}
          value={f.vibes}
          onChange={(v) => set("vibes", v)}
        />
        <Chips
          label="Best for"
          options={tags.filter((t) => t.kind === "who").map((t) => ({ key: t.id, label: `${t.emoji} ${t.label.en}` }))}
          value={f.recipients}
          onChange={(v) => set("recipients", v)}
        />
        <p className="text-sm text-ink-soft">Add more options under Tags &amp; care.</p>
      </Panel>

      <Panel title="Plant tag details" sub="The spec list on the product page. Rows with no label are skipped.">
        <ul className="grid gap-3">
          {f.specs.map((s, i) => (
            <li key={i} className="grid gap-2 rounded-2xl border-2 border-line p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <LInput label="Label" value={s.label} onChange={(v) => setF((st) => ({ ...st, specs: st.specs.map((x, j) => (j === i ? { ...x, label: v } : x)) }))} />
              <LInput label="Value" value={s.value} onChange={(v) => setF((st) => ({ ...st, specs: st.specs.map((x, j) => (j === i ? { ...x, value: v } : x)) }))} />
              <button
                type="button"
                onClick={() => setF((st) => ({ ...st, specs: st.specs.filter((_, j) => j !== i) }))}
                className="h-fit rounded-full border-2 border-line px-3 py-1 text-sm font-bold hover:border-pink hover:text-pink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setF((st) => ({ ...st, specs: [...st.specs, { label: blank, value: blank }] }))}
          className="w-fit rounded-full border-2 border-ink bg-lime-soft px-4 py-1.5 font-bold hover:bg-lime"
        >
          + Add row
        </button>
      </Panel>

      <Panel title="On the website">
        <div className="flex flex-wrap gap-6">
          <Toggle label="Show on the shop" checked={f.visible} onChange={(v) => set("visible", v)} />
          <Toggle label="Feature in the home page hero" checked={f.featured} onChange={(v) => set("featured", v)} />
        </div>
      </Panel>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-3xl border-[3px] border-ink bg-sun p-3 shadow-pop">
        <button type="submit" disabled={pending} className="btn btn-pink">
          {pending ? "Saving…" : f.isNew ? "Create pot" : "Save changes"}
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
