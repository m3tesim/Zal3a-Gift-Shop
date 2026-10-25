// Cartoon plant-in-pot drawings (64×64) as data, so the browser (theme colours)
// and the server (mock image generation) draw exactly the same thing.
import type { PlantIconKey } from "./catalog";

export type Tok =
  | "ink" | "paper" | "pink" | "pink-soft" | "sun" | "sun-soft" | "sky" | "sky-soft"
  | "lime" | "lime-soft" | "lilac" | "lilac-soft" | "orange" | "orange-soft";

/** Mirrors the @theme colours in app/globals.css */
export const HEX: Record<Tok, string> = {
  ink: "#3d1a5b", paper: "#ffffff",
  pink: "#f72c83", "pink-soft": "#ffd6e7",
  sun: "#ffc72c", "sun-soft": "#fff1bf",
  sky: "#3ec1f3", "sky-soft": "#d4f1ff",
  lime: "#7bd84a", "lime-soft": "#e0f8cf",
  lilac: "#a77bff", "lilac-soft": "#ece2ff",
  orange: "#ff8a3d", "orange-soft": "#ffe3cc",
};

export type Shape = (
  | { path: string }
  | { circle: [cx: number, cy: number, r: number] }
) & { fill: Tok | "none"; stroke?: Tok | null; width?: number; cap?: boolean; opacity?: number };

const pot = (fill: Tok): Shape => ({ path: "M20 58h24l-3-14H23z", fill });

export const PLANT_ART: Record<PlantIconKey, Shape[]> = {
  cactus: [
    pot("pink-soft"),
    { path: "M26 44V22a6 6 0 0 1 12 0v22", fill: "lime" },
    { path: "M26 36h-5a4 4 0 0 1-4-4v-6a3 3 0 0 1 6 0v4h3M38 32h4v-6a3 3 0 0 1 6 0v6a5 5 0 0 1-5 5h-5", fill: "lime" },
    { circle: [32, 13, 3.5], fill: "pink", width: 2 },
  ],
  echeveria: [
    pot("sun-soft"),
    { path: "M32 44c-12 0-18-6-18-10 6 0 10 2 12 4-3-6-2-12 0-15 3 3 5 8 6 12 1-4 3-9 6-12 2 3 3 9 0 15 2-2 6-4 12-4 0 4-6 10-18 10z", fill: "sky" },
  ],
  haworthia: [
    pot("lilac-soft"),
    { path: "M32 44 22 18l8 14 2-24 2 24 8-14-10 26zM32 44l-16-12 12 8M32 44l16-12-12 8", fill: "lime" },
    { path: "M28 30h2M34 30h2M30 24h1M33 24h1", fill: "none", stroke: "paper", width: 2, cap: true },
  ],
  leafy: [
    pot("orange-soft"),
    { path: "M32 44V16", fill: "none", cap: true },
    { path: "M32 36c-8 0-13-5-13-11 7 0 13 4 13 11z", fill: "lime" },
    { path: "M32 29c7 0 12-5 12-11-7 0-12 4-12 11z", fill: "lime" },
    { path: "M32 19c-3-4-3-9 0-13 3 4 3 9 0 13z", fill: "lime" },
  ],
  flower: [
    pot("sky-soft"),
    { path: "M32 44V24", fill: "none", cap: true },
    { path: "M32 38c-7 0-11-3-11-8 6 0 11 3 11 8z", fill: "lime" },
    { circle: [32, 10, 5], fill: "pink", width: 2 },
    { circle: [39, 17, 5], fill: "pink", width: 2 },
    { circle: [32, 24, 5], fill: "pink", width: 2 },
    { circle: [25, 17, 5], fill: "pink", width: 2 },
    { circle: [32, 17, 4], fill: "sun", width: 2 },
  ],
  pot: [
    { path: "M16 26h32l-4 30H20z", fill: "paper" },
    { circle: [27, 38, 2], fill: "ink", stroke: null },
    { circle: [37, 38, 2], fill: "ink", stroke: null },
    { path: "M28 44q4 3 8 0", fill: "none", cap: true },
    { circle: [23, 43, 2.5], fill: "pink", stroke: null, opacity: 0.7 },
    { circle: [41, 43, 2.5], fill: "pink", stroke: null, opacity: 0.7 },
  ],
};

/** SVG markup with literal colours, for server-side rendering with sharp. */
export function plantSvgMarkup(icon: PlantIconKey, size: number) {
  const body = PLANT_ART[icon]
    .map((s) => {
      const stroke = s.stroke === null ? "" : ` stroke="${HEX[s.stroke ?? "ink"]}" stroke-width="${s.width ?? 2.5}" stroke-linejoin="round"`;
      const cap = s.cap ? ` stroke-linecap="round"` : "";
      const fill = ` fill="${s.fill === "none" ? "none" : HEX[s.fill]}"`;
      const op = s.opacity ? ` opacity="${s.opacity}"` : "";
      return "path" in s
        ? `<path d="${s.path}"${fill}${stroke}${cap}${op}/>`
        : `<circle cx="${s.circle[0]}" cy="${s.circle[1]}" r="${s.circle[2]}"${fill}${stroke}${op}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${body}</svg>`;
}
