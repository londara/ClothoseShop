"use server"

import { randomBytes } from "node:crypto"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"

import {
  clearFailures,
  createSession,
  destroySession,
  lockedMinutes,
  recordFailure,
  requireAdmin,
  requireOwner,
  requirePlatformAdmin,
} from "@/lib/auth"
import { TAGS } from "@/lib/data"
import { hashPassword, verifyPassword } from "@/lib/password"
import type { Product, ProductColor } from "@/lib/products"
import {
  shopCategories,
  shopTypeOf,
  sizeSetOf,
  type CategoryOption,
  type SizeKind,
} from "@/lib/shop-types"
import { defaultSettings } from "@/lib/settings"
import { kh } from "@/lib/site"
import {
  findByIdentifier,
  identifierConflict,
  isValidEmail,
  isValidPhone,
  newId,
  normalizeEmail,
  normalizePhone,
  readStore,
  saveUpload,
  shopOf,
  slugError,
  updateStore,
  type ShopStatus,
  type UserStatus,
} from "@/lib/store"

export type ActionState = { ok?: boolean; message?: string; error?: string }


const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim()

const files = (form: FormData, key: string) =>
  form.getAll(key).filter((f): f is File => f instanceof File && f.size > 0)

/** Accepts only http(s) URLs or our own upload paths for image fields. */
function isImageRef(value: string) {
  return /^https?:\/\/\S+$/i.test(value) || /^\/uploads\/[a-z0-9-]+\.[a-z]+$/.test(value)
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const identifier = text(form, "identifier")
  const password = text(form, "password")
  if (!identifier || !password) {
    return { error: "សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទ និងពាក្យសម្ងាត់" }
  }

  const key = identifier.includes("@") ? normalizeEmail(identifier) : normalizePhone(identifier)
  const wait = lockedMinutes(key)
  if (wait) return { error: `ព្យាយាមខុសច្រើនដងពេក។ សូមរង់ចាំ ${kh(wait)} នាទី រួចព្យាយាមម្តងទៀត។` }

  const user = findByIdentifier((await readStore()).users, identifier)
  // Same message for unknown accounts and wrong passwords, so the form
  // doesn't reveal which emails/phones are registered.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(key)
    return { error: "អ៊ីមែល/លេខទូរស័ព្ទ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ" }
  }
  clearFailures(key)
  if (user.status === "pending") {
    return { error: "គណនីរបស់អ្នកកំពុងរង់ចាំការអនុម័តពីម្ចាស់ហាង។" }
  }
  if (user.status === "disabled") {
    return { error: "គណនីរបស់អ្នកត្រូវបានផ្អាក។ សូមទាក់ទងម្ចាស់ហាង។" }
  }
  if (!user.platformAdmin && shopOf(await readStore(), user)?.status === "suspended") {
    return { error: "ហាងរបស់អ្នកត្រូវបានផ្អាកដោយអ្នកគ្រប់គ្រងវេទិកា។" }
  }
  await createSession(user.id)
  redirect("/admin")
}

