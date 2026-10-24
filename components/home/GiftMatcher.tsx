"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "../I18nProvider";
import { useAddToBag } from "../useAddToBag";
import { ArrowIcon, PlantIcon, ShuffleIcon, StarShape } from "../icons";
import { PRODUCTS, TINT, unitPrice, type Vibe } from "@/lib/products";
import { formatPrice } from "@/lib/i18n";

type Who = "bestie" | "mom" | "coworker" | "crush" | "kid" | "me";

const WHO: { key: Who; emoji: string }[] = [
  { key: "bestie", emoji: "👯" },
  { key: "mom", emoji: "💐" },
  { key: "coworker", emoji: "💼" },
  { key: "crush", emoji: "💘" },
  { key: "kid", emoji: "🧸" },
  { key: "me", emoji: "🙋" },
];
const VIBES: { key: Vibe; emoji: string }[] = [
  { key: "giggly", emoji: "😂" },
  { key: "cozy", emoji: "😴" },
  { key: "cute", emoji: "🥺" },
  { key: "quirky", emoji: "🦖" },
];

function Chip({ on, onClick, emoji, label, onClass }: { on: boolean; onClick: () => void; emoji: string; label: string; onClass: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border-[3px] border-ink px-4 py-2 font-bold transition-all duration-200 ease-[cubic-bezier(.3,1.6,.5,1)] ${on ? `${onClass} -rotate-2 scale-105 shadow-pop-sm` : "bg-paper hover:-translate-y-0.5"}`}
    >
      <span aria-hidden="true" className="text-xl leading-none">
        {emoji}
      </span>
      {label}
    </button>
  );
}

export function GiftMatcher() {
  const { locale, t } = useI18n();
  const addToBag = useAddToBag();
  const [who, setWho] = useState<Who | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [pick, setPick] = useState(0);

  // Best matches first, then everyone else, so "show me another" keeps going.
  const ranked = vibe ? [...PRODUCTS.filter((p) => p.vibes.includes(vibe)), ...PRODUCTS.filter((p) => !p.vibes.includes(vibe))] : [];
  const match = who && vibe ? ranked[pick % ranked.length] : null;

  return (
    <section id="matcher" className="scroll-mt-24 px-4 py-12">
      <div className="relative mx-auto grid max-w-6xl gap-10 rounded-[40px] border-[3px] border-ink bg-pink-soft p-6 shadow-pop sm:p-10 md:grid-cols-[1.15fr_1fr]">
        <StarShape className="absolute -top-6 end-10 size-12 animate-wiggle text-sun" />
        <div className="grid content-start gap-6">
          <div className="grid gap-3">
            <span className="eyebrow">{t.matcher.eyebrow}</span>
            <h2 className="font-head text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold">{t.matcher.title}</h2>
            <p className="text-lg text-ink-soft">{t.matcher.sub}</p>
          </div>
          <fieldset className="grid gap-3">
            <legend className="mb-3 flex items-center gap-2 font-head text-xl">
              <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-sun font-logo text-base">1</span>
              {t.matcher.whoQ}
            </legend>
            <div className="flex flex-wrap gap-2">
              {WHO.map((w) => (
                <Chip key={w.key} on={who === w.key} onClick={() => setWho(w.key)} emoji={w.emoji} label={t.matcher.who[w.key]} onClass="bg-sun" />
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-3">
            <legend className="mb-3 flex items-center gap-2 font-head text-xl">
              <span className="grid size-8 place-items-center rounded-full border-2 border-ink bg-sky font-logo text-base">2</span>
              {t.matcher.vibeQ}
            </legend>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <Chip
                  key={v.key}
                  on={vibe === v.key}
                  onClick={() => {
                    setVibe(v.key);
                    setPick(0);
                  }}
                  emoji={v.emoji}
                  label={t.matcher.vibe[v.key]}
                  onClass="bg-sky"
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div aria-live="polite" className="grid">
          {match && who ? (
            <div key={`${match.id}-${who}`} className={`relative grid animate-rise content-start gap-4 rounded-[28px] border-[3px] border-ink p-4 ${TINT[match.tint].soft}`}>
              <span className="absolute -top-4 start-4 z-10 -rotate-6 rounded-full border-[3px] border-ink bg-pink px-4 py-1 font-head text-xl text-white shadow-pop-sm">
                {t.matcher.match}
              </span>
              <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] border-[3px] border-ink bg-paper">
                <Image src={match.img} alt={match.name[locale]} fill sizes="(min-width: 768px) 440px, 90vw" className="object-cover" style={{ objectPosition: match.pos }} />
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-head text-3xl font-extrabold">{match.name[locale]}</h3>
                <span className="shrink-0 rounded-full border-2 border-ink bg-paper px-3 py-1 font-extrabold tabular-nums">
                  {formatPrice(unitPrice(match.id, match.plant), locale)}
                </span>
              </div>
              <p className="text-lg font-bold">{t.matcher.lines[who]}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-pink flex-1" onClick={() => addToBag(match.id, match.plant)}>
                  {t.matcher.add}
                </button>
                <button type="button" className="btn btn-white" onClick={() => setPick((n) => n + 1)}>
                  <ShuffleIcon />
                  {t.matcher.another}
                </button>
              </div>
              <Link href={`/${locale}/pots/${match.id}`} className="inline-flex w-fit items-center gap-1.5 font-bold underline underline-offset-4 hover:text-pink">
                {t.matcher.view}
                <ArrowIcon width={16} height={16} className="rtl:-scale-x-100" />
              </Link>
            </div>
          ) : (
            <div className="grid place-content-center justify-items-center gap-4 rounded-[28px] border-[3px] border-dashed border-ink/40 bg-paper/60 p-8 text-center">
              <div className="relative">
                <PlantIcon plant="empty" className="size-32 animate-wiggle" />
                <span className="absolute -end-3 -top-2 grid size-12 place-items-center rounded-full border-[3px] border-ink bg-sun font-logo text-2xl">?</span>
              </div>
              <p className="max-w-[24ch] text-lg font-bold">{t.matcher.waiting}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
