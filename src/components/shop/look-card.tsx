"use client"

import Image from "@/components/shop/smart-image"
import Link from "next/link"
import { Send } from "lucide-react"

import { productOrderMessage, useShop } from "@/components/shop/shop-provider"
import { defaultChoice, type Product } from "@/lib/products"
import { formatPrice, telegramUrl } from "@/lib/site"

/** Larger editorial card used in the "Complete the look" row. */
export function LookCard({ product }: { product: Product }) {
  const { openQuickView, shopName, telegram, href, sizeKind } = useShop()
  const image = product.images[1] ?? product.images[0]

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-outline-variant/20 bg-card p-3 shadow-sm transition-shadow hover:shadow-xl">
      <Link
        href={href(`/products/${product.id}`)}
        className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
        {product.badge && (
          <span className="glass absolute top-3 left-3 rounded-full px-3 py-0.5 text-[11px] font-bold">
            {product.badge}
          </span>
        )}
      </Link>
      <div className="px-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{product.atelier}</span>
          <span className="text-sm font-bold text-foreground">{formatPrice(product.price)}</span>
        </div>
        <Link
          href={href(`/products/${product.id}`)}
          className="mt-1 block text-lg font-bold hover:underline hover:underline-offset-4"
        >
          {product.name}
        </Link>
      </div>
      <div className="flex items-center justify-between px-2 pb-1">
        <button
          type="button"
          onClick={() => openQuickView(product)}
          className="text-xs font-bold hover:text-gold"
        >
          មើលរហ័ស
        </button>
        <a
          href={telegramUrl(telegram, productOrderMessage(shopName, product, defaultChoice(product, sizeKind), 1))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-surface-high px-3 py-1 text-xs font-bold transition-colors hover:bg-surface-highest"
        >
          <Send className="size-3" />
          បញ្ជាទិញតាមតេឡេក្រាម
        </a>
      </div>
    </article>
  )
}
