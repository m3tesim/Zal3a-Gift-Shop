"use client";

import { useState, useTransition } from "react";
import {
  deleteCareAction, deleteTagAction, moveListItemAction, saveCareAction, saveTagAction,
  type ActionResult, type CareInput, type TagInput,
} from "@/app/admin/actions";
import { LInput, Labeled, Notice, Panel, TextInput, Toggle } from "./ui";
import { toSlug } from "./PotForm";
import type { CareKind, CareOption, Tag, TagKind } from "@/lib/catalog";

const blank = { en: "", ar: "" };

function useRun() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (action: () => Promise<ActionResult>, onOk?: () => void) =>
    start(async () => {
      const result = await action();
      setError(result.ok ? "" : result.error);
      if (result.ok) onOk?.();
    });
  return { pending, error, run };
}

function Arrows({ onMove, first, last, disabled }: { onMove: (direction: -1 | 1) => void; first: boolean; last: boolean; disabled: boolean }) {
  const cls = "grid size-8 place-items-center rounded-full border-2 border-ink bg-paper font-extrabold hover:bg-sun disabled:opacity-25";
  return (
    <span className="flex gap-1">
      <button type="button" className={cls} disabled={first || disabled} onClick={() => onMove(-1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" className={cls} disabled={last || disabled} onClick={() => onMove(1)} aria-label="Move down">
        ↓
      </button>
    </span>
  );
}

/* ───────── tags ───────── */

function TagForm({ initial, onDone }: { initial: TagInput; onDone: () => void }) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(!initial.isNew);
  const { pending, error, run } = useRun();
  const who = form.kind === "who";
  return (
    <form
      className="grid gap-3 rounded-2xl border-2 border-ink bg-cream p-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveTagAction(form), onDone);
      }}
    >
      <LInput label="Label" required value={form.label} onChange={(label) => setForm((previous) => ({ ...previous, label, id: touched ? previous.id : toSlug(label.en) }))} />
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <Labeled label="Emoji">
          <TextInput value={form.emoji} maxLength={8} onChange={(event) => setForm((previous) => ({ ...previous, emoji: event.target.value }))} />
        </Labeled>
        <Labeled label="ID" hint={form.isNew ? "Used internally; can't be changed later." : undefined}>
          <TextInput
            value={form.id}
            disabled={!form.isNew}
            onChange={(event) => {
              setTouched(true);
              setForm((previous) => ({ ...previous, id: toSlug(event.target.value) }));
            }}
          />
        </Labeled>
      </div>
      {who && (
        <LInput
          label="Matchmaker line"
          hint="Shown under the suggested pot, e.g. “Mom will show it to every single visitor.”"
          value={form.line}
          onChange={(line) => setForm((previous) => ({ ...previous, line }))}
        />
      )}
      <Toggle label="Show in the gift matchmaker" checked={form.visible} onChange={(checked) => setForm((previous) => ({ ...previous, visible: checked }))} />
      {error && <Notice kind="error">{error}</Notice>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-pink py-1.5 text-base">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onDone} className="rounded-full border-2 border-line px-4 font-bold hover:border-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function TagList({ kind, tags, title, sub }: { kind: TagKind; tags: Tag[]; title: string; sub: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const { pending, error, run } = useRun();
  const list = tags.filter((tag) => tag.kind === kind);

  return (
    <Panel title={title} sub={sub}>
      {error && <Notice kind="error">{error}</Notice>}
      <ul className="grid gap-2">
        {list.map((tag, index) =>
          editing === tag.id ? (
            <li key={tag.id}>
              <TagForm initial={{ ...tag, isNew: false }} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={tag.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line px-3 py-2 ${tag.visible ? "" : "opacity-60"}`}>
              <span className="text-2xl" aria-hidden="true">
                {tag.emoji || "•"}
              </span>
              <span className="min-w-0 flex-1">
                <b>{tag.label.en}</b> · <span lang="ar">{tag.label.ar}</span>
                {!tag.visible && <span className="ms-2 text-xs font-bold text-ink-soft">(hidden from matchmaker)</span>}
                {kind === "who" && tag.line.en && <span className="block truncate text-sm text-ink-soft">“{tag.line.en}”</span>}
              </span>
              <Arrows first={index === 0} last={index === list.length - 1} disabled={pending} onMove={(direction) => run(() => moveListItemAction("tags", kind, tag.id, direction))} />
              <button type="button" onClick={() => setEditing(tag.id)} className="rounded-full border-2 border-ink bg-sky-soft px-3 py-0.5 font-bold hover:bg-sky">
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm(`Delete “${tag.label.en}”? It's removed from every pot and plant that uses it.`) && run(() => deleteTagAction(kind, tag.id))}
                className="rounded-full border-2 border-line px-3 py-0.5 font-bold text-ink-soft hover:border-pink hover:text-pink"
              >
                Delete
              </button>
            </li>
          ),
        )}
      </ul>
      {editing === "__new" ? (
        <TagForm initial={{ isNew: true, kind, id: "", label: blank, emoji: "", line: blank, visible: true }} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing("__new")} className="w-fit rounded-full border-2 border-ink bg-lime-soft px-4 py-1.5 font-bold hover:bg-lime">
          + Add {kind === "who" ? "a “best for” label" : "a vibe"}
        </button>
      )}
    </Panel>
  );
}

/* ───────── care options ───────── */

function Dots({ kind, level }: { kind: CareKind; level: number }) {
  return (
    <span className="flex gap-1" aria-label={`${level} of 3`}>
      {[1, 2, 3].map((dot) => (
        <i
          key={dot}
          className={`block size-4 border-2 ${kind === "water" ? "-rotate-45 rounded-[50%_0_50%_50%]" : "rounded-full"} ${dot <= level ? `border-ink ${kind === "sun" ? "bg-sun" : "bg-sky"}` : "border-ink/25 bg-paper"}`}
        />
      ))}
    </span>
  );
}

function CareForm({ initial, onDone }: { initial: CareInput; onDone: () => void }) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(!initial.isNew);
  const { pending, error, run } = useRun();
  return (
    <form
      className="grid gap-3 rounded-2xl border-2 border-ink bg-cream p-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveCareAction(form), onDone);
      }}
    >
      <LInput
        label="Label"
        required
        hint={form.kind === "water" ? "e.g. “Every 5 days” or “When the soil is fully dry”" : "e.g. “Shade is fine”"}
        value={form.label}
        onChange={(label) => setForm((previous) => ({ ...previous, label, id: touched ? previous.id : toSlug(label.en) }))}
      />
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-bold">Meter ({form.kind === "water" ? "how thirsty" : "how much sun"})</legend>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={form.level === level}
              onClick={() => setForm((previous) => ({ ...previous, level }))}
              className={`flex items-center gap-2 rounded-full border-2 px-3 py-1 ${form.level === level ? "border-ink bg-sun-soft" : "border-line bg-paper hover:border-ink"}`}
            >
              <Dots kind={form.kind} level={level} />
            </button>
          ))}
        </div>
      </fieldset>
      {form.isNew && (
        <Labeled label="ID" hint="Used internally; can't be changed later.">
          <TextInput
            value={form.id}
            onChange={(event) => {
              setTouched(true);
              setForm((previous) => ({ ...previous, id: toSlug(event.target.value) }));
            }}
          />
        </Labeled>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-pink py-1.5 text-base">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onDone} className="rounded-full border-2 border-line px-4 font-bold hover:border-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CareList({ kind, options, title, sub }: { kind: CareKind; options: CareOption[]; title: string; sub: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const { pending, error, run } = useRun();
  const list = options.filter((option) => option.kind === kind);

  return (
    <Panel title={title} sub={sub}>
      {error && <Notice kind="error">{error}</Notice>}
      <ul className="grid gap-2">
        {list.map((option, index) =>
          editing === option.id ? (
            <li key={option.id}>
              <CareForm initial={{ ...option, isNew: false }} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={option.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line px-3 py-2">
              <Dots kind={kind} level={option.level} />
              <span className="min-w-0 flex-1">
                <b>{option.label.en}</b> · <span lang="ar">{option.label.ar}</span>
              </span>
              <Arrows first={index === 0} last={index === list.length - 1} disabled={pending} onMove={(direction) => run(() => moveListItemAction("care_options", kind, option.id, direction))} />
              <button type="button" onClick={() => setEditing(option.id)} className="rounded-full border-2 border-ink bg-sky-soft px-3 py-0.5 font-bold hover:bg-sky">
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm(`Delete “${option.label.en}”?`) && run(() => deleteCareAction(kind, option.id))}
                className="rounded-full border-2 border-line px-3 py-0.5 font-bold text-ink-soft hover:border-pink hover:text-pink"
              >
                Delete
              </button>
            </li>
          ),
        )}
      </ul>
      {editing === "__new" ? (
        <CareForm initial={{ isNew: true, kind, id: "", label: blank, level: 1 }} onDone={() => setEditing(null)} />
      ) : (
        <button type="button" onClick={() => setEditing("__new")} className="w-fit rounded-full border-2 border-ink bg-lime-soft px-4 py-1.5 font-bold hover:bg-lime">
          + Add {kind === "water" ? "a watering option" : "a sun option"}
        </button>
      )}
    </Panel>
  );
}
