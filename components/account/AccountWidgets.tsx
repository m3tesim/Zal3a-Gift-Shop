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
  const { locale, dictionary } = useI18n();
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
      {dictionary.account.signOut}
    </button>
  );
}

export function VerifyBanner() {
  const { locale, dictionary } = useI18n();
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-[3px] border-ink bg-sun-soft px-5 py-3">
      <p className="font-bold">✉️ {dictionary.account.verifyBanner}</p>
      {state === "sent" ? (
        <span className="font-bold text-ink-soft">{dictionary.account.verifySent}</span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setState((await resendVerifyAction({ locale })).ok ? "sent" : "error"))}
          className="rounded-full border-2 border-ink bg-paper px-3 py-1 font-bold hover:bg-sun"
        >
          {state === "error" ? dictionary.account.errors.tooMany : dictionary.account.verifyResend}
        </button>
      )}
    </div>
  );
}

export function ProfileForm({ initial }: { initial: { name: string; phone: string; marketing: boolean; email: string } }) {
  const { locale, dictionary } = useI18n();
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await updateProfileAction({ locale, name: form.name, phone: form.phone, marketing: form.marketing });
          setMsg(result.ok ? { ok: true, text: dictionary.account.saved } : { ok: false, text: dictionary.account.errors[result.error] });
          if (result.ok) refreshMe();
        });
      }}
    >
      <label className="grid gap-1.5 font-bold">
        {dictionary.account.name}
        <input className="field font-normal" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </label>
      <label className="grid gap-1.5 font-bold">
        {dictionary.account.email}
        <input className="field font-normal opacity-70" dir="ltr" value={form.email} disabled />
      </label>
      <label className="grid gap-1.5 font-bold">
        {dictionary.account.phone}
        <input className="field font-normal" type="tel" dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      </label>
      <label className="flex cursor-pointer items-start gap-3 font-bold">
        <input type="checkbox" checked={form.marketing} onChange={(event) => setForm({ ...form, marketing: event.target.checked })} className="mt-1 size-5 shrink-0 accent-pink" />
        {dictionary.account.marketing}
      </label>
      {msg && (
        <p role="status" className={`rounded-2xl px-4 py-2 text-sm font-bold ${msg.ok ? "bg-lime-soft" : "bg-pink-soft"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-sun w-fit">
        {dictionary.account.save}
      </button>
    </form>
  );
}

export function TrackForm({ initialNumber = "" }: { initialNumber?: string }) {
  const { locale, dictionary } = useI18n();
  const [form, setForm] = useState({ number: initialNumber, phone: "" });
  const [result, setResult] = useState<{ order: Order; events: OrderEvent[] } | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  if (result) return <OrderTracking order={result.order} events={result.events} locale={locale} />;
  return (
    <form
      className="sticker mx-auto grid w-full max-w-md gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await trackOrderAction(form);
          setResult(result);
          setError(!result);
        });
      }}
    >
      <p className="text-ink-soft">{dictionary.track.sub}</p>
      <label className="grid gap-1.5 font-bold">
        {dictionary.track.number}
        <input className="field font-normal uppercase" dir="ltr" required placeholder="ZL-1001" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
      </label>
      <label className="grid gap-1.5 font-bold">
        {dictionary.track.phone}
        <input className="field font-normal" type="tel" dir="ltr" required placeholder="01X XXXX XXXX" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      </label>
      {error && (
        <p role="alert" className="rounded-2xl bg-pink-soft px-4 py-2 text-sm font-bold">
          {dictionary.track.notFound}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {dictionary.track.find}
      </button>
    </form>
  );
}

export function UnsubscribeButton({ token }: { token: string }) {
  const { dictionary } = useI18n();
  const [state, setState] = useState<"idle" | "done" | "bad">("idle");
  const [pending, start] = useTransition();
  if (state !== "idle") return <p className="rounded-2xl bg-lime-soft px-4 py-3 font-bold">{state === "done" ? dictionary.unsubscribe.done : dictionary.unsubscribe.bad}</p>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => setState((await unsubscribeAction(token)).ok ? "done" : "bad"))}
      className="btn btn-pink w-fit"
    >
      {dictionary.unsubscribe.button}
    </button>
  );
}
