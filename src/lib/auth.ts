import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { cachedGet, cachedMe } from "@/lib/admin-cache"
import { api, ApiError, type ApiShopSummary, type ApiTokens } from "@/lib/api"
import { toAdminUser } from "@/lib/mappers"
import { ACCESS_COOKIE, REFRESH_COOKIE, writeTokenCookies } from "@/lib/session-cookie"
import type { AdminUser } from "@/lib/types"

/**
 * Admin session = the API's JWT pair in httpOnly cookies. The API checks the
 * account and shop on every request, so disabling a user or suspending a shop
 * takes effect right away. proxy.ts refreshes an expired access token.
 */

export type Session = {
  token: string
  user: AdminUser
  shop: ApiShopSummary
  counts: { pendingStaff: number; pendingShops: number }
}


/** Server actions only: store a token pair from login / sign-up / password change. */
export async function saveTokens(tokens: ApiTokens) {
  writeTokenCookies(await cookies(), tokens)
}

/** Logs out on the API (revokes the refresh token) and clears the cookies. */
export async function destroySession() {
  const store = await cookies()
  const refreshToken = store.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    await api("/api/v1/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => undefined)
  }
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
}

/** The signed-in user (`/auth/me`, cached up to a minute — see lib/admin-cache.ts), or null. */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  if (!token) return null
  try {
    const data = await cachedMe(token)
    return { token, user: toAdminUser(data.user), shop: data.shop, counts: data.counts }
  } catch (error) {
    // Expired/invalid token, disabled account, suspended shop → signed out.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null
    throw error
  }
})

export const getCurrentUser = async () => (await getSession())?.user ?? null

/** Guards admin pages and server actions; redirects to the login page. */
export async function requireAdmin() {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  return session
}

/** Owner-only areas (shop settings, staff). */
export async function requireOwner() {
  const session = await requireAdmin()
  if (session.user.role !== "owner") redirect("/admin")
  return session
}

/** Platform-wide areas: approving, suspending and deleting shops. */
export async function requirePlatformAdmin() {
  const session = await requireAdmin()
  if (!session.user.platformAdmin) redirect("/admin")
  return session
}

/** A 401 means the session ended (e.g. the token was revoked): go to the login page. */
function onUnauthorized(error: unknown): never {
  if (error instanceof ApiError && error.status === 401) redirect("/admin/login")
  throw error
}

/** Calls the API as the signed-in user, uncached (use it for writes). */
export async function authed<T>(path: string, options: Parameters<typeof api>[1] = {}) {
  const { token } = await requireAdmin()
  try {
    return await api<T>(path, { ...options, token })
  } catch (error) {
    onUnauthorized(error)
  }
}

/**
 * Reads the admin API as the signed-in user through the server cache
 * (lib/admin-cache.ts). With `pageSize`, all pages of a list are returned.
 */
export async function adminRead<T>(path: string, pageSize?: number) {
  const { token, shop } = await requireAdmin()
  try {
    return await cachedGet<T>(token, shop.id, path, pageSize)
  } catch (error) {
    onUnauthorized(error)
  }
}
