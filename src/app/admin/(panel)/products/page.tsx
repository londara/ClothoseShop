import type { Metadata } from "next"
import Link from "next/link"
import { PackagePlus } from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import { ProductTable } from "@/components/admin/product-table"
import { Button } from "@/components/ui/button"
import { apiAll, type ApiCategory, type ApiProductListItem } from "@/lib/api"
import { authed, requireAdmin } from "@/lib/auth"
import { toCategory } from "@/lib/data"
import type { Product } from "@/lib/products"
import { kh } from "@/lib/site"

export const metadata: Metadata = { title: "ផលិតផលទាំងអស់" }

const toRow = (p: ApiProductListItem): Product => ({
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

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const [{ token, shop }, { saved }] = await Promise.all([requireAdmin(), searchParams])
  // The table searches and pages in the browser, so it gets the whole list.
  const [items, categories] = await Promise.all([
    apiAll<ApiProductListItem>("/api/v1/admin/products", 100, token),
    authed<ApiCategory[]>("/api/v1/admin/categories"),
  ])
  const products = items.map(toRow)

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
        categories={categories.data.map(toCategory)}
        saved={saved === "created" || saved === "updated" ? saved : undefined}
      />
    </>
  )
}