/** Validates the name / email / phone / password fields of the new-staff form. */
function readAccountFields(form: FormData) {
  const name = text(form, "name")
  const email = text(form, "email")
  const phone = text(form, "phone")
  const password = text(form, "password")
  const confirm = text(form, "confirmPassword")

  if (!name) return { error: "សូមបញ្ចូលឈ្មោះបុគ្គលិក" }
  if (!email && !phone) return { error: "សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទយ៉ាងហោចណាស់មួយ" }
  if (email && !isValidEmail(email)) return { error: "អ៊ីមែលមិនត្រឹមត្រូវ" }
  if (phone && !isValidPhone(phone)) return { error: "លេខទូរស័ព្ទមិនត្រឹមត្រូវ (៨ ទៅ ១៥ ខ្ទង់)" }
  if (password.length < 8) return { error: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ" }
  if (password !== confirm) return { error: "ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នា" }
  return {
    name,
    email: email ? normalizeEmail(email) : "",
    phone: phone ? normalizePhone(phone) : "",
    password,
  }
}

/**
 * Owner-only: creates a staff account that can log in right away. There is no
 * public sign-up, so staff can't create accounts for anyone.
 */
export async function createStaff(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireOwner()
  const fields = readAccountFields(form)
  if ("error" in fields) return { error: fields.error }

  const passwordHash = await hashPassword(fields.password)
  const conflict = await updateStore((data) => {
    const clash = identifierConflict(data.users, fields)
    if (clash) return clash
    data.users.push({
      id: newId(),
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      title: text(form, "title") || "បុគ្គលិក",
      avatar: "",
      passwordHash,
      role: "staff",
      status: "active",
      shopId: me.shopId,
      createdAt: new Date().toISOString(),
    })
    return null
  })
  if (conflict) return { error: conflict }
  return { ok: true, message: `បានបង្កើតគណនីសម្រាប់ ${fields.name}` }
}

export async function logout() {
  await destroySession()
  redirect("/admin/login")
}

// ── Products ────────────────────────────────────────────────────────────────

function slugify(name: string) {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `${ascii || "product"}-${randomBytes(3).toString("hex")}`
}

async function readProductForm(
  form: FormData,
  { categories: options, sizeKind }: { categories: CategoryOption[]; sizeKind: SizeKind }
) {
  const allowed = new Set(options.map((c) => c.value))
  const name = text(form, "name")
  const price = Number(text(form, "price"))
  const stock = Number(text(form, "stock") || "0")
  const description = text(form, "description")
  const categories = form
    .getAll("categories")
    .map(String)
    .filter((c) => allowed.has(c))

  if (!name) throw new Error("សូមបញ្ចូលឈ្មោះផលិតផល")
  if (!Number.isFinite(price) || price <= 0) throw new Error("តម្លៃត្រូវតែជាលេខធំជាង ០")
  if (!Number.isInteger(stock) || stock < 0) throw new Error("ចំនួនស្តុកត្រូវតែជាលេខគត់ ០ ឬច្រើនជាងនេះ")
  if (!description) throw new Error("សូមបញ្ចូលការពិពណ៌នា")
  if (categories.length === 0) throw new Error("សូមជ្រើសរើសប្រភេទយ៉ាងហោចណាស់មួយ")

  const kept = form.getAll("existingImages").map(String).filter(isImageRef)
  const urls = text(form, "imageUrls")
    .split(/\s+/)
    .filter(Boolean)
  const badUrl = urls.find((u) => !isImageRef(u))
  if (badUrl) throw new Error(`តំណរូបភាពមិនត្រឹមត្រូវ៖ ${badUrl}`)
  const uploaded = await Promise.all(files(form, "images").map(saveUpload))
  const images = [...kept, ...uploaded, ...urls]
  if (images.length === 0) throw new Error("សូមបន្ថែមរូបភាពយ៉ាងហោចណាស់មួយ")

  // Sizes come from the shop type's size system; colours apply to every type.
  let sizes: string[] | undefined
  const sizeSet = sizeSetOf(sizeKind)
  if (sizeSet) {
    const picked = new Set(form.getAll("sizes").map(String))
    sizes = sizeSet.options.map((o) => o.value).filter((v) => picked.has(v))
    if (sizes.length === 0) throw new Error("សូមជ្រើសរើសទំហំយ៉ាងហោចណាស់មួយ")
  }
  const names = form.getAll("colorName").map((v) => String(v).trim())
  const hexes = form.getAll("colorHex").map(String)
  if (names.some((n) => !n)) throw new Error("សូមដាក់ឈ្មោះឲ្យពណ៌នីមួយៗ")
  if (hexes.some((h) => !/^#[0-9a-f]{6}$/i.test(h))) throw new Error("កូដពណ៌មិនត្រឹមត្រូវ")
  if (new Set(names).size !== names.length) throw new Error("ឈ្មោះពណ៌មិនអាចដដែលៗបានទេ")
  if (names.length > 12) throw new Error("អាចបន្ថែមពណ៌បានយ៉ាងច្រើន ១២")
  const colors: ProductColor[] = names.map((name, i) => ({ name: name.slice(0, 30), hex: hexes[i].toLowerCase() }))

  const badgeTone = text(form, "badgeTone") === "gold" ? "gold" : "neutral"
  return {
    sizes,
    colors: colors.length ? colors : undefined,
    name,
    price,
    stock,
    description,
    categories,
    images,
    badge: text(form, "badge") || undefined,
    badgeTone,
    atelier: text(form, "atelier") || "អាតេលីយេ",
  } satisfies Omit<Product, "id">
}

export async function saveProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireAdmin()
  const id = text(form, "id")
  const store = await readStore()
  const myShop = shopOf(store, me)
  if (!myShop) return { error: "រកមិនឃើញហាងរបស់អ្នក" }
  let fields
  try {
    fields = await readProductForm(form, {
      categories: shopCategories(myShop, store.shopTypes),
      sizeKind: shopTypeOf(store.shopTypes, myShop.specialty).sizeKind,
    })
  } catch (error) {
    return { error: (error as Error).message }
  }

  const found = await updateStore((data) => {
    const shop = shopOf(data, me)
    if (!shop) return false
    if (id) {
      const index = shop.products.findIndex((p) => p.id === id)
      if (index === -1) return false
      shop.products[index] = { ...shop.products[index], ...fields }
    } else {
      // Newest products first so they appear in "New arrivals" on the shop's home page.
      shop.products.unshift({ id: slugify(fields.name), ...fields })
    }
    return true
  })
  if (!found) return { error: "រកមិនឃើញផលិតផលនេះទេ" }

  updateTag(TAGS.shops)
  redirect(`/admin/products?saved=${id ? "updated" : "created"}`)
}

export async function deleteProduct(id: string): Promise<ActionState> {
  const me = await requireAdmin()
  await updateStore((data) => {
    const shop = shopOf(data, me)
    if (shop) shop.products = shop.products.filter((p) => p.id !== id)
  })
  updateTag(TAGS.shops)
  return { ok: true, message: "បានលុបផលិតផលដោយជោគជ័យ" }
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireOwner()
  const shopName = text(form, "shopName")
  if (!shopName) return { error: "សូមបញ្ចូលឈ្មោះហាង" }

  const backgroundColor = text(form, "backgroundColor")
  if (!/^#[0-9a-f]{6}$/i.test(backgroundColor)) {
    return { error: "ពណ៌ផ្ទៃខាងក្រោយត្រូវតែជាកូដពណ៌ (ឧ. #f8f9fa)" }
  }

  let heroImage = text(form, "heroImage")
  try {
    const [upload] = files(form, "heroImageFile")
    if (upload) heroImage = await saveUpload(upload)
  } catch (error) {
    return { error: (error as Error).message }
  }
  if (!isImageRef(heroImage)) return { error: "រូបភាពផ្ទៃខាងក្រោយមិនត្រឹមត្រូវ" }

  await updateStore((data) => {
    const shop = shopOf(data, me)
    if (!shop) return
    shop.settings = {
      shopName,
      announcement: text(form, "announcement"),
      heroTitle: text(form, "heroTitle") || shopName,
      heroSubtitle: text(form, "heroSubtitle"),
      heroImage,
      backgroundColor,
      aboutTitle: text(form, "aboutTitle") || "អំពីយើង",
      aboutMe: text(form, "aboutMe"),
      telegram: text(form, "telegram").replace(/^@/, "") || shop.settings.telegram,
    }
  })
  updateTag(TAGS.shops)
  return { ok: true, message: "បានរក្សាទុកការកំណត់ហាង" }
}

export async function saveProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireOwner()
  const name = text(form, "name")
  if (!name) return { error: "សូមបញ្ចូលឈ្មោះរបស់អ្នក" }
  const email = text(form, "email")
  const phone = text(form, "phone")
  if (!email && !phone) return { error: "ត្រូវមានអ៊ីមែល ឬលេខទូរស័ព្ទយ៉ាងហោចណាស់មួយ ដើម្បីចូលប្រើ" }
  if (email && !isValidEmail(email)) return { error: "អ៊ីមែលមិនត្រឹមត្រូវ" }
  if (phone && !isValidPhone(phone)) return { error: "លេខទូរស័ព្ទមិនត្រឹមត្រូវ (៨ ទៅ ១៥ ខ្ទង់)" }

  let avatar: string | undefined
  try {
    const [upload] = files(form, "avatarFile")
    if (upload) avatar = await saveUpload(upload)
  } catch (error) {
    return { error: (error as Error).message }
  }
  const removeAvatar = form.get("removeAvatar") === "on"

  const conflict = await updateStore((data) => {
    const clash = identifierConflict(data.users, { email, phone }, me.id)
    if (clash) return clash
    const user = data.users.find((u) => u.id === me.id)
    if (!user) return "រកមិនឃើញគណនី"
    Object.assign(user, {
      name,
      email: email ? normalizeEmail(email) : "",
      phone: phone ? normalizePhone(phone) : "",
      title: text(form, "title"),
      avatar: removeAvatar ? "" : (avatar ?? user.avatar),
    })
    return null
  })
  if (conflict) return { error: conflict }
  // The owner's profile appears in the storefront "About" section.
  if (me.role === "owner") updateTag(TAGS.users)
  return { ok: true, message: "បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួន" }
}

export async function changePassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireOwner()
  const current = text(form, "currentPassword")
  const next = text(form, "newPassword")
  const confirm = text(form, "confirmPassword")

  if (!(await verifyPassword(current, me.passwordHash))) {
    return { error: "ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ" }
  }
  if (next.length < 8) return { error: "ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ" }
  if (next !== confirm) return { error: "ពាក្យសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នា" }

  const passwordHash = await hashPassword(next)
  await updateStore((data) => {
    const user = data.users.find((u) => u.id === me.id)
    if (user) user.passwordHash = passwordHash
  })
  return { ok: true, message: "បានប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ" }
}

