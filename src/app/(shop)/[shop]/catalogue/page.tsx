import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, Leaf } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { CatalogueView } from "@/components/shop/catalogue-view"
import { getShopBySlug } from "@/lib/data"
import { shopHref } from "@/lib/platform"
import { kh } from "@/lib/site"

export const metadata: Metadata = {
  title: "កម្រងសម្លៀកបំពាក់ពេញលេញ",
  description: "បណ្ណសារពេញលេញនៃសម្លៀកបំពាក់ប្រណីតមានលេខស៊េរីរបស់ AURA Studio។",
}

export default async function CataloguePage({ params }: PageProps<"/[shop]/catalogue">) {
  const shop = await getShopBySlug((await params).shop)
  if (!shop) notFound()
  if (shop.status !== "active") return null
  const { products } = shop

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-6 pb-14 md:px-12">
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={shopHref(shop.slug)} />}>ទំព័រដើម</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>កម្រងសម្លៀកបំពាក់</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-6 mb-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold text-gold">
            សន្ទស្សន៍អចិន្ត្រៃយ៍របស់អាតេលីយេ • ភាគ ៤
          </span>
          <h1 className="text-3xl leading-[1.5] font-bold md:text-5xl md:leading-[1.4]">
            កម្រងសម្លៀកបំពាក់ពេញលេញ
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            បណ្ណសារពេញលេញនៃសម្លៀកបំពាក់តាមរដូវ ការកាត់ដេរបែបស្ថាបត្យកម្ម
            និងការពិសោធន៍ចំនួនកំណត់។ ម៉ូដនីមួយៗផលិតយ៉ាងច្រើនត្រឹម ៨០ ឈុតមានលេខស៊េរី
            ដែលបានចុះបញ្ជីប្រភពនៅសាឡុងប៉ារីសរបស់យើង។
          </p>
        </div>
        <div className="glass flex flex-col gap-1.5 rounded-2xl border border-outline-variant/30 px-5 py-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2 font-bold text-foreground">
            <span className="size-1.5 rounded-full bg-gold" />
            ម៉ូដក្នុងបណ្ណសារចំនួន {kh(products.length)}
          </span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BadgeCheck className="size-3.5 text-gold" />
              សរសៃតាមដានបាន ១០០%
            </span>
            <span className="flex items-center gap-1">
              <Leaf className="size-3.5 text-gold" />
              គ្មានសារធាតុសំយោគ
            </span>
          </span>
        </div>
      </header>

      <CatalogueView products={products} />
    </div>
  )
}
