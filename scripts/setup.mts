// Runs before `npm run dev` / `npm run build`. Safe to run any number of times:
// creates the database, seeds the catalog on first run, and makes sure an admin exists.
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const { getDb } = await import("@/lib/server/db");
const { savePlant, saveProduct, setVariant } = await import("@/lib/server/catalog-repo");
const { saveImage } = await import("@/lib/server/storage");
const { mockPlantImage, mockVariantImage } = await import("@/lib/server/mock-images");
const { SEED_PLANTS, SEED_PRODUCTS } = await import("@/lib/server/seed-data");
const { countUsers, createUser } = await import("@/lib/server/users");
const { comboKey } = await import("@/lib/catalog");

/** Every way to fill `slots` pots with the given plants: [[a,a],[a,b],[b,a],[b,b]] */
function combos(ids: string[], slots: number): string[][] {
  return slots === 0 ? [[]] : combos(ids, slots - 1).flatMap((c) => ids.map((id) => [...c, id]));
}

async function seed() {
  console.log("🌱 Seeding catalog with mock images…");
  for (const p of SEED_PLANTS) {
    const image = p.potOnly ? null : await saveImage(await mockPlantImage(p));
    savePlant({ ...p, image, sort: 0 }, true);
  }
  for (const p of SEED_PRODUCTS) {
    const photo = path.join("public/img", p.photo);
    const { photo: _, ...rest } = p;
    saveProduct({ ...rest, image: await saveImage(photo) }, true);
    for (const c of combos(SEED_PLANTS.map((x) => x.id), p.slots.length)) {
      const plants = c.map((id) => SEED_PLANTS.find((x) => x.id === id)!);
      setVariant(p.id, comboKey(c), await saveImage(await mockVariantImage(photo, plants)));
    }
  }
  console.log(`   ${SEED_PLANTS.length} plants, ${SEED_PRODUCTS.length} pots.`);
}

async function ensureAdmin() {
  if (countUsers() > 0) return;
  const email = process.env.ADMIN_EMAIL || "admin@zal3a.local";
  const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString("base64url");
  await createUser(email, password);
  console.log("\n🔑 Admin account created");
  console.log(`   email:    ${email}`);
  if (!process.env.ADMIN_PASSWORD) console.log(`   password: ${password}   (save it now, it won't be shown again)`);
  console.log("   Sign in at /admin\n");
}

const db = getDb();
const empty = (db.prepare("SELECT COUNT(*) AS n FROM plants").get() as { n: number }).n === 0;
if (empty) await seed();
await ensureAdmin();
