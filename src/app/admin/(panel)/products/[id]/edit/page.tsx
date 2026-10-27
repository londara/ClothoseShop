import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { requireShopAdmin } from "@/lib/auth"
import { shopCategories, shopTypeOf } from "@/lib/shop-types"

export const metadata: Metadata = { title: "កែប្រែផលិតផល" }

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const [{ id }, { shop, data }] = await Promise.all([params, requireShopAdmin()])
  const type = shopTypeOf(data.shopTypes, shop.specialty)
  const product = shop.products.find((p) => p.id === id)
  if (!product) notFound()

  return (
    <>
      <PageHeader title="កែប្រែផលិតផល" description={product.name} />
      <ProductForm
        key={product.id}
        product={product}
        categories={shopCategories(shop, data.shopTypes)}
        specialty={type.label}
        sizeKind={type.sizeKind}
      />
    </>
  )
}
