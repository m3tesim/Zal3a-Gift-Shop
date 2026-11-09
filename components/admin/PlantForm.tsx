"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePlantAction, savePlantAction, type PlantInput } from "@/app/admin/actions";
import { Chips, ImageUpload, LInput, Labeled, Notice, NumberInput, Panel, Select, TextInput, Toggle } from "./ui";
import { PlantIcon } from "../icons";
import { PLANT_ICONS, TINT, TINTS, type CareOption, type Plant, type Tag } from "@/lib/catalog";
import { toSlug } from "./PotForm";

const blank = { en: "", ar: "" };

function initial(p: Plant | null): PlantInput {
  if (!p)
    return {
      isNew: true, id: "", name: blank, latin: blank, blurb: blank,
      price: 0, sun: null, water: null, tint: "lime", icon: "leafy", image: null,
      stock: 10, visible: true, recipients: [], vibes: [],
    };
  const { potOnly: _p, sort: _s, ...rest } = p;
  return { ...rest, isNew: false };
}

function CareSelect({ label, value, options, onChange }: { label: string; value: string | null; options: CareOption[]; onChange: (v: string | null) => void }) {
  return (
    <Labeled label={label} hint="Add or rename options under Tags & care.">
      <Select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Not shown</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {"●".repeat(o.level) || "○"} {o.label.en}
          </option>
        ))}
      </Select>
    </Labeled>
  );
}

export function PlantForm({ plant, tags, care }: { plant: Plant | null; tags: Tag[]; care: CareOption[] }) {
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
        <Panel title="Care" sub="Shown on the plant's page and on every pot it goes in.">
          <div className="grid gap-4 sm:grid-cols-2">
            <CareSelect label="Sun" value={f.sun} options={care.filter((o) => o.kind === "sun")} onChange={(v) => set("sun", v)} />
            <CareSelect label="Watering" value={f.water} options={care.filter((o) => o.kind === "water")} onChange={(v) => set("water", v)} />
          </div>
          <Chips
            label="Best for"
            options={tags.filter((t) => t.kind === "who").map((t) => ({ key: t.id, label: `${t.emoji} ${t.label.en}` }))}
            value={f.recipients}
            onChange={(v) => set("recipients", v)}
          />
          <Chips
            label="Vibe"
            options={tags.filter((t) => t.kind === "vibe").map((t) => ({ key: t.id, label: `${t.emoji} ${t.label.en}` }))}
            value={f.vibes}
            onChange={(v) => set("vibes", v)}
          />
          <p className="text-sm text-ink-soft">The gift matchmaker suggests the plant that best fits who it&apos;s for and their vibe.</p>
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
