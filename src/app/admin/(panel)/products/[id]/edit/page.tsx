import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { ApiError, type ApiProduct, type Envelope } from "@/lib/api"
import { adminRead } from "@/lib/auth"
import { toCategory, toProduct, type FormOptions } from "@/lib/data"

export const metadata: Metadata = { title: "កែប្រែផលិតផល" }

/** The detail endpoint returns the form options next to the product. */
type ProductDetail = Envelope<ApiProduct> & { options: FormOptions }

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params
  let detail: ProductDetail
  try {
    detail = (await adminRead<ApiProduct>(`/api/v1/admin/products/${encodeURIComponent(id)}`)) as ProductDetail
  } catch (error) {
    // Unknown ids and other shops' products are "not found".
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound()
    throw error
  }
  const { data, options } = detail
  const product = toProduct(data, data.id)

  return (
    <>
      <PageHeader title="កែប្រែផលិតផល" description={product.name} />
      <ProductForm
        key={product.id}
        product={product}
        categories={options.categories.map(toCategory)}
        specialty={options.typeLabel}
        sizeKind={options.sizeKind}
      />
    </>
  )
}
