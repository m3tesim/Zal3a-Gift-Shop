import { getDb, json, transaction } from "./db";
import type { CareOption, Catalog, L, Plant, Product, Rating, Tag } from "@/lib/catalog";

type Row = Record<string, unknown>;
const EMPTY_L: L = { en: "", ar: "" };

function toPlant(row: Row): Plant {
  return {
    id: row.id as string,
    name: json(row.name, EMPTY_L),
    latin: json(row.latin, EMPTY_L),
    blurb: json(row.blurb, EMPTY_L),
    price: row.price as number,
    sun: (row.sun_option as string) ?? null,
    water: (row.water_option as string) ?? null,
    tint: row.tint as Plant["tint"],
    icon: row.icon as Plant["icon"],
    image: (row.image as string) ?? null,
    stock: (row.stock as number) ?? null,
    visible: !!row.visible,
    potOnly: !!row.pot_only,
    recipients: json(row.recipients, []),
    vibes: json(row.vibes, []),
    sort: row.sort as number,
  };
}

const toTag = (row: Row): Tag => ({
  kind: row.kind as Tag["kind"],
  id: row.id as string,
  label: json(row.label, EMPTY_L),
  emoji: row.emoji as string,
  line: json(row.line, EMPTY_L),
  visible: !!row.visible,
  sort: row.sort as number,
});

const toCare = (row: Row): CareOption => ({
  kind: row.kind as CareOption["kind"],
  id: row.id as string,
  label: json(row.label, EMPTY_L),
  level: row.level as number,
  sort: row.sort as number,
});

export const readTags = () => (getDb().prepare("SELECT * FROM tags ORDER BY kind, sort, id").all() as Row[]).map(toTag);
export const readCare = () => (getDb().prepare("SELECT * FROM care_options ORDER BY kind, sort, id").all() as Row[]).map(toCare);

/** Average rating + count of visible reviews, per product. */
export function readRatings(): Record<string, Rating> {
  const rows = getDb()
    .prepare("SELECT product_id AS id, AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE visible = 1 GROUP BY product_id")
    .all() as { id: string; avg: number; n: number }[];
  return Object.fromEntries(rows.map((row) => [row.id, { avg: Math.round(row.avg * 10) / 10, count: row.n }]));
}

function toProduct(row: Row, variants: Record<string, string>): Product {
  return {
    id: row.id as string,
    name: json(row.name, EMPTY_L),
    kind: json(row.kind, EMPTY_L),
    desc: json(row.description, EMPTY_L),
    badge: json(row.badge, EMPTY_L),
    styled: json(row.styled, EMPTY_L),
    price: row.price as number,
    salePercent: row.sale_percent as number,
    stock: (row.stock as number) ?? null,
    slots: json(row.slots, [EMPTY_L]),
    defaultPlants: json(row.default_plants, []),
    tint: row.tint as Product["tint"],
    image: row.image as string,
    pos: row.pos as string,
    vibes: json(row.vibes, []),
    recipients: json(row.recipients, []),
    specs: json(row.specs, []),
    variants,
    visible: !!row.visible,
    featured: !!row.featured,
    sort: row.sort as number,
  };
}

/** Whole catalog. The storefront gets visible items only; admin gets everything. */
export function readCatalog({ includeHidden = false } = {}): Catalog {
  const db = getDb();
  const where = includeHidden ? "" : "WHERE visible = 1";
  const variants: Record<string, Record<string, string>> = {};
  for (const variant of db.prepare("SELECT product_id, combo, image FROM variants").all() as Row[]) {
    (variants[variant.product_id as string] ??= {})[variant.combo as string] = variant.image as string;
  }
  return {
    products: (db.prepare(`SELECT * FROM products ${where} ORDER BY sort, id`).all() as Row[]).map((row) =>
      toProduct(row, variants[row.id as string] ?? {}),
    ),
    plants: (db.prepare(`SELECT * FROM plants ${where} ORDER BY sort, id`).all() as Row[]).map(toPlant),
    tags: readTags(),
    care: readCare(),
    ratings: readRatings(),
  };
}

