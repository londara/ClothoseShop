"use client"

import Image from "@/components/shop/smart-image"
import Link from "next/link"
import { Eye, Heart, Send, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { productOrderMessage, useShop } from "@/components/shop/shop-provider"
import type { Product } from "@/lib/products"
import { formatPrice, telegramUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const { addToCart, openQuickView, toggleWishlist, isWishlisted, shopName, telegram, href } =
    useShop()
  const saved = isWishlisted(product.id)

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-outline-variant/20 bg-card shadow-sm transition-all duration-500 hover:shadow-xl">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-low">
        <button
          type="button"
          aria-label={`មើលលម្អិត ${product.name}`}
          onClick={() => openQuickView(product)}
          className="absolute inset-0 cursor-pointer"
        >
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        </button>

        {product.badge && (
          <span
            className={cn(
              "pointer-events-none absolute top-4 left-4 rounded-full px-3 py-0.5 text-[11px] font-bold shadow-sm",
              product.badgeTone === "gold"
                ? "bg-gold-soft text-on-gold-soft"
                : "bg-surface-highest text-foreground"
            )}
          >
            {product.badge}
          </span>
        )}

        <button
          type="button"
          aria-label="រក្សាទុកក្នុងបញ្ជីប្រាថ្នា"
          aria-pressed={saved}
          onClick={() => toggleWishlist(product)}
          className="glass absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-muted-foreground shadow-sm transition-colors hover:text-destructive"
        >
          <Heart className={cn("size-4", saved && "fill-destructive text-destructive")} />
        </button>

        <div className="absolute inset-x-4 bottom-4 flex opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
          <Button
            className="h-9 flex-1 rounded-full bg-primary/90 text-xs font-bold shadow-lg backdrop-blur-md hover:bg-primary"
            onClick={() => addToCart(product)}
          >
            <ShoppingBag className="size-4" />
            ដាក់ក្នុងកាបូប
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-5">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Link
              href={href(`/products/${product.id}`)}
              className="truncate text-base font-bold hover:underline hover:underline-offset-4"
            >
              {product.name}
            </Link>
            <span className="shrink-0 text-base font-bold">{formatPrice(product.price)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>
        <div className="flex items-center gap-2 border-t border-outline-variant/20 pt-3">
          <Button
            variant="secondary"
            className="h-9 flex-1 rounded-full px-2 text-xs"
            onClick={() => openQuickView(product)}
          >
            <Eye className="size-4" />
            មើលលម្អិត
          </Button>
          <Button
            nativeButton={false}
            className="h-9 flex-1 rounded-full px-2 text-xs"
            render={
              <a
                href={telegramUrl(telegram, productOrderMessage(shopName, product, "M", 1))}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Send className="size-4" />
            តេឡេក្រាម
          </Button>
        </div>
      </div>
    </article>
  )
}
