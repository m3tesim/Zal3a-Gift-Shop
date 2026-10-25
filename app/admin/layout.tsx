import type { Metadata } from "next";
import "../globals.css";
import { fontVars } from "../fonts";

export const metadata: Metadata = {
  title: { default: "Admin · zal3a", template: "%s · zal3a admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
