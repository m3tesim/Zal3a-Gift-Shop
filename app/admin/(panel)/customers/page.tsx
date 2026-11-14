import Link from "next/link";
import { listCustomers } from "@/lib/server/customers";
import { formatPrice } from "@/lib/i18n";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  const customers = listCustomers();
  const audience = customers.filter((customer) => customer.marketing && customer.emailVerified).length;
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-head text-4xl font-extrabold">Customers</h1>
        <p className="text-ink-soft">
          {customers.length} accounts · <b>{audience}</b> will get offer emails (said yes and confirmed their email).
        </p>
      </header>
      {customers.length === 0 ? (
        <p className="rounded-3xl border-[3px] border-dashed border-ink/30 p-8 text-center font-bold text-ink-soft">No accounts yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border-[3px] border-ink bg-paper">
          <table className="w-full min-w-[720px] text-start">
            <thead className="bg-sun-soft text-sm">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-start">
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Offers</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t-2 border-line [&>td]:px-4 [&>td]:py-3">
                  <td className="font-bold">
                    {customer.name}
                    <span className="ms-2 text-xs font-normal text-ink-soft">{customer.locale === "ar" ? "عربي" : "EN"}</span>
                  </td>
                  <td>
                    <a href={`mailto:${customer.email}`} className="underline-offset-4 hover:underline">
                      {customer.email}
                    </a>
                    {customer.emailVerified ? (
                      <span className="ms-2 rounded-full bg-lime-soft px-2 py-0.5 text-xs font-extrabold">✓ confirmed</span>
                    ) : (
                      <span className="ms-2 rounded-full bg-line px-2 py-0.5 text-xs font-bold">not confirmed</span>
                    )}
                  </td>
                  <td className="tabular-nums">{customer.phone || "—"}</td>
                  <td>{customer.marketing ? "Yes" : "No"}</td>
                  <td>
                    {customer.orders > 0 ? (
                      <Link href={`/admin/orders?q=${encodeURIComponent(customer.email)}`} className="font-bold underline underline-offset-4">
                        {customer.orders}
                      </Link>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="tabular-nums">{formatPrice(customer.spent, "en")}</td>
                  <td className="text-sm text-ink-soft">{new Date(customer.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
