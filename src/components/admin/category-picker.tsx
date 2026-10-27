"use client"

import * as React from "react"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { addShopCategory } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CategoryOption } from "@/lib/shop-types"

/**
 * Category checkboxes of the product form (submitted as `categories`), with an
 * inline "add new category" that saves it to the shop and ticks it right away.
 */
export function CategoryPicker({
  initial,
  selected,
}: {
  initial: CategoryOption[]
  /** Categories already on the product being edited. */
  selected: string[]
}) {
  const [categories, setCategories] = React.useState(initial)
  const [checked, setChecked] = React.useState(() => new Set(selected))
  const [adding, setAdding] = React.useState(false)
  const [name, setName] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const toggle = (value: string) =>
    setChecked((set) => {
      const next = new Set(set)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  const add = () =>
    startTransition(async () => {
      const result = await addShopCategory(name)
      if (!result.category) {
        toast.error(result.error ?? "មិនអាចបន្ថែមប្រភេទបានទេ")
        return
      }
      const category = result.category
      // Same order as the server: new categories go above "best sellers".
      setCategories((list) => {
        const at = list.findIndex((c) => c.value === "best-sellers")
        return at === -1 ? [...list, category] : [...list.slice(0, at), category, ...list.slice(at)]
      })
      setChecked((set) => new Set(set).add(category.value))
      toast.success(`បានបន្ថែមប្រភេទ «${category.label}»`)
      setName("")
      setAdding(false)
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {categories.map((c) => (
          <label
            key={c.value}
            className="flex cursor-pointer items-center gap-2 rounded-2xl border border-outline-variant/40 px-3 py-2.5 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
          >
            <input
              type="checkbox"
              name="categories"
              value={c.value}
              checked={checked.has(c.value)}
              onChange={() => toggle(c.value)}
              className="size-4 accent-current"
            />
            {c.label}
          </label>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            maxLength={40}
            placeholder="ឈ្មោះប្រភេទថ្មី ឧ. អាវយឺត"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Enter adds the category instead of submitting the whole product form.
              if (e.key === "Enter") {
                e.preventDefault()
                if (name.trim()) add()
              }
              if (e.key === "Escape") setAdding(false)
            }}
            className="h-10 flex-1 rounded-2xl bg-surface-low px-4"
          />
          <Button
            type="button"
            disabled={pending || !name.trim()}
            className="h-10 rounded-full px-4"
            onClick={add}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            បន្ថែម
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label="បោះបង់"
            onClick={() => setAdding(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-10 self-start rounded-full border-dashed"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" />
          បន្ថែមប្រភេទថ្មី
        </Button>
      )}
    </div>
  )
}
