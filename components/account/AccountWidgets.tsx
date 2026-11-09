"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "../I18nProvider";
import { refreshMe } from "./useMe";
import { OrderTracking } from "./OrderTracking";
import {
  logoutCustomerAction, resendVerifyAction, trackOrderAction, unsubscribeAction, updateProfileAction,
} from "@/app/[locale]/account/actions";
import type { Order, OrderEvent } from "@/lib/orders";

export function SignOutButton() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await logoutCustomerAction();
          await refreshMe();
          router.push(`/${locale}`);
          router.refresh();
        })
      }
      className="rounded-full border-2 border-ink bg-paper px-4 py-1.5 font-bold hover:bg-pink hover:text-white"
    >
      {t.account.signOut}
    </button>
  );
}

export function VerifyBanner() {
  const { locale, t } = useI18n();
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-[3px] border-ink bg-sun-soft px-5 py-3">
      <p className="font-bold">✉️ {t.account.verifyBanner}</p>
      {state === "sent" ? (
        <span className="font-bold text-ink-soft">{t.account.verifySent}</span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setState((await resendVerifyAction({ locale })).ok ? "sent" : "error"))}
          className="rounded-full border-2 border-ink bg-paper px-3 py-1 font-bold hover:bg-sun"
        >
          {state === "error" ? t.account.errors.tooMany : t.account.verifyResend}
        </button>
      )}
    </div>
  );
}

export function ProfileForm({ initial }: { initial: { name: string; phone: string; marketing: boolean; email: string } }) {
  const { locale, t } = useI18n();
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfileAction({ locale, name: f.name, phone: f.phone, marketing: f.marketing });
          setMsg(r.ok ? { ok: true, text: t.account.saved } : { ok: false, text: t.account.errors[r.error] });
          if (r.ok) refreshMe();
        });
      }}
    >
      <label className="grid gap-1.5 font-bold">
        {t.account.name}
        <input className="field font-normal" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <label className="grid gap-1.5 font-bold">
        {t.account.email}
        <input className="field font-normal opacity-70" dir="ltr" value={f.email} disabled />
      </label>
      <label className="grid gap-1.5 font-bold">
        {t.account.phone}
        <input className="field font-normal" type="tel" dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </label>
      <label className="flex cursor-pointer items-start gap-3 font-bold">
        <input type="checkbox" checked={f.marketing} onChange={(e) => setF({ ...f, marketing: e.target.checked })} className="mt-1 size-5 shrink-0 accent-pink" />
        {t.account.marketing}
      </label>
      {msg && (
        <p role="status" className={`rounded-2xl px-4 py-2 text-sm font-bold ${msg.ok ? "bg-lime-soft" : "bg-pink-soft"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-sun w-fit">
        {t.account.save}
      </button>
    </form>
  );
}

export function TrackForm({ initialNumber = "" }: { initialNumber?: string }) {
  const { locale, t } = useI18n();
  const [f, setF] = useState({ number: initialNumber, phone: "" });
  const [result, setResult] = useState<{ order: Order; events: OrderEvent[] } | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  if (result) return <OrderTracking order={result.order} events={result.events} locale={locale} />;
  return (
    <form
      className="sticker mx-auto grid w-full max-w-md gap-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await trackOrderAction(f);
          setResult(r);
          setError(!r);
        });
      }}
    >
      <p className="text-ink-soft">{t.track.sub}</p>
      <label className="grid gap-1.5 font-bold">
        {t.track.number}
        <input className="field font-normal uppercase" dir="ltr" required placeholder="ZL-1001" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} />
      </label>
      <label className="grid gap-1.5 font-bold">
        {t.track.phone}
        <input className="field font-normal" type="tel" dir="ltr" required placeholder="01X XXXX XXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </label>
      {error && (
        <p role="alert" className="rounded-2xl bg-pink-soft px-4 py-2 text-sm font-bold">
          {t.track.notFound}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {t.track.find}
      </button>
    </form>
  );
}

export function UnsubscribeButton({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "done" | "bad">("idle");
  const [pending, start] = useTransition();
  if (state !== "idle") return <p className="rounded-2xl bg-lime-soft px-4 py-3 font-bold">{state === "done" ? t.unsubscribe.done : t.unsubscribe.bad}</p>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => setState((await unsubscribeAction(token)).ok ? "done" : "bad"))}
      className="btn btn-pink w-fit"
    >
      {t.unsubscribe.button}
    </button>
  );
}
