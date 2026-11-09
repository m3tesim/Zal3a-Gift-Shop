import { cookies } from "next/headers";
import { createCustomerSession, customerFromSession, deleteCustomerSession } from "./customers";

export const CUSTOMER_COOKIE = "zal3a_customer";

/** The signed-in shopper, or null. */
export async function currentCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  return token ? customerFromSession(token) : null;
}

export async function startCustomerSession(customerId: number) {
  const { token, expires } = createCustomerSession(customerId);
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return token;
}

export async function endCustomerSession() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) deleteCustomerSession(token);
  jar.delete(CUSTOMER_COOKIE);
}

export async function customerSessionToken() {
  return (await cookies()).get(CUSTOMER_COOKIE)?.value ?? "";
}
