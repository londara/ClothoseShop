import type { Metadata } from "next"
import Link from "next/link"
import { PackagePlus } from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import { ProductTable } from "@/components/admin/product-table"
import { Button } from "@/components/ui/button"
import { kh } from "@/lib/site"
import { requireShopAdmin } from "@/lib/auth"

export const metadata: Metadata = { title: "ផលិតផលទាំងអស់" }

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const [{ shop }, { saved }] = await Promise.all([requireShopAdmin(), searchParams])
  const { products } = shop

  return (
    <>
      <PageHeader
        title="ផលិតផលទាំងអស់"
        description={`មានផលិតផលសរុប ${kh(products.length)} មុខនៅក្នុងហាង`}
      >
        <Button
          nativeButton={false}
          render={<Link href="/admin/products/new" />}
          className="h-10 rounded-full px-5 font-bold"
        >
          <PackagePlus className="size-4" />
          បន្ថែមផលិតផល
        </Button>
      </PageHeader>
      <ProductTable
        products={products}
        shopSlug={shop.slug}
        saved={saved === "created" || saved === "updated" ? saved : undefined}
      />
    </>
  )
}