export function getProduct(id: string) {
  const row = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as Row | undefined;
  if (!row) return null;
  const variants: Record<string, string> = {};
  for (const variant of getDb().prepare("SELECT combo, image FROM variants WHERE product_id = ?").all(id) as Row[]) {
    variants[variant.combo as string] = variant.image as string;
  }
  return toProduct(row, variants);
}

export function getPlant(id: string) {
  const row = getDb().prepare("SELECT * FROM plants WHERE id = ?").get(id) as Row | undefined;
  return row ? toPlant(row) : null;
}

const nextSort = (table: "products" | "plants") =>
  ((getDb().prepare(`SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM ${table}`).get() as { n: number }).n);

export function savePlant(plant: Plant, isNew: boolean) {
  const db = getDb();
  const values = {
    $id: plant.id,
    $name: JSON.stringify(plant.name),
    $latin: JSON.stringify(plant.latin),
    $blurb: JSON.stringify(plant.blurb),
    $price: plant.price,
    $sun: plant.sun,
    $water: plant.water,
    $vibes: JSON.stringify(plant.vibes),
    $tint: plant.tint,
    $icon: plant.icon,
    $image: plant.image,
    $stock: plant.stock,
    $visible: plant.visible ? 1 : 0,
    $pot_only: plant.potOnly ? 1 : 0,
    $recipients: JSON.stringify(plant.recipients),
  };
  if (isNew) {
    db.prepare(
      `INSERT INTO plants (id, name, latin, blurb, price, sun_option, water_option, tint, icon, image, stock, visible, pot_only, recipients, vibes, sort)
       VALUES ($id, $name, $latin, $blurb, $price, $sun, $water, $tint, $icon, $image, $stock, $visible, $pot_only, $recipients, $vibes, $sort)`,
    ).run({ ...values, $sort: nextSort("plants") });
  } else {
    db.prepare(
      `UPDATE plants SET name=$name, latin=$latin, blurb=$blurb, price=$price, sun_option=$sun, water_option=$water, tint=$tint, icon=$icon,
       image=$image, stock=$stock, visible=$visible, pot_only=$pot_only, recipients=$recipients, vibes=$vibes, updated_at=datetime('now') WHERE id=$id`,
    ).run(values);
  }
}

export function saveProduct(product: Omit<Product, "variants" | "sort">, isNew: boolean) {
  const values = {
    $id: product.id,
    $name: JSON.stringify(product.name),
    $kind: JSON.stringify(product.kind),
    $description: JSON.stringify(product.desc),
    $badge: JSON.stringify(product.badge),
    $styled: JSON.stringify(product.styled),
    $price: product.price,
    $sale_percent: product.salePercent,
    $stock: product.stock,
    $slots: JSON.stringify(product.slots),
    $default_plants: JSON.stringify(product.defaultPlants),
    $tint: product.tint,
    $image: product.image,
    $pos: product.pos,
    $vibes: JSON.stringify(product.vibes),
    $recipients: JSON.stringify(product.recipients),
    $specs: JSON.stringify(product.specs),
    $visible: product.visible ? 1 : 0,
    $featured: product.featured ? 1 : 0,
  };
  transaction(() => {
    const db = getDb();
    if (product.featured) db.prepare("UPDATE products SET featured = 0 WHERE id != ?").run(product.id);
    if (isNew) {
      db.prepare(
        `INSERT INTO products (id, name, kind, description, badge, styled, price, sale_percent, stock, slots, default_plants, tint,
         image, pos, vibes, recipients, specs, visible, featured, sort)
         VALUES ($id, $name, $kind, $description, $badge, $styled, $price, $sale_percent, $stock, $slots, $default_plants, $tint,
         $image, $pos, $vibes, $recipients, $specs, $visible, $featured, $sort)`,
      ).run({ ...values, $sort: nextSort("products") });
    } else {
      db.prepare(
        `UPDATE products SET name=$name, kind=$kind, description=$description, badge=$badge, styled=$styled, price=$price,
         sale_percent=$sale_percent, stock=$stock, slots=$slots, default_plants=$default_plants, tint=$tint, image=$image, pos=$pos,
         vibes=$vibes, recipients=$recipients, specs=$specs, visible=$visible, featured=$featured, updated_at=datetime('now') WHERE id=$id`,
      ).run(values);
    }
  });
}

