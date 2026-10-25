import { requireAdmin } from "@/lib/server/auth";
import { orderStats } from "@/lib/server/orders-repo";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[230px_1fr]">
      <AdminNav email={me.email} newOrders={orderStats().byStatus.new ?? 0} />
      <main className="mx-auto w-full max-w-6xl min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
