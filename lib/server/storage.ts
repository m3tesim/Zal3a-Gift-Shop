// Image storage on local disk, served by app/uploads/[name]/route.ts.
// To move to S3 / Vercel Blob / R2, reimplement these three functions.
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { DATA_DIR } from "./db";

const UPLOADS = path.join(DATA_DIR, "uploads");
const NAME = /^[a-z0-9-]+\.webp$/;

/** Normalise any image (rotate, cap at 1400px, WebP) and store it. Returns its public URL. */
export async function saveImage(input: Buffer | string, maxSize = 1400) {
  await fs.mkdir(UPLOADS, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
  await sharp(input)
    .rotate()
    .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(UPLOADS, name));
  return `/uploads/${name}`;
}

export async function deleteImage(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return;
  const name = url.slice("/uploads/".length);
  if (NAME.test(name)) await fs.rm(path.join(UPLOADS, name), { force: true });
}

export async function readImage(name: string) {
  if (!NAME.test(name)) return null;
  try {
    return await fs.readFile(path.join(UPLOADS, name));
  } catch {
    return null;
  }
}
