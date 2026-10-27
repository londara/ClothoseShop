"use client"

import Image from "@/components/shop/smart-image"
import { Minus, Plus, Send, ShoppingBag, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { lineKey, useShop } from "@/components/shop/shop-provider"
import { describeChoice } from "@/lib/products"
import { formatPrice, kh } from "@/lib/site"
import { cn } from "@/lib/utils"

export function CartSheet() {
  const {
    cart,
    cartCount,
    cartTotal,
    cartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    checkoutUrl,
    getProduct,
  } = useShop()

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        className="w-full gap-0 bg-card data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center gap-2 border-b border-outline-variant/30 p-5">
          <SheetTitle className="text-xl font-bold">កាបូបរបស់អ្នក</SheetTitle>
          <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-bold text-on-gold-soft">
            {kh(cartCount)}
          </span>
          <SheetDescription className="sr-only">
            បញ្ជីសម្លៀកបំពាក់ដែលអ្នកបានជ្រើសរើស
          </SheetDescription>
        </SheetHeader>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <ShoppingBag className="size-10 text-outline-variant" />
              <p className="text-lg font-bold text-foreground">កាបូបរបស់អ្នកនៅទទេ</p>
              <p className="text-sm">សូមជ្រើសរើសសម្លៀកបំពាក់ពីកម្រងរដូវ ២០២៥ របស់យើង។</p>
            </div>
          ) : (
            cart.map((line) => {
              const product = getProduct(line.productId)
              if (!product) return null
              return (
                <div
                  key={lineKey(line)}
                  className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-low p-1.5"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="truncate text-sm font-bold">{product.name}</h4>
                      <button
                        type="button"
                        aria-label="ដកចេញ"
                        onClick={() => removeFromCart(lineKey(line))}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    {describeChoice(line) && (
                      <span className="block text-xs text-muted-foreground">
                        {describeChoice(line)}
                      </span>
                    )}
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-outline-variant/40 bg-card px-1 py-0.5">
                        <button
                          type="button"
                          aria-label="បន្ថយចំនួន"
                          onClick={() => updateQuantity(lineKey(line), -1)}
                          className="flex size-6 items-center justify-center rounded-full hover:bg-surface-container"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="px-2 text-xs font-bold">{kh(line.quantity)}</span>
                        <button
                          type="button"
                          aria-label="បង្កើនចំនួន"
                          onClick={() => updateQuantity(lineKey(line), 1)}
                          className="flex size-6 items-center justify-center rounded-full hover:bg-surface-container"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatPrice(product.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <SheetFooter className="gap-4 border-t border-outline-variant/30 bg-surface-low/50 p-5">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>តម្លៃសរុបរង</span>
              <span className="font-semibold text-foreground">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>សេវាដឹកជញ្ជូន</span>
              <span className="font-semibold text-gold">ឥតគិតថ្លៃ</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>សរុប</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              nativeButton={false}
              render={<a href={checkoutUrl} target="_blank" rel="noopener noreferrer" />}
              className={cn(
                "h-12 w-full rounded-full text-sm font-bold shadow-xl",
                cart.length === 0 && "pointer-events-none opacity-50"
              )}
            >
              <Send className="size-4" />
              ទូទាត់តាមតេឡេក្រាម
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-full text-muted-foreground"
              onClick={() => setCartOpen(false)}
            >
              បន្តមើលទំនិញ
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
