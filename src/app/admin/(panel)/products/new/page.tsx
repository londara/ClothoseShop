import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { authed } from "@/lib/auth"
import { toCategory, type FormOptions } from "@/lib/data"

export const metadata: Metadata = { title: "បន្ថែមផលិតផល" }

export default async function NewProductPage() {
  const { data: options } = await authed<FormOptions>("/api/v1/admin/products/options")
  return (
    <>
      <PageHeader
        title="បន្ថែមផលិតផលថ្មី"
        description="បំពេញព័ត៌មានខាងក្រោម ផលិតផលនឹងបង្ហាញនៅក្នុងហាងភ្លាមៗ"
      />
      <ProductForm
        categories={options.categories.map(toCategory)}
        specialty={options.typeLabel}
        sizeKind={options.sizeKind}
      />
    </>
  )
}
