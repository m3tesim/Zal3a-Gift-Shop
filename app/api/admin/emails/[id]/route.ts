import { currentAdmin } from "@/lib/server/auth";
import { emailHtml } from "@/lib/server/email/mailer";

/** Shows a saved email exactly as it was sent (admin only, scripts blocked). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentAdmin())) return new Response("Not signed in", { status: 401 });
  const html = emailHtml(Number((await params).id));
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; img-src * data:; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
