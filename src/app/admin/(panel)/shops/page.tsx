import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { ShopTable } from "@/components/admin/shop-table"
import { adminRead, requirePlatformAdmin } from "@/lib/auth"
import { toShopRow, type ApiPlatformShop } from "@/lib/mappers"
import { kh } from "@/lib/site"

export const metadata: Metadata = { title: "ហាងទាំងអស់" }

export default async function ShopsPage() {
  await requirePlatformAdmin()
  // Pending first, then by name (sorted by the API).
  const { data } = await adminRead<ApiPlatformShop[]>("/api/v1/platform/shops")
  const rows = data.map(toShopRow)
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
