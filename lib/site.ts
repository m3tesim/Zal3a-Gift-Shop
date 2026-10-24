// Shop-wide settings. Update the handles, WhatsApp number and fees here.

export const WHATSAPP_NUMBER = "201000000000"; // international format, no "+" (placeholder)

export type SocialId = "instagram" | "tiktok" | "facebook" | "whatsapp";

export const SOCIALS: { id: SocialId; label: string; handle: string; href: string }[] = [
  { id: "instagram", label: "Instagram", handle: "@zal3a", href: "https://www.instagram.com/zal3a" },
  { id: "tiktok", label: "TikTok", handle: "@zal3a", href: "https://www.tiktok.com/@zal3a" },
  { id: "facebook", label: "Facebook", handle: "/zal3a", href: "https://www.facebook.com/zal3a" },
  { id: "whatsapp", label: "WhatsApp", handle: "+20 100 000 0000", href: `https://wa.me/${WHATSAPP_NUMBER}` },
];

export const FREE_DELIVERY_OVER = 800;

export type Governorate = "cairo" | "giza" | "alexandria" | "other";

export const DELIVERY: Record<Governorate, { fee: number; freeOver: number | null; days: string }> = {
  cairo: { fee: 60, freeOver: FREE_DELIVERY_OVER, days: "2–3" },
  giza: { fee: 60, freeOver: FREE_DELIVERY_OVER, days: "2–3" },
  alexandria: { fee: 90, freeOver: null, days: "3–5" },
  other: { fee: 90, freeOver: null, days: "3–5" },
};

export function deliveryFee(gov: Governorate, subtotal: number) {
  const d = DELIVERY[gov];
  return d.freeOver !== null && subtotal >= d.freeOver ? 0 : d.fee;
}
