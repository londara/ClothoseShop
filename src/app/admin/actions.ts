"use server"

import { updateTag } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { api, ApiError, type ApiCategory, type ApiTokens, type ApiUser } from "@/lib/api"
import { PLATFORM_TAG, shopTag, userTag } from "@/lib/admin-cache"
import { authed, destroySession, requireAdmin, saveTokens } from "@/lib/auth"
import { TAGS } from "@/lib/data"
import { isImageRef } from "@/lib/mappers"
import type { CategoryOption } from "@/lib/shop-types"
import type { ShopStatus, UserStatus } from "@/lib/types"

/**
 * Admin and sign-up actions. Validation, permissions and the multi-shop rule
 * live in the API; these actions turn forms into API calls and show the API's
 * Khmer messages.
 */

export type ActionState = { ok?: boolean; message?: string; error?: string }

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim()

const files = (form: FormData, key: string) =>
  form.getAll(key).filter((f): f is File => f instanceof File && f.size > 0)

/** API errors become a form message; anything else (e.g. a redirect) propagates. */
function failure(error: unknown): ActionState {
  if (error instanceof ApiError) return { error: error.message }
  throw error
}

/**
 * After a change: drop the cached data of the signed-in user's shop (admin pages,
 * sessions — lib/admin-cache.ts) plus any `more` tags, e.g. the public storefront
 * (lib/data.ts). The next render reads fresh data from the API.
 */
async function refreshMyShop(...more: string[]) {
  const { shop } = await requireAdmin()
  for (const tag of [shopTag(shop.id), ...more]) updateTag(tag)
}

/** Uploads an image to the signed-in user's shop; returns its `/uploads/...` path. */
async function upload(file: File) {
  const form = new FormData()
  form.append("file", file)
  const { data } = await authed<{ url: string }>("/api/v1/uploads", { method: "POST", form })
  return data.url
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const identifier = text(form, "identifier")
  const password = text(form, "password")
  if (!identifier || !password) {
    return { error: "សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទ និងពាក្យសម្ងាត់" }
  }
  try {
    const { data } = await api<ApiTokens>("/api/v1/auth/login", {
      method: "POST",
      clientIp: await clientIp(),
      body: { identifier, password },
    })
    await saveTokens(data)
  } catch (error) {
    return failure(error)
  }
  redirect("/admin")
}

export async function logout() {
  await destroySession()
  redirect("/admin/login")
}

export async function changePassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin()
  try {
    // The API logs out every other device and returns a new pair for this one.
    const { data, message } = await authed<ApiTokens>("/api/v1/auth/password", {
      method: "PATCH",
      body: {
        currentPassword: text(form, "currentPassword"),
        newPassword: text(form, "newPassword"),
        confirmPassword: text(form, "confirmPassword"),
      },
    })
    await saveTokens(data)
    // Other devices' cached sessions end now instead of within a minute.
    updateTag(userTag(user.id))
    return { ok: true, message: message ?? "បានប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ" }
  } catch (error) {
    return failure(error)
  }
}

// ── Products ────────────────────────────────────────────────────────────────

/** The visitor's IP as seen by this server (first X-Forwarded-For entry), for the API's rate limits. */
async function clientIp() {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined
}

/** Quick checks before uploading files, so a typo doesn't leave orphan uploads. */
function precheckProduct(form: FormData) {
  const price = Number(text(form, "price"))
  if (!text(form, "name")) return "សូមបញ្ចូលឈ្មោះផលិតផល"
  if (!Number.isFinite(price) || price <= 0) return "តម្លៃត្រូវតែជាលេខធំជាង ០"
  if (!text(form, "description")) return "សូមបញ្ចូលការពិពណ៌នា"
  if (form.getAll("categories").length === 0) return "សូមជ្រើសរើសប្រភេទយ៉ាងហោចណាស់មួយ"
  const badUrl = text(form, "imageUrls").split(/\s+/).filter(Boolean).find((u) => !isImageRef(u))
  if (badUrl) return `តំណរូបភាពមិនត្រឹមត្រូវ៖ ${badUrl}`
  return null
}

