import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash, type ScryptOptions } from "node:crypto";

const scrypt = (password: string, salt: Buffer, len: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, len, opts, (err, key) => (err ? reject(err) : resolve(key))));

const PARAMS = { N: 16384, r: 8, p: 1 };

/** Format: scrypt$N$r$p$salt$hash (base64) */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, cost, blockSize, parallelism, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { N: +cost, r: +blockSize, p: +parallelism });
  return timingSafeEqual(key, expected);
}

export const newToken = () => randomBytes(32).toString("base64url");
export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
