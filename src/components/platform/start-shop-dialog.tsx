"use client"

import * as React from "react"
import { BadgeCheck, Loader2, Sparkles, Store } from "lucide-react"

import { startShop } from "@/app/admin/actions"
import { useFormAction } from "@/components/admin/use-form-action"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const inputClass = "h-11 rounded-2xl bg-surface-low px-4"

/** Suggest a link from a Latin shop name ("Sophea Shop" → "sophea-shop"); Khmer names give "". */
function suggestSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="font-bold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

type TypeOption = { value: string; label: string }

function StartShopForm({ onCancel, types }: { onCancel: () => void; types: TypeOption[] }) {
  const { state, pending, onSubmit } = useFormAction(startShop)
  const [slug, setSlug] = React.useState("")
  const [slugTouched, setSlugTouched] = React.useState(false)

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <section className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gold">
          <Store className="size-4" />
          ព័ត៌មានហាង
        </h3>
        <Field label="ឈ្មោះហាង ឬឈ្មោះអ្នករចនា *" htmlFor="start-shopName">
          <Input
            id="start-shopName"
            name="shopName"
            required
            autoFocus
            placeholder="ឧ. ហាងសុភា"
            className={inputClass}
            onChange={(e) => {
              if (!slugTouched) setSlug(suggestSlug(e.target.value))
            }}
          />
        </Field>
        <Field
          label="តំណហាង (ជាអក្សរឡាតាំង) *"
          htmlFor="start-slug"
          hint="អក្សរ a-z លេខ និងសញ្ញា - ប៉ុណ្ណោះ។ មិនអាចប្តូរបានក្រោយពេលបង្កើត។"
        >
          <div className="flex items-center overflow-hidden rounded-2xl border border-input bg-surface-low focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="pl-4 text-sm text-muted-foreground">/</span>
            <input
              id="start-slug"
              name="slug"
              required
              minLength={3}
              maxLength={40}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value.toLowerCase())
              }}
              placeholder="sophea-shop"
              className="h-11 flex-1 bg-transparent pr-4 pl-1 text-sm outline-none"
            />
          </div>
        </Field>
        <Field label="ឈ្មោះអ្នកប្រើតេឡេក្រាម *" htmlFor="start-telegram" hint="ការបញ្ជាទិញរបស់អតិថិជននឹងផ្ញើមកគណនីនេះ">
          <div className="flex items-center overflow-hidden rounded-2xl border border-input bg-surface-low focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="pl-4 text-sm text-muted-foreground">@</span>
            <input
              id="start-telegram"
              name="telegram"
              required
              placeholder="your_shop"
              className="h-11 flex-1 bg-transparent pr-4 pl-1 text-sm outline-none"
            />
          </div>
        </Field>
        <Field label="ប្រភេទហាង (លក់អ្វី) *">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {types.map((s, i) => (
              <label
                key={s.value}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-2xl border border-outline-variant/50 px-3 py-2.5 text-center text-sm transition-colors",
                  "has-checked:border-primary has-checked:bg-primary has-checked:font-bold has-checked:text-primary-foreground"
                )}
              >
                <input
                  type="radio"
                  name="specialty"
                  value={s.value}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                {s.label}
              </label>
            ))}
          </div>
        </Field>
      </section>

      <section className="flex flex-col gap-4 border-t border-outline-variant/30 pt-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gold">
          <Sparkles className="size-4" />
          គណនីម្ចាស់ហាង
        </h3>
        <Field label="ឈ្មោះរបស់អ្នក *" htmlFor="start-name">
          <Input id="start-name" name="name" required autoComplete="name" className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="អ៊ីមែល" htmlFor="start-email">
            <Input id="start-email" name="email" type="email" autoComplete="email" placeholder="name@example.com" className={inputClass} />
          </Field>
          <Field label="លេខទូរស័ព្ទ" htmlFor="start-phone">
            <Input id="start-phone" name="phone" type="tel" autoComplete="tel" placeholder="012 345 678" className={inputClass} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          បញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទយ៉ាងហោចណាស់មួយ — អ្នកនឹងប្រើវាដើម្បីចូលគ្រប់គ្រងហាង។
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ពាក្យសម្ងាត់ *" htmlFor="start-password">
            <Input id="start-password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
          <Field label="បញ្ជាក់ពាក្យសម្ងាត់ *" htmlFor="start-confirm">
            <Input id="start-confirm" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          </Field>
        </div>
      </section>

      <div className="flex gap-3 rounded-2xl bg-gold-soft/50 p-4 text-xs leading-relaxed text-on-gold-soft">
        <BadgeCheck className="size-5 shrink-0" />
        <p>
          <strong className="block text-sm">ការធានារបស់អាតេលីយេ</strong>
          ហាងរបស់អ្នក ការបញ្ជាទិញតាមតេឡេក្រាម និងរចនាប័ទ្មនឹងត្រូវបានរៀបចំភ្លាមៗ។
          អ្នកអាចចាប់ផ្តើមបន្ថែមផលិតផលបានភ្លាម ហើយហាងនឹងបង្ហាញជាសាធារណៈ
          បន្ទាប់ពីក្រុមការងាររបស់យើងអនុម័ត។
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="h-11 rounded-full px-6" onClick={onCancel}>
          បោះបង់
        </Button>
        <Button type="submit" disabled={pending} className="h-11 rounded-full bg-gold px-8 font-bold text-white hover:bg-gold/90">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          បង្កើតហាងរបស់ខ្ញុំ
        </Button>
      </div>
    </form>
  )
}

/** "Create your online shop" button + sign-up dialog (any trigger styling). */
export function StartShopDialog({
  className,
  children,
  types,
}: {
  className?: string
  children: React.ReactNode
  /** Shop types from Admin → ប្រភេទហាង. */
  types: TypeOption[]
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={className} />}>{children}</DialogTrigger>
      <DialogContent className="no-scrollbar max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:max-w-xl md:p-8">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-2xl leading-[1.6] font-bold">បើកហាងអនឡាញរបស់អ្នក</DialogTitle>
          <DialogDescription>
            បំពេញព័ត៌មានខាងក្រោម ហើយហាងរបស់អ្នកនឹងរួចរាល់ក្នុងរយៈពេលតិចជាង ៣ នាទី។
          </DialogDescription>
        </div>
        {/* Remount each time so a reopened dialog starts empty. */}
        {open && <StartShopForm onCancel={() => setOpen(false)} types={types} />}
      </DialogContent>
    </Dialog>
  )
}
