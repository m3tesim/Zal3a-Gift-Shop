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
  const { dictionary } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const submit = (request: () => Promise<AccountResult>, onOk: () => void) =>
    start(async () => {
      try {
        const result = await request();
        if (result.ok) onOk();
        else setError(dictionary.account.errors[result.error]);
      } catch {
        setError(dictionary.account.errors.generic);
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
  const { locale, dictionary } = useI18n();
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [form, setForm] = useState({ email: "", password: "" });
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(
          () => loginCustomerAction(form),
          async () => {
            await refreshMe();
            router.push(safeNext(next, locale));
            router.refresh();
          },
        );
      }}
    >
      <Field label={dictionary.account.email} type="email" dir="ltr" required autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <Field label={dictionary.account.password} type="password" required autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      <Link href={`/${locale}/account/forgot`} className="w-fit text-sm font-bold underline underline-offset-4 hover:text-pink">
        {dictionary.account.forgot}
      </Link>
      <ErrorNote error={error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {dictionary.account.signIn}
      </button>
      <p className="text-center text-sm">
        {dictionary.account.noAccount}{" "}
        <Link href={`/${locale}/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-extrabold text-pink underline underline-offset-4">
          {dictionary.account.register}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { locale, dictionary } = useI18n();
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", marketing: true });
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(
          () => registerAction({ ...form, locale }),
          async () => {
            await refreshMe();
            router.push(safeNext(next, locale));
            router.refresh();
          },
        );
      }}
    >
      <Field label={dictionary.account.name} required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <Field label={dictionary.account.email} type="email" dir="ltr" required autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <Field
        label={`${dictionary.account.phone} (${dictionary.checkout.optional})`}
        type="tel"
        dir="ltr"
        inputMode="tel"
        autoComplete="tel"
        placeholder="01X XXXX XXXX"
        value={form.phone}
        onChange={(event) => setForm({ ...form, phone: event.target.value })}
      />
      <Field
        label={dictionary.account.password}
        hint={dictionary.account.passwordHint}
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
      />
      <label className="flex cursor-pointer items-start gap-3 font-bold">
        <input type="checkbox" checked={form.marketing} onChange={(event) => setForm({ ...form, marketing: event.target.checked })} className="mt-1 size-5 shrink-0 accent-pink" />
        {dictionary.account.marketing}
      </label>
      <ErrorNote error={error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {dictionary.account.register}
      </button>
      <p className="text-center text-sm">
        {dictionary.account.haveAccount}{" "}
        <Link href={`/${locale}/account/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-extrabold text-pink underline underline-offset-4">
          {dictionary.account.signIn}
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const { locale, dictionary } = useI18n();
  const { pending, error, submit } = useSubmit();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="rounded-2xl bg-lime-soft px-4 py-3 font-bold">{dictionary.account.linkSent}</p>;
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(() => forgotPasswordAction({ locale, email }), () => setSent(true));
      }}
    >
      <p className="text-ink-soft">{dictionary.account.forgotText}</p>
      <Field label={dictionary.account.email} type="email" dir="ltr" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <ErrorNote error={error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {dictionary.account.sendLink}
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { locale, dictionary } = useI18n();
  const router = useRouter();
  const { pending, error, submit } = useSubmit();
  const [password, setPassword] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
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
        label={dictionary.account.newPassword}
        hint={dictionary.account.passwordHint}
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <ErrorNote error={error === dictionary.account.errors.generic ? dictionary.account.badLink : error} />
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {dictionary.account.savePassword}
      </button>
    </form>
  );
}
