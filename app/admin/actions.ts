"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  endSession, loginBlocked, loginFailed, loginSucceeded, requireAdmin, sessionToken, startSession,
} from "@/lib/server/auth";
import {
  checkCredentials, checkPassword, countUsers, createUser, deleteOtherSessions, deleteUser, setPassword,
} from "@/lib/server/users";
import * as repo from "@/lib/server/catalog-repo";
import { setOrderStatus } from "@/lib/server/orders-repo";
import { deleteImage } from "@/lib/server/storage";
import { revalidateStore } from "@/lib/server/revalidate";
import { PLANT_ICONS, TINTS, VIBES, WHOS } from "@/lib/catalog";
import { ORDER_STATUSES } from "@/lib/orders";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const firstIssue = (e: z.ZodError) => {
  const i = e.issues[0];
  return `${i.path.length ? i.path.join(" › ") + ": " : ""}${i.message}`;
};

function refreshAll() {
  revalidateStore();
  revalidatePath("/admin", "layout");
}

/* ───────────── auth ───────────── */

export async function loginAction(_prev: { error?: string; email?: string } | undefined, fd: FormData) {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}|${email.toLowerCase()}`;

  if (loginBlocked(key)) return { email, error: "Too many attempts. Please wait 15 minutes and try again." };
  const user = await checkCredentials(email, password);
  if (!user) {
    loginFailed(key);
    return { email, error: "That email and password don't match." };
  }
  loginSucceeded(key);
  await startSession(user.id);
  redirect(/^\/admin(\/|$)/.test(next) ? next : "/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

/* ───────────── shared schemas ───────────── */

const L = (max = 300) => z.object({ en: z.string().trim().max(max), ar: z.string().trim().max(max) });
const LReq = (max = 300) =>
  L(max).refine((v) => v.en.length > 0 && v.ar.length > 0, { message: "fill in both English and Arabic" });
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,39}$/, "use 2–40 lowercase letters, numbers or dashes");
const image = z.string().regex(/^\/(uploads|img)\/[\w.-]+$/, "upload an image");
const stock = z.number().int().min(0).max(100000).nullable();

/* ───────────── pots ───────────── */

const PotSchema = z
  .object({
    isNew: z.boolean(),
    id: slug,
    name: LReq(80),
    kind: LReq(80),
    desc: LReq(1000),
    badge: L(40),
    styled: L(120),
    price: z.number().int().min(0).max(1_000_000),
    salePercent: z.number().int().min(0).max(90),
    stock,
    slots: z.array(LReq(60)).min(1).max(4),
    defaultPlants: z.array(z.string()).min(1).max(4),
    tint: z.enum(TINTS),
    image,
    pos: z.string().regex(/^\d{1,3}% \d{1,3}%$/),
    vibes: z.array(z.enum(VIBES)),
    recipients: z.array(z.enum(WHOS)),
    specs: z.array(z.object({ label: L(60), value: L(120) })).max(12),
    visible: z.boolean(),
    featured: z.boolean(),
  })
  .refine((p) => p.defaultPlants.length === p.slots.length, { message: "pick a default plant for every pot", path: ["defaultPlants"] });

export type PotInput = z.input<typeof PotSchema>;

export async function savePotAction(input: PotInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = PotSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { isNew, ...p } = parsed.data;

  const existing = repo.getProduct(p.id);
  if (isNew && existing) return fail(`A pot with the link name "${p.id}" already exists`);
  if (!isNew && !existing) return fail("This pot no longer exists");
  const plants = repo.readCatalog({ includeHidden: true }).plants;
  if (p.defaultPlants.some((id) => !plants.some((x) => x.id === id))) return fail("Pick a default plant for every pot");

  repo.saveProduct({ ...p, specs: p.specs.filter((s) => s.label.en || s.label.ar) }, isNew);

  if (existing) {
    // Clean up files that are no longer referenced.
    if (existing.image !== p.image) await deleteImage(existing.image);
    if (existing.slots.length !== p.slots.length) {
      for (const [combo, url] of Object.entries(existing.variants)) {
        repo.setVariant(p.id, combo, null);
        await deleteImage(url);
      }
    }
  }
  refreshAll();
  return { ok: true, id: p.id };
}

export async function deletePotAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  for (const url of repo.deleteProduct(id)) await deleteImage(url);
  refreshAll();
  return { ok: true };
}

export async function setVariantAction(productId: string, combo: string, url: string | null): Promise<ActionResult> {
  await requireAdmin();
  if (url !== null && !image.safeParse(url).success) return fail("Bad image");
  if (!repo.getProduct(productId)) return fail("This pot no longer exists");
  const old = repo.setVariant(productId, combo, url);
  if (old && old !== url) await deleteImage(old);
  refreshAll();
  return { ok: true };
}

/* ───────────── plants ───────────── */

const PlantSchema = z.object({
  isNew: z.boolean(),
  id: slug,
  name: LReq(80),
  latin: L(80),
  blurb: LReq(600),
  price: z.number().int().min(0).max(1_000_000),
  sun: z.number().int().min(0).max(3),
  water: z.number().int().min(0).max(3),
  tint: z.enum(TINTS),
  icon: z.enum(PLANT_ICONS),
  image: image.nullable(),
  stock,
  visible: z.boolean(),
  recipients: z.array(z.enum(WHOS)),
});

export type PlantInput = z.input<typeof PlantSchema>;

export async function savePlantAction(input: PlantInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = PlantSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { isNew, ...p } = parsed.data;

  const existing = repo.getPlant(p.id);
  if (isNew && existing) return fail(`A plant with the link name "${p.id}" already exists`);
  if (!isNew && !existing) return fail("This plant no longer exists");

  repo.savePlant({ ...p, potOnly: existing?.potOnly ?? false, sort: 0 }, isNew);
  if (existing?.image && existing.image !== p.image) await deleteImage(existing.image);
  refreshAll();
  return { ok: true, id: p.id };
}

export async function deletePlantAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (repo.getPlant(id)?.potOnly) return fail("The “Pot only” option can't be deleted. Hide it instead.");
  const res = repo.deletePlant(id);
  if ("blockedBy" in res) return fail(`It's the default plant for: ${res.blockedBy.join(", ")}. Change those pots first.`);
  for (const url of res.images) await deleteImage(url);
  refreshAll();
  return { ok: true };
}

