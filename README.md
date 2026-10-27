# AURA Studio — frontend (Next.js 16)

This is the Khmer-only website for the AURA Studio multi-shop fashion platform. It has the
platform home, each shop's storefront, and the admin panel.

- Next.js 16 (App Router, Cache Components) · React 19 · TypeScript
- shadcn/ui (Base UI) · Tailwind CSS 4 · Battambang font · lucide-react icons
- All data comes from the Spring Boot API in [`../aura-backend`](../aura-backend/README.md)

More detail:

- [docs/FRONTEND_PROCESS.md](docs/FRONTEND_PROCESS.md): how each page works.
- [docs/API_AND_DATABASE.md](docs/API_AND_DATABASE.md): the API contract and database tables.
- [docs/DATA_CACHING.md](docs/DATA_CACHING.md): how API data is cached, and the implementation steps.
- [aura-backend/docs/features/18-frontend-integration.md](../aura-backend/docs/features/18-frontend-integration.md):
  how the frontend is connected to the API.

---

## 1. Run

The backend must be running first:

```bash
# terminal 1: API on http://localhost:8080 (embedded PostgreSQL, no install needed)
cd aura-backend
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me-123 mvn spring-boot:test-run

# terminal 2: website on http://localhost:3000
cd aura-studio
npm install
npm run dev
```

Log in at <http://localhost:3000/admin/login> with `ADMIN_EMAIL` (or `ADMIN_PHONE`) and
`ADMIN_PASSWORD`. That account is the **platform admin** and owns the first shop, `/aura-studio`.

Production: `npm run build && npm start`. The API must be reachable during the build,
because the home page is pre-rendered from API data.

### Environment (`.env.local`)

| Variable | Default | Meaning |
|---|---|---|
| `API_URL` | `http://localhost:8080` | Base URL of the Spring Boot API. The Next.js server uses it to call the API, and `/uploads/*` is proxied to it. |

