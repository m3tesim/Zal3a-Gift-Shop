"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
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
import * as taxonomy from "@/lib/server/taxonomy-repo";
import * as reviews from "@/lib/server/reviews-repo";
import { createCampaign, renderOffer, runCampaign } from "@/lib/server/campaigns";
import { emailConfigured, sendEmail } from "@/lib/server/email/mailer";
import { notifyOrderStatus } from "@/lib/server/notify";
import { deleteImage } from "@/lib/server/storage";
import { revalidateStore } from "@/lib/server/revalidate";
import { PLANT_ICONS, TINTS } from "@/lib/catalog";
import { ORDER_STATUSES } from "@/lib/orders";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const firstIssue = (error: z.ZodError) => {
  const issue = error.issues[0];
  return `${issue.path.length ? issue.path.join(" › ") + ": " : ""}${issue.message}`;
};

function refreshAll() {
  revalidateStore();
  revalidatePath("/admin", "layout");
}

/* ───────────── auth ───────────── */

export async function loginAction(_prev: { error?: string; email?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
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

const localized = (max = 300) => z.object({ en: z.string().trim().max(max), ar: z.string().trim().max(max) });
const LReq = (max = 300) =>
  localized(max).refine((value) => value.en.length > 0 && value.ar.length > 0, { message: "fill in both English and Arabic" });
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,39}$/, "use 2–40 lowercase letters, numbers or dashes");
const image = z.string().regex(/^\/(uploads|img)\/[\w.-]+$/, "upload an image");
const stock = z.number().int().min(0).max(100000).nullable();
const tagIds = z.array(z.string().max(40)).max(30);

/** Drop any tag ids that no longer exist (e.g. deleted while the form was open). */
function knownTags(kind: "who" | "vibe", ids: string[]) {
  const all = new Set(repo.readTags().filter((tag) => tag.kind === kind).map((tag) => tag.id));
  return ids.filter((id) => all.has(id));
}

/* ───────────── pots ───────────── */

const PotSchema = z
  .object({
    isNew: z.boolean(),
    id: slug,
    name: LReq(80),
    kind: LReq(80),
    desc: LReq(1000),
    badge: localized(40),
    styled: localized(120),
    price: z.number().int().min(0).max(1_000_000),
    salePercent: z.number().int().min(0).max(90),
    stock,
    slots: z.array(LReq(60)).min(1).max(4),
    defaultPlants: z.array(z.string()).min(1).max(4),
    tint: z.enum(TINTS),
    image,
    pos: z.string().regex(/^\d{1,3}% \d{1,3}%$/),
    vibes: tagIds,
    recipients: tagIds,
    specs: z.array(z.object({ label: localized(60), value: localized(120) })).max(12),
    visible: z.boolean(),
    featured: z.boolean(),
  })
  .refine((pot) => pot.defaultPlants.length === pot.slots.length, { message: "pick a default plant for every pot", path: ["defaultPlants"] });

export type PotInput = z.input<typeof PotSchema>;

export async function savePotAction(input: PotInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = PotSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { isNew, ...pot } = parsed.data;

  const existing = repo.getProduct(pot.id);
  if (isNew && existing) return fail(`A pot with the link name "${pot.id}" already exists`);
  if (!isNew && !existing) return fail("This pot no longer exists");
  const plants = repo.readCatalog({ includeHidden: true }).plants;
  if (pot.defaultPlants.some((id) => !plants.some((plant) => plant.id === id))) return fail("Pick a default plant for every pot");

  repo.saveProduct(
    {
      ...pot,
      vibes: knownTags("vibe", pot.vibes),
      recipients: knownTags("who", pot.recipients),
      specs: pot.specs.filter((spec) => spec.label.en || spec.label.ar),
    },
    isNew,
  );

  if (existing) {
    // Clean up files that are no longer referenced.
    if (existing.image !== pot.image) await deleteImage(existing.image);
    if (existing.slots.length !== pot.slots.length) {
      for (const [combo, url] of Object.entries(existing.variants)) {
        repo.setVariant(pot.id, combo, null);
        await deleteImage(url);
      }
    }
  }
  refreshAll();
  return { ok: true, id: pot.id };
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
  latin: localized(80),
  blurb: LReq(600),
  price: z.number().int().min(0).max(1_000_000),
  sun: z.string().max(40).nullable(),
  water: z.string().max(40).nullable(),
  tint: z.enum(TINTS),
  icon: z.enum(PLANT_ICONS),
  image: image.nullable(),
  stock,
  visible: z.boolean(),
  recipients: tagIds,
  vibes: tagIds,
});

