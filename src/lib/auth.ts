import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { SESSION_COOKIE } from "@/lib/session-cookie"
import { readStore, shopOf, type User } from "@/lib/store"

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

async function secret() {
  return process.env.AUTH_SECRET || (await readStore()).secret
}

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("hex")
}

/** Cookie value: `<userId>.<expiresAt>.<hmac>`. */
export async function createSession(userId: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `${userId}.${expires}`
  const value = `${payload}.${sign(payload, await secret())}`
  const store = await cookies()
  store.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/**
 * The signed-in user, or null. Re-reads the store every time, so approving,
 * disabling or deleting an account takes effect on the user's next request.
 */
export async function getCurrentUser(): Promise<User | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value
  if (!value) return null
  const [userId, expires, signature] = value.split(".")
  if (!userId || !expires || !signature) return null
  // Reading the clock must happen at request time, never during prerendering.
  await connection()
  if (Number(expires) < Date.now() / 1000) return null
  const expected = Buffer.from(sign(`${userId}.${expires}`, await secret()), "hex")
  const given = Buffer.from(signature, "hex")
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

  const data = await readStore()
  const user = data.users.find((u) => u.id === userId)
  if (user?.status !== "active") return null
  // A suspended shop locks out its owner and staff (but never a platform admin).
  if (!user.platformAdmin && shopOf(data, user)?.status === "suspended") return null
  return user
}

/** Guards admin pages and server actions; redirects to the login page. */
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect("/admin/login")
  return user
}

/** The signed-in user together with their shop (and the store it came from). */
export async function requireShopAdmin() {
  const me = await requireAdmin()
  const data = await readStore()
  const shop = shopOf(data, me)
  if (!shop) redirect("/admin/login")
  return { me, shop, data }
}

/** Platform-wide areas: approving, suspending and deleting shops. */
export async function requirePlatformAdmin() {
  const user = await requireAdmin()
  if (!user.platformAdmin) redirect("/admin")
  return user
}

/** Owner-only areas (shop settings, staff approval). */
export async function requireOwner() {
  const user = await requireAdmin()
  if (user.role !== "owner") redirect("/admin")
  return user
}

// ── Login throttling ────────────────────────────────────────────────────────

const MAX_FAILURES = 5
const LOCK_MS = 15 * 60 * 1000
const failures = new Map<string, { count: number; until: number }>()

/** Minutes left on a lockout for this key, or 0 if attempts are allowed. */
export function lockedMinutes(key: string) {
  const entry = failures.get(key)
  if (!entry || entry.count < MAX_FAILURES) return 0
  const left = entry.until - Date.now()
  if (left <= 0) {
    failures.delete(key)
    return 0
  }
  return Math.ceil(left / 60000)
}

export function recordFailure(key: string) {
  const entry = failures.get(key)
  const now = Date.now()
  if (!entry || entry.until < now) failures.set(key, { count: 1, until: now + LOCK_MS })
  else entry.count += 1
}

export const clearFailures = (key: string) => failures.delete(key)
