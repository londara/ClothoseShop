"use client"

import * as React from "react"
import Image from "@/components/shop/smart-image"
import Link from "next/link"
import { ArrowLeft, Send, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { productOrderMessage, useShop } from "@/components/shop/shop-provider"
import { ColorPicker, QuantityStepper, SizePicker } from "@/components/shop/size-picker"
import { defaultChoice, sizesOf, type Product } from "@/lib/products"
import { formatPrice, kh, telegramUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

function QuickViewBody({ product }: { product: Product }) {
  const { addToCart, closeQuickView, setCartOpen, shopName, telegram, href, sizeKind } = useShop()
  const sizes = sizesOf(product, sizeKind)
  const colors = product.colors ?? []
  const [choice, setChoice] = React.useState(() => defaultChoice(product, sizeKind))
  const [quantity, setQuantity] = React.useState(1)
  const [active, setActive] = React.useState(0)
  const gallery = product.images.slice(0, 4)

  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex flex-col gap-3 bg-surface-low p-5 md:w-1/2">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-container">
          <Image
            src={gallery[active]}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 420px, 90vw"
            className="object-cover object-top"
          />
        </div>
        {gallery.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {gallery.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`រូបភាពទី ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border transition-opacity",
                  i === active
                    ? "border-2 border-primary ring-2 ring-primary/20"
                    : "border-outline-variant/40 opacity-70 hover:opacity-100"
                )}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-5 p-6 md:w-1/2 md:p-8">
        <div>
          <span className="text-xs font-bold text-gold">
            កម្រងអាតេលីយេ • ផលិតចំនួនកំណត់
          </span>
          <DialogTitle className="mt-1 text-2xl leading-snug font-bold">
            {product.name}
          </DialogTitle>
          <span className="mt-2 block text-xl font-medium">
            {formatPrice(product.price)}
          </span>
          <DialogDescription className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {product.description}
          </DialogDescription>

          {colors.length > 0 && (
            <div className="mt-5">
              <span className="mb-2 block text-sm">
                ពណ៌៖ <strong>{choice.color}</strong>
              </span>
              <ColorPicker
                colors={colors}
                value={choice.color}
                onChange={(color) => setChoice((c) => ({ ...c, color }))}
              />
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold">ជ្រើសរើសទំហំ</span>
                <Link
                  href={href(`/products/${product.id}`)}
                  onClick={closeQuickView}
                  className="text-xs text-gold underline underline-offset-4"
                >
                  តារាងទំហំ
                </Link>
              </div>
              <SizePicker
                sizes={sizes}
                value={choice.size}
                onChange={(size) => setChoice((c) => ({ ...c, size }))}
              />
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold">ចំនួន</span>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
            <span className="text-sm text-muted-foreground">
              សរុប
              <span className="ml-1 text-xs">
                ({formatPrice(product.price)} × {kh(quantity)})
              </span>
            </span>
            <span aria-live="polite" className="text-xl font-bold">
              {formatPrice(product.price * quantity)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-outline-variant/30 pt-4">
          <Button
            variant="secondary"
            className="h-12 rounded-full text-sm font-bold"
            onClick={() => {
              addToCart(product, choice, quantity)
              closeQuickView()
              setCartOpen(true)
            }}
          >
            <ShoppingBag className="size-4" />
            បន្ថែមទៅកាបូប
          </Button>
          <Button
            nativeButton={false}
            className="h-12 rounded-full text-sm font-bold shadow-md"
            render={
              <a
                href={telegramUrl(telegram, productOrderMessage(shopName, product, choice, quantity))}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Send className="size-4" />
            បញ្ជាទិញភ្លាមៗតាមតេឡេក្រាម
          </Button>
          <Link
            href={href(`/products/${product.id}`)}
            onClick={closeQuickView}
            className="mt-1 inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            មើលព័ត៌មានលម្អិតពេញលេញ
            <ArrowLeft className="size-3 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function QuickViewDialog() {
  const { quickView, closeQuickView } = useShop()

  return (
    <Dialog open={quickView !== null} onOpenChange={(open) => !open && closeQuickView()}>
      <DialogContent className="no-scrollbar max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-4xl">
        {quickView && <QuickViewBody key={quickView.id} product={quickView} />}
      </DialogContent>
    </Dialog>
  )
}
