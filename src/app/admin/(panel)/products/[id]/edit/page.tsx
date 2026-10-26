import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { requireShopAdmin } from "@/lib/auth"

export const metadata: Metadata = { title: "កែប្រែផលិតផល" }

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const [{ id }, { shop }] = await Promise.all([params, requireShopAdmin()])
  const product = shop.products.find((p) => p.id === id)
  if (!product) notFound()

  return (
    <>
      <PageHeader title="កែប្រែផលិតផល" description={product.name} />
      <ProductForm key={product.id} product={product} />
    </>
  )
}
