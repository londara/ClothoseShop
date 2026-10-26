/** The marketplace that hosts every shop (the home page at `/`). */
export const PLATFORM_NAME = "AURA Studio"

/** Shop specialties offered in the "create your shop" form. */
export const specialties = [
  { value: "couture", label: "ម៉ូដសម្លៀកបំពាក់" },
  { value: "jewelry", label: "គ្រឿងអលង្ការ" },
  { value: "ceramics", label: "សេរ៉ាមិច និងវត្ថុតុបតែង" },
  { value: "leather", label: "ផលិតផលស្បែក" },
] as const

export const specialtyLabel = (value: string) =>
  specialties.find((s) => s.value === value)?.label ?? value

/** Prefix a shop-relative path ("/catalogue", "/#about") with the shop's link. */
export function shopHref(slug: string, path = "") {
  if (!path || path === "/") return `/${slug}`
  return path.startsWith("/#") ? `/${slug}${path.slice(1)}` : `/${slug}${path}`
}
