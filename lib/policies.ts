import type { Locale } from "./i18n";

export type PolicyId = "shipping" | "refunds";
export const POLICY_PATHS: Record<PolicyId, string> = { shipping: "shipping-policy", refunds: "refund-policy" };

type PolicyItem = { label?: string; text: string };
type PolicySection = { heading: string; paragraphs?: string[]; items?: PolicyItem[] };
export type Policy = { title: string; intro: string[]; sections: PolicySection[]; related?: { id: PolicyId; label: string } };

export const POLICIES: Record<PolicyId, Record<Locale, Policy>> = {
  shipping: {
    en: {
      title: "Shipping & Delivery Policy",
      intro: [
        "At zal3a we always do our best to get your order to you as quickly as possible and in great condition. Delivery usually takes 3 to 10 working days unless otherwise agreed, and some items may take more or less time.",
        "Deliveries are handled by our approved shipping partners, who are responsible for delivering orders and collecting payment on delivery.",
        "Once your order is confirmed, we will contact you to arrange the delivery time, and you will receive a WhatsApp message when your order leaves with the courier, including the courier's name, phone number and the amount to be collected.",
        "Shipping rates may vary based on order size, region and specific items, and are always shown before you confirm your order.",
      ],
      sections: [
        {
          heading: "Inspection on delivery",
          paragraphs: ["You are welcome to inspect your full order in the presence of the courier before accepting it, and check the items, quantities and condition."],
        },
        {
          heading: "If an order is not received after dispatch",
          paragraphs: [
            "Once an order has left with the courier, the delivery trip has already been made. For that reason the shipping fee is due if the order is not received for a reason on the customer's side, such as refusing the delivery, cancelling after dispatch, or not being reachable at the agreed time.",
          ],
          items: [
            { text: "The shipping fee is paid to the courier, or deducted from any amount paid in advance." },
            { text: "If the order had free shipping, the standard shipping fee for your area applies, as free shipping applies to delivered orders." },
            { text: "Any change or cancellation must be made through customer care only, ideally before the order is dispatched so that no fee applies." },
          ],
        },
        {
          heading: "Follow-up deliveries",
          items: [
            { label: "Missing or temporarily unavailable items", text: "we ship the available part of your order and send the rest as soon as it is available, with no additional shipping fee." },
            { label: "Picking errors on our side", text: "we deliver the correct item and collect the wrong one at no charge." },
            {
              label: "New items added to an existing order",
              text: "the price of the new items applies, plus shipping for the added weight only, calculated on top of your original order's shipping rather than as a new shipment.",
            },
            {
              label: "Exchanges",
              text: "the value of the exchanged item is credited to you, and only the price difference is collected if the replacement costs more, plus shipping for any added weight. If the replacement costs less, the difference stays with you as store credit.",
            },
          ],
        },
      ],
      related: { id: "refunds", label: "Read our returns & exchanges policy" },
    },
    ar: {
      title: "سياسة الشحن والتوصيل",
      intro: [
        "في زلعة بنحرص إن طلبك يوصلك في أسرع وقت ممكن وبأفضل حالة. مدة التوصيل عادةً من 3 إلى 10 أيام عمل، إلا لو تم الاتفاق على غير كده، وبعض المنتجات ممكن تاخد وقت أقل أو أكتر.",
        "التوصيل بيتم من خلال شركات شحن معتمدة، مسؤولة عن توصيل الطلبات وتحصيل قيمتها عند الاستلام.",
        "بعد تأكيد الطلب، بيتم التواصل مع حضرتك لتحديد موعد التوصيل، وبيوصلك إشعار على واتساب بمجرد خروج الطلب مع المندوب فيه اسم المندوب ورقمه والمبلغ المطلوب تحصيله.",
        "رسوم الشحن بتختلف حسب حجم الطلب والمنطقة ونوع المنتجات، وبتظهر بوضوح قبل تأكيد الطلب.",
      ],
      sections: [
        {
          heading: "المعاينة عند الاستلام",
          paragraphs: ["من حق حضرتك تعاين الطلب بالكامل في وجود المندوب قبل الاستلام، وتتأكد من الأصناف والكمية والحالة."],
        },
        {
          heading: "في حالة عدم استلام الطلب بعد خروجه للتوصيل",
          paragraphs: [
            "بمجرد خروج الطلب مع المندوب تكون رحلة التوصيل تمت بالفعل، علشان كده رسوم الشحن بتكون مستحقة لو الطلب ما اتسلمش لسبب من طرف العميل، زي رفض الاستلام أو الإلغاء بعد خروج الطلب أو تعذّر التواصل في الموعد المتفق عليه.",
          ],
          items: [
            { text: "بيتم دفع رسوم الشحن للمندوب، أو خصمها من أي مبلغ مدفوع مقدماً." },
            { text: "لو الطلب كان عليه شحن مجاني، بيتم تطبيق رسوم الشحن المعتادة لمنطقة حضرتك، لأن الشحن المجاني مرتبط باستلام الطلب." },
            { text: "أي تعديل أو إلغاء للطلب بيتم من خلال خدمة العملاء فقط، ويفضل قبل خروج الطلب علشان ما يكونش في أي رسوم." },
          ],
        },
        {
          heading: "التوصيلات المكملة للطلب",
          items: [
            { label: "صنف ناقص أو غير متوفر مؤقتاً", text: "بنشحن الجزء المتاح، وبنبعت الباقي أول ما يتوفر من غير رسوم شحن إضافية." },
            { label: "خطأ في التجهيز من طرفنا", text: "بنوصل الصنف الصحيح ونستلم الصنف الخطأ بدون أي رسوم." },
            { label: "إضافة أصناف جديدة على طلب قائم", text: "بيتم تحصيل سعر الأصناف الجديدة، ورسوم شحن للوزن الإضافي فقط، محسوبة استكمالاً لشحن الطلب الأصلي وليس كشحنة جديدة." },
            {
              label: "الاستبدال",
              text: "قيمة الصنف المستبدل بتتحسب لحضرتك كرصيد، وبيتم تحصيل فرق السعر فقط لو البديل أغلى، مع رسوم شحن للوزن الإضافي إن وجد. ولو البديل أرخص بيفضل الفرق رصيد لحضرتك في المتجر.",
            },
          ],
        },
      ],
      related: { id: "refunds", label: "اقرا سياسة الاسترجاع والاستبدال" },
    },
  },
  refunds: {
    en: {
      title: "Returns & Exchanges Policy",
      intro: [],
      sections: [
        {
          heading: "In short",
          items: [
            { text: "You are welcome to inspect your full order in the presence of the courier before accepting it." },
            {
              text: "A plant can be exchanged if it has a defect (pests or fungal disease) within 3 days of delivery, as long as it is still in the same condition as when it was delivered. The value of the exchanged plant is credited to you, and only the price difference is collected if the replacement costs more.",
            },
            { text: "Other products can be returned within 7 days of delivery, as long as they are in their original condition and unused." },
            { text: "Any return, exchange or cancellation request must be made through customer care only." },
            { text: "If an order is not received after it has left for delivery, the shipping fee applies as explained in our shipping policy." },
          ],
        },
      ],
      related: { id: "shipping", label: "Read our shipping & delivery policy" },
    },
    ar: {
      title: "سياسة الاسترجاع والاستبدال",
      intro: [],
      sections: [
        {
          heading: "ملخص",
          items: [
            { text: "من حق حضرتك تعاين الطلب بالكامل في وجود المندوب قبل الاستلام." },
            {
              text: "يتم استبدال النبات في حالة وجود عيب به (آفات أو أمراض فطرية) خلال 3 أيام من الاستلام، بشرط أن يكون النبات في نفس حالته وقت التسليم. قيمة النبات المستبدل بتتحسب رصيد لحضرتك، ويتم تحصيل فرق السعر فقط لو البديل أغلى.",
            },
            { text: "باقي المنتجات يمكن طلب إرجاعها خلال 7 أيام من الاستلام بشرط أن تكون بحالتها الأصلية وغير مستخدمة." },
            { text: "أي طلب إرجاع أو استبدال أو إلغاء يتم من خلال خدمة العملاء فقط." },
            { text: "في حالة عدم استلام الطلب بعد خروجه للتوصيل، تُطبق رسوم الشحن كما هو موضح في سياسة الشحن." },
          ],
        },
      ],
      related: { id: "shipping", label: "اقرا سياسة الشحن والتوصيل" },
    },
  },
};