export async function saveProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = text(form, "id")
  const problem = precheckProduct(form)
  if (problem) return { error: problem }

  try {
    const kept = form.getAll("existingImages").map(String).filter(isImageRef)
    const urls = text(form, "imageUrls").split(/\s+/).filter(Boolean)
    const uploaded = await Promise.all(files(form, "images").map(upload))
    const names = form.getAll("colorName").map((v) => String(v).trim())
    const hexes = form.getAll("colorHex").map(String)

    const body = {
      name: text(form, "name"),
      description: text(form, "description"),
      price: Number(text(form, "price")),
      stock: Number(text(form, "stock") || "0"),
      badge: text(form, "badge") || null,
      badgeTone: text(form, "badgeTone") === "gold" ? "gold" : "neutral",
      atelier: text(form, "atelier") || "អាតេលីយេ",
      categories: form.getAll("categories").map(String),
      images: [...kept, ...uploaded, ...urls],
      sizes: form.getAll("sizes").map(String),
      colors: names.map((name, i) => ({ name, hex: hexes[i] ?? "" })),
    }
    await authed(id ? `/api/v1/admin/products/${encodeURIComponent(id)}` : "/api/v1/admin/products", {
      method: id ? "PUT" : "POST",
      body,
    })
  } catch (error) {
    return failure(error)
  }

  // Admin lists/dashboard, the storefront, and product counts on the platform page.
  await refreshMyShop(TAGS.shops, PLATFORM_TAG)
  redirect(`/admin/products?saved=${id ? "updated" : "created"}`)
}

