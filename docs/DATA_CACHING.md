# Data caching: how it was implemented

**Goal:** stop calling the API on every page load. Data is cached on the Next.js server and
reloaded only when it changes or gets old. Changes made in the admin still show
**immediately**.

**Result (measured):** 32 admin page loads made **3** API calls. Without the cache, every load
made 2–3 calls (`/auth/me` plus the page's data).

---

## 1. What is cached

| Data | Function | Cache key | Lifetime | Tags (cleared by) |
|---|---|---|---|---|
| Public shops, products, owner profile | `getShopBySlug(slug)`, `getActiveShops()` in `src/lib/data.ts` | slug | `hours` | `shops`, `users` |
| Shop types | `getShopTypes()` in `src/lib/data.ts` | – | `hours` | `shop-types` |
| Logged-in user (`GET /auth/me`) | `cachedMe(token)` in `src/lib/admin-cache.ts` | access token | stale/revalidate 60 s, expire 5 min | `user:{userId}`, `shop:{shopId}`, `platform` |
| Admin reads (dashboard, products, categories, form options, product detail, settings, staff, platform shops) | `cachedGet(token, shopId, path)` in `src/lib/admin-cache.ts` | access token + shop id + path | `minutes` (revalidate 1 min, expire 1 h) | `shop:{shopId}` (+ `platform` for `/platform/*`) |

Not cached: **writes** (POST/PUT/PATCH/DELETE through `authed()`), login, refresh and logout.

Lifetimes use Next.js 16 `cacheLife`. `revalidate` is when the next request refreshes the
entry in the background while the old data is still shown; `expire` is when the old data can
no longer be shown.

---

## 2. Implementation steps

### Step 1: Turn on Cache Components (already done)

`next.config.ts` has `cacheComponents: true`, which enables the `"use cache"` directive,
`cacheLife` and `cacheTag`.

### Step 2: Cache the public storefront (`src/lib/data.ts`)

Each reader starts with:

```ts
"use cache"
cacheTag(TAGS.shops)        // a name used to clear this entry later
cacheLife("hours")
```

The function arguments (e.g. `slug`) become the cache key, so each shop has its own entry.

### Step 3: Cache the admin reads per user (`src/lib/admin-cache.ts`)

A cached function cannot read cookies, so the token is read outside and **passed as an
argument**. That makes the token part of the cache key:

```ts
export async function cachedGet<T>(token: string, shopId: string, path: string, pageSize?: number) {
  "use cache"
  cacheLife("minutes")
  cacheTag(shopTag(shopId))                     // "shop:{shopId}"
  if (path.startsWith("/api/v1/platform/")) cacheTag(PLATFORM_TAG)
  return pageSize ? { data: await apiAll(path, pageSize, token) } : api<T>(path, { token })
}
```

Why the token is in the key:

- **Security / multi-shop:** each entry belongs to one logged-in user, so one shop can never
  see another shop's cached data.
- When the token is refreshed (about every 15 min), new entries start automatically.

`src/lib/auth.ts` gains `adminRead(path, pageSize?)`, which takes the token and shop from the
session and calls `cachedGet`. The admin pages call `adminRead()` instead of `authed()` for
their reads.

### Step 4: Cache the session check (`/auth/me`)

`getSession()` (in `src/lib/auth.ts`) calls `cachedMe(token)`:

```ts
"use cache"
cacheLife({ stale: 60, revalidate: 60, expire: 300 })
const { data } = await api<Me>("/api/v1/auth/me", { token })
cacheTag(userTag(data.user.id), shopTag(data.shop.id))   // tags known after the call
```

The window is kept short because this check decides whether a disabled user or a suspended
shop can still open pages.

> **Gotcha found while testing:** the first version used `expire: 60`. Next.js treats any
> cache with `expire` **under 5 minutes** as dynamic, so it called the API on every page
> anyway (8 loads → 8 `/auth/me` calls). With `expire: 300` the entry is stored, and after
> 60 s the next request refreshes it in the background.

### Step 5: Clear the cache when something changes (`src/app/admin/actions.ts`)

Every server action that changes data calls `updateTag(...)` for what it touched, so the next
render reads fresh data. The helper is:

```ts
async function refreshMyShop(...more: string[]) {
  const { shop } = await requireAdmin()
  for (const tag of [shopTag(shop.id), ...more]) updateTag(tag)
}
```

| Action | Tags cleared | Why |
|---|---|---|
| `saveProduct`, `deleteProduct` | `shop:{me}`, `shops`, `platform` | admin lists and dashboard, storefront, product counts |
| `addShopCategory` | `shop:{me}`, `shops` | form options, storefront filters |
| `saveSettings` | `shop:{me}`, `shops`, `platform` | sidebar shop name, storefront, platform list |
| `saveProfile` | `shop:{me}`, `user:{me}`, `users` | sidebar, staff list, owner profile on the storefront |
| `changePassword` | `user:{me}` | sessions on other devices end now |
| `createStaff` | `shop:{me}`, `platform` | staff list, account counts |
| `setStaffStatus`, `deleteStaff` | `shop:{me}`, `user:{staff}` | a disabled staff member is locked out at once |
| `startShop` | `shops`, `platform` | new pending shop in the platform list |
| `setShopStatus`, `deleteShop` | `shops`, `platform`, `shop:{that shop}` | storefront; that shop's sessions (suspended → logged out at once) |

`updateTag` (Next.js 16) clears the entries right away and also clears the browser's router
cache, so the user sees their own change immediately.

### Step 6: Errors are never cached

If the API answers with an error, `cachedGet`/`cachedMe` throw, and Next.js does not store
the result. The page still receives the `ApiError`: an unknown product gives a 404 page, and
a 401 sends the user to the login page.

---

## 3. How it was tested

API requests were counted in the backend log (`LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_WEB=DEBUG`):

1. 32 loads of `/admin`, `/admin/products`, `/admin/settings`, `/admin/staff` → 3 API calls
   (the first visit to each uncached page).
2. Two products were created **directly in the API**: the cached admin list did not show them
   (as expected).
3. One of them was deleted through the Next.js `deleteProduct` action: the list was fresh
   right away and showed only the other product, so `updateTag` cleared the cache.
4. An unknown product id still shows the 404 page.

---

## 4. Things to know

- **Changes made outside this website** (Swagger, another app, SQL) are not announced to
  Next.js. They show after the lifetime: admin data within about 1 minute (background
  refresh), the storefront within an hour. Restarting Next.js clears all caches.
- **One server:** the default cache lives in the Next.js server's memory. With several
  instances (or serverless hosting) each instance has its own cache and `updateTag` only
  clears the instance that ran the action. For that setup, use `"use cache: remote"` with a
  shared cache handler (e.g. Redis).
- **Memory:** entries are kept in an LRU (oldest dropped first). Its size is set by
  `cacheMaxMemorySize` in `next.config.ts`.
- **Debug:** `NEXT_PRIVATE_DEBUG_CACHE=1 npm run dev` logs cache hits and misses.
