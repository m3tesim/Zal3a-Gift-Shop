// npm run admin:create -- someone@example.com 'a-long-password'
// Creates an admin, or resets the password if the email already exists.
import fs from "node:fs";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
const { getDb } = await import("@/lib/server/db");
const { createUser, setPassword } = await import("@/lib/server/users");

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error("Usage: npm run admin:create -- <email> <password (10+ characters)>");
  process.exit(1);
}
const existing = getDb().prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase()) as { id: number } | undefined;
if (existing) {
  await setPassword(existing.id, password);
  console.log(`Password reset for ${email}`);
} else {
  await createUser(email, password);
  console.log(`Admin created: ${email}`);
}
