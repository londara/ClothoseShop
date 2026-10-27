/**
 * Server-side client for the Spring Boot backend (aura-backend). Every page and
 * server action talks to the API through here; the browser never sees a token.
 *
 * Responses follow `{ data, message?, meta? }`; errors `{ error: { code, message, field? } }`
 * with Khmer messages (aura-studio/docs/API_AND_DATABASE.md §4).
 */

export const API_URL = (process.env.API_URL || "http://localhost:8080").replace(/\/+$/, "")

export type Envelope<T> = { data: T; message?: string; meta?: PageMeta }

export type PageMeta = {
  page: number
  pageSize: number
  total: number
  pageCount: number
  categoryCounts?: Record<string, number>
}

export class ApiError extends Error {
  // Plain fields (not constructor parameter properties) so Node can run this file in tests.
  readonly status: number
  readonly code: string
  readonly field?: string

  constructor(status: number, code: string, message: string, field?: string) {
    super(message)
    this.status = status
    this.code = code
    this.field = field
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** Sent as JSON. */
  body?: unknown
  /** Sent as multipart (uploads). */
  form?: FormData
  /** Access token; omit for public endpoints. */
  token?: string
  /**
   * The visitor's IP, for the API's per-IP limits on login and sign-up. Without it every
   * request would come from this server's IP and all visitors would share one limit.
   */
  clientIp?: string
}

export async function api<T>(path: string, { method = "GET", body, form, token, clientIp }: Options = {}) {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  if (clientIp) headers["X-Forwarded-For"] = clientIp
  if (body !== undefined) headers["Content-Type"] = "application/json"

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
      cache: "no-store",
    })
  } catch {
    throw new ApiError(503, "UNAVAILABLE", "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ សូមព្យាយាមម្តងទៀត")
  }

  if (response.status === 204) return { data: undefined } as Envelope<T>
  const json = await response.json().catch(() => null)
  if (!response.ok) {
    const error = json?.error
    throw new ApiError(
      response.status,
      error?.code ?? "INTERNAL",
      error?.message ?? "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត",
      error?.field ?? undefined
    )
  }
  return json as Envelope<T>
}

/** Every page of a paginated list (the API caps page sizes). */
export async function apiAll<T>(path: string, pageSize: number, token?: string): Promise<T[]> {
  const items: T[] = []
  const join = path.includes("?") ? "&" : "?"
  for (let page = 1; ; page++) {
    const { data, meta } = await api<T[]>(`${path}${join}page=${page}&pageSize=${pageSize}`, { token })
    items.push(...data)
    if (!meta || page >= meta.pageCount) return items
  }
}

// ── API shapes ──────────────────────────────────────────────────────────────

export type ApiUser = {
  id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  role: "owner" | "staff"
  isPlatformAdmin: boolean
}

export type ApiShopSummary = {
  id: string
  slug: string
  name: string
  status: "pending" | "active" | "suspended"
}

export type ApiTokens = {
  tokenType: "Bearer"
  accessToken: string
  expiresIn: number
  refreshToken: string
  refreshExpiresIn: number
  user?: ApiUser
  shop?: ApiShopSummary
}

export type ApiProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  stock: number
  /** Absent (not null) when the product has no badge: the API omits null fields here. */
  badge?: string | null
  badgeTone: string | null
  atelier: string | null
  categories: string[]
  images: string[]
  sizes?: string[]
  colors?: { name: string; hex: string }[]
  /** Only on the storefront product detail: "complete the look". */
  related?: { slug: string; name: string; price: number; image: string | null; atelier: string; badge: string | null }[]
}

export type ApiProductListItem = {
  id: string
  slug: string
  name: string
  price: number
  stock: number
  badge: string | null
  categories: string[]
  image: string | null
}

export type ApiCategory = { code: string; label: string; sortOrder: number }
