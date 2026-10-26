"use client"

import * as React from "react"

import { ProductCard } from "@/components/shop/product-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  categories,
  filterAndSort,
  sortOptions,
  type Category,
  type Product,
  type SortValue,
} from "@/lib/products"
import { kh } from "@/lib/site"
import { cn } from "@/lib/utils"

export function FilterPills({
  value,
  onChange,
  counts,
}: {
  value: "all" | Category
  onChange: (value: "all" | Category) => void
  counts?: Record<string, number>
}) {
  return (
    <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
      {categories.map((c) => (
        <button
          key={c.value}
          type="button"
          aria-pressed={value === c.value}
          onClick={() => onChange(c.value)}
          className={cn(
            "rounded-full px-5 py-1.5 text-[13px] font-bold whitespace-nowrap transition-all duration-200",
            value === c.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-high text-muted-foreground hover:bg-surface-highest hover:text-foreground"
          )}
        >
          {c.label}
          {counts && <span className="ml-1 opacity-70">({kh(counts[c.value] ?? 0)})</span>}
        </button>
      ))}
    </div>
  )
}

export function SortSelect({
  value,
  onChange,
}: {
  value: SortValue
  onChange: (value: SortValue) => void
}) {
  return (
    <Select
      items={sortOptions.map((o) => ({ value: o.value, label: o.label }))}
      value={value}
      onValueChange={(v) => v && onChange(v as SortValue)}
    >
      <SelectTrigger className="h-9 min-w-44 rounded-full border-outline-variant/40 bg-card px-4 text-[13px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-2xl">
        {sortOptions.map((o) => (
          <SelectItem key={o.value} value={o.value} className="rounded-xl text-[13px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function EmptyProducts() {
  return (
    <p className="rounded-3xl border border-dashed border-outline-variant p-12 text-center text-sm text-muted-foreground">
      មិនទាន់មានផលិតផលនៅឡើយទេ — សូមត្រឡប់មកវិញឆាប់ៗនេះ។
    </p>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return <EmptyProducts />
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  )
}

/** Home page catalogue: sticky filter bar, live count, sort, grid. */
export function ProductBrowser({ products }: { products: Product[] }) {
  const [category, setCategory] = React.useState<"all" | Category>("all")
  const [sort, setSort] = React.useState<SortValue>("curated")
  const visible = filterAndSort(products, category, sort)

  return (
    <>
      <div className="sticky top-28 z-30 mb-8 flex flex-col gap-4 border-b border-outline-variant/30 bg-background/95 pt-5 pb-3 backdrop-blur-lg md:flex-row md:items-center md:justify-between">
        <FilterPills value={category} onChange={setCategory} />
        <div className="flex items-center justify-between gap-5 md:justify-end">
          <span className="text-[13px] text-muted-foreground">
            កំពុងបង្ហាញ {kh(visible.length)} មុខទំនិញពិសេស
          </span>
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>
      <ProductGrid products={visible} />
    </>
  )
}
