import type { Locale } from "./i18n";

export type L = Record<Locale, string>;
export type PlantKey = "cactus" | "echeveria" | "haworthia" | "empty";
export type Tint = "pink" | "sun" | "sky" | "lime" | "lilac" | "orange";
export type Vibe = "giggly" | "cozy" | "cute" | "quirky";

export type Plant = {
  name: L;
  latin: L;
  blurb: L;
  delta: number; // price change vs. the pot's default plant
  sun: 0 | 1 | 2 | 3;
  water: 0 | 1 | 2 | 3;
  tint: Tint;
};

export const PLANT_KEYS: PlantKey[] = ["cactus", "echeveria", "haworthia", "empty"];

export const PLANTS: Record<PlantKey, Plant> = {
  cactus: {
    name: { en: "Mini cactus", ar: "صبارة صغنونة" },
    latin: { en: "Mammillaria", ar: "ماميلاريا" },
    blurb: {
      en: "A round little cactus that flowers pink in spring. The easiest roommate you will ever have.",
      ar: "صبارة مدوّرة بتطلع ورد بمبي في الربيع. أسهل شريك سكن ممكن تقابله.",
    },
    delta: 0, sun: 3, water: 1, tint: "lime",
  },
  echeveria: {
    name: { en: "Echeveria rosette", ar: "وردة إشيفيريا" },
    latin: { en: "Echeveria elegans", ar: "إشيفيريا إليجانز" },
    blurb: {
      en: "A soft blue-green rosette shaped like a flower. Plump leaves store water for weeks.",
      ar: "وردة لونها أخضر مزرق شكلها زي الزهرة. ورقها المليان بيخزن مية لأسابيع.",
    },
    delta: 30, sun: 3, water: 1, tint: "sky",
  },
  haworthia: {
    name: { en: "Zebra haworthia", ar: "هاورثيا الزيبرا" },
    latin: { en: "Haworthiopsis fasciata", ar: "هاورثيوبسيس فاشياتا" },
    blurb: {
      en: "Striped and spiky but totally harmless. Happy with bright indirect light, so it loves desks.",
      ar: "مخططة وشكلها شقي بس طيبة خالص. بتحب النور غير المباشر، فمكانها المفضل المكتب.",
    },
    delta: 45, sun: 2, water: 1, tint: "lilac",
  },
  empty: {
    name: { en: "Pot only", ar: "القصرية بس" },
    latin: { en: "Bring your own plant", ar: "هات زرعتك معاك" },
    blurb: {
      en: "Just the pot, with a drainage hole and a plug. Ready for a plant you already love.",
      ar: "القصرية لوحدها، بفتحة تصريف وسدادة. جاهزة لزرعة انت بتحبها أصلًا.",
    },
    delta: -90, sun: 0, water: 0, tint: "sun",
  },
};

export type Product = {
  id: string;
  name: L;
  kind: L;
  price: number;
  badge: L;
  tint: Tint;
  img: string;
  pos: string;
  plant: PlantKey;
  vibes: Vibe[];
  desc: L;
  styled: L;
  specs: [L, L][];
};

const h = (cm: number): L => ({ en: `${cm} cm`, ar: `${cm} سم` });
const g = (grams: number): L => ({ en: `${grams} g`, ar: `${grams} جرام` });
const S = {
  height: { en: "Height", ar: "الطول" },
  opening: { en: "Opening", ar: "الفتحة" },
  material: { en: "Material", ar: "الخامة" },
  drainage: { en: "Drainage", ar: "التصريف" },
  weight: { en: "Weight", ar: "الوزن" },
  inBox: { en: "In the box", ar: "في العلبة" },
} satisfies Record<string, L>;
const ceramic: L = { en: "Glazed ceramic", ar: "سيراميك لامع" };
const plug: L = { en: "Hole + rubber plug", ar: "فتحة + سدادة كاوتش" };

