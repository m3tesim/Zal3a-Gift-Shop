"use client";

import { useState, useTransition } from "react";
import { moveAction, setSaleAction, setStockAction, setVisibleAction, type ActionResult } from "@/app/admin/actions";
import { Toggle } from "./ui";

type Table = "products" | "plants";

function useSave() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (action: () => Promise<ActionResult>) =>
    start(async () => {
      const result = await action();
      setError(result.ok ? "" : result.error);
    });
  return { pending, error, run };
}

/** Stock count. Empty = not tracked (never sells out). */
export function StockInput({ table, id, stock }: { table: Table; id: string; stock: number | null }) {
  const [value, setValue] = useState(stock === null ? "" : String(stock));
  const { pending, error, run } = useSave();
  const parsed = value.trim() === "" ? null : Math.max(0, Math.round(Number(value)));
  const save = (value: number | null) => {
    if (value === stock || Number.isNaN(value)) return;
    setValue(value === null ? "" : String(value));
    run(() => setStockAction(table, id, value));
  };

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-1.5">
        <input
          aria-label="Stock"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="∞"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => save(parsed)}
          onKeyDown={(event) => event.key === "Enter" && (event.currentTarget as HTMLInputElement).blur()}
          className={`w-20 rounded-xl border-[3px] px-2 py-1 font-bold tabular-nums outline-none focus:border-pink ${stock === 0 ? "border-pink bg-pink-soft" : "border-line bg-paper"} ${pending ? "opacity-50" : ""}`}
        />
        {stock !== 0 ? (
          <button type="button" onClick={() => save(0)} className="rounded-full border-2 border-line px-2 py-0.5 text-xs font-bold whitespace-nowrap hover:border-pink hover:text-pink">
            Sold out
          </button>
        ) : (
          <span className="rounded-full bg-pink px-2 py-0.5 text-xs font-extrabold whitespace-nowrap text-white">Sold out</span>
        )}
      </div>
      {stock !== null && stock > 0 && stock <= 3 && <span className="text-xs font-bold text-orange">Low stock</span>}
      {error && <span className="text-xs font-bold text-pink">{error}</span>}
    </div>
  );
}

export function SaleInput({ id, pct }: { id: string; pct: number }) {
  const [value, setValue] = useState(String(pct));
  const { pending, error, run } = useSave();
  const save = () => {
    const percent = Math.min(90, Math.max(0, Math.round(Number(value) || 0)));
    setValue(String(percent));
    if (percent !== pct) run(() => setSaleAction(id, percent));
  };
  return (
    <div className="grid gap-1">
      <label className="flex items-center gap-1 font-bold">
        <input
          aria-label="Sale percent"
          type="number"
          min={0}
          max={90}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => event.key === "Enter" && (event.currentTarget as HTMLInputElement).blur()}
          className={`w-16 rounded-xl border-[3px] px-2 py-1 font-bold tabular-nums outline-none focus:border-pink ${pct > 0 ? "border-ink bg-sun" : "border-line bg-paper"} ${pending ? "opacity-50" : ""}`}
        />
        % off
      </label>
      {error && <span className="text-xs font-bold text-pink">{error}</span>}
    </div>
  );
}

export function VisibleSwitch({ table, id, visible }: { table: Table; id: string; visible: boolean }) {
  const { pending, error, run } = useSave();
  return (
    <div className="grid gap-1">
      <Toggle label={visible ? "On site" : "Hidden"} checked={visible} disabled={pending} onChange={(nextVisible) => run(() => setVisibleAction(table, id, nextVisible))} />
      {error && <span className="text-xs font-bold text-pink">{error}</span>}
    </div>
  );
}

export function MoveButtons({ table, id, first, last }: { table: Table; id: string; first: boolean; last: boolean }) {
  const { pending, run } = useSave();
  const cls = "grid size-8 place-items-center rounded-full border-2 border-ink bg-paper font-extrabold hover:bg-sun disabled:opacity-25";
  return (
    <div className="flex gap-1" aria-label="Reorder">
      <button type="button" className={cls} disabled={first || pending} onClick={() => run(() => moveAction(table, id, -1))} aria-label="Move up">
        ↑
      </button>
      <button type="button" className={cls} disabled={last || pending} onClick={() => run(() => moveAction(table, id, 1))} aria-label="Move down">
        ↓
      </button>
    </div>
  );
}
