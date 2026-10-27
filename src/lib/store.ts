import { randomBytes } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import { hashPassword } from "@/lib/password"
import { defaultProducts, type Product } from "@/lib/products"
import {
  defaultProfile,
  defaultSettings,
  type Profile,
  type Settings,
} from "@/lib/settings"
import { DEFAULT_SHOP_TYPES, type CategoryOption, type ShopType } from "@/lib/shop-types"

/**
 * File-backed data store. Everything lives in `data/store.json` (created and
 * seeded on first read); uploaded images go to `data/uploads`.
 * Server-only: imports Node built-ins.
 *
 * The platform hosts many shops. Each shop has its own products and settings
 * and is served at `/{slug}`; users belong to exactly one shop.
 */

export type Role = "owner" | "staff"
/** `pending` is kept for accounts from the old self sign-up; the owner can approve them. */
export type UserStatus = "active" | "pending" | "disabled"
/** New shops wait for a platform admin before they appear publicly. */
export type ShopStatus = "pending" | "active" | "suspended"

export type User = Profile & {
  id: string
  passwordHash: string
  role: Role
  status: UserStatus
  shopId: string
  /** Can approve, suspend and delete shops on the whole platform. */
  platformAdmin?: boolean
  createdAt?: string
}

/** User fields that are safe to send to the browser. */
export type PublicUser = Omit<User, "passwordHash">

export type Shop = {
  id: string
  /** URL segment: the shop lives at `/{slug}`. Latin letters, digits, dashes. */
  slug: string
  status: ShopStatus
  specialty: string
  /** Categories the owner added in the product form; unset → the shop type's defaults. */
  categories?: CategoryOption[]
  settings: Settings
  products: Product[]
  createdAt?: string
}

export type StoreData = {
  shops: Shop[]
  /** What shops can sell; managed by the platform admin. */
  shopTypes: ShopType[]
  users: User[]
  /** HMAC key for admin session cookies, used when AUTH_SECRET is unset. */
  secret: string
}

/** Shapes written by earlier versions; migrated on read. */
type LegacyUser = Omit<User, "shopId"> & { shopId?: string }
type LegacyStoreData = {
  shops?: Shop[]
  shopTypes?: ShopType[]
  users?: LegacyUser[]
  secret: string
  // single-shop store (v2) / single-profile store (v1)
  products?: Product[]
  settings?: Settings
  profile?: Profile & { passwordHash: string }
}

/** Override with DATA_DIR (e.g. a Docker volume); defaults to ./data. */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data")
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads")
const STORE_FILE = path.join(DATA_DIR, "store.json")

/** Password for the first login; change it under Settings → Security. */
export const DEFAULT_ADMIN_PASSWORD = "admin123"
/** Slug of the original shop, created on first run / migration. */
export const FIRST_SHOP_SLUG = "aura-studio"

export const newId = () => randomBytes(8).toString("hex")

async function seed(): Promise<StoreData> {
  const shopId = newId()
  return {
    shops: [
      {
        id: shopId,
        slug: FIRST_SHOP_SLUG,
        status: "active",
        specialty: "couture",
        settings: defaultSettings,
        products: defaultProducts,
      },
    ],
    shopTypes: DEFAULT_SHOP_TYPES,
    users: [
      {
        ...defaultProfile,
        email: process.env.ADMIN_EMAIL || defaultProfile.email,
        phone: process.env.ADMIN_PHONE || defaultProfile.phone,
        id: newId(),
        role: "owner",
        status: "active",
        shopId,
        platformAdmin: true,
        passwordHash: await hashPassword(
          process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
        ),
      },
    ],
    secret: randomBytes(32).toString("hex"),
  }
}

/** Upgrades any earlier store layout to the multi-shop layout. */
function migrate(raw: LegacyStoreData): { data: StoreData; changed: boolean } {
  let changed = false
  let users: LegacyUser[] = raw.users ?? []

  // v1: a single profile → one owner account.
  if (!raw.users && raw.profile) {
    users = [{ ...defaultProfile, ...raw.profile, id: newId(), role: "owner", status: "active" }]
    changed = true
  }

  // v2: one shop's products/settings at the top level → the first shop.
  let shops = raw.shops
  if (!shops) {
    shops = [
      {
        id: newId(),
        slug: FIRST_SHOP_SLUG,
        status: "active",
        specialty: "couture",
        settings: { ...defaultSettings, ...raw.settings },
        products: raw.products ?? defaultProducts,
      },
    ]
    changed = true
  }

  // Users from a single-shop store belong to the first shop; its owner runs the platform.
  const firstShopId = shops[0].id
  const migratedUsers: User[] = users.map((u) => {
    if (u.shopId) return u as User
    changed = true
    return { ...u, shopId: firstShopId, platformAdmin: u.role === "owner" || undefined }
  })

  // Stores from before shop types were editable get the starting list.
  if (!raw.shopTypes) changed = true

  const data: StoreData = {
    secret: raw.secret,
    shopTypes: raw.shopTypes ?? DEFAULT_SHOP_TYPES,
    users: migratedUsers,
    shops: shops.map((s) => ({ ...s, settings: { ...defaultSettings, ...s.settings } })),
  }
  return { data, changed }
}

