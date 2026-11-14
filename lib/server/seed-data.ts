// First-run catalog. After seeding, everything is edited in /admin.
import type { CareOption, L, Plant, Product, Spec, Tag } from "@/lib/catalog";

type SeedPlant = Omit<Plant, "image" | "sort">;
type SeedProduct = Omit<Product, "image" | "variants" | "sort"> & { photo: string };

export const SEED_PLANTS: SeedPlant[] = [
  {
    id: "cactus",
    name: { en: "Mini cactus", ar: "صبارة صغنونة" },
    latin: { en: "Mammillaria", ar: "ماميلاريا" },
    blurb: {
      en: "A round little cactus that flowers pink in spring. The easiest roommate you will ever have.",
      ar: "صبارة مدوّرة بتطلع ورد بمبي في الربيع. أسهل شريك سكن ممكن تقابله.",
    },
    price: 90, sun: "full-sun", water: "every-2-3-weeks", tint: "lime", icon: "cactus", stock: 40, visible: true, potOnly: false,
    recipients: ["bestie", "crush", "me"], vibes: ["quirky", "giggly"],
  },
  {
    id: "echeveria",
    name: { en: "Echeveria rosette", ar: "وردة إشيفيريا" },
    latin: { en: "Echeveria elegans", ar: "إشيفيريا إليجانز" },
    blurb: {
      en: "A soft blue-green rosette shaped like a flower. Plump leaves store water for weeks.",
      ar: "وردة لونها أخضر مزرق شكلها زي الزهرة. ورقها المليان بيخزن مية لأسابيع.",
    },
    price: 120, sun: "full-sun", water: "every-2-3-weeks", tint: "sky", icon: "echeveria", stock: 25, visible: true, potOnly: false,
    recipients: ["mom", "kid", "crush"], vibes: ["cute", "cozy"],
  },
  {
    id: "haworthia",
    name: { en: "Zebra haworthia", ar: "هاورثيا الزيبرا" },
    latin: { en: "Haworthiopsis fasciata", ar: "هاورثيوبسيس فاشياتا" },
    blurb: {
      en: "Striped and spiky but totally harmless. Happy with bright indirect light, so it loves desks.",
      ar: "مخططة وشكلها شقي بس طيبة خالص. بتحب النور غير المباشر، فمكانها المفضل المكتب.",
    },
    price: 135, sun: "some-direct", water: "every-2-3-weeks", tint: "lilac", icon: "haworthia", stock: 20, visible: true, potOnly: false,
    recipients: ["coworker", "me", "bestie"], vibes: ["cozy", "quirky"],
  },
  {
    id: "empty",
    name: { en: "Pot only", ar: "القصرية بس" },
    latin: { en: "Bring your own plant", ar: "هات زرعتك معاك" },
    blurb: {
      en: "Just the pot, with a drainage hole and a plug. Ready for a plant you already love.",
      ar: "القصرية لوحدها، بفتحة تصريف وسدادة. جاهزة لزرعة انت بتحبها أصلًا.",
    },
    price: 0, sun: null, water: null, tint: "sun", icon: "pot", stock: null, visible: true, potOnly: true,
    recipients: [], vibes: [],
  },
];

