import { useI18n } from "../I18nProvider";

export function Field({
  id,
  label,
  error,
  hint,
  optional,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className={`grid content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className="flex items-baseline gap-2 font-bold">
        {label}
        {optional && <span className="text-xs font-semibold text-ink-soft">({t.checkout.optional})</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-sm font-bold text-pink">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="text-sm text-ink-soft">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/* A big tappable radio card, used for gift/wrap/payment choices */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  sub,
  tag,
  icon,
  onClass = "bg-sun-soft",
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  sub?: string;
  tag?: string;
  icon?: React.ReactNode;
  onClass?: string;
}) {
  return (
    <label
      className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border-[3px] p-3.5 transition-all duration-200 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-pink ${checked ? `border-ink ${onClass} shadow-pop-sm` : "border-line bg-paper hover:border-ink"}`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={`grid size-6 shrink-0 place-items-center rounded-full border-[3px] border-ink ${checked ? "bg-pink" : "bg-paper"}`}
      >
        {checked && <span className="size-2 rounded-full bg-paper" />}
      </span>
      {icon}
      <span className="grid min-w-0 flex-1">
        <b className="leading-tight">{title}</b>
        {sub && <small className="text-ink-soft">{sub}</small>}
      </span>
      {tag && <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-extrabold">{tag}</span>}
    </label>
  );
}
