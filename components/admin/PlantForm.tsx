"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePlantAction, savePlantAction, type PlantInput } from "@/app/admin/actions";
import { Chips, ImageUpload, LInput, Labeled, Notice, NumberInput, Panel, Select, TextInput, Toggle } from "./ui";
import { PlantIcon } from "../icons";
import { PLANT_ICONS, TINT, TINTS, type CareOption, type Plant, type Tag } from "@/lib/catalog";
import { toSlug } from "./PotForm";

const blank = { en: "", ar: "" };

function initial(plant: Plant | null): PlantInput {
  if (!plant)
    return {
      isNew: true, id: "", name: blank, latin: blank, blurb: blank,
      price: 0, sun: null, water: null, tint: "lime", icon: "leafy", image: null,
      stock: 10, visible: true, recipients: [], vibes: [],
    };
  const { potOnly: _potOnly, sort: _sort, ...rest } = plant;
  return { ...rest, isNew: false };
}

function CareSelect({ label, value, options, onChange }: { label: string; value: string | null; options: CareOption[]; onChange: (value: string | null) => void }) {
  return (
    <Labeled label={label} hint="Add or rename options under Tags & care.">
      <Select value={value ?? ""} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">Not shown</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {"●".repeat(option.level) || "○"} {option.label.en}
          </option>
        ))}
      </Select>
    </Labeled>
  );
}

export function PlantForm({ plant, tags, care }: { plant: Plant | null; tags: Tag[]; care: CareOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState<PlantInput>(() => initial(plant));
  const [slugTouched, setSlugTouched] = useState(!!plant);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = <K extends keyof PlantInput>(key: K, value: PlantInput[K]) => setForm((previous) => ({ ...previous, [key]: value }));
  const potOnly = !!plant?.potOnly;

  function save() {
    setMsg(null);
    start(async () => {
      const result = await savePlantAction(form);
      if (!result.ok) return setMsg({ kind: "error", text: result.error });
      if (form.isNew) router.push(`/admin/plants/${result.id}?created=1`);
      else setMsg({ kind: "ok", text: "Saved! The shop is updated." });
    });
  }

  function remove() {
    if (!plant || !confirm(`Delete “${plant.name.en}”? Its combo photos on every pot are deleted too.`)) return;
    start(async () => {
      const result = await deletePlantAction(plant.id);
      if (result.ok) router.push("/admin/plants");
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
        <LInput label="Name" required value={form.name} onChange={(name) => setForm((previous) => ({ ...previous, name, id: slugTouched ? previous.id : toSlug(name.en) }))} />
        <Labeled label="Link name" hint={form.isNew ? `Shop link: /en/plants/${form.id || "…"}  (can't be changed later)` : `Shop link: /en/plants/${form.id}`}>
          <TextInput
            value={form.id}
            disabled={!form.isNew}
            onChange={(event) => {
              setSlugTouched(true);
              set("id", toSlug(event.target.value));
            }}
          />
        </Labeled>
        <LInput label={potOnly ? "Subtitle" : "Latin name"} value={form.latin} onChange={(value) => set("latin", value)} />
        <LInput label="Description" required multiline value={form.blurb} onChange={(value) => set("blurb", value)} />
      </Panel>

      <Panel title="Look" sub="The photo shows on “Meet the roommates” and the plant's own page. The icon shows next to it and in the plant picker.">
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          {!potOnly ? (
            <ImageUpload value={form.image} onChange={(url) => set("image", url)} removable label="Upload photo" emptyText="Drop a plant photo here" />
          ) : (
            <p className="text-sm text-ink-soft">“Pot only” has no photo.</p>
          )}
          <div className="grid content-start gap-4">
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-bold">Icon</legend>
              <div className="flex flex-wrap gap-2">
                {PLANT_ICONS.map((iconKey) => (
                  <button
                    key={iconKey}
                    type="button"
                    aria-label={iconKey}
                    aria-pressed={form.icon === iconKey}
                    onClick={() => set("icon", iconKey)}
                    className={`grid size-14 place-items-center rounded-2xl border-[3px] ${form.icon === iconKey ? "border-ink bg-sun-soft" : "border-line bg-paper hover:border-ink"}`}
                  >
                    <PlantIcon icon={iconKey} className="size-10" />
                  </button>
                ))}
              </div>
            </fieldset>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Price per pot (EGP)" hint="Added to the pot price for every pot this plant goes in.">
            <NumberInput value={form.price} onChange={(price) => set("price", price ?? 0)} />
          </Labeled>
          <div className="grid content-start gap-2">
            <Toggle label="Track stock" checked={form.stock !== null} onChange={(tracked) => set("stock", tracked ? 10 : null)} />
            {form.stock !== null && (
              <Labeled label="In stock" hint="0 = sold out (customers can't pick it)">
                <NumberInput value={form.stock} onChange={(stock) => set("stock", stock ?? 0)} />
              </Labeled>
            )}
          </div>
        </div>
      </Panel>

      {!potOnly && (
        <Panel title="Care" sub="Shown on the plant's page and on every pot it goes in.">
          <div className="grid gap-4 sm:grid-cols-2">
            <CareSelect label="Sun" value={form.sun} options={care.filter((option) => option.kind === "sun")} onChange={(value) => set("sun", value)} />
            <CareSelect label="Watering" value={form.water} options={care.filter((option) => option.kind === "water")} onChange={(value) => set("water", value)} />
          </div>
          <Chips
            label="Best for"
            options={tags.filter((tag) => tag.kind === "who").map((tag) => ({ key: tag.id, label: `${tag.emoji} ${tag.label.en}` }))}
            value={form.recipients}
            onChange={(recipients) => set("recipients", recipients)}
          />
          <Chips
            label="Vibe"
            options={tags.filter((tag) => tag.kind === "vibe").map((tag) => ({ key: tag.id, label: `${tag.emoji} ${tag.label.en}` }))}
            value={form.vibes}
            onChange={(vibes) => set("vibes", vibes)}
          />
          <p className="text-sm text-ink-soft">The gift matchmaker suggests the plant that best fits who it&apos;s for and their vibe.</p>
        </Panel>
      )}


      <Panel title="On the website">
        <Toggle label="Customers can pick this" checked={form.visible} onChange={(checked) => set("visible", checked)} />
      </Panel>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-3xl border-[3px] border-ink bg-sun p-3 shadow-pop">
        <button type="submit" disabled={pending} className="btn btn-pink">
          {pending ? "Saving…" : form.isNew ? "Create plant" : "Save changes"}
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
