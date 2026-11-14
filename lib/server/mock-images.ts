// Placeholder art until real photos are uploaded in /admin.
import sharp from "sharp";
import { HEX, plantSvgMarkup, type Tok } from "@/lib/plant-art";
import type { Plant } from "@/lib/catalog";

const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A plant "portrait": big illustration on a dotted tinted card. */
export async function mockPlantImage(plant: Pick<Plant, "icon" | "tint">) {
  const canvasSize = 900;
  const bg = HEX[`${plant.tint}-soft` as Tok];
  const dot = HEX[plant.tint];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}">
    <defs><pattern id="d" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="5" fill="${dot}" opacity=".25"/></pattern></defs>
    <rect width="${canvasSize}" height="${canvasSize}" fill="${bg}"/><rect width="${canvasSize}" height="${canvasSize}" fill="url(#d)"/>
    <circle cx="${canvasSize / 2}" cy="${canvasSize / 2 + 40}" r="330" fill="#fff" opacity=".7"/>
  </svg>`;
  const art = Buffer.from(plantSvgMarkup(plant.icon, 640));
  return sharp(Buffer.from(svg))
    .composite([{ input: art, left: (canvasSize - 640) / 2, top: (canvasSize - 640) / 2 + 10 }])
    .webp({ quality: 85 })
    .toBuffer();
}

/** The pot photo with a sticker per pot showing which plant goes in it, plus a "mock" ribbon. */
export async function mockVariantImage(photo: string, plants: Pick<Plant, "icon" | "tint" | "name">[]) {
  const canvasSize = 1000;
  const plantCount = plants.length;
  const stickerWidth = plantCount > 2 ? 250 : 300;
  const stickerHeight = stickerWidth + 70;
  const gap = (canvasSize - plantCount * stickerWidth) / (plantCount + 1);
  const stickers = await Promise.all(
    plants.map(async (plant, index) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${stickerWidth}" height="${stickerHeight}">
        <rect x="10" y="10" width="${stickerWidth - 20}" height="${stickerHeight - 20}" rx="34" fill="${HEX.ink}"/>
        <rect x="4" y="4" width="${stickerWidth - 20}" height="${stickerHeight - 20}" rx="34" fill="${HEX[`${plant.tint}-soft` as Tok]}" stroke="${HEX.ink}" stroke-width="6"/>
        <text x="${(stickerWidth - 12) / 2}" y="${stickerHeight - 38}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="${plantCount > 2 ? 22 : 26}" fill="${HEX.ink}">${esc(plant.name.en)}</text>
      </svg>`;
      const art = await sharp(Buffer.from(plantSvgMarkup(plant.icon, stickerWidth - 70))).png().toBuffer();
      const card = await sharp(Buffer.from(svg)).composite([{ input: art, left: 29, top: 18 }]).png().toBuffer();
      return { input: card, left: Math.round(gap + index * (stickerWidth + gap)), top: 36 };
    }),
  );
  const ribbon = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="64">
    <rect width="300" height="64" rx="32" fill="${HEX.pink}"/>
    <text x="150" y="42" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="26" fill="#fff">MOCK PHOTO</text>
  </svg>`);
  return sharp(photo)
    .resize(canvasSize, canvasSize, { fit: "cover" })
    .composite([...stickers, { input: ribbon, left: canvasSize - 300 - 28, top: canvasSize - 64 - 28 }])
    .webp({ quality: 82 })
    .toBuffer();
}
