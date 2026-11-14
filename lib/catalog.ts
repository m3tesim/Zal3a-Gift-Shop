// Catalog types + pure helpers shared by the storefront, admin and server.
import type { Locale } from "./i18n";

export type L = Record<Locale, string>;
export type Tint = "pink" | "sun" | "sky" | "lime" | "lilac" | "orange";
/** Tag ids are editable in /admin/tags, so they're plain strings. */
export type Vibe = string;
export type Who = string;
export type PlantIconKey = "cactus" | "echeveria" | "haworthia" | "leafy" | "flower" | "pot";

export const TINTS: Tint[] = ["pink", "sun", "sky", "lime", "lilac", "orange"];
export const PLANT_ICONS: PlantIconKey[] = ["cactus", "echeveria", "haworthia", "leafy", "flower", "pot"];

export type Plant = {
  id: string;
  name: L;
  latin: L;
  blurb: L;
  price: number; // added to the pot price, per pot it lives in
  sun: string | null; // care option id
  water: string | null; // care option id
  tint: Tint;
  icon: PlantIconKey;
  image: string | null;
  stock: number | null; // null = not tracked
  visible: boolean;
  potOnly: boolean; // the special "no plant" option
  recipients: Who[];
  vibes: Vibe[];
  sort: number;
};

/** "Best for" (who) and vibe tags used by the gift matchmaker. */
export type TagKind = "who" | "vibe";
export type Tag = { kind: TagKind; id: string; label: L; emoji: string; line: L; visible: boolean; sort: number };

/** Sun / watering choices shown on plant care cards. level = how many dots (0–3). */
export type CareKind = "sun" | "water";
export type CareOption = { kind: CareKind; id: string; label: L; level: number; sort: number };

export type Rating = { avg: number; count: number };

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

export type Catalog = {
  products: Product[];
  plants: Plant[];
  tags: Tag[];
  care: CareOption[];
  ratings: Record<string, Rating>;
};

export const tagsOf = (catalog: Catalog, kind: TagKind) => catalog.tags.filter((tag) => tag.kind === kind);
export const careOf = (catalog: Catalog, kind: CareKind, id: string | null) => catalog.care.find((option) => option.kind === kind && option.id === id) ?? null;

export const MAX_QTY = 9;

export const comboKey = (plants: string[]) => plants.join("+");
export const soldOut = (item: { stock: number | null }) => item.stock !== null && item.stock <= 0;
export const applySale = (price: number, pct: number) => (pct > 0 ? Math.round((price * (100 - pct)) / 100) : price);

export function plantOf(catalog: Catalog, id: string) {
  return catalog.plants.find((plant) => plant.id === id);
}
export function productOf(catalog: Catalog, id: string) {
  return catalog.products.find((product) => product.id === id);
}

/** Price before and after the product's sale, for a given plant per slot. */
export function linePrice(catalog: Catalog, product: Product, plants: string[]) {
  const full = product.price + plants.reduce((total, id) => total + (plantOf(catalog, id)?.price ?? 0), 0);
  return { full, unit: applySale(full, product.salePercent) };
}

/** Plants customers can pick right now (visible and in stock). */
export const pickablePlants = (catalog: Catalog) => catalog.plants.filter((plant) => plant.visible && !soldOut(plant));

/** The product's default plants, swapping out any that are hidden or sold out. */
export function defaultPlantsFor(catalog: Catalog, product: Product) {
  const ok = pickablePlants(catalog);
  const fallback = ok.find((plant) => !plant.potOnly) ?? ok[0];
  return product.slots.map((_slot, slotIndex) => {
    const id = product.defaultPlants[slotIndex];
    return ok.some((plant) => plant.id === id) ? id : (fallback?.id ?? id);
  });
}

export const variantImage = (product: Product, plants: string[]) => product.variants[comboKey(plants)] ?? null;

/** Most a customer can add: limited by pot stock and by each plant's stock. */
export function maxQty(catalog: Catalog, product: Product, plants: string[]) {
  let max = MAX_QTY;
  if (product.stock !== null) max = Math.min(max, product.stock);
  const counts = new Map<string, number>();
  plants.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  counts.forEach((count, id) => {
    const plant = plantOf(catalog, id);
    if (plant?.stock != null) max = Math.min(max, Math.floor(plant.stock / count));
  });
  return Math.max(0, max);
}

/** "Mini cactus", "2 × Mini cactus" or "Mini cactus + Echeveria rosette" */
export function plantsSummary(catalog: Catalog, plants: string[], locale: Locale) {
  const name = (id: string) => plantOf(catalog, id)?.name[locale] ?? id;
  if (plants.length > 1 && plants.every((plantId) => plantId === plants[0])) return `${plants.length} × ${name(plants[0])}`;
  return plants.map(name).join(" + ");
}

/** Gift matchmaker: both answers count; vibe weighs a little more than recipient. */
export function rankMatches(catalog: Catalog, who: Who, vibe: Vibe) {
  const score = (product: Product) => (product.vibes.includes(vibe) ? 3 : 0) + (product.recipients.includes(who) ? 2 : 0);
  return catalog.products
    .filter((product) => product.visible && !soldOut(product))
    .map((product) => ({ product, score: score(product) }))
    .sort((first, second) => second.score - first.score || first.product.sort - second.product.sort)
    .map((match) => match.product);
}

/** Pick the plant that best suits the person and vibe (falls back to the pot's defaults). */
export function suggestPlants(catalog: Catalog, product: Product, who: Who, vibe?: Vibe) {
  const score = (plant: Plant) => (plant.recipients.includes(who) ? 2 : 0) + (vibe && plant.vibes.includes(vibe) ? 1 : 0);
  const best = pickablePlants(catalog)
    .filter((plant) => !plant.potOnly && score(plant) > 0)
    .sort((first, second) => score(second) - score(first) || first.sort - second.sort)[0];
  return best ? product.slots.map(() => best.id) : defaultPlantsFor(catalog, product);
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

export function cartSubtotal(catalog: Catalog, lines: { id: string; plants: string[]; qty: number }[]) {
  return lines.reduce((total, line) => {
    const product = productOf(catalog, line.id);
    return product ? total + linePrice(catalog, product, line.plants).unit * line.qty : total;
  }, 0);
}
