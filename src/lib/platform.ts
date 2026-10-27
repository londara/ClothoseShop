/** The marketplace that hosts every shop (the home page at `/`). */
export const PLATFORM_NAME = "AURA Studio"

/** Slug of the platform's first shop (the API creates it on first start). */
export const FIRST_SHOP_SLUG = "aura-studio"

/** Prefix a shop-relative path ("/catalogue", "/#about") with the shop's link. */
export function shopHref(slug: string, path = "") {
  if (!path || path === "/") return `/${slug}`
  return path.startsWith("/#") ? `/${slug}${path.slice(1)}` : `/${slug}${path}`
}
