// Placeholder art until real photos are uploaded in /admin.
import sharp from "sharp";
import { HEX, plantSvgMarkup, type Tok } from "@/lib/plant-art";
import type { Plant } from "@/lib/catalog";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A plant "portrait": big illustration on a dotted tinted card. */
export async function mockPlantImage(plant: Pick<Plant, "icon" | "tint">) {
  const S = 900;
  const bg = HEX[`${plant.tint}-soft` as Tok];
  const dot = HEX[plant.tint];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs><pattern id="d" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="5" fill="${dot}" opacity=".25"/></pattern></defs>
    <rect width="${S}" height="${S}" fill="${bg}"/><rect width="${S}" height="${S}" fill="url(#d)"/>
    <circle cx="${S / 2}" cy="${S / 2 + 40}" r="330" fill="#fff" opacity=".7"/>
  </svg>`;
  const art = Buffer.from(plantSvgMarkup(plant.icon, 640));
  return sharp(Buffer.from(svg))
    .composite([{ input: art, left: (S - 640) / 2, top: (S - 640) / 2 + 10 }])
    .webp({ quality: 85 })
    .toBuffer();
}

/** The pot photo with a sticker per pot showing which plant goes in it, plus a "mock" ribbon. */
export async function mockVariantImage(photo: string, plants: Pick<Plant, "icon" | "tint" | "name">[]) {
  const S = 1000;
  const n = plants.length;
  const W = n > 2 ? 250 : 300;
  const H = W + 70;
  const gap = (S - n * W) / (n + 1);
  const stickers = await Promise.all(
    plants.map(async (p, i) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="34" fill="${HEX.ink}"/>
        <rect x="4" y="4" width="${W - 20}" height="${H - 20}" rx="34" fill="${HEX[`${p.tint}-soft` as Tok]}" stroke="${HEX.ink}" stroke-width="6"/>
        <text x="${(W - 12) / 2}" y="${H - 38}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="${n > 2 ? 22 : 26}" fill="${HEX.ink}">${esc(p.name.en)}</text>
      </svg>`;
      const art = await sharp(Buffer.from(plantSvgMarkup(p.icon, W - 70))).png().toBuffer();
      const card = await sharp(Buffer.from(svg)).composite([{ input: art, left: 29, top: 18 }]).png().toBuffer();
      return { input: card, left: Math.round(gap + i * (W + gap)), top: 36 };
    }),
  );
  const ribbon = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="64">
    <rect width="300" height="64" rx="32" fill="${HEX.pink}"/>
    <text x="150" y="42" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="26" fill="#fff">MOCK PHOTO</text>
  </svg>`);
  return sharp(photo)
    .resize(S, S, { fit: "cover" })
    .composite([...stickers, { input: ribbon, left: S - 300 - 28, top: S - 64 - 28 }])
    .webp({ quality: 82 })
    .toBuffer();
}
