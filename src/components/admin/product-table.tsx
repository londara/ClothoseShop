"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteProduct } from "@/app/admin/actions"
import Image from "@/components/shop/smart-image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ALL_CATEGORIES, type CategoryOption, type Product } from "@/lib/products"
import { formatPrice, kh } from "@/lib/site"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

/** Page numbers to show: first, last, and the current page ±1, with gaps as "…". */
function pageList(current: number, count: number): (number | "…")[] {
  const pages = new Set([1, count, current - 1, current, current + 1])
  const sorted = [...pages].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b)
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ["…" as const, n] : [n]))
}

function Pagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number
  pageCount: number
  total: number
  onPage: (page: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/30 p-4 sm:flex-row">
      <span className="text-xs text-muted-foreground">
        បង្ហាញ {kh(from)}–{kh(to)} នៃ {kh(total)} ផលិតផល
      </span>
      {pageCount > 1 && (
        <nav aria-label="ទំព័រ" className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="ទៅទំព័រមុន"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pageList(page, pageCount).map((n, i) =>
            n === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={n}
                variant={n === page ? "default" : "ghost"}
                size="icon"
                className="rounded-full text-xs"
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPage(n)}
              >
                {kh(n)}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="ទៅទំព័របន្ទាប់"
            disabled={page === pageCount}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  )
}

function DeleteButton({ product }: { product: Product }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-destructive hover:bg-destructive/10"
            aria-label={`លុប ${product.name}`}
          />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>លុបផលិតផលនេះមែនទេ?</AlertDialogTitle>
          <AlertDialogDescription>
            «{product.name}» នឹងត្រូវលុបចេញពីហាងជាអចិន្ត្រៃយ៍ ហើយមិនអាចយកមកវិញបានទេ។
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">បោះបង់</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteProduct(product.id)
                if (result.ok) toast.success(result.message)
                router.refresh()
              })
            }
          >
            លុប
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ProductTable({
  products,
  shopSlug,
  categories,
  saved,
}: {
  products: Product[]
  shopSlug: string
  categories: CategoryOption[]
  saved?: "created" | "updated"
}) {
  const categoryLabel = Object.fromEntries(categories.map((c) => [c.value, c.label]))
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const topRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!saved) return
    toast.success(saved === "created" ? "បានបន្ថែមផលិតផលថ្មីដោយជោគជ័យ" : "បានកែប្រែផលិតផលដោយជោគជ័យ")
    router.replace("/admin/products", { scroll: false })
  }, [saved, router])

  const visible = products.filter(
    (p) =>
      (category === "all" || p.categories.includes(category)) &&
      (!query.trim() || p.name.includes(query.trim()) || p.id.includes(query.trim()))
  )
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  // Deleting the last product on the last page leaves that page empty: step back.
  const current = Math.min(page, pageCount)
  const pageItems = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const goTo = (n: number) => {
    setPage(n)
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div ref={topRef} className="scroll-mt-20 rounded-3xl border border-outline-variant/30 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-outline-variant/30 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-72">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="ស្វែងរកផលិតផល..."
            className="h-10 rounded-full pl-10"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {[ALL_CATEGORIES, ...categories].map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setCategory(c.value)
                setPage(1)
              }}
              className={cn(
                "rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap transition-colors",
                category === c.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-high text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">ផលិតផល</TableHead>
            <TableHead>ប្រភេទ</TableHead>
            <TableHead className="text-right">តម្លៃ</TableHead>
            <TableHead className="text-right">ស្តុក</TableHead>
            <TableHead className="pr-4 text-right">សកម្មភាព</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                រកមិនឃើញផលិតផលទេ
              </TableCell>
            </TableRow>
          )}
          {pageItems.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                    <Image src={p.images[0]} alt={p.name} fill sizes="44px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-64 truncate font-bold">{p.name}</span>
                    {p.badge && (
                      <span className="text-xs text-muted-foreground">{p.badge}</span>
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {p.categories.map((c) => (
                    <span key={c} className="rounded-full bg-surface-high px-2 py-0.5 text-[11px]">
                      {categoryLabel[c] ?? c}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right font-bold">{formatPrice(p.price)}</TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    p.stock <= 3 ? "bg-destructive/10 text-destructive" : "bg-surface-high"
                  )}
                >
                  {kh(p.stock)}
                </span>
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="មើលក្នុងហាង"
                    nativeButton={false}
                    render={<Link href={`/${shopSlug}/products/${p.id}`} target="_blank" />}
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={`កែប្រែ ${p.name}`}
                    nativeButton={false}
                    render={<Link href={`/admin/products/${p.id}/edit`} />}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <DeleteButton product={p} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={current} pageCount={pageCount} total={visible.length} onPage={goTo} />
    </div>
  )
}
