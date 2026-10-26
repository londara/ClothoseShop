"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"

import Image from "@/components/shop/smart-image"
import { Button } from "@/components/ui/button"
import { formatPrice, kh, telegramUrl } from "@/lib/site"

export type FeaturedPiece = {
  id: string
  name: string
  description: string
  price: number
  image: string
  stock: number
  shopSlug: string
  shopName: string
  telegram: string
}

export function FeaturedRail({ pieces }: { pieces: FeaturedPiece[] }) {
  const rail = React.useRef<HTMLUListElement>(null)
  const scroll = (dir: 1 | -1) =>
    rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" })

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold">ការជ្រើសរើសពីហាងនានា</span>
          <h2 className="text-3xl leading-[1.5] font-bold md:text-4xl">ម៉ូដពិសេសពីអាតេលីយេ</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="មុន" onClick={() => scroll(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="បន្ទាប់" onClick={() => scroll(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <ul ref={rail} className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 md:-mx-12 md:px-12">
        {pieces.map((p) => (
          <li
            key={`${p.shopSlug}-${p.id}`}
            className="flex w-[78%] shrink-0 snap-start flex-col gap-4 rounded-3xl border border-outline-variant/20 bg-card p-3 shadow-sm transition-shadow hover:shadow-xl sm:w-[45%] lg:w-[31%]"
          >
            <Link
              href={`/${p.shopSlug}/products/${p.id}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container"
            >
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 78vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="glass absolute top-3 left-3 rounded-full px-3 py-0.5 text-[11px] font-bold">
                នៅសល់ {kh(p.stock)} / ៨០
              </span>
            </Link>
            <div className="px-2">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/${p.shopSlug}/products/${p.id}`}
                  className="truncate text-lg font-bold hover:underline hover:underline-offset-4"
                >
                  {p.name}
                </Link>
                <span className="shrink-0 font-bold">{formatPrice(p.price)}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-[13px] text-muted-foreground">{p.description}</p>
            </div>
            <div className="flex items-center justify-between gap-2 px-2 pb-1">
              <Link href={`/${p.shopSlug}`} className="truncate text-xs font-bold text-gold hover:underline">
                {p.shopName}
              </Link>
              <a
                href={telegramUrl(p.telegram, `សួស្តី ${p.shopName}! ខ្ញុំចាប់អារម្មណ៍នឹង «${p.name}» (${formatPrice(p.price)})។`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Send className="size-3" />
                បញ្ជាទិញតាមតេឡេក្រាម
              </a>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
