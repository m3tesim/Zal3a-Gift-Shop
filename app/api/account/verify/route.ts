import { NextResponse, type NextRequest } from "next/server";
import { consumeCustomerToken, getCustomer, markVerified } from "@/lib/server/customers";
import { claimGuestOrders } from "@/lib/server/orders-repo";

/** Link from the "confirm your email" message. */
export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const locale = req.nextUrl.searchParams.get("l") === "ar" ? "ar" : "en";
  const id = token ? consumeCustomerToken(token, "verify") : null;
  const customer = id ? getCustomer(id) : null;
  if (customer) {
    markVerified(customer.id);
    claimGuestOrders(customer.id, customer.email);
  }
  return NextResponse.redirect(new URL(id ? `/${locale}/account?verified=1` : `/${locale}/account`, req.url));
}
