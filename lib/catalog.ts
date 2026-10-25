// Catalog types + pure helpers shared by the storefront, admin and server.
import type { Locale } from "./i18n";

export type L = Record<Locale, string>;
export type Tint = "pink" | "sun" | "sky" | "lime" | "lilac" | "orange";
export type Vibe = "giggly" | "cozy" | "cute" | "quirky";
export type Who = "bestie" | "mom" | "coworker" | "crush" | "kid" | "me";
export type PlantIconKey = "cactus" | "echeveria" | "haworthia" | "leafy" | "flower" | "pot";

export const TINTS: Tint[] = ["pink", "sun", "sky", "lime", "lilac", "orange"];
export const VIBES: Vibe[] = ["giggly", "cozy", "cute", "quirky"];
export const WHOS: Who[] = ["bestie", "mom", "coworker", "crush", "kid", "me"];
export const PLANT_ICONS: PlantIconKey[] = ["cactus", "echeveria", "haworthia", "leafy", "flower", "pot"];

export type Plant = {
  id: string;
  name: L;
  latin: L;
  blurb: L;
  price: number; // added to the pot price, per pot it lives in
  sun: number; // 0–3
  water: number; // 0–3
  tint: Tint;
  icon: PlantIconKey;
  image: string | null;
  stock: number | null; // null = not tracked
  visible: boolean;
  potOnly: boolean; // the special "no plant" option
  recipients: Who[];
  sort: number;
};

export type Spec = { label: L; value: L };

export type Product = {
  id: string;
  name: L;
  kind: L;
  desc: L;
  badge: L;
  styled: L; // what the main photo is styled with
  price: number; // pots only, for the whole set
  salePercent: number;
  stock: number | null;
  slots: L[]; // one label per pot in the set
  defaultPlants: string[]; // one plant id per slot
  tint: Tint;
  image: string;
  pos: string; // CSS object-position for the main photo
  vibes: Vibe[];
  recipients: Who[];
  specs: Spec[];
  variants: Record<string, string>; // comboKey -> image url
  visible: boolean;
  featured: boolean;
  sort: number;
};

export type Catalog = { products: Product[]; plants: Plant[] };

export const MAX_QTY = 9;

export const comboKey = (plants: string[]) => plants.join("+");
export const soldOut = (x: { stock: number | null }) => x.stock !== null && x.stock <= 0;
export const applySale = (n: number, pct: number) => (pct > 0 ? Math.round((n * (100 - pct)) / 100) : n);

export function plantOf(c: Catalog, id: string) {
  return c.plants.find((p) => p.id === id);
}
export function productOf(c: Catalog, id: string) {
  return c.products.find((p) => p.id === id);
}

/** Price before and after the product's sale, for a given plant per slot. */
export function linePrice(c: Catalog, product: Product, plants: string[]) {
  const full = product.price + plants.reduce((n, id) => n + (plantOf(c, id)?.price ?? 0), 0);
  return { full, unit: applySale(full, product.salePercent) };
}

/** Plants customers can pick right now (visible and in stock). */
export const pickablePlants = (c: Catalog) => c.plants.filter((p) => p.visible && !soldOut(p));

/** The product's default plants, swapping out any that are hidden or sold out. */
export function defaultPlantsFor(c: Catalog, product: Product) {
  const ok = pickablePlants(c);
  const fallback = ok.find((p) => !p.potOnly) ?? ok[0];
  return product.slots.map((_, i) => {
    const id = product.defaultPlants[i];
    return ok.some((p) => p.id === id) ? id : (fallback?.id ?? id);
  });
}

export const variantImage = (product: Product, plants: string[]) => product.variants[comboKey(plants)] ?? null;

/** Most a customer can add: limited by pot stock and by each plant's stock. */
export function maxQty(c: Catalog, product: Product, plants: string[]) {
  let max = MAX_QTY;
  if (product.stock !== null) max = Math.min(max, product.stock);
  const counts = new Map<string, number>();
  plants.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  counts.forEach((n, id) => {
    const p = plantOf(c, id);
    if (p?.stock != null) max = Math.min(max, Math.floor(p.stock / n));
  });
  return Math.max(0, max);
}

/** "Mini cactus", "2 × Mini cactus" or "Mini cactus + Echeveria rosette" */
export function plantsSummary(c: Catalog, plants: string[], locale: Locale) {
  const name = (id: string) => plantOf(c, id)?.name[locale] ?? id;
  if (plants.length > 1 && plants.every((p) => p === plants[0])) return `${plants.length} × ${name(plants[0])}`;
  return plants.map(name).join(" + ");
}

/** Gift matchmaker: both answers count; vibe weighs a little more than recipient. */
export function rankMatches(c: Catalog, who: Who, vibe: Vibe) {
  const score = (p: Product) => (p.vibes.includes(vibe) ? 3 : 0) + (p.recipients.includes(who) ? 2 : 0);
  return c.products
    .filter((p) => p.visible && !soldOut(p))
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || a.p.sort - b.p.sort)
    .map((x) => x.p);
}

/** Pick a plant suited to the recipient (falls back to the pot's defaults). */
export function suggestPlants(c: Catalog, product: Product, who: Who) {
  const fit = pickablePlants(c).find((p) => !p.potOnly && p.recipients.includes(who));
  return fit ? product.slots.map(() => fit.id) : defaultPlantsFor(c, product);
}

// Full Tailwind class strings so the compiler can see them.
export const TINT: Record<Tint, { soft: string; solid: string; text: string }> = {
  pink: { soft: "bg-pink-soft", solid: "bg-pink", text: "text-white" },
  sun: { soft: "bg-sun-soft", solid: "bg-sun", text: "text-ink" },
  sky: { soft: "bg-sky-soft", solid: "bg-sky", text: "text-ink" },
  lime: { soft: "bg-lime-soft", solid: "bg-lime", text: "text-ink" },
  lilac: { soft: "bg-lilac-soft", solid: "bg-lilac", text: "text-white" },
  orange: { soft: "bg-orange-soft", solid: "bg-orange", text: "text-ink" },
};

export function cartSubtotal(c: Catalog, lines: { id: string; plants: string[]; qty: number }[]) {
  return lines.reduce((n, l) => {
    const p = productOf(c, l.id);
    return p ? n + linePrice(c, p, l.plants).unit * l.qty : n;
  }, 0);
}
