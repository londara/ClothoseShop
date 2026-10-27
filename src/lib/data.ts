import { cacheLife, cacheTag } from "next/cache"

import type { Product } from "@/lib/products"
import { defaultProfile, type Profile, type Settings } from "@/lib/settings"
import type { CategoryOption, ShopType } from "@/lib/shop-types"
import { ownerOf, readStore, toPublicUser, type ShopStatus } from "@/lib/store"

/**
 * Cached readers for the public site. Admin actions invalidate these tags with
 * `updateTag`, so pages stay static until something is edited.
 */

export const TAGS = {
  shops: "shops",
  shopTypes: "shop-types",
  users: "users",
} as const

/** What a storefront needs about its shop; no user data. */
export type PublicShop = {
  id: string
  slug: string
  status: ShopStatus
  specialty: string
  categories?: CategoryOption[]
  settings: Settings
  products: Product[]
}

export async function getShops(): Promise<PublicShop[]> {
  "use cache"
  cacheTag(TAGS.shops)
  cacheLife("max")
  return (await readStore()).shops
}

/** Shops visible to the public (approved and not suspended). */
export async function getActiveShops() {
  return (await getShops()).filter((s) => s.status === "active")
}

/** Any shop by its link, including pending/suspended ones (callers decide what to show). */
export async function getShopBySlug(slug: string) {
  return (await getShops()).find((s) => s.slug === slug)
}

/** The shop owner's profile for that shop's public "About" section. */
export async function getShopOwnerProfile(shopId: string): Promise<Profile> {
  "use cache"
  cacheTag(TAGS.users)
  cacheLife("max")
  const owner = ownerOf(await readStore(), shopId)
  if (!owner) return defaultProfile
  const { name, title, email, phone, avatar } = toPublicUser(owner)
  return { name, title, email, phone, avatar }
}

/** Shop types for the "create a shop" form and storefront categories/sizes. */
export async function getShopTypes(): Promise<ShopType[]> {
  "use cache"
  cacheTag(TAGS.shopTypes)
  cacheLife("max")
  return (await readStore()).shopTypes
}
