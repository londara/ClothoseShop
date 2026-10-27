import { cacheLife, cacheTag } from "next/cache"

import { api, apiAll, ApiError, type ApiProduct } from "@/lib/api"
import {
  toPublicShop,
  toShopType,
  type ApiShopDetail,
  type ApiShopType,
  type PublicShop,
} from "@/lib/mappers"
import type { ShopType } from "@/lib/shop-types"

export { toCategory, toProduct, type FormOptions, type PublicShop } from "@/lib/mappers"

/**
 * Cached readers for the public site, backed by the API's storefront endpoints.
 * Admin actions invalidate these tags with `updateTag`, so edits show at once;
 * changes made outside this app (e.g. Swagger) show up within an hour.
 * The response → page shape mapping lives in lib/mappers.ts (unit-tested).
 */

export const TAGS = {
  shops: "shops",
  shopTypes: "shop-types",
  users: "users",
} as const

/** Any shop by its link, including pending/suspended ones (callers decide what to show). */
export async function getShopBySlug(slug: string): Promise<PublicShop | undefined> {
  "use cache"
  cacheTag(TAGS.shops, TAGS.users)
  cacheLife("hours")

  let shop: ApiShopDetail
  try {
    shop = (await api<ApiShopDetail>(`/api/v1/shops/${encodeURIComponent(slug)}`)).data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined
    throw error
  }
  // Pending/suspended shops have no public products.
  const products =
    shop.status === "active"
      ? await apiAll<ApiProduct>(`/api/v1/shops/${encodeURIComponent(slug)}/products`, 60)
      : []
  return toPublicShop(shop, products)
}

/** Shops visible to the public (approved and not suspended), with their products. */
export async function getActiveShops(): Promise<PublicShop[]> {
  "use cache"
  cacheTag(TAGS.shops)
  cacheLife("hours")
  const { data } = await api<{ slug: string }[]>("/api/v1/shops")
  const shops = await Promise.all(data.map((s) => getShopBySlug(s.slug)))
  return shops.filter((s): s is PublicShop => s?.status === "active")
}

/** Shop types for the "create a shop" form. */
export async function getShopTypes(): Promise<ShopType[]> {
  "use cache"
  cacheTag(TAGS.shopTypes)
  cacheLife("hours")
  const { data } = await api<ApiShopType[]>("/api/v1/shop-types")
  return data.map(toShopType)
}
