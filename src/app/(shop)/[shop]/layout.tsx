import type { CSSProperties } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { Clock, PauseCircle } from "lucide-react"

import { CartSheet } from "@/components/shop/cart-sheet"
import { QuickViewDialog } from "@/components/shop/quick-view-dialog"
import { ShopProvider } from "@/components/shop/shop-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { TelegramFab } from "@/components/layout/telegram-fab"
import { Button } from "@/components/ui/button"
import { getShopBySlug, getShopTypes, type PublicShop } from "@/lib/data"
import { PLATFORM_NAME } from "@/lib/platform"
import { shopCategories, shopTypeOf } from "@/lib/shop-types"

/**
 * Shop pages render per request (the shop data itself is cached and invalidated
 * by admin edits). Prerendering them would bake the build-time shop list into the
 * shell, so the first visit after approving or editing a shop showed stale data.
 */
export const instant = false

export async function generateMetadata({ params }: LayoutProps<"/[shop]">): Promise<Metadata> {
  const shop = await getShopBySlug((await params).shop)
  if (!shop) return { title: "រកមិនឃើញហាង" }
  const { shopName } = shop.settings
  return {
    title: { default: shopName, template: `%s | ${shopName}` },
    description: shop.settings.heroSubtitle || `${shopName} — ហាងលើ ${PLATFORM_NAME}`,
  }
}

function ShopUnavailable({ shop }: { shop: PublicShop }) {
  const pending = shop.status === "pending"
  const Icon = pending ? Clock : PauseCircle
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-low px-5">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-3xl border border-outline-variant/30 bg-card p-10 text-center shadow-sm">
        <Icon className="size-10 text-gold" />
        <h1 className="text-2xl leading-[1.6] font-bold">{shop.settings.shopName}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {pending
            ? "ហាងនេះកំពុងរង់ចាំការអនុម័តពីក្រុមការងាររបស់យើង។ សូមត្រឡប់មកវិញក្នុងពេលឆាប់ៗនេះ។"
            : "ហាងនេះត្រូវបានផ្អាកជាបណ្តោះអាសន្ន។"}
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          className="mt-2 h-11 rounded-full px-6 font-bold"
        >
          ត្រឡប់ទៅ {PLATFORM_NAME}
        </Button>
      </div>
    </div>
  )
}

export default async function ShopLayout({ params, children }: LayoutProps<"/[shop]">) {
  await connection()
  const shop = await getShopBySlug((await params).shop)
  if (!shop) notFound()
  if (shop.status !== "active") return <ShopUnavailable shop={shop} />
  const { settings } = shop
  const shopTypes = await getShopTypes()
  const type = shopTypeOf(shopTypes, shop.specialty)

  return (
    <div
      className="flex min-h-full flex-1 flex-col bg-background"
      style={{ "--background": settings.backgroundColor } as CSSProperties}
    >
      <ShopProvider
        products={shop.products}
        shopName={settings.shopName}
        telegram={settings.telegram}
        slug={shop.slug}
        sizeKind={type.sizeKind}
        categories={shopCategories(shop, shopTypes)}
      >
        <SiteHeader announcement={settings.announcement} />
        <main className="w-full flex-1 pt-28">{children}</main>
        <SiteFooter settings={settings} slug={shop.slug} />
        <TelegramFab telegram={settings.telegram} />
        <CartSheet />
        <QuickViewDialog />
      </ShopProvider>
    </div>
  )
}