export type PlantInput = z.input<typeof PlantSchema>;

export async function savePlantAction(input: PlantInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = PlantSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { isNew, ...plant } = parsed.data;

  const existing = repo.getPlant(plant.id);
  if (isNew && existing) return fail(`A plant with the link name "${plant.id}" already exists`);
  if (!isNew && !existing) return fail("This plant no longer exists");

  const care = repo.readCare();
  const has = (kind: "sun" | "water", id: string | null) => id === null || care.some((option) => option.kind === kind && option.id === id);
  if (!has("sun", plant.sun) || !has("water", plant.water)) return fail("Pick sun and watering from the list");
  repo.savePlant(
    { ...plant, recipients: knownTags("who", plant.recipients), vibes: knownTags("vibe", plant.vibes), potOnly: existing?.potOnly ?? false, sort: 0 },
    isNew,
  );
  if (existing?.image && existing.image !== plant.image) await deleteImage(existing.image);
  refreshAll();
  return { ok: true, id: plant.id };
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
  const validTable = Table.parse(table);
  const parsedStock = stock.safeParse(value);
  if (!parsedStock.success) return fail("Stock must be a whole number, 0 or more");
  repo.setStock(validTable, id, parsedStock.data);
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
  const parsedPercent = z.number().int().min(0).max(90).safeParse(pct);
  if (!parsedPercent.success) return fail("Sale must be between 0 and 90%");
  repo.setSale(id, parsedPercent.data);
  refreshAll();
  return { ok: true };
}

/* ───────────── orders ───────────── */

export async function setOrderStatusAction(number: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const parsedStatus = z.enum(ORDER_STATUSES).safeParse(status);
  if (!parsedStatus.success) return fail("Unknown status");
  const changed = setOrderStatus(number, parsedStatus.data);
  // Email the customer about the new step without making the admin wait for the mail server.
  if (changed) after(() => notifyOrderStatus(changed, parsedStatus.data));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ───────────── account ───────────── */

const password = z.string().min(10, "use at least 10 characters").max(200);

export async function changePasswordAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = password.safeParse(String(formData.get("next") ?? ""));
  if (!(await checkPassword(me.id, current))) return fail("Your current password isn't right");
  if (!next.success) return fail(`New password: ${next.error.issues[0].message}`);
  if (next.data !== formData.get("confirm")) return fail("The new passwords don't match");
  await setPassword(me.id, next.data);
  deleteOtherSessions(me.id, await sessionToken()); // sign out other devices
  return { ok: true };
}