/** Removes the product and returns every image URL it owned, so the caller can delete the files. */
export function deleteProduct(id: string) {
  const product = getProduct(id);
  if (!product) return [];
  getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
  return [product.image, ...Object.values(product.variants)];
}

/** Plants used as a pot's default can't be deleted. Returns the blocking pot names, or the image URLs to delete on success. */
export function deletePlant(id: string): { blockedBy: string[] } | { images: string[] } {
  const db = getDb();
  const users = (db.prepare("SELECT name, default_plants FROM products").all() as Row[])
    .filter((row) => json<string[]>(row.default_plants, []).includes(id))
    .map((row) => json(row.name, EMPTY_L).en);
  if (users.length) return { blockedBy: users };
  const plant = getPlant(id);
  // Combo images that include this plant are no longer reachable.
  const orphans = (db.prepare("SELECT product_id, combo, image FROM variants").all() as Row[]).filter((variant) =>
    (variant.combo as string).split("+").includes(id),
  );
  transaction(() => {
    for (const variant of orphans) db.prepare("DELETE FROM variants WHERE product_id = ? AND combo = ?").run(variant.product_id as string, variant.combo as string);
    db.prepare("DELETE FROM plants WHERE id = ?").run(id);
  });
  return { images: [...(plant?.image ? [plant.image] : []), ...orphans.map((variant) => variant.image as string)] };
}

/** Sets (or clears, with null) the image for one plant combination. Returns the replaced URL. */
export function setVariant(productId: string, combo: string, image: string | null) {
  const db = getDb();
  const old = db.prepare("SELECT image FROM variants WHERE product_id = ? AND combo = ?").get(productId, combo) as Row | undefined;
  if (image) {
    db.prepare(
      "INSERT INTO variants (product_id, combo, image) VALUES (?, ?, ?) ON CONFLICT(product_id, combo) DO UPDATE SET image = excluded.image",
    ).run(productId, combo, image);
  } else {
    db.prepare("DELETE FROM variants WHERE product_id = ? AND combo = ?").run(productId, combo);
  }
  return (old?.image as string) ?? null;
}

type Table = "products" | "plants";

export function setStock(table: Table, id: string, stock: number | null) {
  getDb().prepare(`UPDATE ${table} SET stock = ?, updated_at = datetime('now') WHERE id = ?`).run(stock, id);
}

export function setVisible(table: Table, id: string, visible: boolean) {
  getDb().prepare(`UPDATE ${table} SET visible = ?, updated_at = datetime('now') WHERE id = ?`).run(visible ? 1 : 0, id);
}

export function setSale(id: string, pct: number) {
  getDb().prepare("UPDATE products SET sale_percent = ?, updated_at = datetime('now') WHERE id = ?").run(pct, id);
}

/** Swap sort position with the neighbour above (-1) or below (+1). */
export function move(table: Table, id: string, dir: -1 | 1) {
  transaction(() => {
    const db = getDb();
    const rows = db.prepare(`SELECT id FROM ${table} ORDER BY sort, id`).all() as { id: string }[];
    const currentIndex = rows.findIndex((row) => row.id === id);
    const targetIndex = currentIndex + dir;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= rows.length) return;
    [rows[currentIndex], rows[targetIndex]] = [rows[targetIndex], rows[currentIndex]];
    const upd = db.prepare(`UPDATE ${table} SET sort = ? WHERE id = ?`);
    rows.forEach((row, position) => upd.run(position + 1, row.id));
  });
}
