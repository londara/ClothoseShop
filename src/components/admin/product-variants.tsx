"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Product, ProductColor } from "@/lib/products"
import { sizeSetOf, type SizeKind } from "@/lib/shop-types"
import { cn } from "@/lib/utils"

/** Common colours, one click to add. */
const COLOR_PRESETS: ProductColor[] = [
  { name: "ខ្មៅ", hex: "#111111" },
  { name: "ស", hex: "#ffffff" },
  { name: "ក្រែម", hex: "#efe6d6" },
  { name: "ប្រផេះ", hex: "#9ca3af" },
  { name: "ត្នោត", hex: "#8b5e3c" },
  { name: "ខៀវចាស់", hex: "#1e3a8a" },
  { name: "ក្រហម", hex: "#b91c1c" },
  { name: "បៃតង", hex: "#166534" },
  { name: "ផ្កាឈូក", hex: "#f9a8d4" },
]

/**
 * Size + colour choices on the product form. Sizes come from the shop type's
 * size system (none for e.g. jewellery); colours for every shop type. Submitted as `sizes`, `colorName`, `colorHex`.
 */
export function ProductVariants({
  product,
  sizeKind,
}: {
  product?: Product
  sizeKind: SizeKind
}) {
  const sizeSet = sizeSetOf(sizeKind)
  const [colors, setColors] = React.useState<ProductColor[]>(product?.colors ?? [])
  const initialSizes = product?.sizes?.length ? product.sizes : (sizeSet?.defaults ?? [])

  const addColor = (color: ProductColor) =>
    setColors((list) => (list.some((c) => c.name === color.name) ? list : [...list, color]))
  const updateColor = (index: number, patch: Partial<ProductColor>) =>
    setColors((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)))

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-outline-variant/30 bg-card p-6 shadow-sm xl:col-span-2">
      <h2 className="text-lg font-bold">{sizeSet ? "ពណ៌ និងទំហំ" : "ពណ៌"}</h2>

      {sizeSet && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">ទំហំដែលមាន *</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {sizeSet.options.map((s) => (
              <label
                key={s.value}
                className="flex cursor-pointer flex-col items-center rounded-2xl border border-outline-variant/40 py-2 text-sm font-bold transition-colors has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
              >
                <input
                  type="checkbox"
                  name="sizes"
                  value={s.value}
                  defaultChecked={initialSizes.includes(s.value)}
                  className="sr-only"
                />
                {s.value}
                {s.hint && <span className="text-[10px] font-normal opacity-70">{s.hint}</span>}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            ចុចដើម្បីជ្រើសរើស ឬដកទំហំចេញ។ អតិថិជននឹងជ្រើសរើសបានតែទំហំដែលអ្នកបានជ្រើស។
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-sm font-bold">ពណ៌ដែលមាន</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => {
            const added = colors.some((c) => c.name === preset.name)
            return (
              <button
                key={preset.name}
                type="button"
                disabled={added}
                onClick={() => addColor(preset)}
                className={cn(
                  "flex items-center gap-2 rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs transition-colors",
                  added ? "opacity-40" : "hover:border-primary"
                )}
              >
                <span
                  className="size-4 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.hex }}
                />
                {preset.name}
              </button>
            )
          })}
        </div>

        {colors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-outline-variant p-4 text-center text-xs text-muted-foreground">
            មិនទាន់មានពណ៌ — ជ្រើសរើសពណ៌ខាងលើ ឬបន្ថែមពណ៌ផ្ទាល់ខ្លួន។ (ទុកទទេ ប្រសិនបើផលិតផលមានតែមួយពណ៌)
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {colors.map((color, i) => (
              <li key={i} className="flex items-center gap-2">
                <input type="hidden" name="colorHex" value={color.hex} />
                <label
                  className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-outline-variant/40"
                  style={{ backgroundColor: color.hex }}
                  title="ប្តូរពណ៌"
                >
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(i, { hex: e.target.value })}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    aria-label={`ពណ៌សម្រាប់ ${color.name || "ពណ៌ថ្មី"}`}
                  />
                </label>
                <Input
                  name="colorName"
                  value={color.name}
                  required
                  maxLength={30}
                  placeholder="ឈ្មោះពណ៌ ឧ. ខ្មៅធ្យូង"
                  onChange={(e) => updateColor(i, { name: e.target.value })}
                  className="h-11 flex-1 rounded-2xl bg-surface-low px-4"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  aria-label="ដកពណ៌ចេញ"
                  onClick={() => setColors((list) => list.filter((_, j) => j !== i))}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="h-10 self-start rounded-full"
          onClick={() => setColors((list) => [...list, { name: "", hex: "#c5a880" }])}
        >
          <Plus className="size-4" />
          បន្ថែមពណ៌ផ្ទាល់ខ្លួន
        </Button>
      </div>
    </section>
  )
}