export const PRODUCTS: Product[] = [
  {
    id: "duo",
    name: { en: "The Gossip Duo", ar: "التوأم الرغّاي" },
    kind: { en: "Cat pots · set of 2", ar: "قصاري قطط · طقم 2" },
    price: 649,
    badge: { en: "Best seller", ar: "الأكثر مبيعًا" },
    tint: "pink",
    img: "/img/duo.webp", pos: "50% 60%", plant: "cactus",
    vibes: ["giggly", "quirky"],
    desc: {
      en: "One cat just heard the news, the other can't stop laughing. A pair of glazed ceramic cat pots that look best side by side on a windowsill.",
      ar: "قطة لسه سامعة الخبر، والتانية مش قادرة تبطل ضحك. طقم قصريتين سيراميك شكلهم أحلى جنب بعض على الشباك.",
    },
    styled: { en: "microgreens and clover", ar: "ميكروجرينز ونفل" },
    specs: [
      [S.height, { en: "14 cm each", ar: "14 سم لكل واحدة" }],
      [S.opening, h(8.5)],
      [S.material, ceramic],
      [S.drainage, plug],
      [S.inBox, { en: "2 pots, 2 plants, care card", ar: "قصريتين، زرعتين، كارت عناية" }],
    ],
  },
  {
    id: "bisbis",
    name: { en: "Bisbis", ar: "بسبس" },
    kind: { en: "Cat pot", ar: "قصرية قطة" },
    price: 349,
    badge: { en: "Big eyes", ar: "عيون واسعة" },
    tint: "sky",
    img: "/img/bisbis.webp", pos: "42% 55%", plant: "echeveria",
    vibes: ["cute", "giggly"],
    desc: {
      en: "Huge sparkly eyes and pink cheeks. Bisbis looks at you like you just opened a can of tuna.",
      ar: "عيون كبيرة بتلمع وخدود بمبي. بسبس بيبصلك كأنك لسه فاتح علبة تونة.",
    },
    styled: { en: "clover", ar: "نفل" },
    specs: [[S.height, h(14)], [S.opening, h(8.5)], [S.material, ceramic], [S.drainage, plug], [S.weight, g(420)]],
  },
  {
    id: "dino",
    name: { en: "Dodo the Dino", ar: "دودو الديناصور" },
    kind: { en: "Dino pot", ar: "قصرية ديناصور" },
    price: 399,
    badge: { en: "New", ar: "جديد" },
    tint: "lime",
    img: "/img/dino.webp", pos: "50% 55%", plant: "echeveria",
    vibes: ["quirky", "cute"],
    desc: {
      en: "A chubby sage-green dinosaur with stubby arms and a spiky tail. Soft matte finish that feels like a pebble.",
      ar: "ديناصور مربرب لونه أخضر فاتح، إيديه قصيرة وديله مشوّك. ملمسه مطفي وناعم زي الزلطة.",
    },
    styled: { en: "cut flowers", ar: "ورد مقطوف" },
    specs: [
      [S.height, h(11)], [S.opening, h(9)],
      [S.material, { en: "Matte resin", ar: "ريزن مطفي" }],
      [S.drainage, plug], [S.weight, g(310)],
    ],
  },
  {
    id: "dahka",
    name: { en: "Dahka", ar: "ضحكة" },
    kind: { en: "Cat pot", ar: "قصرية قطة" },
    price: 349,
    badge: { en: "Fan favourite", ar: "حبيبة الجماهير" },
    tint: "sun",
    img: "/img/dahka.webp", pos: "48% 55%", plant: "cactus",
    vibes: ["giggly"],
    desc: {
      en: "Laughing so hard its eyes closed. Dahka is the pot for anyone who needs a small daily giggle.",
      ar: "بتضحك لدرجة إن عينيها غمّضت. ضحكة هي القصرية لأي حد محتاج ضحكة صغيرة كل يوم.",
    },
    styled: { en: "clover", ar: "نفل" },
    specs: [[S.height, h(14)], [S.opening, h(8.5)], [S.material, ceramic], [S.drainage, plug], [S.weight, g(420)]],
  },
  {
    id: "twinkle",
    name: { en: "Twinkle", ar: "تونكل" },
    kind: { en: "Buddy pot", ar: "قصرية صاحب" },
    price: 279,
    badge: { en: "Pocket size", ar: "حجم الجيب" },
    tint: "lilac",
    img: "/img/twinkle.webp", pos: "50% 50%", plant: "haworthia",
    vibes: ["cozy", "cute"],
    desc: {
      en: "A palm-sized pebble buddy with little brown boots, giving itself a hug. Small enough for a bookshelf gap.",
      ar: "صاحب صغير قد كف الإيد، لابس بوت بني صغير وحاضن نفسه. صغير كفاية يستخبى بين الكتب.",
    },
    styled: { en: "daisies", ar: "ورد الأقحوان" },
    specs: [
      [S.height, h(8)], [S.opening, h(6.5)],
      [S.material, { en: "Cement-resin blend", ar: "خليط أسمنت وريزن" }],
      [S.drainage, { en: "Hole", ar: "فتحة" }], [S.weight, g(190)],
    ],
  },
  {
    id: "nono",
    name: { en: "Nono", ar: "نونو" },
    kind: { en: "Cat pot", ar: "قصرية قطة" },
    price: 349,
    badge: { en: "Calm vibes", ar: "رايقة" },
    tint: "orange",
    img: "/img/nono.webp", pos: "45% 60%", plant: "haworthia",
    vibes: ["cozy"],
    desc: {
      en: "Eyes closed, lashes out, totally at peace. Nono is the bedside-table cat that never wakes you up.",
      ar: "مغمّضة، رموشها باينة، ورايقة على الآخر. نونو قطة الكومودينو اللي عمرها ما هتصحيك.",
    },
    styled: { en: "cat grass", ar: "حشيشة القطط" },
    specs: [[S.height, h(14)], [S.opening, h(8.5)], [S.material, ceramic], [S.drainage, plug], [S.weight, g(420)]],
  },
];

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const unitPrice = (id: string, plant: PlantKey) => (PRODUCT_BY_ID[id]?.price ?? 0) + PLANTS[plant].delta;

// Full Tailwind class strings so the compiler can see them.
export const TINT: Record<Tint, { soft: string; solid: string; text: string }> = {
  pink: { soft: "bg-pink-soft", solid: "bg-pink", text: "text-white" },
  sun: { soft: "bg-sun-soft", solid: "bg-sun", text: "text-ink" },
  sky: { soft: "bg-sky-soft", solid: "bg-sky", text: "text-ink" },
  lime: { soft: "bg-lime-soft", solid: "bg-lime", text: "text-ink" },
  lilac: { soft: "bg-lilac-soft", solid: "bg-lilac", text: "text-white" },
  orange: { soft: "bg-orange-soft", solid: "bg-orange", text: "text-ink" },
};
