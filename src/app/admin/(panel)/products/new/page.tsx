import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { requireShopAdmin } from "@/lib/auth"
import { shopCategories, shopTypeOf } from "@/lib/shop-types"

export const metadata: Metadata = { title: "បន្ថែមផលិតផល" }

export default async function NewProductPage() {
  const { shop, data } = await requireShopAdmin()
  const type = shopTypeOf(data.shopTypes, shop.specialty)
  return (
    <>
      <PageHeader
        title="បន្ថែមផលិតផលថ្មី"
        description="បំពេញព័ត៌មានខាងក្រោម ផលិតផលនឹងបង្ហាញនៅក្នុងហាងភ្លាមៗ"
      />
      <ProductForm
        categories={shopCategories(shop, data.shopTypes)}
        specialty={type.label}
        sizeKind={type.sizeKind}
      />
    </>
  )
}