// ── Staff (owner only) ──────────────────────────────────────────────────────

export async function setStaffStatus(id: string, status: UserStatus): Promise<ActionState> {
  const me = await requireOwner()
  const error = await updateStore((data) => {
    const user = data.users.find((u) => u.id === id && u.shopId === me.shopId)
    if (!user) return "រកមិនឃើញគណនី"
    if (user.id === me.id || user.role === "owner") return "មិនអាចប្តូរស្ថានភាពគណនីម្ចាស់ហាងបានទេ"
    user.status = status
    return null
  })
  if (error) return { error }
  const messages: Record<UserStatus, string> = {
    active: "បានអនុម័តគណនី",
    disabled: "បានផ្អាកគណនី",
    pending: "បានកំណត់គណនីជារង់ចាំ",
  }
  return { ok: true, message: messages[status] }
}

export async function deleteStaff(id: string): Promise<ActionState> {
  const me = await requireOwner()
  const error = await updateStore((data) => {
    const user = data.users.find((u) => u.id === id && u.shopId === me.shopId)
    if (!user) return "រកមិនឃើញគណនី"
    if (user.id === me.id || user.role === "owner") return "មិនអាចលុបគណនីម្ចាស់ហាងបានទេ"
    data.users = data.users.filter((u) => u.id !== id)
    return null
  })
  if (error) return { error }
  return { ok: true, message: "បានលុបគណនី" }
}

