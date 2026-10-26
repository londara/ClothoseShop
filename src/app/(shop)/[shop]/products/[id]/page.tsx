import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Send, Star } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { LookCard } from "@/components/shop/look-card"
import { ProductDetail } from "@/components/shop/product-detail"
import { getShopBySlug } from "@/lib/data"
import { shopHref } from "@/lib/platform"
import { kh, telegramUrl } from "@/lib/site"

async function findProduct(params: PageProps<"/[shop]/products/[id]">["params"]) {
  const { shop: slug, id } = await params
  const shop = await getShopBySlug(slug)
  if (!shop || shop.status !== "active") return { shop, product: undefined }
  return { shop, product: shop.products.find((p) => p.id === id) }
}

export async function generateMetadata({
  params,
}: PageProps<"/[shop]/products/[id]">): Promise<Metadata> {
  const { product } = await findProduct(params)
  return product
    ? { title: product.name, description: product.description }
    : { title: "រកមិនឃើញទំនិញ" }
}

const reviews = [
  {
    name: "សុភា វ.",
    city: "ភ្នំពេញ",
    when: "២ សប្តាហ៍មុន",
    text: "ស្រាលគួរឲ្យភ្ញាក់ផ្អើល។ ពេលរុំខ្សែក្រវាត់ វាបង្កើតរាងស្អាតមុតស្រួច ដោយមិនមានអារម្មណ៍ក្រាស់ធ្ងន់ឡើយ។ ពណ៌ស្រស់ស្អាតណាស់នៅក្រោមពន្លឺថ្ងៃ។",
  },
  {
    name: "ដារ៉ា ក.",
    city: "សៀមរាប",
    when: "ខែមុន",
    text: "បានបញ្ជាទិញតាមតេឡេក្រាម។ ការណែនាំអំពីទំហំត្រឹមត្រូវណាស់ ហើយការដឹកជញ្ជូនមកដល់ក្នុងរយៈពេល ៤៨ ម៉ោង ជាមួយការវេចខ្ចប់ដ៏ស្រស់ស្អាត។",
  },
]

export default async function ProductPage({ params }: PageProps<"/[shop]/products/[id]">) {
  const { shop, product } = await findProduct(params)
  if (shop && shop.status !== "active") return null
  if (!shop || !product) notFound()
  const { products, settings } = shop

  const look = products
    .filter((p) => p.id !== product.id && p.categories.some((c) => product.categories.includes(c)))
    .slice(0, 3)

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-7xl px-5 pt-6 md:px-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={shopHref(shop.slug)} />}>ទំព័រដើម</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={shopHref(shop.slug, "/catalogue")} />}>
                  កម្រងសម្លៀកបំពាក់
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <span className="flex items-center gap-1.5 text-xs font-bold text-gold">
            <span className="size-1.5 rounded-full bg-gold" />
            ការផលិតអាតេលីយេ • ៨០ ឈុតមានលេខដោយដៃ
          </span>
        </div>

        <ProductDetail product={product} />
      </div>

      {/* Complete the look */}
      <section className="mt-20 w-full bg-surface-low py-16">
        <div className="mx-auto w-full max-w-7xl px-5 md:px-12">
          <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold text-gold">ការផ្គូផ្គងសម្លៀកបំពាក់រដូវ ២០២៥</span>
              <h2 className="text-3xl leading-[1.5] font-bold">បំពេញរចនាប័ទ្មរបស់អ្នក</h2>
            </div>
            <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
              ម៉ូដដែលបានជ្រើសរើសដោយអ្នករចនាម៉ូដជាន់ខ្ពស់របស់យើង
              ដើម្បីបំពេញការធ្លាក់ វាយនភាព និងពណ៌ធម្មជាតិនៃ «{product.name}»។
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {look.map((p) => (
              <LookCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-5 py-16 md:px-12 lg:grid-cols-12">
        <figure className="flex flex-col justify-between gap-6 rounded-3xl bg-surface-high/70 p-8 lg:col-span-5">
          <span className="text-xs font-bold text-gold">ពីបន្ទប់កាត់ដេរ</span>
          <blockquote className="text-xl leading-[1.8] font-bold italic md:text-2xl">
            “យើងបានដកចេញនូវស្រទាប់រឹង និងក្រណាត់សំយោគទាំងអស់។
            រាងរបស់អាវនេះកើតចេញពីភាពតឹងនៃក្រណាត់កាស្មៀរពីរមុខ ដែលជួបគ្នានៅគែមកអាវ។”
          </blockquote>
          <figcaption className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-gold-soft text-sm font-bold text-on-gold-soft">
              ម៉
            </span>
            <span className="text-sm">
              <strong className="block">ម៉ាសេឡា វ.</strong>
              <span className="text-xs text-muted-foreground">ប្រធានផ្នែកកាត់ដេរ អាតេលីយេប៊ីយ៉ែឡា</span>
            </span>
          </figcaption>
        </figure>

        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold">មតិអតិថិជន</h3>
              <p className="text-xs text-muted-foreground">មតិពីអតិថិជនដែលបានផ្ទៀងផ្ទាត់</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold">
                {kh("4.9")}
                <span className="text-lg text-muted-foreground"> / {kh(5)}</span>
              </span>
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-3.5 fill-foreground" />
                ))}
              </span>
            </div>
          </div>
          {reviews.map((r) => (
            <article
              key={r.name}
              className="rounded-2xl border border-outline-variant/30 bg-card p-5 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2">
                  <strong>{r.name}</strong>
                  <span className="text-muted-foreground">• {r.city}</span>
                  <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] text-on-gold-soft">
                    អតិថិជនបានផ្ទៀងផ្ទាត់
                  </span>
                </span>
                <span className="text-muted-foreground">{r.when}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">“{r.text}”</p>
            </article>
          ))}
        </div>
      </section>

      {/* Consultation banner */}
      <div className="mx-auto mb-16 w-full max-w-3xl px-5">
        <div className="flex flex-col items-center justify-between gap-4 rounded-full border border-outline-variant/30 bg-card px-6 py-4 shadow-xl sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Send className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold">មានសំណួរអំពីទំហំ ឬក្រណាត់?</p>
              <p className="text-xs text-muted-foreground">
                ពិគ្រោះភ្លាមៗជាមួយអ្នករចនាម៉ូដជាន់ខ្ពស់របស់យើងតាមតេឡេក្រាម
              </p>
            </div>
          </div>
          <Button
            nativeButton={false}
            render={
              <a
                href={telegramUrl(settings.telegram, `សួស្តី! ខ្ញុំមានសំណួរអំពី «${product.name}»។`)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            className="h-10 shrink-0 rounded-full px-5 text-xs font-bold"
          >
            ចាប់ផ្តើមជជែក
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
