import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, deleteSession, sessionUser } from "./users";

export const SESSION_COOKIE = "zal3a_admin";

/** The signed-in admin, or null. */
export async function currentAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? sessionUser(token) : null;
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

export async function startSession(userId: number) {
  const { token, expires } = createSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return token;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  jar.delete(SESSION_COOKIE);
}

export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? "";
}

// Simple in-memory brute-force guard for the login form.
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW = 15 * 60_000;
const LIMIT = 8;

export function loginBlocked(key: string) {
  const attempt = attempts.get(key);
  return !!attempt && attempt.count >= LIMIT && attempt.until > Date.now();
}
export function loginFailed(key: string) {
  const attempt = attempts.get(key);
  attempts.set(key, attempt && attempt.until > Date.now() ? { count: attempt.count + 1, until: attempt.until } : { count: 1, until: Date.now() + WINDOW });
}
export function loginSucceeded(key: string) {
  attempts.delete(key);
}
