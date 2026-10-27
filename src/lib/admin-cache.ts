import { cacheLife, cacheTag } from "next/cache"

import { api, apiAll, type ApiShopSummary, type ApiUser, type Envelope } from "@/lib/api"

/**
 * Server-side cache for the signed-in user's API reads, so admin pages don't call
 * the API on every request.
 *
 * - The **access token is part of the cache key** (it's an argument), so every entry
 *   belongs to one user and one shop: shops never see each other's data. A new token
 *   (refresh every ~15 min) simply starts new entries.
 * - Entries are **tagged per shop / user**. Server actions call `updateTag` on the
 *   tags they touch, so a change shows up immediately (see app/admin/actions.ts).
 * - Errors are thrown, never cached.
 */

/** Everything about one shop's admin data (products, categories, settings, staff, dashboard, sessions). */
export const shopTag = (shopId: string) => `shop:${shopId}`
/** One user's session (/auth/me). */
export const userTag = (userId: string) => `user:${userId}`
/** The platform admin's list of all shops. */
export const PLATFORM_TAG = "platform"

export type Me = {
  user: ApiUser
  shop: ApiShopSummary
  counts: { pendingStaff: number; pendingShops: number }
}

/**
 * `GET /auth/me`, kept briefly: after a minute the next request triggers a background
 * re-check of role, status and shop status (and admin actions that change them drop
 * the entry at once). `expire` must be ≥ 5 minutes — shorter lifetimes are treated
 * as dynamic and not stored at all.
 */
export async function cachedMe(token: string): Promise<Me> {
  "use cache"
  cacheLife({ stale: 60, revalidate: 60, expire: 300 })
  const { data } = await api<Me>("/api/v1/auth/me", { token })
  cacheTag(userTag(data.user.id), shopTag(data.shop.id))
  if (data.user.isPlatformAdmin) cacheTag(PLATFORM_TAG)
  return data
}

/**
 * A GET of the admin API for `shopId`, as the token's user. With `pageSize`,
 * every page of the list is loaded and returned as one array.
 */
export async function cachedGet<T>(
  token: string,
  shopId: string,
  path: string,
  pageSize?: number
): Promise<Envelope<T>> {
  "use cache"
  cacheLife("minutes")
  cacheTag(shopTag(shopId))
  if (path.startsWith("/api/v1/platform/")) cacheTag(PLATFORM_TAG)
  if (pageSize) return { data: (await apiAll<unknown>(path, pageSize, token)) as T }
  return api<T>(path, { token })
}
