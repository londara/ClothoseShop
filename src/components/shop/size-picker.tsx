"use client"

import { Minus, Plus } from "lucide-react"

import { sizes, type Size } from "@/lib/products"
import { kh } from "@/lib/site"
import { cn } from "@/lib/utils"

export function SizePicker({
  value,
  onChange,
  showHints = false,
}: {
  value: Size
  onChange: (size: Size) => void
  showHints?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="ជ្រើសរើសទំហំ" className="grid grid-cols-4 gap-2">
      {sizes.map((s) => {
        const active = s.value === value
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border text-sm font-bold transition-all",
              showHints ? "py-2.5" : "rounded-full py-2",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-outline-variant/50 bg-card hover:border-primary"
            )}
          >
            {s.value}
            {showHints && (
              <span
                className={cn(
                  "text-[10px] font-normal",
                  active ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {s.hint}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function QuantityStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center rounded-full border border-outline-variant/40 bg-surface-container px-1.5 py-1">
      <button
        type="button"
        aria-label="បន្ថយចំនួន"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-surface-high"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-sm font-bold">{kh(value)}</span>
      <button
        type="button"
        aria-label="បង្កើនចំនួន"
        onClick={() => onChange(value + 1)}
        className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-surface-high"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