const heightLabel = (cm: number): L => ({ en: `${cm} cm`, ar: `${cm} سم` });
const weightLabel = (grams: number): L => ({ en: `${grams} g`, ar: `${grams} جرام` });
const SPEC_LABELS = {
  height: { en: "Height", ar: "الطول" },
  opening: { en: "Opening", ar: "الفتحة" },
  material: { en: "Material", ar: "الخامة" },
  drainage: { en: "Drainage", ar: "التصريف" },
  weight: { en: "Weight", ar: "الوزن" },
  inBox: { en: "In the box", ar: "في العلبة" },
} satisfies Record<string, L>;
const spec = (label: L, value: L): Spec => ({ label, value });
const ceramic: L = { en: "Glazed ceramic", ar: "سيراميك لامع" };
const plug: L = { en: "Hole + rubber plug", ar: "فتحة + سدادة كاوتش" };
const onePot: L[] = [{ en: "Pot", ar: "القصرية" }];
const catSpecs = [spec(SPEC_LABELS.height, heightLabel(14)), spec(SPEC_LABELS.opening, heightLabel(8.5)), spec(SPEC_LABELS.material, ceramic), spec(SPEC_LABELS.drainage, plug), spec(SPEC_LABELS.weight, weightLabel(420))];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "duo",
    name: { en: "The Gossip Duo", ar: "التوأم الرغّاي" },
    kind: { en: "Cat pots · set of 2", ar: "قصاري قطط · طقم 2" },
    badge: { en: "Best seller", ar: "الأكثر مبيعًا" },
    desc: {
      en: "One cat just heard the news, the other can't stop laughing. A pair of glazed ceramic cat pots that look best side by side on a windowsill.",
      ar: "قطة لسه سامعة الخبر، والتانية مش قادرة تبطل ضحك. طقم قصريتين سيراميك شكلهم أحلى جنب بعض على الشباك.",
    },
    styled: { en: "microgreens and clover", ar: "ميكروجرينز ونفل" },
    price: 469, salePercent: 0, stock: 8,
    slots: [
      { en: "the wide-eyed cat", ar: "القطة المخضوضة" },
      { en: "the laughing cat", ar: "القطة اللي بتضحك" },
    ],
    defaultPlants: ["cactus", "cactus"],
    tint: "pink", photo: "duo.webp", pos: "50% 60%",
    vibes: ["giggly", "quirky"], recipients: ["bestie", "crush"],
    specs: [
      spec(SPEC_LABELS.height, { en: "14 cm each", ar: "14 سم لكل واحدة" }),
      spec(SPEC_LABELS.opening, heightLabel(8.5)),
      spec(SPEC_LABELS.material, ceramic),
      spec(SPEC_LABELS.drainage, plug),
      spec(SPEC_LABELS.inBox, { en: "2 pots, 2 plants, care card", ar: "قصريتين، زرعتين، كارت عناية" }),
    ],
    visible: true, featured: true,
  },
  {
    id: "bisbis",
    name: { en: "Bisbis", ar: "بسبس" },
    kind: { en: "Cat pot", ar: "قصرية قطة" },
    badge: { en: "Big eyes", ar: "عيون واسعة" },
    desc: {
      en: "Huge sparkly eyes and pink cheeks. Bisbis looks at you like you just opened a can of tuna.",
      ar: "عيون كبيرة بتلمع وخدود بمبي. بسبس بيبصلك كأنك لسه فاتح علبة تونة.",
    },
    styled: { en: "clover", ar: "نفل" },
    price: 259, salePercent: 0, stock: 12, slots: onePot, defaultPlants: ["echeveria"],
    tint: "sky", photo: "bisbis.webp", pos: "42% 55%",
    vibes: ["cute", "giggly"], recipients: ["kid", "crush", "me"],
    specs: catSpecs, visible: true, featured: false,
  },
  {
    id: "dino",
    name: { en: "Dodo the Dino", ar: "دودو الديناصور" },
    kind: { en: "Dino pot", ar: "قصرية ديناصور" },
    badge: { en: "New", ar: "جديد" },
    desc: {
      en: "A chubby sage-green dinosaur with stubby arms and a spiky tail. Soft matte finish that feels like a pebble.",
      ar: "ديناصور مربرب لونه أخضر فاتح، إيديه قصيرة وديله مشوّك. ملمسه مطفي وناعم زي الزلطة.",
    },
    styled: { en: "cut flowers", ar: "ورد مقطوف" },
    price: 309, salePercent: 0, stock: 6, slots: onePot, defaultPlants: ["echeveria"],
    tint: "lime", photo: "dino.webp", pos: "50% 55%",
    vibes: ["quirky", "cute"], recipients: ["kid", "coworker"],
    specs: [
      spec(SPEC_LABELS.height, heightLabel(11)), spec(SPEC_LABELS.opening, heightLabel(9)),
      spec(SPEC_LABELS.material, { en: "Matte resin", ar: "ريزن مطفي" }),
      spec(SPEC_LABELS.drainage, plug), spec(SPEC_LABELS.weight, weightLabel(310)),
    ],
    visible: true, featured: false,
  },
  {
    id: "dahka",
    name: { en: "Dahka", ar: "ضحكة" },
    kind: { en: "Cat pot", ar: "قصرية قطة" },
    badge: { en: "Fan favourite", ar: "حبيبة الجماهير" },
    desc: {
      en: "Laughing so hard its eyes closed. Dahka is the pot for anyone who needs a small daily giggle.",
      ar: "بتضحك لدرجة إن عينيها غمّضت. ضحكة هي القصرية لأي حد محتاج ضحكة صغيرة كل يوم.",
    },
    styled: { en: "clover", ar: "نفل" },
    price: 259, salePercent: 0, stock: 10, slots: onePot, defaultPlants: ["cactus"],
    tint: "sun", photo: "dahka.webp", pos: "48% 55%",
    vibes: ["giggly"], recipients: ["bestie", "coworker", "mom"],
    specs: catSpecs, visible: true, featured: false,
  },
  {
    id: "twinkle",
    name: { en: "Twinkle", ar: "تونكل" },
    kind: { en: "Buddy pot", ar: "قصرية صاحب" },
    badge: { en: "Pocket size", ar: "حجم الجيب" },
    desc: {
      en: "A palm-sized pebble buddy with little brown boots, giving itself a hug. Small enough for a bookshelf gap.",
      ar: "صاحب صغير قد كف الإيد، لابس بوت بني صغير وحاضن نفسه. صغير كفاية يستخبى بين الكتب.",
    },
    styled: { en: "daisies", ar: "ورد الأقحوان" },
    price: 189, salePercent: 0, stock: 15, slots: onePot, defaultPlants: ["haworthia"],
    tint: "lilac", photo: "twinkle.webp", pos: "50% 50%",
    vibes: ["cozy", "cute"], recipients: ["coworker", "me", "kid"],
    specs: [
      spec(SPEC_LABELS.height, heightLabel(8)), spec(SPEC_LABELS.opening, heightLabel(6.5)),
      spec(SPEC_LABELS.material, { en: "Cement-resin blend", ar: "خليط أسمنت وريزن" }),
      spec(SPEC_LABELS.drainage, { en: "Hole", ar: "فتحة" }), spec(SPEC_LABELS.weight, weightLabel(190)),
    ],
    visible: true, featured: false,
  },
  {
    id: "nono",
    name: { en: "Nono", ar: "نونو" },
    kind: { en: "Cat pot", ar: "قصرية قطة" },
    badge: { en: "Calm vibes", ar: "رايقة" },
    desc: {
      en: "Eyes closed, lashes out, totally at peace. Nono is the bedside-table cat that never wakes you up.",
      ar: "مغمّضة، رموشها باينة، ورايقة على الآخر. نونو قطة الكومودينو اللي عمرها ما هتصحيك.",
    },
    styled: { en: "cat grass", ar: "حشيشة القطط" },
    price: 259, salePercent: 0, stock: 9, slots: onePot, defaultPlants: ["haworthia"],
    tint: "orange", photo: "nono.webp", pos: "45% 60%",
    vibes: ["cozy"], recipients: ["mom", "me"],
    specs: catSpecs, visible: true, featured: false,
  },
];

