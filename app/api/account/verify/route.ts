import { NextResponse, type NextRequest } from "next/server";
import { consumeCustomerToken, markVerified } from "@/lib/server/customers";

/** Link from the "confirm your email" message. */
export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const locale = req.nextUrl.searchParams.get("l") === "ar" ? "ar" : "en";
  const id = token ? consumeCustomerToken(token, "verify") : null;
  if (id) markVerified(id);
  return NextResponse.redirect(new URL(id ? `/${locale}/account?verified=1` : `/${locale}/account`, req.url));
}
