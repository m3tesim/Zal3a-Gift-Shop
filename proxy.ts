import { NextResponse, type NextRequest } from "next/server";

// Fast redirect for signed-out visitors. The real session check happens in
// requireAdmin() inside every admin page and action.
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (!req.cookies.has("zal3a_admin")) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
