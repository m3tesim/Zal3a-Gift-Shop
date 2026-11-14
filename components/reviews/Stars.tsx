import { StarIcon } from "../icons";

/** 5 stars, filled to `value` (supports halves, e.g. 4.5). */
export function Stars({ value, size = 18, label }: { value: number; size?: number; label?: string }) {
  return (
    <span className="relative inline-flex shrink-0" role="img" aria-label={label ?? `${value} / 5`}>
      <span className="flex text-line">
        {[0, 1, 2, 3, 4].map((index) => (
          <StarIcon key={index} width={size} height={size} />
        ))}
      </span>
      <span className="absolute inset-y-0 start-0 flex overflow-hidden text-sun" style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}>
        {[0, 1, 2, 3, 4].map((index) => (
          <StarIcon key={index} width={size} height={size} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}
