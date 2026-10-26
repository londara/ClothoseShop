"use client"

import * as React from "react"
import Image from "@/components/shop/smart-image"
import Link from "next/link"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useShop } from "@/components/shop/shop-provider"
import { formatPrice } from "@/lib/site"

export function SearchDialog() {
  const { products, href } = useShop()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const results = React.useMemo(() => {
    const q = query.trim()
    if (!q) return products.slice(0, 5)
    return products.filter(
      (p) => p.name.includes(q) || p.description.includes(q) || p.badge?.includes(q)
    )
  }, [query, products])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full text-muted-foreground hover:text-foreground"
            aria-label="ស្វែងរក"
          />
        }
      >
        <Search className="size-[20px]" />
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 gap-3 rounded-3xl p-5 sm:max-w-lg">
        <DialogTitle className="text-lg font-bold">ស្វែងរកសម្លៀកបំពាក់</DialogTitle>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ឧ. កាស្មៀរ, សូត្រ, កាបូប..."
          className="h-12 rounded-full bg-surface-low px-5 text-sm"
        />
        <ul className="no-scrollbar -mx-1 flex max-h-80 flex-col gap-1 overflow-y-auto">
          {results.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              រកមិនឃើញសម្លៀកបំពាក់ដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។
            </li>
          )}
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={href(`/products/${p.id}`)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-surface-low"
              >
                <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                  <Image src={p.images[0]} alt={p.name} fill sizes="44px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                <span className="text-sm font-bold">{formatPrice(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
