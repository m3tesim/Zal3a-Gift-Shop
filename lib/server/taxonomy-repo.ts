// Editable lists: "best for" + vibe tags, and sun / watering care options.
import { getDb, json, transaction } from "./db";
import type { CareKind, CareOption, L, Tag, TagKind } from "@/lib/catalog";

export function saveTag(tag: Omit<Tag, "sort">, isNew: boolean) {
  const db = getDb();
  const label = JSON.stringify(tag.label);
  const line = JSON.stringify(tag.line);
  if (isNew) {
    const sort = (db.prepare("SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM tags WHERE kind = ?").get(tag.kind) as { n: number }).n;
    db.prepare("INSERT INTO tags (kind, id, label, emoji, line, visible, sort) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      tag.kind, tag.id, label, tag.emoji, line, tag.visible ? 1 : 0, sort,
    );
  } else {
    db.prepare("UPDATE tags SET label = ?, emoji = ?, line = ?, visible = ? WHERE kind = ? AND id = ?").run(
      label, tag.emoji, line, tag.visible ? 1 : 0, tag.kind, tag.id,
    );
  }
}

export const tagExists = (kind: TagKind, id: string) =>
  !!getDb().prepare("SELECT 1 FROM tags WHERE kind = ? AND id = ?").get(kind, id);

/** Deletes the tag and removes it from every pot and plant that used it. */
export function deleteTag(kind: TagKind, id: string) {
  const column = kind === "who" ? "recipients" : "vibes";
  transaction(() => {
    const db = getDb();
    for (const table of ["products", "plants"] as const) {
      const rows = db.prepare(`SELECT id, ${column} AS list FROM ${table}`).all() as { id: string; list: string }[];
      const upd = db.prepare(`UPDATE ${table} SET ${column} = ? WHERE id = ?`);
      for (const row of rows) {
        const list = json<string[]>(row.list, []);
        if (list.includes(id)) upd.run(JSON.stringify(list.filter((tagId) => tagId !== id)), row.id);
      }
    }
    db.prepare("DELETE FROM tags WHERE kind = ? AND id = ?").run(kind, id);
  });
}

export function saveCare(option: Omit<CareOption, "sort">, isNew: boolean) {
  const db = getDb();
  if (isNew) {
    const sort = (db.prepare("SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM care_options WHERE kind = ?").get(option.kind) as { n: number }).n;
    db.prepare("INSERT INTO care_options (kind, id, label, level, sort) VALUES (?, ?, ?, ?, ?)").run(option.kind, option.id, JSON.stringify(option.label), option.level, sort);
  } else {
    db.prepare("UPDATE care_options SET label = ?, level = ? WHERE kind = ? AND id = ?").run(JSON.stringify(option.label), option.level, option.kind, option.id);
  }
}

export const careExists = (kind: CareKind, id: string) =>
  !!getDb().prepare("SELECT 1 FROM care_options WHERE kind = ? AND id = ?").get(kind, id);

/** Options still used by a plant can't be deleted. Returns the plant names using it. */
export function deleteCare(kind: CareKind, id: string) {
  const db = getDb();
  const column = kind === "sun" ? "sun_option" : "water_option";
  const users = (db.prepare(`SELECT name FROM plants WHERE ${column} = ?`).all(id) as { name: string }[]).map((row) => json<L>(row.name, { en: "", ar: "" }).en);
  if (users.length) return users;
  db.prepare("DELETE FROM care_options WHERE kind = ? AND id = ?").run(kind, id);
  return [];
}

/** Swap with the neighbour above (-1) or below (+1) within the same list. */
export function moveListItem(table: "tags" | "care_options", kind: string, id: string, dir: -1 | 1) {
  transaction(() => {
    const db = getDb();
    const rows = db.prepare(`SELECT id FROM ${table} WHERE kind = ? ORDER BY sort, id`).all(kind) as { id: string }[];
    const currentIndex = rows.findIndex((row) => row.id === id);
    const targetIndex = currentIndex + dir;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= rows.length) return;
    [rows[currentIndex], rows[targetIndex]] = [rows[targetIndex], rows[currentIndex]];
    const upd = db.prepare(`UPDATE ${table} SET sort = ? WHERE kind = ? AND id = ?`);
    rows.forEach((row, position) => upd.run(position + 1, kind, row.id));
  });
}