// Gift-matchmaker tags and care options. Seeded once, then edited in /admin/tags.
type SeedTag = Omit<Tag, "sort" | "visible">;

export const DEFAULT_TAGS: SeedTag[] = [
  { kind: "who", id: "bestie", emoji: "👯", label: { en: "My bestie", ar: "صاحبي الأنتيم" },
    line: { en: "Perfect for the friend who sends you 40 memes a day.", ar: "مثالية للصاحب اللي بيبعتلك 40 ميم في اليوم." } },
  { kind: "who", id: "mom", emoji: "💐", label: { en: "Mom", ar: "ماما" },
    line: { en: "Mom will show it to every single visitor. Guaranteed.", ar: "ماما هتوريها لكل ضيف ييجي البيت. مضمونة." } },
  { kind: "who", id: "coworker", emoji: "💼", label: { en: "A coworker", ar: "زميل في الشغل" },
    line: { en: "Instantly the most popular desk in the office.", ar: "مكتبه هيبقى أشهر مكتب في الشركة." } },
  { kind: "who", id: "crush", emoji: "💘", label: { en: "My crush", ar: "الكراش" },
    line: { en: "Says \"I like you\" without having to say it.", ar: "بتقول \"أنا معجب بيك\" من غير ما تقولها." } },
  { kind: "who", id: "kid", emoji: "🧸", label: { en: "A little one", ar: "حد صغنن" },
    line: { en: "A tiny plant buddy to keep alive together.", ar: "صاحب أخضر صغير تهتموا بيه سوا." } },
  { kind: "who", id: "me", emoji: "🙋", label: { en: "Me, obviously", ar: "ليا أنا طبعًا" },
    line: { en: "No occasion needed. You deserve a little green friend.", ar: "مش محتاج مناسبة. انت تستاهل صاحب أخضر صغير." } },
  { kind: "vibe", id: "giggly", emoji: "😂", label: { en: "Loud & giggly", ar: "دوشة وضحوك" }, line: { en: "", ar: "" } },
  { kind: "vibe", id: "cozy", emoji: "😴", label: { en: "Calm & cozy", ar: "هادي ورايق" }, line: { en: "", ar: "" } },
  { kind: "vibe", id: "cute", emoji: "🥺", label: { en: "Cuteness overload", ar: "كيوت زيادة عن اللزوم" }, line: { en: "", ar: "" } },
  { kind: "vibe", id: "quirky", emoji: "🦖", label: { en: "Delightfully weird", ar: "غريب بس لذيذ" }, line: { en: "", ar: "" } },
];

