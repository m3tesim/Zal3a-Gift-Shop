import { getDict, type Locale } from "@/lib/i18n";
import { GiftIcon, PlantIcon, TruckIcon } from "../icons";

const STYLE = [
  { card: "bg-sun-soft md:-rotate-2", num: "bg-sun" },
  { card: "bg-pink-soft md:rotate-1 md:translate-y-6", num: "bg-pink text-white" },
  { card: "bg-sky-soft md:-rotate-1", num: "bg-sky" },
];

export function GiftSteps({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const art = [
    <PlantIcon key="a" plant="empty" className="size-24" />,
    <PlantIcon key="b" plant="cactus" className="size-24" />,
    <GiftIcon key="c" className="size-20 text-pink" strokeWidth={2} />,
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-10 grid justify-items-center gap-3 text-center">
        <span className="eyebrow">{t.steps.eyebrow}</span>
        <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{t.steps.title}</h2>
      </div>
      <ol className="grid gap-6 md:grid-cols-3 md:gap-8">
        {t.steps.items.map((s, i) => (
          <li
            key={s.title}
            className={`sticker relative grid content-start gap-3 p-6 pt-8 transition-transform duration-300 hover:rotate-0 ${STYLE[i].card}`}
          >
            <span
              className={`absolute -top-5 start-5 grid size-12 place-items-center rounded-full border-[3px] border-ink font-logo text-2xl ${STYLE[i].num}`}
            >
              {i + 1}
            </span>
            <div className="grid h-28 place-items-center">{art[i]}</div>
            <h3 className="font-head text-2xl font-extrabold">{s.title}</h3>
            <p className="text-ink-soft">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-14 flex w-fit max-w-full items-center gap-3 rounded-full border-[3px] border-dashed border-ink bg-lime-soft px-5 py-3 font-bold">
        <TruckIcon className="shrink-0 text-ink" />
        {t.steps.bonus}
      </p>
    </section>
  );
}
