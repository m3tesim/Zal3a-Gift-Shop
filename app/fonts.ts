import { Bagel_Fat_One, Baloo_Bhaijaan_2, Bricolage_Grotesque, Figtree, Lalezar } from "next/font/google";

const bagel = Bagel_Fat_One({ weight: "400", subsets: ["latin"], variable: "--font-bagel", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const lalezar = Lalezar({ weight: "400", subsets: ["arabic", "latin"], variable: "--font-lalezar", display: "swap" });
const baloo = Baloo_Bhaijaan_2({ subsets: ["arabic", "latin"], variable: "--font-baloo", display: "swap" });

/** CSS variables for every font, set on <html> in both root layouts. */
export const fontVars = [bagel, bricolage, figtree, lalezar, baloo].map((font) => font.variable).join(" ");
