// Branded HTML emails (inline styles, table layout, so they render in every mail app).
import { formatPrice, type Locale } from "@/lib/i18n";
import type { Order, OrderStatus } from "@/lib/orders";
import { siteUrl } from "./mailer";

const C = { cream: "#fff8ec", ink: "#3d1a5b", soft: "#7a5a92", pink: "#f72c83", sun: "#ffc72c", lime: "#7bd84a" };

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain text from the admin -> paragraphs with line breaks. */
export const paragraphs = (text: string) =>
  text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

const S = {
  en: {
    footer: "Character pots with real little plants, potted by hand in Cairo.",
    unsubscribe: "Unsubscribe from offers",
    status: {
      new: {
        subject: (n: string) => `We got your order ${n}! 🌱`,
        title: (name: string) => `Thank you, ${name}!`,
        text: "Your order is in and your pots are getting ready. We'll email you again when it's confirmed and when it's on the way.",
      },
      confirmed: {
        subject: (n: string) => `Order ${n} is confirmed`,
        title: () => "We're potting your plants!",
        text: "Your order is confirmed. We're potting, pebbling and wrapping everything by hand now.",
      },
      shipped: {
        subject: () => "Your pots are on their way! 🚚",
        title: () => "On its way!",
        text: "Your order has left our shop. The courier will call before delivering.",
      },
      delivered: {
        subject: () => "Delivered! Say hi to your new roommates 🪴",
        title: () => "Delivered!",
        text: "We hope it made someone smile. Got a minute? Tell other plant lovers what you think by leaving a review.",
      },
      cancelled: {
        subject: (n: string) => `Order ${n} was cancelled`,
        title: () => "Your order was cancelled",
        text: "If this is a surprise, just reply to this email or message us on WhatsApp and we'll sort it out.",
      },
    } satisfies Record<OrderStatus, unknown>,
    track: "Track your order",
    review: "Leave a review",
    order: "Order",
    deliveringTo: "Delivering to",
    delivery: "Delivery",
    free: "Free",
    total: "Total",
    verify: {
      subject: "Confirm your email for zal3a",
      title: (name: string) => `Welcome, ${name}! 🌵`,
      text: "Tap the button to confirm your email. This link works for 48 hours.",
      cta: "Confirm my email",
    },
    reset: {
      subject: "Reset your zal3a password",
      title: "Forgot your password?",
      text: "No worries. Tap the button to choose a new one. This link works for 1 hour. If you didn't ask for this, you can ignore this email.",
      cta: "Choose a new password",
    },
  },
  ar: {
    footer: "قصاري بوشوش وجواها زرع حقيقي، بنزرعها بإيدينا في القاهرة.",
    unsubscribe: "إلغاء الاشتراك في العروض",
    status: {
      new: {
        subject: (n: string) => `وصلنا طلبك ${n}! 🌱`,
        title: (name: string) => `شكرًا يا ${name}!`,
        text: "طلبك وصل وقصاريك بتجهز. هنبعتلك إيميل تاني لما نأكده ولما يبقى في الطريق.",
      },
      confirmed: {
        subject: (n: string) => `طلبك ${n} اتأكد`,
        title: () => "بنزرع قصاريك دلوقتي!",
        text: "طلبك اتأكد. بنزرع ونحط الزلط ونغلف كل حاجة بإيدينا دلوقتي.",
      },
      shipped: {
        subject: () => "قصاريك في الطريق! 🚚",
        title: () => "في الطريق!",
        text: "طلبك خرج من عندنا. المندوب هيكلمك قبل ما يوصل.",
      },
      delivered: {
        subject: () => "وصلت! سلّم على شركاء السكن الجداد 🪴",
        title: () => "وصلت!",
        text: "نتمنى تكون فرّحت حد. عندك دقيقة؟ قول رأيك واكتب تقييم يساعد غيرك.",
      },
      cancelled: {
        subject: (n: string) => `طلبك ${n} اتلغى`,
        title: () => "طلبك اتلغى",
        text: "لو ده مفاجأة ليك، رد على الإيميل ده أو كلمنا على واتساب وهنحلها.",
      },
    } satisfies Record<OrderStatus, unknown>,
    track: "تابع طلبك",
    review: "اكتب تقييم",
    order: "الطلب",
    deliveringTo: "التوصيل لـ",
    delivery: "التوصيل",
    free: "مجاني",
    total: "الإجمالي",
    verify: {
      subject: "أكد إيميلك في زلعة",
      title: (name: string) => `أهلًا يا ${name}! 🌵`,
      text: "دوس على الزرار عشان تأكد إيميلك. اللينك شغال لمدة 48 ساعة.",
      cta: "أكد الإيميل",
    },
    reset: {
      subject: "غيّر باسورد زلعة",
      title: "نسيت الباسورد؟",
      text: "ولا يهمك. دوس على الزرار واختار باسورد جديد. اللينك شغال لمدة ساعة. لو مطلبتش ده، تجاهل الإيميل.",
      cta: "اختار باسورد جديد",
    },
  },
};

