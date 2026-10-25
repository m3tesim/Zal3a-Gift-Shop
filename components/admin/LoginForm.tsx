"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5 font-bold">
        Email
        <input name="email" type="email" required autoComplete="username" defaultValue={state?.email} className="field" />
      </label>
      <label className="grid gap-1.5 font-bold">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-pink-soft px-4 py-2 text-sm font-bold">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-pink w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
