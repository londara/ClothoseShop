"use client"

import * as React from "react"
import Link from "next/link"
import { ImagePlus, Loader2, Save, X } from "lucide-react"

import { saveProduct } from "@/app/admin/actions"
import { CategoryPicker } from "@/components/admin/category-picker"
import { ProductVariants } from "@/components/admin/product-variants"
import { useFormAction } from "@/components/admin/use-form-action"
import Image from "@/components/shop/smart-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CategoryOption, Product } from "@/lib/products"
import type { SizeKind } from "@/lib/shop-types"
import { cn } from "@/lib/utils"

function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor} className="font-bold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputClass = "h-11 rounded-2xl bg-surface-low px-4"

export function ProductForm({
  product,
  categories,
  specialty,
  sizeKind,
}: {
  product?: Product
  /** Categories of the shop's specialty (from the "create a shop" form). */
  categories: CategoryOption[]
  /** Specialty label shown above the category choices. */
  specialty: string
  /** Size system of the shop's type; "none" → colours only. */
  sizeKind: SizeKind
}) {
  const { state, pending, onSubmit } = useFormAction(saveProduct)
  const [existing, setExisting] = React.useState<string[]>(product?.images ?? [])
  const [previews, setPreviews] = React.useState<string[]>([])
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {product && <input type="hidden" name="id" value={product.id} />}

      <section className="flex flex-col gap-5 rounded-3xl border border-outline-variant/30 bg-card p-6 shadow-sm xl:col-span-2">
        <h2 className="text-lg font-bold">ព័ត៌មានផលិតផល</h2>
        <Field label="ឈ្មោះផលិតផល *" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={product?.name}
            placeholder="ឧ. អាវធំកាស្មៀរមានខ្សែក្រវាត់"
            className={inputClass}
          />
        </Field>
        <Field label="ការពិពណ៌នា *" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            required
            rows={5}
            defaultValue={product?.description}
            placeholder="ពិពណ៌នាអំពីក្រណាត់ ការកាត់ដេរ និងលក្ខណៈពិសេស..."
            className="rounded-2xl bg-surface-low px-4 py-3 leading-relaxed"
          />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="តម្លៃ (ដុល្លារ) *" htmlFor="price">
            <Input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={product?.price}
              placeholder="890"
              className={inputClass}
            />
          </Field>
          <Field label="ចំនួនស្តុក *" htmlFor="stock">
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={product?.stock ?? 10}
              className={inputClass}
            />
          </Field>
          <Field label="ស្លាកលើរូបភាព" htmlFor="badge" hint="ឧ. កាស្មៀរសុទ្ធ, ផលិតចំនួនកំណត់">
            <Input id="badge" name="badge" defaultValue={product?.badge} className={inputClass} />
          </Field>
          <Field label="ពណ៌ស្លាក">
            <div className="flex gap-2">
              {[
                { value: "neutral", label: "ប្រផេះ", className: "bg-surface-highest" },
                { value: "gold", label: "មាស", className: "bg-gold-soft text-on-gold-soft" },
              ].map((tone) => (
                <label
                  key={tone.value}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-outline-variant/40 py-2.5 text-sm has-checked:border-primary has-checked:ring-2 has-checked:ring-primary/15"
                >
                  <input
                    type="radio"
                    name="badgeTone"
                    value={tone.value}
                    defaultChecked={(product?.badgeTone ?? "neutral") === tone.value}
                    className="sr-only"
                  />
                  <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold", tone.className)}>
                    {tone.label}
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </div>
        <Field label="អាតេលីយេ / ស្ទូឌីយោ" htmlFor="atelier">
          <Input
            id="atelier"
            name="atelier"
            defaultValue={product?.atelier}
            placeholder="ឧ. ស្ទូឌីយោមីឡាន"
            className={inputClass}
          />
        </Field>
      </section>

      <ProductVariants product={product} sizeKind={sizeKind} />

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold">ប្រភេទ *</h2>
            <p className="text-xs text-muted-foreground">
              ហាង៖ <span className="font-bold text-gold">{specialty}</span> — ជ្រើសរើសមួយ ឬច្រើន ឬបន្ថែមប្រភេទថ្មី
            </p>
          </div>
          <CategoryPicker initial={categories} selected={product?.categories ?? []} />
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">រូបភាព *</h2>
          <p className="-mt-2 text-xs text-muted-foreground">
            រូបភាពទីមួយនឹងបង្ហាញជារូបភាពមេ។ ទំហំអតិបរមា ៥MB ក្នុងមួយរូប។
          </p>
          {(existing.length > 0 || previews.length > 0) && (
            <div className="grid grid-cols-3 gap-2">
              {existing.map((src, i) => (
                <div key={src} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-container">
                  <input type="hidden" name="existingImages" value={src} />
                  <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 text-[10px] text-primary-foreground">
                      រូបមេ
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="ដករូបភាពចេញ"
                    onClick={() => setExisting((list) => list.filter((s) => s !== src))}
                    className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {previews.map((src) => (
                <div key={src} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-container ring-2 ring-gold">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={src} alt="" className="size-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded-full bg-gold px-2 text-[10px] text-white">
                    ថ្មី
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-outline-variant py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ImagePlus className="size-6" />
            ជ្រើសរើសរូបភាពពីកុំព្យូទ័រ
          </button>
          <input
            ref={fileRef}
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            hidden
            onChange={(e) =>
              setPreviews(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))
            }
          />
          <Field label="ឬបិទភ្ជាប់តំណរូបភាព" htmlFor="imageUrls" hint="មួយតំណក្នុងមួយបន្ទាត់ (https://...)">
            <Textarea
              id="imageUrls"
              name="imageUrls"
              rows={2}
              placeholder="https://..."
              className="rounded-2xl bg-surface-low px-4 py-2 text-xs"
            />
          </Field>
        </section>
      </div>

      <div className="glass sticky bottom-4 z-20 flex flex-col-reverse items-stretch justify-end gap-3 rounded-3xl border border-outline-variant/30 p-3 shadow-lg sm:flex-row sm:items-center xl:col-span-3">
        {state.error && (
          <p role="alert" className="flex-1 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/admin/products" />}
          className="h-11 rounded-full px-6"
        >
          បោះបង់
        </Button>
        <Button type="submit" disabled={pending} className="h-11 rounded-full px-8 font-bold">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {product ? "រក្សាទុកការកែប្រែ" : "បង្កើតផលិតផល"}
        </Button>
      </div>
    </form>
  )
}
