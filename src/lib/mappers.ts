import type {
  ApiCategory,
  ApiProduct,
  ApiProductListItem,
  ApiUser,
} from "@/lib/api"
import type { Product } from "@/lib/products"
import { defaultProfile, defaultSettings, type Profile, type Settings } from "@/lib/settings"
import type { CategoryOption, ShopType, SizeKind } from "@/lib/shop-types"
import type { AdminUser, PublicUser, ShopStatus, UserStatus } from "@/lib/types"

/**
 * API response → frontend shape, in one place. Pure functions (no Next.js imports), so
 * the frontend/backend contract can be unit-tested against real API responses
 * (src/test/contract.test.ts with fixtures recorded by the backend's ContractFixturesTest).
 */

// ── API response shapes not in lib/api.ts ───────────────────────────────────

export type ApiShopDetail = {
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

export type ApiStaff = Omit<ApiUser, "isPlatformAdmin"> & { status: UserStatus; isMe: boolean }

export type ApiPlatformShop = {
  id: string
  slug: string
  name: string
  status: ShopStatus
  /** Shop type label. */
  type: string
  productCount: number
  accountCount: number
  owner: { name: string; email: string | null; phone: string | null } | null
  createdAt: string | null
  isMine: boolean
}

export type ApiShopType = { code: string; label: string; sizeKind: SizeKind }

// ── Frontend shapes ─────────────────────────────────────────────────────────

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

/** A row of the platform admin's shop table. */
export type ShopRow = {
  id: string
  slug: string
  name: string
  status: ShopStatus
  specialty: string
  products: number
  staff: number
  owner: { name: string; email: string; phone: string } | null
  createdAt: string | null
  isMine: boolean
}

// ── Mappers ─────────────────────────────────────────────────────────────────

export const toCategory = (c: ApiCategory): CategoryOption => ({ value: c.code, label: c.label })

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

/** Admin product table row (GET /admin/products); links use the UUID. */
export const toProductRow = (p: ApiProductListItem): Product => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  price: Number(p.price),
  stock: p.stock,
  badge: p.badge ?? undefined,
  categories: p.categories,
  images: p.image ? [p.image] : [],
  description: "",
  atelier: "",
})

/**
 * GET /shops/{slug} (+ its products) → storefront shop. Pending/suspended shops only
 * have name and status; the page shows a notice instead of the shop.
 */
export function toPublicShop(shop: ApiShopDetail, products: ApiProduct[]): PublicShop {
  if (shop.status !== "active" || !shop.type || !shop.settings) {
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

export const toShopType = (t: ApiShopType): ShopType => ({
  value: t.code,
  label: t.label,
  sizeKind: t.sizeKind,
  categories: [],
})

/** GET /auth/me user → the signed-in admin (nulls become ""). */
export function toAdminUser(u: ApiUser): AdminUser {
  return {
    id: u.id,
    name: u.name,
    title: u.title ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    avatar: u.avatar ?? "",
    role: u.role,
    platformAdmin: u.isPlatformAdmin,
  }
}

/** GET /admin/staff row → staff table row. */
export const toStaffUser = (u: ApiStaff): PublicUser => ({
  id: u.id,
  name: u.name,
  title: u.title ?? "",
  email: u.email ?? "",
  phone: u.phone ?? "",
  avatar: u.avatar ?? "",
  role: u.role,
  status: u.status,
})

/** GET /platform/shops row → platform shop table row. */
export const toShopRow = (shop: ApiPlatformShop): ShopRow => ({
  id: shop.id,
  slug: shop.slug,
  name: shop.name,
  status: shop.status,
  specialty: shop.type,
  products: shop.productCount,
  staff: shop.accountCount,
  owner: shop.owner
    ? { name: shop.owner.name, email: shop.owner.email ?? "", phone: shop.owner.phone ?? "" }
    : null,
  createdAt: shop.createdAt,
  isMine: shop.isMine,
})

// ── Input rules shared with the API ─────────────────────────────────────────

/**
 * Image/link fields: the same rule as the API's Validators.isRemoteUrl (https only,
 * ≤ 2,048 chars, no quotes/brackets) or one of our `/uploads/...` files.
 */
export function isImageRef(value: string) {
  if (/^\/uploads\/[a-z0-9-]+\.(jpg|png|webp|gif|avif)$/.test(value)) return true
  // A host must follow "https://" directly: the browser's URL parser would quietly turn
  // "https:///x" into host "x", but the API (java.net.URI) refuses it.
  if (value.length > 2048 || !/^https:\/\/[^\s"'<>\\`/][^\s"'<>\\`]*$/i.test(value)) return false
  try {
    return new URL(value).hostname.length > 0
  } catch {
    return false
  }
}
