/**
 * Shop types ("specialties"): what a shop sells. The platform admin manages the
 * list under Admin → ប្រភេទហាង; each type brings its own product categories and
 * size system. Client-safe (no server imports).
 */

export type CategoryOption = { value: string; label: string }
export type SizeOption = { value: string; hint?: string }

export type SizeKind = "none" | "clothing" | "shoes" | "kids"

export type ShopType = {
  /** Stored on each shop as `specialty`. */
  value: string
  label: string
  sizeKind: SizeKind
  categories: CategoryOption[]
}

type SizeSet = { label: string; options: SizeOption[]; defaults: string[] }

/** Size systems a shop type can use. `defaults` are pre-selected for new products. */
export const SIZE_SETS: Record<Exclude<SizeKind, "none">, SizeSet> = {
  clothing: {
    label: "ទំហំសម្លៀកបំពាក់ (XS–XXL)",
    options: [
      { value: "XS", hint: "ទំហំ ៣៤–៣៦" },
      { value: "S", hint: "ទំហំ ៣៨–៤០" },
      { value: "M", hint: "ទំហំ ៤២–៤៤" },
      { value: "L", hint: "ទំហំ ៤៦–៤៨" },
      { value: "XL", hint: "ទំហំ ៥០" },
      { value: "XXL", hint: "ទំហំ ៥២–៥៤" },
    ],
    defaults: ["S", "M", "L", "XL"],
  },
  shoes: {
    label: "ទំហំស្បែកជើង (៣៦–៤៥)",
    options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"].map((value) => ({ value })),
    defaults: ["37", "38", "39", "40", "41", "42"],
  },
  kids: {
    label: "អាយុកុមារ (០–១២ ឆ្នាំ)",
    options: [
      { value: "0-1", hint: "អាយុ ០–១ ឆ្នាំ" },
      { value: "1-2", hint: "អាយុ ១–២ ឆ្នាំ" },
      { value: "3-4", hint: "អាយុ ៣–៤ ឆ្នាំ" },
      { value: "5-6", hint: "អាយុ ៥–៦ ឆ្នាំ" },
      { value: "7-8", hint: "អាយុ ៧–៨ ឆ្នាំ" },
      { value: "9-10", hint: "អាយុ ៩–១០ ឆ្នាំ" },
      { value: "11-12", hint: "អាយុ ១១–១២ ឆ្នាំ" },
    ],
    defaults: ["1-2", "3-4", "5-6", "7-8"],
  },
}

export const SIZE_KIND_OPTIONS: { value: SizeKind; label: string }[] = [
  { value: "none", label: "គ្មានទំហំ" },
  { value: "clothing", label: SIZE_SETS.clothing.label },
  { value: "shoes", label: SIZE_SETS.shoes.label },
  { value: "kids", label: SIZE_SETS.kids.label },
]

export const sizeSetOf = (kind: SizeKind) => (kind === "none" ? null : SIZE_SETS[kind])

/** Hint under a size button ("ទំហំ ៤២–៤៤"), whatever size system it belongs to. */
export function sizeHint(size: string) {
  for (const set of Object.values(SIZE_SETS)) {
    const hit = set.options.find((o) => o.value === size)
    if (hit) return hit.hint
  }
}

/** The "show everything" filter shown before a shop's own categories. */
export const ALL_CATEGORIES: CategoryOption = { value: "all", label: "ទាំងអស់" }
export const BEST_SELLERS: CategoryOption = { value: "best-sellers", label: "លក់ដាច់បំផុត" }

/** Starting list; the platform admin can add, edit and remove types. */
export const DEFAULT_SHOP_TYPES: ShopType[] = [
  {
    value: "couture",
    label: "ម៉ូដសម្លៀកបំពាក់",
    sizeKind: "clothing",
    categories: [
      { value: "women", label: "នារី" },
      { value: "men", label: "បុរស" },
      { value: "accessories", label: "គ្រឿងបន្លាស់" },
      BEST_SELLERS,
    ],
  },
  {
    value: "jewelry",
    label: "គ្រឿងអលង្ការ",
    sizeKind: "none",
    categories: [
      { value: "rings", label: "ចិញ្ចៀន" },
      { value: "necklaces", label: "ខ្សែក" },
      { value: "earrings", label: "ក្រវិល" },
      { value: "bracelets", label: "ខ្សែដៃ" },
      BEST_SELLERS,
    ],
  },
  {
    value: "ceramics",
    label: "សេរ៉ាមិច និងវត្ថុតុបតែង",
    sizeKind: "none",
    categories: [
      { value: "tableware", label: "ចាន និងចានគោម" },
      { value: "cups", label: "ពែង និងកែវ" },
      { value: "vases", label: "ថូផ្កា" },
      { value: "decor", label: "វត្ថុតុបតែង" },
      BEST_SELLERS,
    ],
  },
  {
    value: "leather",
    label: "ផលិតផលស្បែក",
    sizeKind: "none",
    categories: [
      { value: "handbags", label: "កាបូបដៃ" },
      { value: "wallets", label: "កាបូបលុយ" },
      { value: "belts", label: "ខ្សែក្រវាត់" },
      { value: "shoes", label: "ស្បែកជើង" },
      BEST_SELLERS,
    ],
  },
]

/**
 * Product categories of one shop: the ones its owner has set up, or the
 * defaults of its shop type until they add their own.
 */
export function shopCategories(
  shop: { categories?: CategoryOption[]; specialty: string },
  types: ShopType[]
): CategoryOption[] {
  return shop.categories ?? shopTypeOf(types, shop.specialty).categories
}

/** Type of a shop; a deleted/unknown type falls back to "best sellers only, no sizes". */
export function shopTypeOf(types: ShopType[], value: string): ShopType {
  return (
    types.find((t) => t.value === value) ?? {
      value,
      label: value,
      sizeKind: "none",
      categories: [BEST_SELLERS],
    }
  )
}
