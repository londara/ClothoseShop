import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { requireAdmin } from "@/lib/auth"
import { ProductForm } from "@/components/admin/product-form"

export const metadata: Metadata = { title: "បន្ថែមផលិតផល" }

export default async function NewProductPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader
        title="បន្ថែមផលិតផលថ្មី"
        description="បំពេញព័ត៌មានខាងក្រោម ផលិតផលនឹងបង្ហាញនៅក្នុងហាងភ្លាមៗ"
      />
      <ProductForm />
    </>
  )
}
