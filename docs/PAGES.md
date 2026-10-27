# AURA Studio — Page-by-page reference

A guide to every page of the platform: what it shows, who can open it, where its
data comes from, which files implement it, and what to keep in mind when
re-implementing or extending it.

- **Stack:** Next.js 16 (App Router, Cache Components + Partial Prefetching),
  React 19, Tailwind CSS v4, shadcn/ui (Base UI primitives), lucide icons.
- **Language:** the whole UI is Khmer. Numbers are shown with Khmer digits via
  `kh()` / `formatPrice()` in `src/lib/site.ts`. Font: Battambang (`next/font`).
- **Data:** a JSON file store (`data/store.json`) plus uploaded images
  (`data/uploads/`). See [Data model](#data-model).

---

## Contents

1. [Big picture](#big-picture)
2. [Roles and permissions](#roles-and-permissions)
3. [Data model](#data-model)
4. [Public pages](#public-pages)
   - [`/` Platform home](#-platform-home)
   - [`/{shop}` Shop home](#shop-shop-home)
   - [`/{shop}/catalogue` Catalogue](#shopcatalogue-catalogue)
   - [`/{shop}/products/{id}` Product detail](#shopproductsid-product-detail)
   - [Shared storefront pieces (header, cart, quick view, search, footer)](#shared-storefront-pieces)
   - [Not-found page](#not-found-page)
5. [Admin pages](#admin-pages)
   - [`/admin/login` Login](#adminlogin-login)
   - [Admin shell (sidebar, header, banners)](#admin-shell)
   - [`/admin` Dashboard](#admin-dashboard)
   - [`/admin/products` Product list](#adminproducts-product-list)
   - [`/admin/products/new` and `/admin/products/{id}/edit` Product form](#adminproductsnew-and-adminproductsidedit-product-form)
   - [`/admin/staff` Staff](#adminstaff-staff)
   - [`/admin/settings` Settings](#adminsettings-settings)
   - [`/admin/shops` All shops (platform admin)](#adminshops-all-shops-platform-admin)
6. [Non-page routes](#non-page-routes)
7. [Server actions reference](#server-actions-reference)
8. [Cross-cutting behaviour](#cross-cutting-behaviour)
9. [Implementing later: checklist and known gaps](#implementing-later-checklist-and-known-gaps)

---

## Big picture

The app is a **multi-shop platform**:

```
/                         Platform home: shop directory, featured pieces, "open a shop"
/{shop}                   One shop's storefront (e.g. /aura-studio)
/{shop}/catalogue         That shop's full catalogue
/{shop}/products/{id}     A product page in that shop
/admin/...                Admin for the signed-in user's own shop
                          (+ platform-wide pages for the platform admin)
```

- Anyone can **open a shop** from the home page. The shop starts **pending** and
  becomes public when the **platform admin** approves it.
- Customers don't have accounts. Ordering happens through **Telegram**: every
  "order" button opens a `t.me/{shop telegram}?text=...` link with a ready-made
  Khmer message (product, size, colour, quantity, total).
- The cart and wishlist live in the browser (`localStorage`), one per shop.

### Route groups (folders under `src/app`)

| Folder | URL | Layout |
|---|---|---|
| `(platform)/` | `/` | Platform header + footer are rendered by the page itself |
| `(shop)/[shop]/` | `/{shop}/...` | `layout.tsx` renders the shop header, footer, cart, quick view, Telegram button |
| `admin/login/` | `/admin/login` | Centered login card |
| `admin/(panel)/` | `/admin`, `/admin/*` | Admin shell (sidebar + top bar), behind login |
| `uploads/[file]/` | `/uploads/*` | Route handler that serves uploaded images |

Old single-shop URLs redirect: `/catalogue` → `/aura-studio/catalogue`,
`/products/:id` → `/aura-studio/products/:id` (`next.config.ts`).

---

## Roles and permissions

There is one kind of login (email **or** phone + password). What a user can do
depends on their `role` and the `platformAdmin` flag.

| Capability | Platform admin | Shop owner | Staff |
|---|:-:|:-:|:-:|
| Dashboard, product list, add / edit / delete products of **own shop** | ✓ | ✓ | ✓ |
| Add a new product category (from the product form) | ✓ | ✓ | ✓ |
| Staff page: create / suspend / delete staff of own shop | ✓ | ✓ | – |
| Settings page: shop settings, own profile, own password | ✓ | ✓ | – |
| All shops page: approve / suspend / delete any shop | ✓ | – | – |

- The **platform admin** is the owner of the first shop (`aura-studio`); the
  flag is set on that user in the store.
- **Shop owners** are created by the public "open a shop" form.
- **Staff** are created only by their shop's owner (no public sign-up).
- Every check runs on the server (`requireAdmin`, `requireOwner`,
  `requirePlatformAdmin`, `requireShopAdmin` in `src/lib/auth.ts`). Hiding a menu
  item is only cosmetic.

---

## Data model

Everything is in `data/store.json` (folder can be moved with `DATA_DIR`).
Types live in `src/lib/store.ts`, `src/lib/products.ts`, `src/lib/settings.ts`,
`src/lib/shop-types.ts`.

```ts
StoreData {
  shops: Shop[]
  shopTypes: ShopType[]     // options in the "open a shop" form
  users: User[]
  secret: string            // HMAC key for session cookies if AUTH_SECRET is unset
}

Shop {
  id, slug                  // slug = URL segment, e.g. "aura-studio"
  status: "pending" | "active" | "suspended"
  specialty: string         // ShopType.value
  categories?: CategoryOption[]  // owner-added list; unset → the shop type's defaults
  settings: Settings
  products: Product[]
  createdAt?
}

Settings {
  shopName, announcement, heroTitle, heroSubtitle,
  heroImage, backgroundColor, aboutTitle, aboutMe, telegram
}

Product {
  id, name, price, description, stock,
  categories: string[]      // CategoryOption.value list
  images: string[]          // remote URLs or "/uploads/..." paths
  badge?, badgeTone?: "gold" | "neutral", atelier
  sizes?: string[]          // only for shop types with a size system
  colors?: { name, hex }[]
}

User {
  id, name, title, email, phone, avatar,
  passwordHash,             // scrypt, "salt:hash"
  role: "owner" | "staff"
  status: "active" | "pending" | "disabled"
  shopId, platformAdmin?, createdAt?
}

ShopType {
  value, label,
  sizeKind: "none" | "clothing" | "shoes" | "kids",
  categories: CategoryOption[]
}
```

**Size systems** (`SIZE_SETS` in `src/lib/shop-types.ts`):

| sizeKind | Options | Pre-selected for new products |
|---|---|---|
| `clothing` | XS, S, M, L, XL, XXL | S, M, L, XL |
| `shoes` | 36 – 45 | 37 – 42 |
| `kids` | 0-1 … 11-12 (years) | 1-2 … 7-8 |
| `none` | – | – |

**Shop types (starting list):** ម៉ូដសម្លៀកបំពាក់ (clothing sizes),
គ្រឿងអលង្ការ, សេរ៉ាមិច និងវត្ថុតុបតែង, ផលិតផលស្បែក (no sizes). Each has its own
default categories; every list ends with លក់ដាច់បំផុត (best sellers).

**Migrations** run automatically in `readStore()`: single-profile store (v1) →
multi-user (v2) → multi-shop (v3) → `shopTypes` added. Migrated data is written
back immediately so IDs stay stable.

**Reading data:**
- Public pages use cached readers in `src/lib/data.ts` (`getShops`,
  `getActiveShops`, `getShopBySlug`, `getShopTypes`, `getShopOwnerProfile`),
  tagged `shops`, `shop-types`, `users`.
- Admin pages read the store directly (`readStore()`), always fresh.
- Every write goes through `updateStore()` (serialized, atomic file write) and
  then `updateTag(...)` so public pages refresh on the next request.

---

## Public pages

### `/` Platform home

**File:** `src/app/(platform)/page.tsx`
**Who:** everyone. **Rendering:** static, refreshed when shops change.
**Design source:** `stitch_modern_fashion_boutique_storefront/stitch_modern_fashion_boutique_storefront/`

**Sections, top to bottom**

| Section | Content | Data |
|---|---|---|
| Header (`PlatformHeader`) | Announcement bar, logo, anchors (ហាងទាំងអស់, ម៉ូដពិសេស, មុខងារ, បើកហាង), **ចូល** (login) → `/admin/login`, **បើកហាង** button (opens sign-up dialog) | shop types |
| Hero | Welcome title, gold subtitle, intro, "ស្វែងរកហាងអនឡាញ" → `#shops` | static |
| Bento | Showroom photo with total product count; "private label commerce" card with avatars of up to 4 shops and the shop count; "secure ordering" card | active shops |
| Gateway (`#gateway`) | Customer card → flagship shop (`/aura-studio`); Creator card → **ចាប់ផ្តើមបង្កើតហាង** (opens sign-up dialog) | flagship shop |
| Protocols (`#features`) | 3 feature cards | static |
| Shop directory (`#shops`) | Card per **active** shop: hero image, type label, name, subtitle, product count, link `/{slug}` | active shops + shop types |
| Featured pieces (`#featured`) | Horizontal carousel (`FeaturedRail`): up to 4 products per shop, interleaved; product link, shop link, Telegram order | active shops |
| Footer (`PlatformFooter`) | Platform blurb, up to 6 shop links, owner login, open a shop | active shops |

**"Open a shop" dialog** — `src/components/platform/start-shop-dialog.tsx`, action `startShop`

| Field | Rules |
|---|---|
| Shop name | required, Khmer allowed |
| Shop link (`slug`) | required; `a-z`, `0-9`, single `-`; 3–40 chars; not reserved (`admin`, `api`, `uploads`, …); unique. Auto-suggested from a Latin shop name. **Cannot be changed later.** |
| Telegram username | required, 5–32 chars `A-Z a-z 0-9 _` (leading `@` stripped) |
| Shop type | radio; options from `shopTypes` |
| Owner name, email and/or phone, password ×2 | at least one of email/phone; valid formats; password ≥ 8; email/phone unique across all users |

On success: creates a `pending` shop (empty products, default settings with the
shop name and Telegram), creates the owner user, signs them in, redirects to
`/admin?welcome=1`. Form values are kept when validation fails.

---

### `/{shop}` Shop home

**Files:** `src/app/(shop)/[shop]/layout.tsx` (frame), `src/app/(shop)/[shop]/page.tsx`
**Who:** everyone. **Rendering:** per request (`connection()`), data from cache.

**Layout behaviour (applies to every `/{shop}/…` page)**
- Unknown slug → 404 page.
- Shop `pending` → "ហាងនេះកំពុងរង់ចាំការអនុម័ត…" notice with a link back to `/`.
- Shop `suspended` → "ហាងនេះត្រូវបានផ្អាក…" notice.
- Active shop → wraps the page in `ShopProvider` (products, shop name, Telegram,
  slug, size system, categories) and renders header, footer, cart sheet, quick
  view dialog, floating Telegram button.
- The page background colour comes from `settings.backgroundColor` (CSS
  variable `--background`).

**Page sections**

| Section | Content | Source |
|---|---|---|
| Hero | Background `heroImage`, `heroTitle`, `heroSubtitle`, "ស្វែងរកកម្រងម៉ូដ" → `#catalogue-section`, "បញ្ជាទិញផ្ទាល់តាមតេឡេក្រាម" | shop settings |
| Hero badges | Only on the flagship shop (`aura-studio`) | static |
| Products (`#catalogue-section`) | Sticky bar: category filter pills + "កំពុងបង្ហាញ N មុខទំនិញ" + sort (curated / price ↑ / price ↓); grid of the first 8 products; "មើលកម្រងទាំងមូល" → catalogue | shop products + categories |
| Editorial (`#editorial`) | Materials story + 2 photos — **only on the flagship shop** | static |
| About (`#about`) | Owner avatar, name, title; `aboutTitle`, `aboutMe`; email / phone / Telegram buttons | owner profile + settings |

Empty shop → "មិនទាន់មានផលិតផលនៅឡើយទេ…" instead of the grid.

**Product card** (`src/components/shop/product-card.tsx`): image (click → quick
view), badge, wishlist heart, "ដាក់ក្នុងកាបូប" (adds default size/colour), name
→ product page, price, 2-line description, "មើលលម្អិត" (quick view),
"តេឡេក្រាម" (order link with default size/colour).

---

### `/{shop}/catalogue` Catalogue

**Files:** `src/app/(shop)/[shop]/catalogue/page.tsx`, `src/components/shop/catalogue-view.tsx`

- Breadcrumb (home → catalogue), title, intro, small stats box.
- Sticky bar: category pills **with counts**, sort, grid density toggle (4 or 5 columns).
- Grid paginated **12 per page**; after the 8th item on page 1 a "charter" banner
  with a Telegram "reserve" button.
- Pagination: prev / pages / next, "បង្ហាញ a–b នៃ N ម៉ូដ"; changing page scrolls to the top of the list.
- Bottom card: "showing X of N" progress bar + Telegram "custom commission" button.
- Changing a filter or sort resets to page 1. All filtering is client-side.

---

### `/{shop}/products/{id}` Product detail

**Files:** `src/app/(shop)/[shop]/products/[id]/page.tsx`, `src/components/shop/product-detail.tsx`, `src/components/shop/look-card.tsx`

| Area | Content |
|---|---|
| Breadcrumb | home → catalogue → product |
| Gallery | Main image + up to 4 thumbnails; badges; zoom icon; wishlist |
| Info | Shop name • atelier, rating (static), name, price, description |
| Colour picker | Only if the product has `colors`; shows the selected colour name |
| Size picker | Only if the shop type has a size system; shows the product's sizes (legacy products: the system defaults). "តារាងទំហំ" size-guide dialog only for **clothing** |
| Stock warning | "នៅសល់តែ N" when stock ≤ 5 |
| Quantity | Stepper |
| Actions | "បញ្ជាទិញផ្ទាល់តាមតេឡេក្រាម" (message includes size, colour, quantity, total) and "បន្ថែមទៅកាបូប" (opens the cart) |
| Trust row, accordion | Shipping, secure checkout, returns; 4 info panels (static text) |
| Complete the look | 3 other products sharing a category (`LookCard`) |
| Testimonials | Static quote + 2 static reviews |
| Consultation banner | Telegram "start chat" link |

Unknown product id → 404.

---

### Shared storefront pieces

| Piece | File | Notes |
|---|---|---|
| Header | `components/layout/site-header.tsx` | Announcement bar (`settings.announcement`), brand (shop name), nav (new arrivals, catalogue, editorial, about — all relative to `/{shop}`), search, wishlist count, cart count, account icon → `/admin`. Mobile: side sheet menu. The active-link highlight reads the pathname inside `<Suspense>`. |
| Search dialog | `components/shop/search-dialog.tsx` | Client-side search over the shop's products (name, description, badge); first 5 when empty. |
| Cart sheet | `components/shop/cart-sheet.tsx` | Lines keyed by product + size + colour; quantity ±, remove, subtotal, free shipping, total, "ទូទាត់តាមតេឡេក្រាម" (one Telegram message with every line). |
| Quick view | `components/shop/quick-view-dialog.tsx` | Gallery, colour + size pickers (when applicable), quantity, live total, add to bag, Telegram order, link to the full page. |
| Footer | `components/layout/site-footer.tsx` | Shop name, About text, newsletter form (toast only, nothing stored), atelier addresses, care links (placeholders), Telegram link, "ដំណើរការដោយ AURA Studio" → `/`. |
| Telegram button | `components/layout/telegram-fab.tsx` | Fixed bottom-right, opens the shop's Telegram. |
| State | `components/shop/shop-provider.tsx` | Cart + wishlist in `localStorage` key `aura-shop:{slug}`; `href()` builds shop-relative links; builds the cart's Telegram message. |

### Not-found page

**File:** `src/app/not-found.tsx` — Khmer 404 with a button back to `/`.

---

## Admin pages

All admin pages except login live under `src/app/admin/(panel)/`. The proxy
(`src/proxy.ts`) sends visitors without a session cookie to `/admin/login`; each
page and action then verifies the signed cookie and the user's status.

### `/admin/login` Login

**Files:** `src/app/admin/login/page.tsx`, `components/admin/login-form.tsx`, `components/admin/auth-card.tsx` — action `login`

- Fields: **email or phone** (one input) + password.
- Phone formats are normalised: `012 345 678`, `+855 12 345 678`, `85512345678` are the same number.
- Errors (Khmer): wrong credentials (same message for unknown account and wrong
  password), account pending, account disabled, shop suspended, too many attempts.
- **Lockout:** 5 wrong passwords for the same email/phone → locked for 15 minutes (in memory; resets on server restart).
- Already signed in → redirected to `/admin`.
- Note under the form: no account → ask the shop owner.

### Admin shell

**Files:** `admin/(panel)/layout.tsx`, `components/admin/admin-shell.tsx`

- **Sidebar:** shop initial + name + `/{slug}`; menu filtered by role
  (Dashboard, All products, Add product for everyone; Staff, Settings for owners;
  All shops for the platform admin, with a pending-shops badge); "មើលហាងរបស់ខ្ញុំ"
  → `/{slug}` (new tab); "ចាកចេញ" (logout).
- **Top bar:** welcome text; profile chip (name, title, avatar) — a link to
  Settings → Profile for owners only.
- **Pending banner:** while the user's shop is `pending`, a gold bar explains it
  is waiting for approval and can still be prepared.
- Mobile: the sidebar opens in a sheet.

### `/admin` Dashboard

**File:** `admin/(panel)/page.tsx`

- Title "សួស្តី {name}!", "បន្ថែមផលិតផល" button.
- Pending-staff notice for owners when staff accounts are pending.
- 4 stat cards: total products, total stock, stock value (price × stock), low stock count (≤ 3).
- Newest 5 products (link to edit).
- Low-stock list (link to edit).
- Settings shortcut card (owners only).

### `/admin/products` Product list

**Files:** `admin/(panel)/products/page.tsx`, `components/admin/product-table.tsx`

- Header with total count and "បន្ថែមផលិតផល".
- Search box (name or id) and category pills (the shop's categories).
- Table: image, name, badge, category chips, price, stock (red when ≤ 3),
  actions: view in shop (new tab), edit, delete (confirmation dialog → `deleteProduct`).
- **Pagination:** 10 per page (`PAGE_SIZE`), "បង្ហាញ a–b នៃ N ផលិតផល", page
  numbers with "…" for long lists; search/filter reset to page 1; deleting the
  last item of the last page steps back a page.
- After saving a product the form redirects here with `?saved=created|updated`;
  the table shows a toast and cleans the URL.

### `/admin/products/new` and `/admin/products/{id}/edit` Product form

**Files:** `admin/(panel)/products/new/page.tsx`, `.../[id]/edit/page.tsx`,
`components/admin/product-form.tsx`, `product-variants.tsx`, `category-picker.tsx`
— actions `saveProduct`, `addShopCategory`

| Card | Fields / behaviour |
|---|---|
| Product info | Name*, description*, price (USD)*, stock*, badge text, badge colour (grey / gold), atelier label |
| Colours and sizes | **Sizes** (only if the shop type has a size system): toggle buttons, defaults pre-selected, at least one required. **Colours** (all shops): quick presets (black, white, cream, grey, brown, navy, red, green, pink) or custom colours with a colour picker + Khmer name; max 12, names unique |
| Category* | Checkboxes of the shop's categories + **"បន្ថែមប្រភេទថ្មី"**: type a name, Enter/បន្ថែម → saved to the shop immediately (`addShopCategory`), inserted above "លក់ដាច់បំផុត" and ticked. Duplicate names refused; max 20 categories per shop |
| Images* | Existing images (remove ×, first = main), upload new files (JPG/PNG/WEBP/GIF/AVIF, ≤ 5 MB each, previewed), or paste image URLs (one per line) |
| Sticky bar | Error message, Cancel, Save |

- Submit uses `useFormAction` (`components/admin/use-form-action.ts`) so the
  form is **not reset** when the server returns a validation error.
- Server validation (`readProductForm` in `actions.ts`): required fields, price
  > 0, stock integer ≥ 0, categories must belong to the shop, sizes must belong
  to the shop type's size system, colours valid hex + named, at least one image.
- New products get an id from the name (`slugify` + random suffix) and are added
  **first** in the list (they appear as "new arrivals").

### `/admin/staff` Staff

**Files:** `admin/(panel)/staff/page.tsx`, `components/admin/staff-table.tsx`,
`components/admin/create-staff-dialog.tsx` — actions `createStaff`,
`setStaffStatus`, `deleteStaff` — **owners only**

- List of the shop's accounts (pending first): avatar, name, owner badge,
  "(អ្នក)" for yourself, email, phone, status pill.
- Actions per staff: approve / re-enable, suspend (or reject when pending),
  delete (confirmation). The owner account cannot be changed or deleted.
- **បង្កើតគណនីបុគ្គលិក** dialog: name*, title, email and/or phone, password ×2.
  Account is active immediately. Email/phone unique across the whole platform.

### `/admin/settings` Settings

**Files:** `admin/(panel)/settings/page.tsx`, `components/admin/settings-forms.tsx`
— actions `saveSettings`, `saveProfile`, `changePassword` — **owners only**

Tabs (controlled; the URL keeps `?tab=shop|profile|security`):

| Tab | Fields |
|---|---|
| ការកំណត់ហាង (shop) | Shop name*, Telegram username, announcement; About title + About text; hero image (URL or upload) with live preview; page background colour (5 presets or custom); hero title + subtitle |
| ប្រវត្តិរូប (profile) | Avatar upload / remove, name*, title, email, phone (at least one of email/phone — they are the login) |
| សុវត្ថិភាព (security) | Current password, new password ×2 (≥ 8) |

Saving shop settings refreshes the public shop; saving the owner's profile
refreshes the shop's About section.

### `/admin/shops` All shops (platform admin)

**Files:** `admin/(panel)/shops/page.tsx`, `components/admin/shop-table.tsx` —
actions `setShopStatus`, `deleteShop` — **platform admin only**

- Shops sorted pending → active → suspended, then by name.
- Each card: initial, name, `/{slug}`, "ហាងរបស់អ្នក" badge, shop type, product
  count, account count, owner name/email/phone, status pill.
- Actions: view (new tab), approve (pending) / re-enable (suspended), suspend
  (active), delete (confirmation; removes the shop, its products and all its
  accounts). Your own shop cannot be suspended or deleted.
- Effects: approve → appears on `/` and its pages go live; suspend → public
  notice + its owner/staff are logged out and cannot log in.

---

## Non-page routes

| Route | File | Purpose |
|---|---|---|
| `GET /uploads/{file}` | `src/app/uploads/[file]/route.ts` | Serves images from `data/uploads/`. File names must match `^[a-z0-9-]+\.(jpg|png|webp|gif|avif)$` (no path traversal). Cached for a year (names are unique). |
| Proxy | `src/proxy.ts` | For `/admin` and `/admin/*` (except `/admin/login`): no session cookie → redirect to login. |
| Redirects | `next.config.ts` | `/catalogue`, `/products/:id` → `/aura-studio/...` |

---

## Server actions reference

All in `src/app/admin/actions.ts`. Form actions return
`{ ok?, message?, error? }` (Khmer messages) unless they redirect.

| Action | Guard | Does |
|---|---|---|
| `login(form)` | – | Email/phone + password, lockout, status checks, sets session cookie, → `/admin` |
| `logout()` | – | Clears the cookie, → `/admin/login` |
| `startShop(form)` | – | Creates pending shop + owner, signs in, → `/admin?welcome=1` |
| `saveProduct(form)` | any shop user | Create or update a product in the user's shop, → `/admin/products?saved=…` |
| `deleteProduct(id)` | any shop user | Remove a product from the user's shop |
| `addShopCategory(label)` | any shop user | Add a category to the user's shop; returns `{ category }` |
| `saveSettings(form)` | owner | Update the shop's `Settings` (incl. hero upload) |
| `saveProfile(form)` | owner | Update own profile (incl. avatar upload) |
| `changePassword(form)` | owner | Verify current password, set a new one |
| `createStaff(form)` | owner | Create an active staff account in the owner's shop |
| `setStaffStatus(id, status)` | owner | active / disabled / pending for staff of own shop |
| `deleteStaff(id)` | owner | Delete a staff account of own shop |
| `setShopStatus(id, status)` | platform admin | Approve / suspend / re-enable a shop |
| `deleteShop(id)` | platform admin | Delete a shop and its accounts |

---

## Cross-cutting behaviour

- **Sessions:** cookie `aura_admin_session` = `{userId}.{expires}.{hmac}`, 7 days,
  `httpOnly`, `sameSite=lax`, `secure` in production. Key: `AUTH_SECRET` or the
  store's `secret`. Every request re-reads the user, so status changes apply at once.
- **Passwords:** scrypt with a random salt (`src/lib/password.ts`).
- **Uploads:** saved by `saveUpload()` in `src/lib/store.ts` as
  `{time}-{random}.{ext}`; type and 5 MB size checked on the server.
- **Images:** `components/shop/smart-image.tsx` wraps `next/image`; it optimises
  local paths and `lh3.googleusercontent.com`, and serves other hosts unoptimised.
- **Telegram messages:** built by `productOrderMessage()` and the cart message in
  `shop-provider.tsx`; size/colour lines appear only when present.
- **Caching:** public data is cached (`"use cache"`, `cacheLife("max")`) and
  invalidated with `updateTag` after each admin change. Shop pages render per
  request (the shop list baked into a prerendered shell would otherwise be stale
  on the first visit after an edit).
- **Environment variables** (`.env.local`, see `.env.example`):
  `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PHONE` (first platform admin),
  `AUTH_SECRET`, `DATA_DIR`.

---

## Implementing later: checklist and known gaps

Things that are static, placeholder or worth adding when you build on this:

| Area | Current state | Suggested next step |
|---|---|---|
| Storage | Single JSON file, one server | Move to a database (Postgres/SQLite) — `readStore`/`updateStore` are the only access points |
| Orders | Only Telegram links, nothing recorded | Order table + order history in admin |
| Customer accounts | None (cart in `localStorage`) | Optional customer login / saved carts |
| Categories | Add only (from the product form) | Rename / delete / reorder categories |
| Shop link | Fixed after creation | Allow changing with redirects from the old link |
| Platform name | Constant `PLATFORM_NAME` in `src/lib/platform.ts` | Make it a platform setting |
| Shop types | Stored list, no admin UI | Admin UI if more types are needed |
| Staff passwords | Staff cannot change their own password | Owner "reset password" or staff Settings → Security |
| Login lockout / sign-up spam | In-memory lockout; no sign-up rate limit (approval is the filter) | Persistent rate limiting, CAPTCHA |
| Static content | Reviews, rating 4.9, accordion texts, size guide table, footer addresses/links, flagship editorial | Make editable per shop or remove |
| Newsletter form | Shows a toast only | Store emails / connect a mailing service |
| Size guide | Clothing table only | Tables for shoes / kids sizes |
| Hosting | Needs a persistent disk for `data/` | Not suitable for serverless file systems as-is |
