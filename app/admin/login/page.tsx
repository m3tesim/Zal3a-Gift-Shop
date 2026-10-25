import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/server/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const { next = "/admin" } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="sticker grid w-full max-w-sm gap-6 p-7">
        <div className="grid justify-items-center gap-2 text-center">
          <Logo />
          <h1 className="font-head text-3xl font-extrabold">Shop admin</h1>
          <p className="text-sm text-ink-soft">Sign in to manage pots, plants and orders.</p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
