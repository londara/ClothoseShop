import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { ShopTable, type ShopRow } from "@/components/admin/shop-table"
import { authed, requirePlatformAdmin } from "@/lib/auth"
import { kh } from "@/lib/site"
import type { ShopStatus } from "@/lib/types"

export const metadata: Metadata = { title: "ហាងទាំងអស់" }

type PlatformShop = {
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

export default async function ShopsPage() {
  await requirePlatformAdmin()
  // Pending first, then by name (sorted by the API).
  const { data } = await authed<PlatformShop[]>("/api/v1/platform/shops")
  const rows: ShopRow[] = data.map((shop) => ({
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
  }))
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
