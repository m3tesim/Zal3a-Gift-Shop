"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePlantAction, savePlantAction, type PlantInput } from "@/app/admin/actions";
import { Chips, ImageUpload, LInput, Labeled, Notice, NumberInput, Panel, TextInput, Toggle } from "./ui";
import { PlantIcon } from "../icons";
import { PLANT_ICONS, TINT, TINTS, WHOS, type Plant } from "@/lib/catalog";
import { en } from "@/lib/dictionaries/en";
import { toSlug } from "./PotForm";

const blank = { en: "", ar: "" };

function initial(p: Plant | null): PlantInput {
  if (!p)
    return {
      isNew: true, id: "", name: blank, latin: blank, blurb: blank,
      price: 0, sun: 2, water: 1, tint: "lime", icon: "leafy", image: null,
      stock: 10, visible: true, recipients: [],
    };
  const { potOnly: _p, sort: _s, ...rest } = p;
  return { ...rest, isNew: false };
}

function Level({ label, value, onChange, names }: { label: string; value: number; onChange: (n: number) => void; names: string[] }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {names.map((n, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={value === i}
            onClick={() => onChange(i)}
            className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${value === i ? "border-ink bg-sky" : "border-line bg-paper hover:border-ink"}`}
          >
            {i} · {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PlantForm({ plant }: { plant: Plant | null }) {
  const router = useRouter();
  const [f, setF] = useState<PlantInput>(() => initial(plant));
  const [slugTouched, setSlugTouched] = useState(!!plant);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = <K extends keyof PlantInput>(k: K, v: PlantInput[K]) => setF((s) => ({ ...s, [k]: v }));
  const potOnly = !!plant?.potOnly;

  function save() {
    setMsg(null);
    start(async () => {
      const r = await savePlantAction(f);
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      if (f.isNew) router.push(`/admin/plants/${r.id}?created=1`);
      else setMsg({ kind: "ok", text: "Saved! The shop is updated." });
    });
  }

  function remove() {
    if (!plant || !confirm(`Delete “${plant.name.en}”? Its combo photos on every pot are deleted too.`)) return;
    start(async () => {
      const r = await deletePlantAction(plant.id);
      if (r.ok) router.push("/admin/plants");
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
        <LInput label="Name" required value={f.name} onChange={(v) => setF((s) => ({ ...s, name: v, id: slugTouched ? s.id : toSlug(v.en) }))} />
        <Labeled label="Link name" hint={f.isNew ? `Shop link: /en/plants/${f.id || "…"}  (can't be changed later)` : `Shop link: /en/plants/${f.id}`}>
          <TextInput
            value={f.id}
            disabled={!f.isNew}
            onChange={(e) => {
              setSlugTouched(true);
              set("id", toSlug(e.target.value));
            }}
          />
        </Labeled>
        <LInput label={potOnly ? "Subtitle" : "Latin name"} value={f.latin} onChange={(v) => set("latin", v)} />
        <LInput label="Description" required multiline value={f.blurb} onChange={(v) => set("blurb", v)} />
      </Panel>

      <Panel title="Look" sub="The photo shows on “Meet the roommates” and the plant's own page. The icon shows next to it and in the plant picker.">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          {!potOnly ? (
            <ImageUpload value={f.image} onChange={(url) => set("image", url)} removable label="Upload photo" emptyText="Drop a plant photo here" />
          ) : (
            <p className="text-sm text-ink-soft">“Pot only” has no photo.</p>
          )}
          <div className="grid content-start gap-4">
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-bold">Icon</legend>
              <div className="flex flex-wrap gap-2">
                {PLANT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    aria-label={ic}
                    aria-pressed={f.icon === ic}
                    onClick={() => set("icon", ic)}
                    className={`grid size-14 place-items-center rounded-2xl border-[3px] ${f.icon === ic ? "border-ink bg-sun-soft" : "border-line bg-paper hover:border-ink"}`}
                  >
                    <PlantIcon icon={ic} className="size-10" />
                  </button>
                ))}
              </div>
            </fieldset>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Price per pot (EGP)" hint="Added to the pot price for every pot this plant goes in.">
            <NumberInput value={f.price} onChange={(n) => set("price", n ?? 0)} />
          </Labeled>
          <div className="grid content-start gap-2">
            <Toggle label="Track stock" checked={f.stock !== null} onChange={(v) => set("stock", v ? 10 : null)} />
            {f.stock !== null && (
              <Labeled label="In stock" hint="0 = sold out (customers can't pick it)">
                <NumberInput value={f.stock} onChange={(n) => set("stock", n ?? 0)} />
              </Labeled>
            )}
          </div>
        </div>
      </Panel>

      {!potOnly && (
        <Panel title="Care">
          <Level label="Sun" value={f.sun} onChange={(n) => set("sun", n)} names={en.product.sunLevels} />
          <Level label="Water" value={f.water} onChange={(n) => set("water", n)} names={en.product.waterLevels} />
        </Panel>
      )}

      {!potOnly && (
        <Panel title="Gift matchmaker" sub="When the matchmaker suggests a pot, it picks the first plant tagged for that person.">
          <Chips label="Great for" options={WHOS.map((w) => ({ key: w, label: en.matcher.who[w] }))} value={f.recipients} onChange={(v) => set("recipients", v)} />
        </Panel>
      )}

      <Panel title="On the website">
        <Toggle label="Customers can pick this" checked={f.visible} onChange={(v) => set("visible", v)} />
      </Panel>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-3xl border-[3px] border-ink bg-sun p-3 shadow-pop">
        <button type="submit" disabled={pending} className="btn btn-pink">
          {pending ? "Saving…" : f.isNew ? "Create plant" : "Save changes"}
        </button>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        {plant && !potOnly && (
          <button type="button" onClick={remove} disabled={pending} className="ms-auto rounded-full border-2 border-ink bg-paper px-4 py-2 font-bold hover:bg-pink hover:text-white">
            Delete plant
          </button>
        )}
      </div>
    </form>
  );
}