export const DEFAULT_CARE: Omit<CareOption, "sort">[] = [
  { kind: "sun", id: "bright-indirect", level: 1, label: { en: "Bright, indirect light", ar: "نور قوي غير مباشر" } },
  { kind: "sun", id: "some-direct", level: 2, label: { en: "Bright light, some direct sun", ar: "نور قوي وشوية شمس مباشرة" } },
  { kind: "sun", id: "full-sun", level: 3, label: { en: "Full sun, 4+ hours a day", ar: "شمس كاملة، 4 ساعات أو أكتر" } },
  { kind: "water", id: "every-2-3-weeks", level: 1, label: { en: "Every 2–3 weeks", ar: "كل 2–3 أسابيع" } },
  { kind: "water", id: "every-10-14-days", level: 2, label: { en: "Every 10–14 days", ar: "كل 10–14 يوم" } },
  { kind: "water", id: "weekly", level: 3, label: { en: "Weekly", ar: "كل أسبوع" } },
];

/** Old 0–3 care levels -> option ids (used once when upgrading an existing database). */
export const LEVEL_TO_OPTION = {
  sun: [null, "bright-indirect", "some-direct", "full-sun"],
  water: [null, "every-2-3-weeks", "every-10-14-days", "weekly"],
} as const;

export const DEFAULT_PLANT_VIBES: Record<string, string[]> = {
  cactus: ["quirky", "giggly"],
  echeveria: ["cute", "cozy"],
  haworthia: ["cozy", "quirky"],
};