/* ───────────── quick list controls ───────────── */

const Table = z.enum(["products", "plants"]);

export async function setStockAction(table: "products" | "plants", id: string, value: number | null): Promise<ActionResult> {
  await requireAdmin();
  const t = Table.parse(table);
  const s = stock.safeParse(value);
  if (!s.success) return fail("Stock must be a whole number, 0 or more");
  repo.setStock(t, id, s.data);
  refreshAll();
  return { ok: true };
}

export async function setVisibleAction(table: "products" | "plants", id: string, visible: boolean): Promise<ActionResult> {
  await requireAdmin();
  repo.setVisible(Table.parse(table), id, visible);
  refreshAll();
  return { ok: true };
}

export async function moveAction(table: "products" | "plants", id: string, dir: -1 | 1): Promise<ActionResult> {
  await requireAdmin();
  repo.move(Table.parse(table), id, dir === -1 ? -1 : 1);
  refreshAll();
  return { ok: true };
}

export async function setSaleAction(id: string, pct: number): Promise<ActionResult> {
  await requireAdmin();
  const s = z.number().int().min(0).max(90).safeParse(pct);
  if (!s.success) return fail("Sale must be between 0 and 90%");
  repo.setSale(id, s.data);
  refreshAll();
  return { ok: true };
}

/* ───────────── orders ───────────── */

export async function setOrderStatusAction(number: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const s = z.enum(ORDER_STATUSES).safeParse(status);
  if (!s.success) return fail("Unknown status");
  setOrderStatus(number, s.data);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ───────────── account ───────────── */

const password = z.string().min(10, "use at least 10 characters").max(200);

export async function changePasswordAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = password.safeParse(String(fd.get("next") ?? ""));
  if (!(await checkPassword(me.id, current))) return fail("Your current password isn't right");
  if (!next.success) return fail(`New password: ${next.error.issues[0].message}`);
  if (next.data !== fd.get("confirm")) return fail("The new passwords don't match");
  await setPassword(me.id, next.data);
  deleteOtherSessions(me.id, await sessionToken()); // sign out other devices
  return { ok: true };
}

export async function addAdminAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const email = z.email("enter a valid email").safeParse(String(fd.get("email") ?? "").trim());
  const pw = password.safeParse(String(fd.get("password") ?? ""));
  if (!email.success) return fail(`Email: ${email.error.issues[0].message}`);
  if (!pw.success) return fail(`Password: ${pw.error.issues[0].message}`);
  try {
    await createUser(email.data, pw.data);
  } catch {
    return fail("That email is already an admin");
  }
  revalidatePath("/admin/account");
  return { ok: true };
}

export async function removeAdminAction(id: number): Promise<ActionResult> {
  const me = await requireAdmin();
  if (id === me.id) return fail("You can't remove yourself");
  if (countUsers() <= 1) return fail("There must be at least one admin");
  deleteUser(id);
  revalidatePath("/admin/account");
  return { ok: true };
}
