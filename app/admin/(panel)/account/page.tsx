import { requireAdmin } from "@/lib/server/auth";
import { listUsers } from "@/lib/server/users";
import { AccountForms, RemoveAdmin } from "@/components/admin/AccountForms";
import { Panel } from "@/components/admin/ui";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await requireAdmin();
  const users = listUsers();
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Account</h1>
        <p className="text-ink-soft">Signed in as {me.email}</p>
      </header>
      <Panel title="Admins" sub="Everyone here can manage the shop.">
        <ul className="grid gap-2">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-line px-3 py-2">
              <span>
                <b>{user.email}</b>
                {user.id === me.id && <span className="ms-2 rounded-full bg-sun px-2 py-0.5 text-xs font-extrabold">you</span>}
              </span>
              {user.id !== me.id && <RemoveAdmin id={user.id} email={user.email} />}
            </li>
          ))}
        </ul>
      </Panel>
      <AccountForms />
    </div>
  );
}
