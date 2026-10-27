import { cacheLife, cacheTag } from "next/cache"

import { api, apiAll, ApiError, type ApiCategory, type ApiProduct } from "@/lib/api"
import type { Product } from "@/lib/products"
import { defaultProfile, defaultSettings, type Profile, type Settings } from "@/lib/settings"
import type { CategoryOption, ShopType, SizeKind } from "@/lib/shop-types"
import type { ShopStatus } from "@/lib/types"

/**
 * Cached readers for the public site, backed by the API's storefront endpoints.
 * Admin actions invalidate these tags with `updateTag`, so edits show at once;
 * changes made outside this app (e.g. Swagger) show up within an hour.
 */

export const TAGS = {
  shops: "shops",
  shopTypes: "shop-types",
  users: "users",
} as const

/** What a storefront needs about its shop. */
export type PublicShop = {
  slug: string
  status: ShopStatus
  /** Shop type code ("couture", "jewelry", …). */
  specialty: string
  typeLabel: string
  sizeKind: SizeKind
  categories: CategoryOption[]
  settings: Settings
  products: Product[]
  /** The owner's profile for the "About" section. */
  owner: Profile
}

type ApiShopDetail = {
  slug: string
  name: string
  status: ShopStatus
  type?: { code: string; label: string; sizeKind: SizeKind }
  settings?: Settings
  categories?: ApiCategory[]
  owner?: { name: string; title: string | null; email: string | null; phone: string | null; avatar: string | null }
}

/** What the admin product form needs (GET /admin/products/options). */
export type FormOptions = {
  categories: ApiCategory[]
  typeLabel: string
  sizeKind: SizeKind
  defaultSizes: string[]
}

export const toCategory =(c: ApiCategory): CategoryOption => ({ value: c.code, label: c.label })

/** API product → the storefront/admin shape. `id` is what the page links use. */
export function toProduct(p: ApiProduct, id: string = p.slug): Product {
  return {
    id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    description: p.description ?? "",
    badge: p.badge ?? undefined,
    badgeTone: p.badgeTone === "gold" ? "gold" : "neutral",
    atelier: p.atelier ?? "",
    categories: p.categories,
    images: p.images,
    stock: p.stock,
    sizes: p.sizes?.length ? p.sizes : undefined,
    colors: p.colors?.length ? p.colors : undefined,
  }
}

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

  if (shop.status !== "active" || !shop.type || !shop.settings) {
    // Pending/suspended: the API only tells the name and status.
    return {
      slug: shop.slug,
      status: shop.status,
      specialty: "",
      typeLabel: "",
      sizeKind: "none",
      categories: [],
      settings: { ...defaultSettings, shopName: shop.name },
      products: [],
      owner: defaultProfile,
    }
  }

  const products = await apiAll<ApiProduct>(`/api/v1/shops/${encodeURIComponent(slug)}/products`, 60)
  const owner = shop.owner
  return {
    slug: shop.slug,
    status: shop.status,
    specialty: shop.type.code,
    typeLabel: shop.type.label,
    sizeKind: shop.type.sizeKind,
    categories: (shop.categories ?? []).map(toCategory),
    settings: shop.settings,
    products: products.map((p) => toProduct(p)),
    owner: owner
      ? {
          name: owner.name,
          title: owner.title ?? "",
          email: owner.email ?? "",
          phone: owner.phone ?? "",
          avatar: owner.avatar ?? "",
        }
      : defaultProfile,
  }
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
  const { data } = await api<{ code: string; label: string; sizeKind: SizeKind }[]>("/api/v1/shop-types")
  return data.map((t) => ({ value: t.code, label: t.label, sizeKind: t.sizeKind, categories: [] }))
}