Accounts, passwords and secrets belong to the backend (`ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`JWT_SECRET`, …). The frontend stores no data of its own.

---

## 2. Project structure

```
aura-studio/
├── next.config.ts          Cache Components, image hosts, /uploads → API rewrite, old-link redirects
├── docs/                   FRONTEND_PROCESS.md, API_AND_DATABASE.md
└── src/
    ├── proxy.ts            /admin/* gate + automatic JWT refresh (see §4)
    ├── app/                Routes (App Router)
    │   ├── layout.tsx          root layout: Battambang font, <html lang="km">, toaster
    │   ├── not-found.tsx       404 page
    │   ├── (platform)/         platform home  →  /
    │   ├── (shop)/[shop]/      one shop's storefront  →  /{shop}
    │   └── admin/              admin panel  →  /admin
    │       ├── login/              login page
    │       ├── (panel)/            pages behind login (share the sidebar layout)
    │       └── actions.ts          ALL server actions (forms → API calls)
    ├── components/
    │   ├── ui/                 shadcn/ui primitives (button, dialog, table, tabs, …)
    │   ├── platform/           home page: header, footer, featured rail, "open a shop" dialog
    │   ├── layout/             storefront header, footer, Telegram button, newsletter form
    │   ├── shop/               storefront: product cards, catalogue, product detail,
    │   │                       quick view, search, cart sheet, ShopProvider (cart state)
    │   └── admin/              admin shell (sidebar), tables, product form, settings forms,
    │                           staff dialog, login form, useFormAction hook
    └── lib/
        ├── api.ts              fetch wrapper for the API + API response types
        ├── auth.ts             session (cached /auth/me), requireAdmin/Owner/PlatformAdmin, adminRead() (cached reads), authed() (writes)
        ├── admin-cache.ts      server cache for the logged-in user: cachedMe, cachedGet, cache tags
        ├── session-cookie.ts   token cookie names + options (shared with proxy.ts)
        ├── data.ts             cached public reads (shops, products, shop types) + mappers
        ├── types.ts            AdminUser, PublicUser, Role, ShopStatus, UserStatus
        ├── products.ts         Product type, sizes/colours helpers, sort options
        ├── settings.ts         Settings/Profile types, defaults, background presets
        ├── shop-types.ts       size systems (clothing / shoes / kids), category helpers
        ├── site.ts             Khmer numerals (kh), price format, Telegram links, nav links
        ├── platform.ts         platform name, first shop slug, shopHref()
        ├── images.ts           demo photos from the Stitch design
        └── utils.ts            cn() class helper
```

**Rules of thumb**

- **Server components** (pages, layouts) fetch data. **Client components** (`"use client"`)
  only handle interaction: cart, dialogs, filters, forms.
- Only the Next.js server talks to the API: pages through `lib/data.ts` and `lib/auth.ts`,
  forms through `app/admin/actions.ts`. The browser never sees a token.
- All visible text is Khmer. Error messages come from the API in Khmer and are shown as-is.

---

## 3. Pages and the API calls behind them

### Public pages (no login)

Data comes from `lib/data.ts`. It is cached on the server and refreshed as soon as an admin
action changes it (`updateTag`), or within an hour for changes made outside this website.

| URL | File | What it shows | API |
|---|---|---|---|
| `/` | `app/(platform)/page.tsx` | Platform home: hero, featured pieces from every shop, shop directory, "បើកហាង" (open a shop) dialog | `GET /api/v1/shops` → for each shop `GET /api/v1/shops/{slug}` + `GET /api/v1/shops/{slug}/products`; `GET /api/v1/shop-types` (dialog choices) |
| "បើកហាង" dialog | `components/platform/start-shop-dialog.tsx` → `startShop` | Form: shop name, link, Telegram, shop type, owner email/phone + password. The owner is signed in afterwards. | `POST /api/v1/shops` → tokens saved in cookies → redirect to `/admin?welcome=1` |
| `/{shop}` | `app/(shop)/[shop]/layout.tsx` + `page.tsx` | Shop home: announcement bar, hero, new arrivals, "about us" with the owner's profile. Pending or suspended shops show a notice instead. | `GET /api/v1/shops/{slug}` (settings, categories, owner, type) + `GET /api/v1/shops/{slug}/products` (all pages) |
| `/{shop}/catalogue` | `app/(shop)/[shop]/catalogue/page.tsx` | All products with category filter, sort (curated / price ↑ / price ↓) and search; the filtering happens in the browser | same data as the shop layout (cached) |
| `/{shop}/products/{slug}` | `app/(shop)/[shop]/products/[id]/page.tsx` | Product detail: gallery, sizes, colours, quantity, "order via Telegram", "complete the look" | same cached shop data (found by product slug) |
| `/uploads/{file}` | `next.config.ts` rewrite | Uploaded images | proxied to `GET {API_URL}/uploads/{file}` |

**Cart and orders.** The cart is client state (`ShopProvider`), saved per shop in
`localStorage`. Checkout opens Telegram with a pre-filled Khmer order message to the shop's
Telegram account, so there is no order API yet.
Old single-shop links (`/catalogue`, `/products/…`) redirect to `/aura-studio/…`.

### Admin pages (login required)

Every page calls `requireAdmin()` (which checks `GET /api/v1/auth/me`). Pages read through
`adminRead()`, which uses the signed-in user's token and is **cached per user** (see
[docs/DATA_CACHING.md](docs/DATA_CACHING.md)). Writes go through `authed()` and are never
cached. The API only returns **that user's shop**.

| URL | File | Who | What it does | API |
|---|---|---|---|---|
| `/admin/login` | `app/admin/login/page.tsx` | everyone | Login with **email or phone number** + password. 5 wrong tries lock it for 15 min. | `POST /api/v1/auth/login` (action `login`) |
| (sidebar) | `app/admin/(panel)/layout.tsx` | all | Shop name and link, menu, pending badges, logout | `GET /api/v1/auth/me`; logout → `POST /api/v1/auth/logout` |
| `/admin` | `app/admin/(panel)/page.tsx` | all | Dashboard: totals, stock value, low stock, latest products | `GET /api/v1/admin/dashboard` |
| `/admin/products` | `app/admin/(panel)/products/page.tsx` | all | Product table with search, category filter and pagination; delete | `GET /api/v1/admin/products` (all pages) + `GET /api/v1/admin/categories`; delete → `DELETE /api/v1/admin/products/{id}` |
| `/admin/products/new` | `app/admin/(panel)/products/new/page.tsx` | all | Product form: name, price, stock, description, categories (+ add a new category inline), images (upload / URL), sizes (by shop type), colours, badge | `GET /api/v1/admin/products/options`; save → `POST /api/v1/uploads` (each file) then `POST /api/v1/admin/products`; new category → `POST /api/v1/admin/categories` |
| `/admin/products/{id}/edit` | `app/admin/(panel)/products/[id]/edit/page.tsx` | all | Same form, pre-filled | `GET /api/v1/admin/products/{id}` (product + options); save → `PUT /api/v1/admin/products/{id}` |
| `/admin/settings` | `app/admin/(panel)/settings/page.tsx` | **owner** | Tabs: **Shop** (name, Telegram, announcement, hero, background colour, about), **Profile** (name, title, email, phone, avatar), **Security** (change password) | `GET /api/v1/admin/settings`; save → `PUT /api/v1/admin/settings`, `PUT /api/v1/admin/profile`, `PATCH /api/v1/auth/password` (+ `POST /api/v1/uploads` for images) |
| `/admin/staff` | `app/admin/(panel)/staff/page.tsx` | **owner** | List staff, create a staff account (email or phone), approve / disable / re-enable, delete | `GET /api/v1/admin/staff`; `POST /api/v1/admin/staff`; `PATCH /api/v1/admin/staff/{id}`; `DELETE /api/v1/admin/staff/{id}` |
| `/admin/shops` | `app/admin/(panel)/shops/page.tsx` | **platform admin** | All shops on the platform: approve pending shops, suspend, re-open, delete (not your own) | `GET /api/v1/platform/shops`; `PATCH /api/v1/platform/shops/{id}`; `DELETE /api/v1/platform/shops/{id}` |

### Who can do what

| | Platform admin | Shop owner | Staff |
|---|---|---|---|
| Dashboard + products of own shop | ✓ | ✓ | ✓ |
| Settings + staff of own shop | ✓ | ✓ | – |
| All shops (approve / suspend / delete) | ✓ | – | – |

The sidebar hides menus a role can't use. The API enforces the same rules (403 otherwise).

---

## 4. How the API connection works

```
browser ──► Next.js server ──────────────────────► Spring API (:8080) ──► PostgreSQL
            pages / server actions / proxy.ts
            cookies: aura_access, aura_refresh (httpOnly)
```

1. **Login or sign-up** (server action) calls the API and stores the JWT pair in httpOnly
   cookies:
   - `aura_access` holds the 15-minute access token; the cookie expires one minute earlier;
   - `aura_refresh` holds the 30-day refresh token.
2. **Every admin request** goes through `src/proxy.ts`:
   - no cookies → redirect to `/admin/login`;
   - access cookie expired but refresh cookie present → `POST /api/v1/auth/refresh`, new
     cookies are set, and the page renders with the new token.

   Requests sent at the same moment share one refresh, because the API logs a session out
   when a used refresh token is sent again.
3. **Pages** call `getSession()` → `GET /api/v1/auth/me` (cached about a minute per user). A 401 or 403
   (disabled account, suspended shop) means the user is logged out.
4. **Server actions** call `authed(path, { method, body })`. API errors come back as
   `ApiError` and the form shows their Khmer `message`. Images are uploaded first
   (`POST /api/v1/uploads`); the returned `/uploads/…` path is saved with the product or
   settings.
5. **Logout** calls `POST /api/v1/auth/logout` (revokes the refresh token) and deletes the
   cookies.

Response format (all endpoints): `{ "data": …, "message"?: "…", "meta"?: { page, pageSize, total, pageCount } }`;
errors: `{ "error": { "code": "VALIDATION", "message": "…Khmer…", "field": "price" } }`.
The full API is in Swagger: <http://localhost:8080/swagger-ui.html>.
