"use client";

import { MinusIcon, PlusIcon } from "./icons";
import { MAX_QTY } from "@/lib/store";

export function QtyStepper({
  value,
  onChange,
  min = 1,
  labels,
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  labels: { group: string; fewer: string; more: string };
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "size-8" : "size-12";
  return (
    <div
      role="group"
      aria-label={labels.group}
      className="inline-flex items-center rounded-full border-[3px] border-ink bg-paper"
    >
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full transition-colors hover:bg-pink-soft disabled:opacity-30`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={labels.fewer}
      >
        <MinusIcon width={size === "sm" ? 14 : 18} height={size === "sm" ? 14 : 18} />
      </button>
      <output aria-live="polite" className={`text-center font-extrabold tabular-nums ${size === "sm" ? "min-w-5" : "min-w-7 text-lg"}`}>
        {value}
      </output>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full transition-colors hover:bg-lime-soft disabled:opacity-30`}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY}
        aria-label={labels.more}
      >
        <PlusIcon width={size === "sm" ? 14 : 18} height={size === "sm" ? 14 : 18} />
      </button>
    </div>
  );
}
