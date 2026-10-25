import { getDb, json, tx } from "./db";
import type { Catalog, L, Plant, Product } from "@/lib/catalog";

type Row = Record<string, unknown>;
const EMPTY_L: L = { en: "", ar: "" };

function toPlant(r: Row): Plant {
  return {
    id: r.id as string,
    name: json(r.name, EMPTY_L),
    latin: json(r.latin, EMPTY_L),
    blurb: json(r.blurb, EMPTY_L),
    price: r.price as number,
    sun: r.sun as number,
    water: r.water as number,
    tint: r.tint as Plant["tint"],
    icon: r.icon as Plant["icon"],
    image: (r.image as string) ?? null,
    stock: (r.stock as number) ?? null,
    visible: !!r.visible,
    potOnly: !!r.pot_only,
    recipients: json(r.recipients, []),
    sort: r.sort as number,
  };
}

function toProduct(r: Row, variants: Record<string, string>): Product {
  return {
    id: r.id as string,
    name: json(r.name, EMPTY_L),
    kind: json(r.kind, EMPTY_L),
    desc: json(r.description, EMPTY_L),
    badge: json(r.badge, EMPTY_L),
    styled: json(r.styled, EMPTY_L),
    price: r.price as number,
    salePercent: r.sale_percent as number,
    stock: (r.stock as number) ?? null,
    slots: json(r.slots, [EMPTY_L]),
    defaultPlants: json(r.default_plants, []),
    tint: r.tint as Product["tint"],
    image: r.image as string,
    pos: r.pos as string,
    vibes: json(r.vibes, []),
    recipients: json(r.recipients, []),
    specs: json(r.specs, []),
    variants,
    visible: !!r.visible,
    featured: !!r.featured,
    sort: r.sort as number,
  };
}

/** Whole catalog. The storefront gets visible items only; admin gets everything. */
export function readCatalog({ includeHidden = false } = {}): Catalog {
  const db = getDb();
  const where = includeHidden ? "" : "WHERE visible = 1";
  const variants: Record<string, Record<string, string>> = {};
  for (const v of db.prepare("SELECT product_id, combo, image FROM variants").all() as Row[]) {
    (variants[v.product_id as string] ??= {})[v.combo as string] = v.image as string;
  }
  return {
    products: (db.prepare(`SELECT * FROM products ${where} ORDER BY sort, id`).all() as Row[]).map((r) =>
      toProduct(r, variants[r.id as string] ?? {}),
    ),
    plants: (db.prepare(`SELECT * FROM plants ${where} ORDER BY sort, id`).all() as Row[]).map(toPlant),
  };
}

export function getProduct(id: string) {
  const r = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as Row | undefined;
  if (!r) return null;
  const variants: Record<string, string> = {};
  for (const v of getDb().prepare("SELECT combo, image FROM variants WHERE product_id = ?").all(id) as Row[]) {
    variants[v.combo as string] = v.image as string;
  }
  return toProduct(r, variants);
}

export function getPlant(id: string) {
  const r = getDb().prepare("SELECT * FROM plants WHERE id = ?").get(id) as Row | undefined;
  return r ? toPlant(r) : null;
}

const nextSort = (table: "products" | "plants") =>
  ((getDb().prepare(`SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM ${table}`).get() as { n: number }).n);

export function savePlant(p: Plant, isNew: boolean) {
  const db = getDb();
  const values = {
    $id: p.id,
    $name: JSON.stringify(p.name),
    $latin: JSON.stringify(p.latin),
    $blurb: JSON.stringify(p.blurb),
    $price: p.price,
    $sun: p.sun,
    $water: p.water,
    $tint: p.tint,
    $icon: p.icon,
    $image: p.image,
    $stock: p.stock,
    $visible: p.visible ? 1 : 0,
    $pot_only: p.potOnly ? 1 : 0,
    $recipients: JSON.stringify(p.recipients),
  };
  if (isNew) {
    db.prepare(
      `INSERT INTO plants (id, name, latin, blurb, price, sun, water, tint, icon, image, stock, visible, pot_only, recipients, sort)
       VALUES ($id, $name, $latin, $blurb, $price, $sun, $water, $tint, $icon, $image, $stock, $visible, $pot_only, $recipients, $sort)`,
    ).run({ ...values, $sort: nextSort("plants") });
  } else {
    db.prepare(
      `UPDATE plants SET name=$name, latin=$latin, blurb=$blurb, price=$price, sun=$sun, water=$water, tint=$tint, icon=$icon,
       image=$image, stock=$stock, visible=$visible, pot_only=$pot_only, recipients=$recipients, updated_at=datetime('now') WHERE id=$id`,
    ).run(values);
  }
}

export function saveProduct(p: Omit<Product, "variants" | "sort">, isNew: boolean) {
  const values = {
    $id: p.id,
    $name: JSON.stringify(p.name),
    $kind: JSON.stringify(p.kind),
    $description: JSON.stringify(p.desc),
    $badge: JSON.stringify(p.badge),
    $styled: JSON.stringify(p.styled),
    $price: p.price,
    $sale_percent: p.salePercent,
    $stock: p.stock,
    $slots: JSON.stringify(p.slots),
    $default_plants: JSON.stringify(p.defaultPlants),
    $tint: p.tint,
    $image: p.image,
    $pos: p.pos,
    $vibes: JSON.stringify(p.vibes),
    $recipients: JSON.stringify(p.recipients),
    $specs: JSON.stringify(p.specs),
    $visible: p.visible ? 1 : 0,
    $featured: p.featured ? 1 : 0,
  };
  tx(() => {
    const db = getDb();
    if (p.featured) db.prepare("UPDATE products SET featured = 0 WHERE id != ?").run(p.id);
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
  const p = getProduct(id);
  if (!p) return [];
  getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
  return [p.image, ...Object.values(p.variants)];
}

/** Plants used as a pot's default can't be deleted. Returns the blocking pot names, or the image URLs to delete on success. */
export function deletePlant(id: string): { blockedBy: string[] } | { images: string[] } {
  const db = getDb();
  const users = (db.prepare("SELECT name, default_plants FROM products").all() as Row[])
    .filter((r) => json<string[]>(r.default_plants, []).includes(id))
    .map((r) => json(r.name, EMPTY_L).en);
  if (users.length) return { blockedBy: users };
  const plant = getPlant(id);
  // Combo images that include this plant are no longer reachable.
  const orphans = (db.prepare("SELECT product_id, combo, image FROM variants").all() as Row[]).filter((v) =>
    (v.combo as string).split("+").includes(id),
  );
  tx(() => {
    for (const v of orphans) db.prepare("DELETE FROM variants WHERE product_id = ? AND combo = ?").run(v.product_id as string, v.combo as string);
    db.prepare("DELETE FROM plants WHERE id = ?").run(id);
  });
  return { images: [...(plant?.image ? [plant.image] : []), ...orphans.map((v) => v.image as string)] };
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
  tx(() => {
    const db = getDb();
    const rows = db.prepare(`SELECT id FROM ${table} ORDER BY sort, id`).all() as { id: string }[];
    const i = rows.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    const upd = db.prepare(`UPDATE ${table} SET sort = ? WHERE id = ?`);
    rows.forEach((r, k) => upd.run(k + 1, r.id));
  });
}
