"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "../I18nProvider";
import { refreshMe } from "./useMe";
import {
  forgotPasswordAction, loginCustomerAction, registerAction, resetPasswordAction, type AccountResult,
} from "@/app/[locale]/account/actions";

/** Only allow redirects back into this locale's pages. */
const safeNext = (next: string | undefined, locale: string) => (next && next.startsWith(`/${locale}/`) && !next.startsWith("//") ? next : `/${locale}/account`);

function useSubmit() {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const submit = (fn: () => Promise<AccountResult>, onOk: () => void) =>
    start(async () => {
      try {
        const r = await fn();
        if (r.ok) onOk();
        else setError(t.account.errors[r.error]);
      } catch {
        setError(t.account.errors.generic);
      }
    });
  return { pending, error, submit };
}

function Field({ label, hint, ...input }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5 font-bold">
      {label}
      <input {...input} className="field font-normal" />
      {hint && <span className="text-sm font-normal text-ink-soft">{hint}</span>}
    </label>
  );
}

function ErrorNote({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="rounded-2xl bg-pink-soft px-4 py-2 text-sm font-bold">
      {error}
    </p>
  ) : null;
}

export function LoginForm({ next }: { next?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [f, setF] = useState({ email: "", password: "" });
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          () => loginCustomerAction(f),
          async () => {
            await refreshMe();
            router.push(safeNext(next, locale));
            router.refresh();
          },
        );
      }}
    >
      <Field label={t.account.email} type="email" dir="ltr" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Field label={t.account.password} type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <Link href={`/${locale}/account/forgot`} className="w-fit text-sm font-bold underline underline-offset-4 hover:text-pink">
        {t.account.forgot}
      </Link>
      <ErrorNote error={error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {t.account.signIn}
      </button>
      <p className="text-center text-sm">
        {t.account.noAccount}{" "}
        <Link href={`/${locale}/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-extrabold text-pink underline underline-offset-4">
          {t.account.register}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", marketing: true });
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          () => registerAction({ ...f, locale }),
          async () => {
            await refreshMe();
            router.push(safeNext(next, locale));
            router.refresh();
          },
        );
      }}
    >
      <Field label={t.account.name} required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Field label={t.account.email} type="email" dir="ltr" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Field
        label={`${t.account.phone} (${t.checkout.optional})`}
        type="tel"
        dir="ltr"
        inputMode="tel"
        autoComplete="tel"
        placeholder="01X XXXX XXXX"
        value={f.phone}
        onChange={(e) => setF({ ...f, phone: e.target.value })}
      />
      <Field
        label={t.account.password}
        hint={t.account.passwordHint}
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={f.password}
        onChange={(e) => setF({ ...f, password: e.target.value })}
      />
      <label className="flex cursor-pointer items-start gap-3 font-bold">
        <input type="checkbox" checked={f.marketing} onChange={(e) => setF({ ...f, marketing: e.target.checked })} className="mt-1 size-5 shrink-0 accent-pink" />
        {t.account.marketing}
      </label>
      <ErrorNote error={error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {t.account.register}
      </button>
      <p className="text-center text-sm">
        {t.account.haveAccount}{" "}
        <Link href={`/${locale}/account/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-extrabold text-pink underline underline-offset-4">
          {t.account.signIn}
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const { locale, t } = useI18n();
  const { pending, error, submit } = useSubmit();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="rounded-2xl bg-lime-soft px-4 py-3 font-bold">{t.account.linkSent}</p>;
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(() => forgotPasswordAction({ locale, email }), () => setSent(true));
      }}
    >
      <p className="text-ink-soft">{t.account.forgotText}</p>
      <Field label={t.account.email} type="email" dir="ltr" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <ErrorNote error={error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {t.account.sendLink}
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [password, setPassword] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          () => resetPasswordAction({ token, password }),
          async () => {
            await refreshMe();
            router.push(`/${locale}/account`);
            router.refresh();
          },
        );
      }}
    >
      <Field
        label={t.account.newPassword}
        hint={t.account.passwordHint}
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <ErrorNote error={error === t.account.errors.generic ? t.account.badLink : error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {t.account.savePassword}
      </button>
    </form>
  );
}
