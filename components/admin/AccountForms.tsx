"use client";

import { useActionState, useTransition } from "react";
import { addAdminAction, changePasswordAction, removeAdminAction } from "@/app/admin/actions";
import { Notice, Panel } from "./ui";

export function AccountForms() {
  const [passwordState, changePassword, passwordPending] = useActionState(changePasswordAction, null);
  const [add, addAdmin, addPending] = useActionState(addAdminAction, null);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Change your password" sub="Other devices you're signed in on will be signed out.">
        <form action={changePassword} className="grid gap-3">
          <label className="grid gap-1 text-sm font-bold">
            Current password
            <input name="current" type="password" required autoComplete="current-password" className="field" />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            New password (10+ characters)
            <input name="next" type="password" required minLength={10} autoComplete="new-password" className="field" />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Repeat new password
            <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className="field" />
          </label>
          {passwordState && <Notice kind={passwordState.ok ? "ok" : "error"}>{passwordState.ok ? "Password changed." : passwordState.error}</Notice>}
          <button type="submit" disabled={passwordPending} className="btn btn-pink w-fit">
            {passwordPending ? "Saving…" : "Change password"}
          </button>
        </form>
      </Panel>

      <Panel title="Add an admin">
        <form action={addAdmin} className="grid gap-3">
          <label className="grid gap-1 text-sm font-bold">
            Email
            <input name="email" type="email" required className="field" />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Password (10+ characters, share it privately)
            <input name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
          </label>
          {add && <Notice kind={add.ok ? "ok" : "error"}>{add.ok ? "Admin added." : add.error}</Notice>}
          <button type="submit" disabled={addPending} className="btn btn-sun w-fit">
            {addPending ? "Adding…" : "Add admin"}
          </button>
        </form>
      </Panel>
    </div>
  );
}

export function RemoveAdmin({ id, email }: { id: number; email: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => confirm(`Remove ${email} as an admin?`) && start(async () => void (await removeAdminAction(id)))}
      className="rounded-full border-2 border-line px-3 py-1 text-sm font-bold hover:border-pink hover:text-pink"
    >
      Remove
    </button>
  );
}
