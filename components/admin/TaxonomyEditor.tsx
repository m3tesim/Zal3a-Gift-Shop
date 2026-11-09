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
  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? "" : r.error);
      if (r.ok) onOk?.();
    });
  return { pending, error, run };
}

function Arrows({ onMove, first, last, disabled }: { onMove: (d: -1 | 1) => void; first: boolean; last: boolean; disabled: boolean }) {
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
  const [f, setF] = useState(initial);
  const [touched, setTouched] = useState(!initial.isNew);
  const { pending, error, run } = useRun();
  const who = f.kind === "who";
  return (
    <form
      className="grid gap-3 rounded-2xl border-2 border-ink bg-cream p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveTagAction(f), onDone);
      }}
    >
      <LInput label="Label" required value={f.label} onChange={(v) => setF((s) => ({ ...s, label: v, id: touched ? s.id : toSlug(v.en) }))} />
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <Labeled label="Emoji">
          <TextInput value={f.emoji} maxLength={8} onChange={(e) => setF((s) => ({ ...s, emoji: e.target.value }))} />
        </Labeled>
        <Labeled label="ID" hint={f.isNew ? "Used internally; can't be changed later." : undefined}>
          <TextInput
            value={f.id}
            disabled={!f.isNew}
            onChange={(e) => {
              setTouched(true);
              setF((s) => ({ ...s, id: toSlug(e.target.value) }));
            }}
          />
        </Labeled>
      </div>
      {who && (
        <LInput
          label="Matchmaker line"
          hint="Shown under the suggested pot, e.g. “Mom will show it to every single visitor.”"
          value={f.line}
          onChange={(v) => setF((s) => ({ ...s, line: v }))}
        />
      )}
      <Toggle label="Show in the gift matchmaker" checked={f.visible} onChange={(v) => setF((s) => ({ ...s, visible: v }))} />
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
  const list = tags.filter((t) => t.kind === kind);

  return (
    <Panel title={title} sub={sub}>
      {error && <Notice kind="error">{error}</Notice>}
      <ul className="grid gap-2">
        {list.map((t, i) =>
          editing === t.id ? (
            <li key={t.id}>
              <TagForm initial={{ ...t, isNew: false }} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={t.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line px-3 py-2 ${t.visible ? "" : "opacity-60"}`}>
              <span className="text-2xl" aria-hidden="true">
                {t.emoji || "•"}
              </span>
              <span className="min-w-0 flex-1">
                <b>{t.label.en}</b> · <span lang="ar">{t.label.ar}</span>
                {!t.visible && <span className="ms-2 text-xs font-bold text-ink-soft">(hidden from matchmaker)</span>}
                {kind === "who" && t.line.en && <span className="block truncate text-sm text-ink-soft">“{t.line.en}”</span>}
              </span>
              <Arrows first={i === 0} last={i === list.length - 1} disabled={pending} onMove={(d) => run(() => moveListItemAction("tags", kind, t.id, d))} />
              <button type="button" onClick={() => setEditing(t.id)} className="rounded-full border-2 border-ink bg-sky-soft px-3 py-0.5 font-bold hover:bg-sky">
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm(`Delete “${t.label.en}”? It's removed from every pot and plant that uses it.`) && run(() => deleteTagAction(kind, t.id))}
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
      {[1, 2, 3].map((i) => (
        <i
          key={i}
          className={`block size-4 border-2 ${kind === "water" ? "-rotate-45 rounded-[50%_0_50%_50%]" : "rounded-full"} ${i <= level ? `border-ink ${kind === "sun" ? "bg-sun" : "bg-sky"}` : "border-ink/25 bg-paper"}`}
        />
      ))}
    </span>
  );
}

function CareForm({ initial, onDone }: { initial: CareInput; onDone: () => void }) {
  const [f, setF] = useState(initial);
  const [touched, setTouched] = useState(!initial.isNew);
  const { pending, error, run } = useRun();
  return (
    <form
      className="grid gap-3 rounded-2xl border-2 border-ink bg-cream p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCareAction(f), onDone);
      }}
    >
      <LInput
        label="Label"
        required
        hint={f.kind === "water" ? "e.g. “Every 5 days” or “When the soil is fully dry”" : "e.g. “Shade is fine”"}
        value={f.label}
        onChange={(v) => setF((s) => ({ ...s, label: v, id: touched ? s.id : toSlug(v.en) }))}
      />
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-bold">Meter ({f.kind === "water" ? "how thirsty" : "how much sun"})</legend>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={f.level === n}
              onClick={() => setF((s) => ({ ...s, level: n }))}
              className={`flex items-center gap-2 rounded-full border-2 px-3 py-1 ${f.level === n ? "border-ink bg-sun-soft" : "border-line bg-paper hover:border-ink"}`}
            >
              <Dots kind={f.kind} level={n} />
            </button>
          ))}
        </div>
      </fieldset>
      {f.isNew && (
        <Labeled label="ID" hint="Used internally; can't be changed later.">
          <TextInput
            value={f.id}
            onChange={(e) => {
              setTouched(true);
              setF((s) => ({ ...s, id: toSlug(e.target.value) }));
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
  const list = options.filter((o) => o.kind === kind);

  return (
    <Panel title={title} sub={sub}>
      {error && <Notice kind="error">{error}</Notice>}
      <ul className="grid gap-2">
        {list.map((o, i) =>
          editing === o.id ? (
            <li key={o.id}>
              <CareForm initial={{ ...o, isNew: false }} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-line px-3 py-2">
              <Dots kind={kind} level={o.level} />
              <span className="min-w-0 flex-1">
                <b>{o.label.en}</b> · <span lang="ar">{o.label.ar}</span>
              </span>
              <Arrows first={i === 0} last={i === list.length - 1} disabled={pending} onMove={(d) => run(() => moveListItemAction("care_options", kind, o.id, d))} />
              <button type="button" onClick={() => setEditing(o.id)} className="rounded-full border-2 border-ink bg-sky-soft px-3 py-0.5 font-bold hover:bg-sky">
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm(`Delete “${o.label.en}”?`) && run(() => deleteCareAction(kind, o.id))}
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
