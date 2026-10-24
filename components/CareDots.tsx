export function CareDots({ kind, level, label, hint }: { kind: "sun" | "water"; level: number; label: string; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-extrabold tracking-wider text-ink-soft uppercase rtl:tracking-normal">{label}</span>
      <div className="flex gap-1.5" role="img" aria-label={`${label}: ${level}/3`}>
        {[1, 2, 3].map((i) => (
          <i
            key={i}
            className={`block size-5 border-2 ${
              kind === "water" ? "-rotate-45 scale-90 rounded-[50%_0_50%_50%]" : "rounded-full"
            } ${i <= level ? (kind === "sun" ? "border-ink bg-sun" : "border-ink bg-sky") : "border-ink/25 bg-paper"}`}
          />
        ))}
      </div>
      {hint && <em className="text-sm text-ink-soft not-italic">{hint}</em>}
    </div>
  );
}