function button(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px"><tr><td style="border-radius:999px;background:${C.pink};border:3px solid ${C.ink}">
    <a href="${esc(url)}" style="display:inline-block;padding:12px 26px;color:#fff;font-weight:800;font-size:16px;text-decoration:none;font-family:Arial,sans-serif">${esc(label)}</a>
  </td></tr></table>`;
}

function layout(locale: Locale, o: { title: string; body: string; cta?: { label: string; url: string }; image?: string; unsubscribeUrl?: string }) {
  const s = S[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  return `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(o.title)}</title></head>
<body style="margin:0;background:${C.cream};font-family:Arial,'Segoe UI',Tahoma,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 6px 14px;text-align:${align}">
      <span style="font-size:30px;font-weight:900;color:${C.ink};letter-spacing:-1px">zal<span style="color:${C.pink}">3</span>a</span>
      <span style="font-size:18px;color:${C.pink};font-weight:700">&nbsp;زلعة</span>
    </td></tr>
    <tr><td style="background:#fff;border:3px solid ${C.ink};border-radius:24px;padding:28px;text-align:${align};direction:${dir}">
      ${o.image ? `<img src="${esc(o.image)}" alt="" width="500" style="display:block;width:100%;height:auto;border-radius:16px;border:3px solid ${C.ink};margin:0 0 20px">` : ""}
      <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:${C.ink}">${esc(o.title)}</h1>
      <div style="font-size:16px;line-height:1.6;color:${C.ink}">${o.body}</div>
      ${o.cta ? button(o.cta.label, o.cta.url) : ""}
    </td></tr>
    <tr><td style="padding:18px 6px;font-size:13px;color:${C.soft};text-align:${align};direction:${dir}">
      ${esc(s.footer)}<br><a href="${siteUrl()}/${locale}" style="color:${C.soft}">${siteUrl().replace(/^https?:\/\//, "")}</a>
      ${o.unsubscribeUrl ? `<br><br><a href="${esc(o.unsubscribeUrl)}" style="color:${C.soft}">${esc(s.unsubscribe)}</a>` : ""}
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const GOVS: Record<Locale, Record<string, string>> = {
  en: { cairo: "Cairo", giza: "Giza", alexandria: "Alexandria", other: "Another governorate" },
  ar: { cairo: "القاهرة", giza: "الجيزة", alexandria: "الإسكندرية", other: "محافظة تانية" },
};

export function orderStatusEmail(order: Order, status: OrderStatus, links: { track: string; review?: string }) {
  const L = order.locale;
  const s = S[L];
  const copy = s.status[status];
  const name = order.contact.name.split(" ")[0];
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;border-bottom:1px dashed #f1dcc4">${i.qty} × <b>${esc(i.name[L])}</b><br><span style="color:${C.soft};font-size:14px">${esc(i.plants.map((p) => p.name[L]).join(" + "))}</span></td>
        <td style="padding:6px 0;border-bottom:1px dashed #f1dcc4;text-align:${L === "ar" ? "left" : "right"};white-space:nowrap">${esc(formatPrice(i.unit * i.qty, L))}</td>
      </tr>`,
    )
    .join("");
  const a = order.address;
  const body = `
    <p style="margin:0 0 16px">${esc(copy.text)}</p>
    <p style="margin:0 0 8px;font-weight:800">${esc(s.order)} ${esc(order.number)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}
      <tr><td style="padding:6px 0;color:${C.soft}">${esc(s.delivery)}</td><td style="padding:6px 0;text-align:${L === "ar" ? "left" : "right"}">${esc(order.delivery ? formatPrice(order.delivery, L) : s.free)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:800">${esc(s.total)}</td><td style="padding:6px 0;font-weight:800;text-align:${L === "ar" ? "left" : "right"}">${esc(formatPrice(order.total, L))}</td></tr>
    </table>
    <p style="margin:16px 0 0;color:${C.soft};font-size:14px">${esc(s.deliveringTo)}: ${esc(order.gift?.name ?? order.contact.name)} · ${esc(a.area)}, ${esc(GOVS[L][a.governorate] ?? a.governorate)}</p>`;
  const cta = status === "delivered" && links.review ? { label: s.review, url: links.review } : { label: s.track, url: links.track };
  return { subject: copy.subject(order.number), html: layout(L, { title: copy.title(name), body, cta }) };
}

export function verifyEmail(locale: Locale, name: string, url: string) {
  const s = S[locale].verify;
  return { subject: s.subject, html: layout(locale, { title: s.title(name.split(" ")[0]), body: `<p style="margin:0">${esc(s.text)}</p>`, cta: { label: s.cta, url } }) };
}

export function resetEmail(locale: Locale, url: string) {
  const s = S[locale].reset;
  return { subject: s.subject, html: layout(locale, { title: s.title, body: `<p style="margin:0">${esc(s.text)}</p>`, cta: { label: s.cta, url } }) };
}

export function offerEmail(
  locale: Locale,
  o: { title: string; body: string; ctaLabel: string; ctaUrl: string; image?: string | null },
  unsubscribeUrl: string,
) {
  return layout(locale, {
    title: o.title,
    body: paragraphs(o.body),
    cta: o.ctaLabel && o.ctaUrl ? { label: o.ctaLabel, url: o.ctaUrl } : undefined,
    image: o.image ?? undefined,
    unsubscribeUrl,
  });
}
