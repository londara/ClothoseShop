"use client"

import * as React from "react"
import Image from "@/components/shop/smart-image"
import {
  BadgeCheck,
  Heart,
  Lock,
  Plane,
  Ruler,
  Scissors,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Undo2,
  Wind,
  ZoomIn,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { productOrderMessage, useShop } from "@/components/shop/shop-provider"
import { ColorPicker, QuantityStepper, SizePicker } from "@/components/shop/size-picker"
import { defaultChoice, sizesOf, type Product } from "@/lib/products"
import { formatPrice, kh, telegramUrl } from "@/lib/site"
import { cn } from "@/lib/utils"


const galleryLabels = ["ខាងមុខ", "ការធ្លាក់", "ឡេវស្នែង", "វាយនភាព", "រចនាប័ទ្ម", "លម្អិត"]

const details = [
  {
    value: "fabric",
    icon: Wind,
    title: "ក្រណាត់ និងសម្ភារៈ",
    body: "កាស្មៀរម៉ុងហ្គោលីសុទ្ធ ១០០% ត្បាញពីរមុខ គ្មានស្រទាប់ក្នុង។ ជ្រលក់ពណ៌ដោយរុក្ខជាតិធម្មជាតិ និងបញ្ជាក់ប្រភពពីរោងត្បាញប៊ីយ៉ែឡា។",
  },
  {
    value: "tailoring",
    icon: Scissors,
    title: "ការកាត់ដេរ និងរាង",
    body: "រាងធំធូររលុង ស្មាធ្លាក់ ផ្ទាំងការពារភ្លៀងបែបស្ថាបត្យកម្ម និងខ្សែក្រវាត់អាចដោះចេញបាន ដើម្បីបង្កើតរាងតាមចិត្ត។",
  },
  {
    value: "concierge",
    icon: Sparkles,
    title: "សេវាជំនួយការឥតគិតថ្លៃ",
    body: "ពិគ្រោះទំហំផ្ទាល់ជាមួយអ្នករចនាម៉ូដជាន់ខ្ពស់តាមតេឡេក្រាម ការកែសម្រួលទំហំឥតគិតថ្លៃ និងការវេចខ្ចប់ជាកាដូ។",
  },
  {
    value: "shipping",
    icon: Truck,
    title: "ការដឹកជញ្ជូន និងការត្រឡប់",
    body: "ដឹកជញ្ជូនតាមយន្តហោះក្នុងរយៈពេល ៣ ថ្ងៃ មានការធានារ៉ាប់រង។ អាចត្រឡប់ ឬប្តូរបានក្នុងរយៈពេល ៣០ ថ្ងៃ។",
  },
]

const sizeGuide = [
  ["S", "៨៨", "៧២", "៩៦"],
  ["M", "៩២", "៧៦", "១០០"],
  ["L", "៩៦", "៨០", "១០៤"],
  ["XL", "១០០", "៨៤", "១០៨"],
]

function SizeGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger className="flex items-center gap-1 text-xs font-bold text-gold underline underline-offset-4">
        <Ruler className="size-3.5" />
        តារាងទំហំ
      </DialogTrigger>
      <DialogContent className="rounded-3xl p-6 sm:max-w-md">
        <DialogTitle className="text-xl font-bold">តារាងទំហំ និងសមាមាត្រ</DialogTitle>
        <DialogDescription>រង្វាស់ទាំងអស់គិតជាសង់ទីម៉ែត្រ</DialogDescription>
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-outline-variant/40 text-muted-foreground">
              <th className="py-2 font-normal">ទំហំ</th>
              <th className="py-2 font-normal">ទ្រូង</th>
              <th className="py-2 font-normal">ចង្កេះ</th>
              <th className="py-2 font-normal">ត្រគាក</th>
            </tr>
          </thead>
          <tbody>
            {sizeGuide.map((row) => (
              <tr key={row[0]} className="border-b border-outline-variant/20 last:border-0">
                {row.map((cell, i) => (
                  <td key={i} className={cn("py-2", i === 0 && "font-bold")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  )
}

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart, setCartOpen, toggleWishlist, isWishlisted, shopName, telegram, sizeKind } =
    useShop()
  const sizes = sizesOf(product, sizeKind)
  const colors = product.colors ?? []
  const [active, setActive] = React.useState(0)
  const [choice, setChoice] = React.useState(() => defaultChoice(product, sizeKind))
  const [quantity, setQuantity] = React.useState(1)
  const saved = isWishlisted(product.id)
  const gallery = product.images

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
      {/* Gallery */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-surface-container">
          <Image
            src={gallery[active]}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-top"
          />
          <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
            {product.badge && (
              <span className="glass rounded-full px-3 py-0.5 text-[11px] font-bold shadow-sm">
                {product.badge}
              </span>
            )}
            <span className="rounded-full bg-gold-soft px-3 py-0.5 text-[11px] font-bold text-on-gold-soft">
              ការកាត់អាតេលីយេ៖ លេខ {kh(18)} / {kh(80)}
            </span>
          </div>
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <span className="glass flex size-9 items-center justify-center rounded-full shadow-sm">
              <ZoomIn className="size-4" />
            </span>
            <button
              type="button"
              aria-label="រក្សាទុកក្នុងបញ្ជីប្រាថ្នា"
              aria-pressed={saved}
              onClick={() => toggleWishlist(product)}
              className="glass flex size-9 items-center justify-center rounded-full shadow-sm"
            >
              <Heart className={cn("size-4", saved && "fill-destructive text-destructive")} />
            </button>
          </div>
          <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            {sizes.includes("M") && (
              <span className="glass rounded-full px-3 py-1">តួអង្គកម្ពស់ ១៧៨ សង់ទីម៉ែត្រ • ពាក់ទំហំ M</span>
            )}
            <span className="glass rounded-full px-3 py-1">មានក្នុងស្តុកនៅសាឡុងប៉ារីស</span>
          </div>
        </div>

        {gallery.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {gallery.slice(0, 4).map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative aspect-[4/5] overflow-hidden rounded-2xl border bg-surface-container transition-all",
                  i === active
                    ? "border-2 border-primary"
                    : "border-outline-variant/30 opacity-80 hover:opacity-100"
                )}
              >
                <Image src={src} alt={galleryLabels[i]} fill sizes="15vw" className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-white/80 py-0.5 text-center text-[10px]">
                  {galleryLabels[i]}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 rounded-3xl border border-outline-variant/30 bg-surface-low p-5">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-bold">រួមបញ្ចូលវិញ្ញាបនបត្ររោងត្បាញប៊ីយ៉ែឡា</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                សម្លៀកបំពាក់នីមួយៗមានវិញ្ញាបនបត្របណ្ណសារ និងព្យួរខោអាវឈើតាត្រៅសម្រាប់ថែរក្សា។
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xl leading-snug font-bold text-gold italic">
            កាស្មៀរ
            <br />
            ១០០%
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-6 lg:col-span-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-gold">{shopName} • {product.atelier}</span>
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-foreground" />
              {kh("4.9")} <span className="text-muted-foreground">({kh(34)} នាក់)</span>
            </span>
          </div>
          <h1 className="text-3xl leading-[1.5] font-bold md:text-4xl md:leading-[1.45]">
            {product.name}
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
            <span className="text-xs text-muted-foreground">ដុល្លារ / រួមពន្ធ</span>
          </div>
          <p className="text-[15px] leading-relaxed text-muted-foreground">{product.description}</p>
        </div>

        {colors.length > 0 && (
          <div>
            <div className="mb-2 text-sm">
              ពណ៌៖ <strong>{choice.color}</strong>
            </div>
            <ColorPicker
              colors={colors}
              value={choice.color}
              onChange={(color) => setChoice((c) => ({ ...c, color }))}
            />
          </div>
        )}

        {sizes.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold">ជ្រើសរើសទំហំ</span>
              {sizeKind === "clothing" && <SizeGuideDialog />}
            </div>
            <SizePicker
              sizes={sizes}
              value={choice.size}
              onChange={(size) => setChoice((c) => ({ ...c, size }))}
              showHints
            />
          </div>
        )}

        {product.stock <= 5 && (
          <p className="-mt-3 text-xs font-bold text-destructive">នៅសល់តែ {kh(product.stock)} ប៉ុណ្ណោះ</p>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold">ចំនួន</span>
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <span className="hidden flex-1 text-right text-xs text-muted-foreground sm:block">
            រួមបញ្ចូលការធានារ៉ាប់រងដឹកជញ្ជូនឥតគិតថ្លៃ
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            nativeButton={false}
            render={
              <a
                href={telegramUrl(telegram, productOrderMessage(shopName, product, choice, quantity))}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            className="h-13 rounded-full text-sm font-bold shadow-lg"
          >
            <Send className="size-4" />
            បញ្ជាទិញផ្ទាល់តាមតេឡេក្រាម
          </Button>
          <Button
            variant="outline"
            className="h-13 rounded-full border-outline-variant/40 text-sm font-bold"
            onClick={() => {
              addToCart(product, choice, quantity)
              setCartOpen(true)
            }}
          >
            <ShoppingBag className="size-4" />
            បន្ថែមទៅកាបូប
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] leading-snug text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Plane className="size-3.5 shrink-0" />
            ដឹកតាមយន្តហោះ ៣ ថ្ងៃ
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 shrink-0" />
            ទូទាត់ប្រកបដោយសុវត្ថិភាព
          </span>
          <span className="flex items-center gap-1.5">
            <Undo2 className="size-3.5 shrink-0" />
            ត្រឡប់វិញក្នុង ៣០ ថ្ងៃ
          </span>
        </div>

        <Accordion className="flex flex-col gap-2.5">
          {details.map(({ value, icon: Icon, title, body }) => (
            <AccordionItem
              key={value}
              value={value}
              className="rounded-2xl border border-outline-variant/30 bg-surface-low px-4"
            >
              <AccordionTrigger className="py-3.5 text-sm font-bold hover:no-underline">
                <span className="flex items-center gap-3">
                  <Icon className="size-4 text-gold" />
                  {title}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">
                {body}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