export async function readStore(): Promise<StoreData> {
  let raw: string
  try {
    raw = await fs.readFile(STORE_FILE, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    const data = await seed()
    await persist(data)
    return data
  }

  // Persist migrations right away so ids (used in session cookies) stay stable.
  const { data, changed: migrated } = migrate(JSON.parse(raw) as LegacyStoreData)
  let changed = migrated

  // ADMIN_EMAIL / ADMIN_PHONE fill in the platform admin's login while it still
  // has the placeholder email or no phone; after that, edit it in Settings → Profile.
  const admin = data.users.find((u) => u.platformAdmin)
  if (admin && process.env.ADMIN_EMAIL && admin.email === defaultProfile.email) {
    admin.email = normalizeEmail(process.env.ADMIN_EMAIL)
    changed = true
  }
  if (admin && process.env.ADMIN_PHONE && !admin.phone) {
    admin.phone = normalizePhone(process.env.ADMIN_PHONE)
    changed = true
  }
  if (changed) await persist(data)
  return data
}

async function persist(data: StoreData) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tmp = `${STORE_FILE}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8")
  // On Windows the rename fails with EPERM/EBUSY while another process (e.g. a
  // parallel build worker) is replacing the same file, so retry briefly.
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(tmp, STORE_FILE)
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (attempt >= 5 || (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")) {
        await fs.rm(tmp, { force: true })
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)))
    }
  }
}

// Serialize writes so concurrent admin actions don't clobber each other.
let queue: Promise<unknown> = Promise.resolve()

export function updateStore<T>(mutate: (data: StoreData) => T | Promise<T>) {
  const run = queue.then(async () => {
    const data = await readStore()
    const result = await mutate(data)
    await persist(data)
    return result
  })
  queue = run.catch(() => undefined)
  return run
}

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user
  return rest
}

export function shopOf(data: StoreData, user: Pick<User, "shopId">): Shop | undefined {
  return data.shops.find((s) => s.id === user.shopId)
}

export function ownerOf(data: StoreData, shopId: string): User | undefined {
  return data.users.find((u) => u.shopId === shopId && u.role === "owner")
}

// ── Shop links ──────────────────────────────────────────────────────────────

/** Top-level paths that can never be shop links. */
const RESERVED_SLUGS = new Set([
  "admin", "api", "uploads", "start", "login", "register", "shops", "catalogue",
  "products", "settings", "static", "public", "assets", "images", "favicon.ico",
  "robots.txt", "sitemap.xml", "_next", "aura",
])

/** Lower-case Latin letters, digits and single dashes; 3–40 characters. */
export function slugError(slug: string): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "តំណហាងអាចមានតែអក្សរឡាតាំងតូច (a-z) លេខ និងសញ្ញា - ប៉ុណ្ណោះ"
  }
  if (slug.length < 3 || slug.length > 40) return "តំណហាងត្រូវមានពី ៣ ទៅ ៤០ តួអក្សរ"
  if (RESERVED_SLUGS.has(slug)) return "តំណនេះត្រូវបានរក្សាទុក សូមជ្រើសរើសឈ្មោះផ្សេង"
  return null
}

// ── Login identifiers ───────────────────────────────────────────────────────

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

/** Digits only, with Cambodia's +855 / 855 prefix folded into a leading 0. */
export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "")
  if (digits.startsWith("855") && digits.length >= 11) digits = `0${digits.slice(3)}`
  return digits
}

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
export const isValidPhone = (value: string) => /^\d{8,15}$/.test(normalizePhone(value))

/** Finds a user by email (if it contains "@") or by phone number. */
export function findByIdentifier(users: User[], identifier: string) {
  const value = identifier.trim()
  if (!value) return undefined
  if (value.includes("@")) {
    const email = normalizeEmail(value)
    return users.find((u) => u.email && normalizeEmail(u.email) === email)
  }
  const phone = normalizePhone(value)
  return phone ? users.find((u) => u.phone && normalizePhone(u.phone) === phone) : undefined
}

/** Returns an error message if the email/phone is taken by another user. */
export function identifierConflict(
  users: User[],
  { email, phone }: { email: string; phone: string },
  exceptId?: string
) {
  const others = users.filter((u) => u.id !== exceptId)
  if (email && others.some((u) => u.email && normalizeEmail(u.email) === normalizeEmail(email))) {
    return "អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ"
  }
  if (phone && others.some((u) => u.phone && normalizePhone(u.phone) === normalizePhone(phone))) {
    return "លេខទូរស័ព្ទនេះត្រូវបានប្រើរួចហើយ"
  }
  return null
}

// ── Uploads ─────────────────────────────────────────────────────────────────

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Saves an uploaded image and returns its public `/uploads/...` path. */
export async function saveUpload(file: File) {
  const ext = IMAGE_TYPES[file.type]
  if (!ext) throw new Error("អនុញ្ញាតតែឯកសាររូបភាព (JPG, PNG, WEBP, GIF, AVIF) ប៉ុណ្ណោះ")
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("រូបភាពត្រូវមានទំហំមិនលើស ៥MB")
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${name}`
}