export async function addAdminAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const email = z.email("enter a valid email").safeParse(String(formData.get("email") ?? "").trim());
  const passwordResult = password.safeParse(String(formData.get("password") ?? ""));
  if (!email.success) return fail(`Email: ${email.error.issues[0].message}`);
  if (!passwordResult.success) return fail(`Password: ${passwordResult.error.issues[0].message}`);
  try {
    await createUser(email.data, passwordResult.data);
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

/* ───────────── tags & care options ───────────── */

const TagSchema = z.object({
  isNew: z.boolean(),
  kind: z.enum(["who", "vibe"]),
  id: slug,
  label: LReq(40),
  emoji: z.string().trim().max(8),
  line: localized(200),
  visible: z.boolean(),
});
export type TagInput = z.input<typeof TagSchema>;

export async function saveTagAction(input: TagInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = TagSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { isNew, ...tag } = parsed.data;
  if (isNew && taxonomy.tagExists(tag.kind, tag.id)) return fail(`“${tag.id}” already exists`);
  taxonomy.saveTag(tag, isNew);
  refreshAll();
  return { ok: true, id: tag.id };
}

export async function deleteTagAction(kind: "who" | "vibe", id: string): Promise<ActionResult> {
  await requireAdmin();
  taxonomy.deleteTag(z.enum(["who", "vibe"]).parse(kind), id);
  refreshAll();
  return { ok: true };
}

const CareSchema = z.object({
  isNew: z.boolean(),
  kind: z.enum(["sun", "water"]),
  id: slug,
  label: LReq(80),
  level: z.number().int().min(0).max(3),
});
export type CareInput = z.input<typeof CareSchema>;

export async function saveCareAction(input: CareInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = CareSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { isNew, ...option } = parsed.data;
  if (isNew && taxonomy.careExists(option.kind, option.id)) return fail(`“${option.id}” already exists`);
  taxonomy.saveCare(option, isNew);
  refreshAll();
  return { ok: true, id: option.id };
}

export async function deleteCareAction(kind: "sun" | "water", id: string): Promise<ActionResult> {
  await requireAdmin();
  const users = taxonomy.deleteCare(z.enum(["sun", "water"]).parse(kind), id);
  if (users.length) return fail(`Still used by: ${users.join(", ")}. Change those plants first.`);
  refreshAll();
  return { ok: true };
}

export async function moveListItemAction(table: "tags" | "care_options", kind: string, id: string, dir: -1 | 1): Promise<ActionResult> {
  await requireAdmin();
  const validTable = z.enum(["tags", "care_options"]).parse(table);
  const validKind = (validTable === "tags" ? z.enum(["who", "vibe"]) : z.enum(["sun", "water"])).parse(kind);
  taxonomy.moveListItem(validTable, validKind, id, dir === -1 ? -1 : 1);
  refreshAll();
  return { ok: true };
}

/* ───────────── reviews ───────────── */

const ReviewSchema = z.object({
  author: z.string().trim().min(1).max(60),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(1).max(2000),
  reply: z.string().trim().max(1000),
  visible: z.boolean(),
});

export async function updateReviewAction(id: number, input: z.input<typeof ReviewSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = ReviewSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  reviews.updateReview(id, parsed.data);
  refreshAll();
  return { ok: true };
}

export async function deleteReviewAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  reviews.deleteReview(id);
  refreshAll();
  return { ok: true };
}

/* ───────────── offer emails ───────────── */

const CampaignSchema = z.object({
  subject: LReq(150),
  body: LReq(5000),
  ctaLabel: localized(40),
  ctaUrl: z.union([z.literal(""), z.string().regex(/^(https?:\/\/|\/)[^\s]*$/, "start the link with / or https://")]),
  image: image.nullable(),
});
export type CampaignFormInput = z.input<typeof CampaignSchema>;

export async function previewOfferAction(input: CampaignFormInput, locale: "en" | "ar") {
  await requireAdmin();
  const parsed = CampaignSchema.safeParse(input);
  const campaign = parsed.success ? parsed.data : { ...input, image: input.image ?? null };
  return renderOffer(campaign as z.output<typeof CampaignSchema>, locale, "#unsubscribe");
}

export async function sendTestOfferAction(input: CampaignFormInput): Promise<ActionResult> {
  const me = await requireAdmin();
  const parsed = CampaignSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  for (const locale of ["en", "ar"] as const) {
    await sendEmail({
      to: me.email,
      subject: `[TEST] ${parsed.data.subject[locale]}`,
      html: renderOffer(parsed.data, locale, "#unsubscribe"),
      kind: "test",
    });
  }
  revalidatePath("/admin/emails");
  return emailConfigured() ? { ok: true } : fail("Saved to the outbox below, but not sent: email isn't set up yet.");
}

export async function sendOfferAction(input: CampaignFormInput): Promise<ActionResult> {
  await requireAdmin();
  if (!emailConfigured()) return fail("Email isn't set up yet. Add your SMTP settings to .env.local first.");
  const parsed = CampaignSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const id = createCampaign(parsed.data);
  after(() => runCampaign(id));
  revalidatePath("/admin/emails");
  return { ok: true, id: String(id) };
}
