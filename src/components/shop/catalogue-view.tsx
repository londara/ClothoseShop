"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, LayoutGrid, Rows3, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/shop/product-card"
import { EmptyProducts, FilterPills, SortSelect } from "@/components/shop/product-browser"
import {
  categories,
  filterAndSort,
  type Category,
  type Product,
  type SortValue,
} from "@/lib/products"
import { useShop } from "@/components/shop/shop-provider"
import { kh, telegramUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 12

function countByCategory(products: Product[]) {
  return Object.fromEntries(
    categories.map((c) => [
      c.value,
      c.value === "all"
        ? products.length
        : products.filter((p) => p.categories.includes(c.value as Category)).length,
    ])
  )
}

function CharterBanner() {
  const { shopName, telegram } = useShop()
  return (
    <div className="col-span-full my-4 grid grid-cols-1 items-center gap-8 rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-surface-low to-cashmere/40 p-8 md:grid-cols-12 md:p-12">
      <div className="space-y-3 md:col-span-8">
        <span className="text-xs font-bold text-gold">ធម្មនុញ្ញប្រឆាំងការផលិតច្រើន</span>
        <blockquote className="text-2xl leading-[1.7] font-bold md:text-3xl">
          “យើងផលិតសម្លៀកបំពាក់ មិនមែនដើម្បីបំពេញទីផ្សារឲ្យឆ្អែតទេ
          តែដើម្បីស្លៀកពាក់ឲ្យអ្នកដែលស្រឡាញ់ភាពសាមញ្ញបែបស្ថាបត្យកម្ម។”
        </blockquote>
        <p className="max-w-xl text-[13px] text-muted-foreground">
          ក្រណាត់គ្រប់ដុំត្រូវបានគណនាសម្រាប់ការកាត់ជាក់លាក់។ ពេលការផលិតមួយជុំចប់
          គំរូនោះនឹងត្រូវរក្សាទុកក្នុងបណ្ណសាររូបវន្តរបស់យើងនៅប៉ារីស។
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 md:col-span-4">
        <div className="rounded-2xl border border-outline-variant/40 bg-card px-10 py-4 text-center">
          <span className="block text-3xl font-bold">៨០</span>
          <span className="text-[11px] text-muted-foreground">ឈុតក្នុងមួយការផលិត</span>
        </div>
        <Button
          nativeButton={false}
          render={
            <a
              href={telegramUrl(telegram, `សួស្តី ${shopName}! ខ្ញុំចង់កក់ការកាត់សម្រាប់រដូវក្រោយ។`)}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          className="h-11 rounded-full px-6 text-xs font-bold"
        >
          កក់ការកាត់រដូវក្រោយ
        </Button>
      </div>
    </div>
  )
}

export function CatalogueView({ products }: { products: Product[] }) {
  const { shopName, telegram } = useShop()
  const counts = React.useMemo(() => countByCategory(products), [products])
  const [category, setCategory] = React.useState<"all" | Category>("all")
  const [sort, setSort] = React.useState<SortValue>("curated")
  const [page, setPage] = React.useState(1)
  const [dense, setDense] = React.useState(false)
  const topRef = React.useRef<HTMLDivElement>(null)

  const visible = filterAndSort(products, category, sort)
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageItems = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const shownTo = (current - 1) * PAGE_SIZE + pageItems.length

  const goTo = (p: number) => {
    setPage(p)
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div ref={topRef} className="scroll-mt-32">
      <div className="sticky top-28 z-30 mb-8 flex flex-col gap-3 border-b border-outline-variant/30 bg-background/95 pt-4 pb-3 backdrop-blur-lg lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          value={category}
          counts={counts}
          onChange={(c) => {
            setCategory(c)
            setPage(1)
          }}
        />
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <SortSelect
            value={sort}
            onChange={(s) => {
              setSort(s)
              setPage(1)
            }}
          />
          <div className="flex items-center gap-1 rounded-full border border-outline-variant/40 bg-card p-1">
            <button
              type="button"
              aria-label="ក្រឡាធំ"
              aria-pressed={!dense}
              onClick={() => setDense(false)}
              className={cn("rounded-full p-1.5", !dense && "bg-primary text-primary-foreground")}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              aria-label="ក្រឡាតូច"
              aria-pressed={dense}
              onClick={() => setDense(true)}
              className={cn("rounded-full p-1.5", dense && "bg-primary text-primary-foreground")}
            >
              <Rows3 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {pageItems.length === 0 && <EmptyProducts />}
      <div
        className={cn(
          "grid gap-6",
          dense
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {pageItems.map((p, i) => (
          <React.Fragment key={p.id}>
            {current === 1 && i === 8 && <CharterBanner />}
            <ProductCard product={p} priority={i < 4} />
          </React.Fragment>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/30 pt-6 md:flex-row">
        <span className="text-xs text-muted-foreground">
          បង្ហាញ {kh(pageItems.length ? (current - 1) * PAGE_SIZE + 1 : 0)}–{kh(shownTo)} នៃ{" "}
          {kh(visible.length)} ម៉ូដ
        </span>
        <nav aria-label="ទំព័រ" className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label="ទៅទំព័រមុន"
            disabled={current === 1}
            onClick={() => goTo(current - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === current ? "default" : "ghost"}
              size="icon-lg"
              className="rounded-full text-sm"
              aria-current={p === current ? "page" : undefined}
              onClick={() => goTo(p)}
            >
              {kh(p)}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label="ទៅទំព័របន្ទាប់"
            disabled={current === pageCount}
            onClick={() => goTo(current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </div>

      <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-outline-variant/30 bg-card p-8 text-center shadow-sm">
        <span className="text-xs text-muted-foreground">សន្ទស្សន៍ស្តុកពេញលេញ</span>
        <h3 className="mt-1 text-2xl font-bold">
          បង្ហាញ {kh(shownTo)} នៃ {kh(visible.length)} ម៉ូដមានលេខស៊េរី
        </h3>
        <div className="mx-auto my-4 h-1 w-40 overflow-hidden rounded-full bg-surface-high">
          <div
            className="h-full rounded-full bg-gold"
            style={{ width: `${visible.length ? (shownTo / visible.length) * 100 : 0}%` }}
          />
        </div>
        <p className="mb-5 text-[13px] text-muted-foreground">
          ម៉ូដទាំងអស់ត្រូវបានផលិតក្នុងចំនួនកំណត់។ ចង់បានការកាត់ពិសេសតាមតម្រូវការ?
        </p>
        <Button
          nativeButton={false}
          render={
            <a
              href={telegramUrl(telegram, `សួស្តី ${shopName}! ខ្ញុំចង់សាកសួរអំពីការកាត់ដេរពិសេសតាមតម្រូវការ។`)}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          className="h-11 rounded-full px-6 text-xs font-bold"
        >
          <Send className="size-4" />
          សាកសួរអំពីការកាត់ដេរតាមតម្រូវការ
        </Button>
      </div>
    </div>
  )
}