// ── Shops: public sign-up ───────────────────────────────────────────────────

/**
 * "Create your online shop" on the platform home page. Creates a pending shop
 * and its owner account, then signs the owner in so they can prepare products
 * while a platform admin reviews the shop.
 */
export async function startShop(_prev: ActionState, form: FormData): Promise<ActionState> {
  const shopName = text(form, "shopName")
  const slug = text(form, "slug").toLowerCase()
  const telegram = text(form, "telegram").replace(/^@/, "")
  const specialty = text(form, "specialty")
  if (!shopName) return { error: "សូមបញ្ចូលឈ្មោះហាង" }
  const badSlug = slugError(slug)
  if (badSlug) return { error: badSlug }
  if (!/^[A-Za-z0-9_]{5,32}$/.test(telegram)) {
    return { error: "ឈ្មោះអ្នកប្រើតេឡេក្រាមមិនត្រឹមត្រូវ (៥–៣២ តួអក្សរ a-z, 0-9, _)" }
  }
  if (!(await readStore()).shopTypes.some((t) => t.value === specialty)) {
    return { error: "សូមជ្រើសរើសប្រភេទហាង" }
  }

  const fields = readAccountFields(form)
  if ("error" in fields) return { error: fields.error }
  const passwordHash = await hashPassword(fields.password)

  const result = await updateStore((data) => {
    if (data.shops.some((s) => s.slug === slug)) return { error: "តំណហាងនេះមានគេប្រើរួចហើយ" }
    const clash = identifierConflict(data.users, fields)
    if (clash) return { error: clash }

    const now = new Date().toISOString()
    const shopId = newId()
    const userId = newId()
    data.shops.push({
      id: shopId,
      slug,
      status: "pending",
      specialty,
      products: [],
      createdAt: now,
      settings: {
        ...defaultSettings,
        shopName,
        telegram,
        heroTitle: shopName,
        heroSubtitle: "សូមស្វាគមន៍មកកាន់ហាងរបស់យើង។",
        aboutMe: "",
        announcement: "សូមស្វាគមន៍! បញ្ជាទិញងាយៗតាមតេឡេក្រាម។",
      },
    })
    data.users.push({
      id: userId,
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      title: "ម្ចាស់ហាង",
      avatar: "",
      passwordHash,
      role: "owner",
      status: "active",
      shopId,
      createdAt: now,
    })
    return { userId }
  })
  if ("error" in result) return { error: result.error }

  updateTag(TAGS.shops)
  await createSession(result.userId)
  redirect("/admin?welcome=1")
}

