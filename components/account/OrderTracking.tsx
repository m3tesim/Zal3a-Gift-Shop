import Link from "next/link";
import { formatPrice, getDict, type Locale } from "@/lib/i18n";
import { ORDER_STEPS, type Order, type OrderEvent } from "@/lib/orders";
import { CheckIcon } from "../icons";

const fmtDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleString(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Timeline + contents of an order. Works on the server and in the browser. */
export function OrderTracking({
  order,
  events,
  locale,
  reviewLinks = false,
}: {
  order: Order;
  events: OrderEvent[];
  locale: Locale;
  reviewLinks?: boolean;
}) {
  const dictionary = getDict(locale);
  const cancelled = order.status === "cancelled";
  const reached = ORDER_STEPS.indexOf(order.status);
  const when = (status: string) => [...events].reverse().find((statusEvent) => statusEvent.status === status)?.at;

  return (
    <div className="grid gap-5">
      <div className="sticker grid gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span dir="ltr" className="font-logo text-3xl">
            {order.number}
          </span>
          <span className="text-sm text-ink-soft">
            {dictionary.track.placed} {fmtDate(order.createdAt, locale)}
          </span>
        </div>

        {cancelled ? (
          <p className="rounded-2xl border-2 border-ink bg-line px-4 py-3 font-bold">
            {dictionary.status.cancelled}. {dictionary.track.cancelledNote}
          </p>
        ) : (
          <ol className="grid gap-0 sm:grid-cols-4">
            {ORDER_STEPS.map((step, stepIndex) => {
              const done = stepIndex <= reached;
              const at = when(step);
              return (
                <li key={step} className="relative flex items-start gap-3 pb-5 sm:grid sm:justify-items-center sm:pb-0 sm:text-center">
                  {stepIndex < ORDER_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute start-[15px] top-8 bottom-0 w-[3px] sm:start-[calc(50%+18px)] sm:top-[15px] sm:bottom-auto sm:h-[3px] sm:w-[calc(100%-36px)] ${stepIndex < reached ? "bg-lime" : "bg-line"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-[3px] border-ink ${done ? "bg-lime" : "bg-paper"} ${stepIndex === reached ? "ring-4 ring-lime-soft" : ""}`}
                  >
                    {done && <CheckIcon width={14} height={14} />}
                  </span>
                  <span className="grid sm:mt-2">
                    <b className={done ? "" : "text-ink-soft"}>{dictionary.status[step]}</b>
                    {done && at && <small className="text-ink-soft">{fmtDate(at, locale)}</small>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="sticker grid content-start gap-3 p-5">
          <h2 className="font-head text-xl font-extrabold">{dictionary.track.items}</h2>
          <ul className="grid gap-2">
            {order.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-line pb-2">
                <span>
                  <b>
                    {item.qty} × {item.name[locale]}
                  </b>
                  <small className="block text-ink-soft">{item.plants.map((plant) => plant.name[locale]).join(" + ")}</small>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-bold tabular-nums">{formatPrice(item.unit * item.qty, locale)}</span>
                  {reviewLinks && order.status === "delivered" && (
                    <Link href={`/${locale}/pots/${item.productId}#reviews`} className="rounded-full border-2 border-ink bg-sun px-3 py-0.5 text-sm font-extrabold hover:-rotate-2">
                      ★ {dictionary.account.reviewThis}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-lg font-extrabold tabular-nums">
            <span>{dictionary.track.total}</span>
            <span>{formatPrice(order.total, locale)}</span>
          </div>
        </div>
        <div className="sticker grid content-start gap-1 bg-sky-soft p-5">
          <h2 className="font-head text-xl font-extrabold">{dictionary.track.deliveringTo}</h2>
          <p className="font-bold">{order.gift?.name ?? order.contact.name}</p>
          <p className="text-ink-soft">
            {order.address.area}, {dictionary.checkout.govs[order.address.governorate]}
          </p>
          <p className="mt-2 text-sm text-ink-soft">{dictionary.checkout.pay[order.payment].title}</p>
        </div>
      </div>
    </div>
  );
}
