// First-run catalog. After seeding, everything is edited in /admin.
import type { L, Plant, Product, Spec } from "@/lib/catalog";

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
    price: 90, sun: 3, water: 1, tint: "lime", icon: "cactus", stock: 40, visible: true, potOnly: false,
    recipients: ["bestie", "crush", "me"],
  },
  {
    id: "echeveria",
    name: { en: "Echeveria rosette", ar: "وردة إشيفيريا" },
    latin: { en: "Echeveria elegans", ar: "إشيفيريا إليجانز" },
    blurb: {
      en: "A soft blue-green rosette shaped like a flower. Plump leaves store water for weeks.",
      ar: "وردة لونها أخضر مزرق شكلها زي الزهرة. ورقها المليان بيخزن مية لأسابيع.",
    },
    price: 120, sun: 3, water: 1, tint: "sky", icon: "echeveria", stock: 25, visible: true, potOnly: false,
    recipients: ["mom", "kid", "crush"],
  },
  {
    id: "haworthia",
    name: { en: "Zebra haworthia", ar: "هاورثيا الزيبرا" },
    latin: { en: "Haworthiopsis fasciata", ar: "هاورثيوبسيس فاشياتا" },
    blurb: {
      en: "Striped and spiky but totally harmless. Happy with bright indirect light, so it loves desks.",
      ar: "مخططة وشكلها شقي بس طيبة خالص. بتحب النور غير المباشر، فمكانها المفضل المكتب.",
    },
    price: 135, sun: 2, water: 1, tint: "lilac", icon: "haworthia", stock: 20, visible: true, potOnly: false,
    recipients: ["coworker", "me", "bestie"],
  },
  {
    id: "empty",
    name: { en: "Pot only", ar: "القصرية بس" },
    latin: { en: "Bring your own plant", ar: "هات زرعتك معاك" },
    blurb: {
      en: "Just the pot, with a drainage hole and a plug. Ready for a plant you already love.",
      ar: "القصرية لوحدها، بفتحة تصريف وسدادة. جاهزة لزرعة انت بتحبها أصلًا.",
    },
    price: 0, sun: 0, water: 0, tint: "sun", icon: "pot", stock: null, visible: true, potOnly: true,
    recipients: [],
  },
];

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
const spec = (label: L, value: L): Spec => ({ label, value });
const ceramic: L = { en: "Glazed ceramic", ar: "سيراميك لامع" };
const plug: L = { en: "Hole + rubber plug", ar: "فتحة + سدادة كاوتش" };
const onePot: L[] = [{ en: "Pot", ar: "القصرية" }];
const catSpecs = [spec(S.height, h(14)), spec(S.opening, h(8.5)), spec(S.material, ceramic), spec(S.drainage, plug), spec(S.weight, g(420))];

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
      spec(S.height, { en: "14 cm each", ar: "14 سم لكل واحدة" }),
      spec(S.opening, h(8.5)),
      spec(S.material, ceramic),
      spec(S.drainage, plug),
      spec(S.inBox, { en: "2 pots, 2 plants, care card", ar: "قصريتين، زرعتين، كارت عناية" }),
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
      spec(S.height, h(11)), spec(S.opening, h(9)),
      spec(S.material, { en: "Matte resin", ar: "ريزن مطفي" }),
      spec(S.drainage, plug), spec(S.weight, g(310)),
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
      spec(S.height, h(8)), spec(S.opening, h(6.5)),
      spec(S.material, { en: "Cement-resin blend", ar: "خليط أسمنت وريزن" }),
      spec(S.drainage, { en: "Hole", ar: "فتحة" }), spec(S.weight, g(190)),
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
