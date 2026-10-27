import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { ApiCategory, ApiProduct, ApiProductListItem, ApiUser } from "@/lib/api"
import {
  toAdminUser,
  toCategory,
  toProduct,
  toProductRow,
  toPublicShop,
  toShopRow,
  toShopType,
  toStaffUser,
  type ApiPlatformShop,
  type ApiShopDetail,
  type ApiShopType,
  type ApiStaff,
  type FormOptions,
} from "@/lib/mappers"
import { describeChoice, defaultChoice, sizesOf } from "@/lib/products"
import { defaultSettings } from "@/lib/settings"

import { fixture } from "./fixtures"

/**
 * Frontend ↔ backend contract, frontend side (aura-backend/docs/features/21-contract-tests.md).
 * Every fixture is a real response recorded by the backend's ContractFixturesTest; here it
 * goes through the same mappers the pages use. If the API changes a field the frontend
 * reads, a test fails here (or in the backend's own field checks).
 */

type Envelope<T> = { data: T; meta?: { page: number; pageCount: number; total: number; categoryCounts?: Record<string, number> } }

describe("storefront: GET /shops/{slug} + /products → PublicShop", () => {
  const shop = fixture<Envelope<ApiShopDetail>>("shop").data
  const products = fixture<Envelope<ApiProduct[]>>("storefront-products")
  const mapped = toPublicShop(shop, products.data)

  it("maps the shop, its type and its settings", () => {
    assert.equal(mapped.status, "active")
    assert.equal(mapped.slug, shop.slug)
    assert.equal(mapped.specialty, "couture")
    assert.equal(mapped.sizeKind, "clothing")
    assert.ok(mapped.typeLabel.length > 0)
    assert.equal(mapped.settings.shopName, shop.settings!.shopName)
    assert.match(mapped.settings.backgroundColor, /^#[0-9a-f]{6}$/)
    assert.match(mapped.settings.telegram, /^[A-Za-z0-9_]{5,32}$/)
  })

  it("maps categories to filter options in the API's order (best-sellers last)", () => {
    assert.deepEqual(mapped.categories[0], toCategory(shop.categories![0]))
    assert.equal(mapped.categories.at(-1)?.value, "best-sellers")
    for (const c of mapped.categories) assert.equal(products.meta!.categoryCounts![c.value] !== undefined, true)
  })

  it("maps the owner profile and turns nulls into empty strings", () => {
    assert.equal(mapped.owner.name, "សុភា")
    assert.equal(mapped.owner.phone, "") // null in the API
    assert.equal(mapped.owner.avatar, "")
    assert.ok(mapped.owner.email.includes("@"))
  })

  it("maps products: slug as link id, number price, sizes, colours, optional badge", () => {
    const coat = mapped.products.find((p) => p.name === "អាវធំកាស្មៀរ")!
    const tee = mapped.products.find((p) => p.name === "Plain tee")!
    assert.equal(coat.id, coat.slug) // /{shop}/products/{slug}
    assert.equal(coat.price, 890.5)
    assert.equal(typeof coat.price, "number")
    assert.equal(coat.badge, "កាស្មៀរសុទ្ធ")
    assert.equal(coat.badgeTone, "gold")
    assert.deepEqual(coat.sizes, ["S", "M"])
    assert.deepEqual(coat.colors, [{ name: "ខ្មៅ", hex: "#111111" }])
    assert.deepEqual(coat.categories, ["women", "best-sellers"])
    // The API omits "badge" when there is none and sends [] for no colours.
    assert.equal(tee.badge, undefined)
    assert.equal(tee.badgeTone, "neutral")
    assert.equal(tee.colors, undefined)
  })

  it("product helpers work on mapped products (sizes, default choice, Telegram text)", () => {
    const coat = mapped.products.find((p) => p.name === "អាវធំកាស្មៀរ")!
    assert.deepEqual(sizesOf(coat, mapped.sizeKind), ["S", "M"])
    const choice = defaultChoice(coat, mapped.sizeKind)
    assert.deepEqual(choice, { size: "M", color: "ខ្មៅ" })
    assert.equal(describeChoice(choice), "ទំហំ៖ M • ពណ៌៖ ខ្មៅ")
  })

  it("product detail carries related products for 'complete the look'", () => {
    const detail = fixture<Envelope<ApiProduct>>("storefront-product").data
    assert.equal(toProduct(detail).slug, detail.slug)
    assert.ok(Array.isArray(detail.related))
    for (const r of detail.related!) assert.ok(r.slug && r.name && typeof r.price === "number")
  })

  it("a pending shop only has name and status → notice page with defaults", () => {
    const pending = toPublicShop(fixture<Envelope<ApiShopDetail>>("shop-pending").data, [])
    assert.equal(pending.status, "pending")
    assert.ok(pending.settings.shopName.startsWith("ហាង"))
    assert.equal(pending.settings.heroImage, defaultSettings.heroImage)
    assert.deepEqual(pending.products, [])
  })

  it("shop types for the sign-up form", () => {
    const types = fixture<Envelope<ApiShopType[]>>("shop-types").data.map(toShopType)
    assert.deepEqual(
      types.map((t) => t.value),
      ["couture", "jewelry", "ceramics", "leather"]
    )
    assert.equal(types.find((t) => t.value === "couture")?.sizeKind, "clothing")
  })
})

describe("admin pages", () => {
  it("session: GET /auth/me → AdminUser", () => {
    const me = fixture<Envelope<{ user: ApiUser; counts: { pendingStaff: number } }>>("me").data
    const user = toAdminUser(me.user)
    assert.equal(user.role, "owner")
    assert.equal(user.platformAdmin, false)
    assert.equal(user.phone, "")
    assert.equal(typeof me.counts.pendingStaff, "number")
  })

  it("product table: GET /admin/products → rows linked by UUID, viewed by slug", () => {
    const rows = fixture<Envelope<ApiProductListItem[]>>("admin-products").data.map(toProductRow)
    assert.equal(rows.length, 2)
    for (const row of rows) {
      assert.match(row.id, /^[0-9a-f-]{36}$/) // /admin/products/{uuid}/edit
      assert.ok(row.slug) // /{shop}/products/{slug}
      assert.equal(typeof row.price, "number")
      assert.equal(row.images.length, 1)
    }
  })

  it("edit page: GET /admin/products/{id} → product + form options", () => {
    const detail = fixture<Envelope<ApiProduct> & { options: FormOptions }>("admin-product")
    const product = toProduct(detail.data, detail.data.id)
    assert.match(product.id, /^[0-9a-f-]{36}$/)
    assert.equal(detail.options.sizeKind, "clothing")
    assert.ok(detail.options.typeLabel.length > 0)
    assert.ok(detail.options.categories.map(toCategory).some((c) => c.value === "women"))
    assert.deepEqual(detail.options.defaultSizes, ["S", "M", "L", "XL"])
  })

  it("category picker: GET /admin/categories → options", () => {
    const categories = fixture<Envelope<ApiCategory[]>>("categories").data.map(toCategory)
    assert.ok(categories.every((c) => c.value && c.label))
  })

  it("dashboard: totals are numbers, recent products have an image or null", () => {
    const d = fixture<Envelope<{ totalProducts: number; stockValue: number; recentProducts: ApiProductListItem[] }>>(
      "dashboard"
    ).data
    assert.equal(d.totalProducts, 2)
    assert.equal(typeof Number(d.stockValue), "number")
    assert.ok(d.recentProducts.every((p) => p.image === null || typeof p.image === "string"))
  })

  it("staff table: GET /admin/staff → rows (email or phone, never null)", () => {
    const staff = fixture<Envelope<ApiStaff[]>>("staff").data.map(toStaffUser)
    assert.deepEqual(new Set(staff.map((u) => u.role)), new Set(["owner", "staff"]))
    for (const u of staff) {
      assert.equal(typeof u.email, "string")
      assert.equal(typeof u.phone, "string")
      assert.ok(u.email || u.phone)
    }
  })

  it("settings form: GET /admin/settings has every field of the form", () => {
    const settings = fixture<Envelope<Record<string, unknown>>>("settings").data
    assert.deepEqual(Object.keys(settings).sort(), Object.keys(defaultSettings).sort())
  })

  it("platform shop table: GET /platform/shops → rows", () => {
    const rows = fixture<Envelope<ApiPlatformShop[]>>("platform-shops").data.map(toShopRow)
    assert.ok(rows.some((r) => r.isMine))
    for (const r of rows) {
      assert.ok(["pending", "active", "suspended"].includes(r.status))
      assert.equal(typeof r.products, "number")
      assert.equal(typeof r.staff, "number")
    }
  })
})