export async function deleteProduct(id: string): Promise<ActionState> {
  try {
    await authed(`/api/v1/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" })
  } catch (error) {
    return failure(error)
  }
  await refreshMyShop(TAGS.shops, PLATFORM_TAG)
  return { ok: true, message: "បានលុបផលិតផលដោយជោគជ័យ" }
}

export type AddCategoryResult = { category?: CategoryOption; error?: string }

/** Adds a category to the signed-in user's shop, straight from the product form. */
export async function addShopCategory(label: string): Promise<AddCategoryResult> {
  try {
    const { data } = await authed<ApiCategory>("/api/v1/admin/categories", {
      method: "POST",
      body: { label },
    })
    await refreshMyShop(TAGS.shops)
    return { category: { value: data.code, label: data.label } }
  } catch (error) {
    return failure(error)
  }
}

// ── Settings & profile ──────────────────────────────────────────────────────

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const [heroFile] = files(form, "heroImageFile")
    const heroImage = heroFile ? await upload(heroFile) : text(form, "heroImage")
    const { message } = await authed("/api/v1/admin/settings", {
      method: "PUT",
      body: {
        shopName: text(form, "shopName"),
        telegram: text(form, "telegram"),
        announcement: text(form, "announcement"),
        heroTitle: text(form, "heroTitle"),
        heroSubtitle: text(form, "heroSubtitle"),
        heroImage,
        backgroundColor: text(form, "backgroundColor"),
        aboutTitle: text(form, "aboutTitle"),
        aboutMe: text(form, "aboutMe"),
      },
    })
    // The shop name also shows in the sidebar (session) and the platform list.
    await refreshMyShop(TAGS.shops, PLATFORM_TAG)
    return { ok: true, message: message ?? "បានរក្សាទុកការកំណត់ហាង" }
  } catch (error) {
    return failure(error)
  }
}

export async function saveProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin()
  try {
    const [avatarFile] = files(form, "avatarFile")
    const avatar =
      form.get("removeAvatar") === "on" ? null : avatarFile ? await upload(avatarFile) : user.avatar || null
    const { message } = await authed<ApiUser>("/api/v1/admin/profile", {
      method: "PUT",
      body: {
        name: text(form, "name"),
        title: text(form, "title"),
        email: text(form, "email"),
        phone: text(form, "phone"),
        avatar,
      },
    })
    // My session (sidebar), the staff list, and the owner's profile in the storefront "About".
    await refreshMyShop(userTag(user.id), TAGS.users)
    return { ok: true, message: message ?? "បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួន" }
  } catch (error) {
    return failure(error)
  }
}

// ── Staff (owner only) ──────────────────────────────────────────────────────

/** Owner-only: creates a staff account that can log in right away. */
export async function createStaff(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { message } = await authed("/api/v1/admin/staff", {
      method: "POST",
      body: {
        name: text(form, "name"),
        title: text(form, "title") || "បុគ្គលិក",
        email: text(form, "email"),
        phone: text(form, "phone"),
        password: text(form, "password"),
        confirmPassword: text(form, "confirmPassword"),
      },
    })
    // Staff list, and account counts on the platform page.
    await refreshMyShop(PLATFORM_TAG)
    return { ok: true, message: message ?? "បានបង្កើតគណនី" }
  } catch (error) {
    return failure(error)
  }
}

export async function setStaffStatus(id: string, status: UserStatus): Promise<ActionState> {
  try {
    const { message } = await authed(`/api/v1/admin/staff/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    })
    // A disabled staff member's cached session ends now (their /auth/me is tagged by user).
    await refreshMyShop(userTag(id))
    return { ok: true, message: message ?? "បានប្តូរស្ថានភាពគណនី" }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteStaff(id: string): Promise<ActionState> {
  try {
    await authed(`/api/v1/admin/staff/${encodeURIComponent(id)}`, { method: "DELETE" })
  } catch (error) {
    return failure(error)
  }
  await refreshMyShop(userTag(id), PLATFORM_TAG)
  return { ok: true, message: "បានលុបគណនី" }
}

// ── Shops: public sign-up ───────────────────────────────────────────────────

/**
 * "Create your online shop" on the platform home page. The API creates a
 * pending shop and its owner and signs the owner in, so they can prepare
 * products while a platform admin reviews the shop.
 */
export async function startShop(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { data } = await api<ApiTokens>("/api/v1/shops", {
      method: "POST",
      clientIp: await clientIp(),
      body: {
        shopName: text(form, "shopName"),
        slug: text(form, "slug").toLowerCase(),
        telegram: text(form, "telegram"),
        shopType: text(form, "specialty"),
        owner: {
          name: text(form, "name"),
          email: text(form, "email"),
          phone: text(form, "phone"),
          password: text(form, "password"),
          confirmPassword: text(form, "confirmPassword"),
        },
      },
    })
    await saveTokens(data)
  } catch (error) {
    return failure(error)
  }
  // A new pending shop for the platform admin's list.
  updateTag(TAGS.shops)
  updateTag(PLATFORM_TAG)
  redirect("/admin?welcome=1")
}

// ── Shops: platform admin ───────────────────────────────────────────────────

export async function setShopStatus(id: string, status: ShopStatus): Promise<ActionState> {
  try {
    const { message } = await authed(`/api/v1/platform/shops/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    })
    // Storefront, platform list, and that shop's cached sessions (suspended → logged out now).
    for (const tag of [TAGS.shops, PLATFORM_TAG, shopTag(id)]) updateTag(tag)
    return { ok: true, message: message ?? "បានប្តូរស្ថានភាពហាង" }
  } catch (error) {
    return failure(error)
  }
}

/** Deletes a shop together with its owner and staff accounts. */
export async function deleteShop(id: string): Promise<ActionState> {
  try {
    await authed(`/api/v1/platform/shops/${encodeURIComponent(id)}`, { method: "DELETE" })
  } catch (error) {
    return failure(error)
  }
  for (const tag of [TAGS.shops, TAGS.users, PLATFORM_TAG, shopTag(id)]) updateTag(tag)
  return { ok: true, message: "បានលុបហាង និងគណនីរបស់ហាងនោះ" }
}
