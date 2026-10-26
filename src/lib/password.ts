import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const key = await scryptAsync(password, salt, 64)
  return `${salt}:${key.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const key = await scryptAsync(password, salt, 64)
  const expected = Buffer.from(hash, "hex")
  return expected.length === key.length && timingSafeEqual(expected, key)
}