// ── Shops: platform admin ───────────────────────────────────────────────────

export async function setShopStatus(id: string, status: ShopStatus): Promise<ActionState> {
  const me = await requirePlatformAdmin()
  const error = await updateStore((data) => {
    const shop = data.shops.find((s) => s.id === id)
    if (!shop) return "រកមិនឃើញហាង"
    if (shop.id === me.shopId && status !== "active") return "មិនអាចផ្អាកហាងរបស់អ្នកផ្ទាល់បានទេ"
    shop.status = status
    return null
  })
  if (error) return { error }
  updateTag(TAGS.shops)
  const messages: Record<ShopStatus, string> = {
    active: "ហាងត្រូវបានអនុម័ត ហើយបង្ហាញជាសាធារណៈ",
    suspended: "បានផ្អាកហាង",
    pending: "បានកំណត់ហាងជារង់ចាំ",
  }
  return { ok: true, message: messages[status] }
}

/** Deletes a shop together with its owner and staff accounts. */
export async function deleteShop(id: string): Promise<ActionState> {
  const me = await requirePlatformAdmin()
  const error = await updateStore((data) => {
    const shop = data.shops.find((s) => s.id === id)
    if (!shop) return "រកមិនឃើញហាង"
    if (shop.id === me.shopId) return "មិនអាចលុបហាងរបស់អ្នកផ្ទាល់បានទេ"
    data.shops = data.shops.filter((s) => s.id !== id)
    data.users = data.users.filter((u) => u.shopId !== id)
    return null
  })
  if (error) return { error }
  updateTag(TAGS.shops)
  updateTag(TAGS.users)
  return { ok: true, message: "បានលុបហាង និងគណនីរបស់ហាងនោះ" }
}

// ── Product categories (from the product form) ──────────────────────────────

export type AddCategoryResult = { category?: CategoryOption; error?: string }

/**
 * Adds a category to the signed-in user's shop, straight from the product form.
 * The first time, the shop's list starts from its type's default categories.
 * New categories go above "best sellers" so it stays the last filter.
 */
export async function addShopCategory(label: string): Promise<AddCategoryResult> {
  const me = await requireAdmin()
  const name = label.trim().slice(0, 40)
  if (!name) return { error: "សូមបញ្ចូលឈ្មោះប្រភេទ" }

  const result = await updateStore((data): AddCategoryResult => {
    const shop = shopOf(data, me)
    if (!shop) return { error: "រកមិនឃើញហាងរបស់អ្នក" }
    const list = shopCategories(shop, data.shopTypes)
    if (list.some((c) => c.label === name)) return { error: "មានប្រភេទឈ្មោះនេះរួចហើយ" }
    if (list.length >= 20) return { error: "អាចមានប្រភេទបានយ៉ាងច្រើន ២០" }
    const category = { value: `c-${randomBytes(3).toString("hex")}`, label: name }
    const at = list.findIndex((c) => c.value === "best-sellers")
    shop.categories = at === -1 ? [...list, category] : [...list.slice(0, at), category, ...list.slice(at)]
    return { category }
  })
  if (result.category) updateTag(TAGS.shops)
  return result
}
