import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { ShopTable, type ShopRow } from "@/components/admin/shop-table"
import { requirePlatformAdmin } from "@/lib/auth"
import { kh } from "@/lib/site"
import { ownerOf, readStore } from "@/lib/store"

export const metadata: Metadata = { title: "ហាងទាំងអស់" }

const statusOrder = { pending: 0, active: 1, suspended: 2 }

export default async function ShopsPage() {
  const me = await requirePlatformAdmin()
  const data = await readStore()

  const rows: ShopRow[] = data.shops
    .map((shop) => {
      const owner = ownerOf(data, shop.id)
      return {
        id: shop.id,
        slug: shop.slug,
        name: shop.settings.shopName,
        status: shop.status,
        specialty: shop.specialty,
        products: shop.products.length,
        staff: data.users.filter((u) => u.shopId === shop.id).length,
        owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : null,
        createdAt: shop.createdAt ?? null,
        isMine: shop.id === me.shopId,
      }
    })
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name))

  const pending = rows.filter((r) => r.status === "pending").length

  return (
    <>
      <PageHeader
        title="ហាងទាំងអស់"
        description={
          pending > 0
            ? `មានហាងថ្មី ${kh(pending)} កំពុងរង់ចាំការអនុម័ត`
            : `ហាងសរុប ${kh(rows.length)} នៅលើវេទិកា`
        }
      />
      <ShopTable shops={rows} />
    </>
  )
}
