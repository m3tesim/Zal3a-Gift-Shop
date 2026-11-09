import type { PlantIconKey } from "@/lib/catalog";
import { PLANT_ART, type Tok } from "@/lib/plant-art";
import type { SocialId } from "@/lib/site";

type P = React.SVGProps<SVGSVGElement>;

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const ArrowIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const BackIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...stroke} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke} strokeWidth={3} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const MinusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke} strokeWidth={3} {...p}>
    <path d="M5 12h14" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...stroke} strokeWidth={3} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const BagIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...stroke} {...p}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </svg>
);
export const UserIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...stroke} {...p}>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
  </svg>
);
export const StarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
    <path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4L2.7 9.5l6.5-.7z" fill="currentColor" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
export const ShuffleIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...stroke} {...p}>
    <path d="M3 7h3c4 0 6 10 10 10h5M18 14l3 3-3 3M3 17h3c1.5 0 2.7-1.4 3.7-3M14.3 10c1-1.6 2.2-3 3.7-3h3M18 4l3 3-3 3" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...stroke} strokeWidth={3.5} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const GiftIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...stroke} {...p}>
    <rect x="3.5" y="8" width="17" height="5" rx="1" />
    <path d="M5 13v7h14v-7M12 8v12M12 8c-1.5-3-5-4-5.5-2S9 8 12 8zM12 8c1.5-3 5-4 5.5-2S15 8 12 8z" />
  </svg>
);
export const TruckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...stroke} {...p}>
    <path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5v3h-7" />
    <circle cx="6.5" cy="17.5" r="2" fill="var(--color-paper)" />
    <circle cx="17" cy="17.5" r="2" fill="var(--color-paper)" />
  </svg>
);
export const StarShape = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden="true" {...p}>
    <path
      d="M20 3l4.6 10.6L36 15l-8.6 7.6L30 34l-10-6-10 6 2.6-11.4L4 15l11.4-1.4z"
      fill="currentColor"
      stroke="var(--color-ink)"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
);
export const FlowerShape = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden="true" {...p}>
    <g fill="currentColor" stroke="var(--color-ink)" strokeWidth="2.5">
      <circle cx="20" cy="9" r="7" />
      <circle cx="31" cy="20" r="7" />
      <circle cx="20" cy="31" r="7" />
      <circle cx="9" cy="20" r="7" />
    </g>
    <circle cx="20" cy="20" r="6" fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="2.5" />
  </svg>
);

/* Little cartoon plants-in-pots, drawn from shared data in lib/plant-art.ts */
export function PlantIcon({ icon, ...p }: { icon: PlantIconKey } & P) {
  const color = (t: Tok | "none") => (t === "none" ? "none" : `var(--color-${t})`);
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...p}>
      {PLANT_ART[icon].map((s, i) => {
        const attrs = {
          fill: color(s.fill),
          stroke: s.stroke === null ? undefined : color(s.stroke ?? "ink"),
          strokeWidth: s.stroke === null ? undefined : (s.width ?? 2.5),
          strokeLinejoin: "round" as const,
          strokeLinecap: s.cap ? ("round" as const) : undefined,
          opacity: s.opacity,
        };
        return "path" in s ? <path key={i} d={s.path} {...attrs} /> : <circle key={i} cx={s.circle[0]} cy={s.circle[1]} r={s.circle[2]} {...attrs} />;
      })}
    </svg>
  );
}

export function SocialIcon({ id, ...p }: { id: SocialId } & P) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...p}>
      {id === "instagram" && (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none" />
        </g>
      )}
      {id === "tiktok" && (
        <path
          d="M16.6 3c.4 2.4 1.9 3.9 4.4 4.1v3.1a7.6 7.6 0 0 1-4.3-1.3v6.3a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3.2a2.7 2.7 0 1 0 1.8 2.5V3z"
          fill="currentColor"
        />
      )}
      {id === "facebook" && (
        <path
          d="M13.5 21v-7.2h2.4l.4-2.9h-2.8V9.1c0-.8.3-1.4 1.4-1.4h1.5V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.1v2.9h2.4V21z"
          fill="currentColor"
        />
      )}
      {id === "whatsapp" && (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M3.5 20.5l1.2-4.1A8.6 8.6 0 1 1 8 19.4z" />
          <path d="M9 8.5c-.3 2.8 3 6.6 6.4 6.6l.9-1.5-1.9-1-.9.9c-1-.4-2.2-1.6-2.6-2.6l.9-.9-1-1.9z" fill="currentColor" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
