"use client";

import Image from "next/image";
import { createContext, useContext, useId, useRef, useState } from "react";
import type { L } from "@/lib/catalog";

export function Panel({ title, sub, children, className = "" }: { title?: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`grid content-start gap-4 rounded-3xl border-[3px] border-ink bg-paper p-5 shadow-pop-sm ${className}`}>
      {title && (
        <header className="grid gap-0.5">
          <h2 className="font-head text-xl font-extrabold">{title}</h2>
          {sub && <p className="text-sm text-ink-soft">{sub}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

// Lets <Labeled> point its <label> at the input inside without threading ids by hand.
const IdCtx = createContext<string | undefined>(undefined);
const useFieldId = () => useContext(IdCtx);

export function Labeled({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={`grid content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <IdCtx.Provider value={id}>{children}</IdCtx.Provider>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-xl border-[3px] border-line bg-paper px-3 py-2 text-ink outline-none transition-colors focus:border-pink";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useFieldId();
  return <input id={id} {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useFieldId();
  return <select id={id} {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  allowEmpty,
  ...rest
}: { value: number | null; onChange: (n: number | null) => void; min?: number; max?: number; allowEmpty?: boolean } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "min" | "max"
>) {
  const id = useFieldId();
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") onChange(allowEmpty ? null : 0);
        else onChange(Math.max(min, Math.round(Number(v))));
      }}
      {...rest}
      className={`${inputCls} tabular-nums ${rest.className ?? ""}`}
    />
  );
}

/** English + Arabic side by side. */
export function LInput({
  label,
  value,
  onChange,
  multiline,
  hint,
  required,
}: {
  label: string;
  value: L;
  onChange: (v: L) => void;
  multiline?: boolean;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const field = (lang: "en" | "ar") => {
    const common = {
      id: `${id}-${lang}`,
      value: value[lang],
      dir: lang === "ar" ? ("rtl" as const) : ("ltr" as const),
      lang,
      required,
      placeholder: lang === "ar" ? "بالعربي" : "In English",
      className: `${inputCls} ${lang === "ar" ? "font-arbody" : ""}`,
    };
    return multiline ? (
      <textarea {...common} rows={3} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} className={`${common.className} resize-y`} />
    ) : (
      <input {...common} onChange={(e) => onChange({ ...value, [lang]: e.target.value })} />
    );
  };
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm font-bold">
        {label}
        {required && <span className="text-pink"> *</span>}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[11px] font-extrabold tracking-wider text-ink-soft uppercase">English</span>
          {field("en")}
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-extrabold tracking-wider text-ink-soft uppercase">عربي</span>
          {field("ar")}
        </label>
      </div>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </fieldset>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`inline-flex items-center gap-2.5 font-bold ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full border-[3px] border-ink bg-line transition-colors peer-checked:bg-lime peer-focus-visible:outline-3 peer-focus-visible:outline-pink after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-paper after:ring-2 after:ring-ink after:transition-transform peer-checked:after:translate-x-5"
      />
      {label}
    </label>
  );
}

/** Multi-select chips (tags). */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  label: string;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o.key) : [...value, o.key])}
              className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors ${on ? "border-ink bg-sun" : "border-line bg-paper hover:border-ink"}`}
            >
              {on ? "✓ " : ""}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

async function upload(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return data.url;
}

/** Click or drop an image; uploads straight away and reports the stored URL. */
export function ImageUpload({
  value,
  onChange,
  label = "Upload image",
  className = "aspect-square",
  removable,
  emptyText = "No image yet",
}: {
  value: string | null;
  onChange: (url: string | null) => void | Promise<void>;
  label?: string;
  className?: string;
  removable?: boolean;
  emptyText?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);

  async function handle(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await onChange(await upload(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid content-start gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files[0]);
        }}
        className={`relative overflow-hidden rounded-2xl border-[3px] ${over ? "border-pink bg-pink-soft" : value ? "border-ink" : "border-dashed border-ink/40 bg-cream"} ${className}`}
      >
        {value ? (
          <Image src={value} alt="" fill sizes="400px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center p-3 text-center text-sm font-bold text-ink-soft">{emptyText}</span>
        )}
        {busy && <span className="absolute inset-0 grid place-items-center bg-paper/80 font-extrabold">Uploading…</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="rounded-full border-2 border-ink bg-sky-soft px-3 py-1 text-sm font-bold hover:bg-sky disabled:opacity-50"
        >
          {value ? "Replace" : label}
        </button>
        {removable && value && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange(null)}
            className="rounded-full border-2 border-line bg-paper px-3 py-1 text-sm font-bold text-ink-soft hover:border-pink hover:text-pink"
          >
            Remove
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      {error && <p className="text-sm font-bold text-pink">{error}</p>}
    </div>
  );
}

export function Notice({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-2xl border-2 px-4 py-2 font-bold ${kind === "error" ? "border-pink bg-pink-soft" : "border-ink bg-lime-soft"}`}>
      {children}
    </p>
  );
}
