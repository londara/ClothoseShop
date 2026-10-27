# AURA Studio — API and database specification

What a real backend for this app needs: the **database tables** to create and
the **HTTP API** to expose. It is written from the current implementation
(JSON file store + Next.js server actions), so every endpoint and rule below
matches what the app already does today. Items marked **(phase 2)** are new
features the app does not have yet (orders, newsletter).

Related: [FRONTEND_PROCESS.md](FRONTEND_PROCESS.md) describes every page and which data it shows.

- Database: **PostgreSQL 15+** (SQL below). Works with MySQL/SQLite with small
  type changes (`uuid` → `char(36)`, `timestamptz` → `datetime`, `citext` →
  case-insensitive collation).
- API style: **REST + JSON**, base path `/api/v1`.
- Auth: **JWT** (access + refresh token); log in with **phone number or email** + password.
- **Multi-shop:** one service hosts many shops. After login every query is
  filtered by the user's `shop_id` — see [§4.1](#41-multi-shop-isolation--every-query-is-scoped-to-the-users-shop).
- Language: all user-facing error messages are **Khmer** (same texts as the app).

---

## Contents

1. [Entity overview](#1-entity-overview)
2. [Tables](#2-tables)
3. [Full SQL (create script)](#3-full-sql-create-script)
4. [API conventions](#4-api-conventions)
   - [4.1 Multi-shop isolation — every query is scoped to the user's shop](#41-multi-shop-isolation--every-query-is-scoped-to-the-users-shop)
5. [Endpoints — authentication](#5-endpoints--authentication)
6. [Endpoints — public (storefront and home)](#6-endpoints--public-storefront-and-home)
7. [Endpoints — shop sign-up](#7-endpoints--shop-sign-up)
8. [Endpoints — shop admin (own shop)](#8-endpoints--shop-admin-own-shop)
9. [Endpoints — platform admin](#9-endpoints--platform-admin)
10. [Endpoints — uploads](#10-endpoints--uploads)
11. [Endpoints — orders (phase 2)](#11-endpoints--orders-phase-2)
12. [Validation rules (single source)](#12-validation-rules-single-source)
13. [Current code → API mapping](#13-current-code--api-mapping)
14. [Migrating `data/store.json` into the database](#14-migrating-datastorejson-into-the-database)

---

## 1. Entity overview

```mermaid
erDiagram
    shop_types ||--o{ shop_type_categories : "default categories"
    shop_types ||--o{ shops : "specialty"
    shops ||--|| shop_settings : has
    shops ||--o{ shop_categories : has
    shops ||--o{ users : "owner + staff"
    shops ||--o{ products : sells
    products ||--o{ product_images : has
    products ||--o{ product_sizes : has
    products ||--o{ product_colors : has
    products ||--o{ product_categories : "tagged with"
    shop_categories ||--o{ product_categories : ""
    users ||--o{ refresh_tokens : has
    uploads }o--|| users : "uploaded by"
    shops ||--o{ orders : "phase 2"
    orders ||--o{ order_items : "phase 2"
```

| Table | One row is… | Today stored in |
|---|---|---|
| `shop_types` | A kind of shop (clothing, jewellery…) and its size system | `store.shopTypes[]` |
| `shop_type_categories` | A default product category of a shop type | `shopTypes[].categories` |
| `shops` | A shop at `/{slug}` | `store.shops[]` |
| `shop_settings` | Storefront texts, colours, Telegram (1:1 with shop) | `shops[].settings` |
| `shop_categories` | A product category of one shop | `shops[].categories` (or type defaults) |
| `users` | An admin login (platform admin / owner / staff) | `store.users[]` |
| `refresh_tokens` | A signed-in device (JWT refresh token, stored hashed) | signed cookie today |
| `login_attempts` | Failed logins for lockout | in memory |
| `products` | A product of a shop | `shops[].products[]` |
| `product_images` | An image of a product, ordered | `products[].images` |
| `product_sizes` | A size the product is sold in | `products[].sizes` |
| `product_colors` | A colour the product is sold in | `products[].colors` |
| `product_categories` | Product ↔ category link | `products[].categories` |
| `uploads` | An uploaded image file | `data/uploads/` folder |
| `orders`, `order_items` **(phase 2)** | A customer order sent via Telegram | not stored |
| `newsletter_subscribers` **(phase 2)** | An email from the footer form | not stored |

---

## 2. Tables

Conventions: `id uuid` primary keys, `created_at` / `updated_at` on every
table, money as `numeric(12,2)` in **USD**, hex colours as `char(7)` (`#rrggbb`).

### 2.1 `shop_types`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `code` | varchar(40) UNIQUE NOT NULL | stable key, e.g. `couture`, `jewelry`, `ceramics`, `leather` (stored on shops) |
| `label` | varchar(40) UNIQUE NOT NULL | Khmer name, e.g. `ម៉ូដសម្លៀកបំពាក់` |
| `size_kind` | enum `size_kind` NOT NULL | `none` \| `clothing` \| `shoes` \| `kids` |
| `sort_order` | int NOT NULL default 0 | order in the sign-up form |
| `created_at`, `updated_at` | timestamptz | |

Seed rows: see [§3](#3-full-sql-create-script).

### 2.2 `shop_type_categories`

Default categories copied to a shop until the owner customises them.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `shop_type_id` | uuid FK → shop_types ON DELETE CASCADE | |
| `code` | varchar(40) NOT NULL | e.g. `women`, `rings`, `best-sellers` |
| `label` | varchar(40) NOT NULL | Khmer |
| `sort_order` | int NOT NULL | `best-sellers` is always last |
| | UNIQUE (`shop_type_id`, `code`) | |

### 2.3 `shops`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `slug` | citext UNIQUE NOT NULL | `^[a-z0-9]+(-[a-z0-9]+)*$`, 3–40 chars, not reserved ([§12](#12-validation-rules-single-source)). Fixed after creation |
| `status` | enum `shop_status` NOT NULL default `pending` | `pending` \| `active` \| `suspended` |
| `shop_type_id` | uuid FK → shop_types ON DELETE RESTRICT | a type in use cannot be deleted |
| `approved_at` | timestamptz NULL | set when first activated |
| `approved_by` | uuid FK → users NULL | platform admin who approved |
| `created_at`, `updated_at` | timestamptz | |

Index: `(status)` — the home page lists `status = 'active'`.

### 2.4 `shop_settings` (1:1)

| Column | Type | Rules / default for new shops |
|---|---|---|
| `shop_id` | uuid PK, FK → shops ON DELETE CASCADE | |
| `shop_name` | varchar(80) NOT NULL | from sign-up |
| `telegram` | varchar(32) NOT NULL | `^[A-Za-z0-9_]{5,32}$`, stored without `@` |
| `announcement` | varchar(200) NOT NULL default `''` | top bar text |
| `hero_title` | varchar(120) NOT NULL | defaults to shop name |
| `hero_subtitle` | varchar(300) NOT NULL default `''` | |
| `hero_image` | text NOT NULL | URL (`https://…`) or `/uploads/{file}` |
| `background_color` | char(7) NOT NULL default `#f8f9fa` | `^#[0-9a-f]{6}$` |
| `about_title` | varchar(80) NOT NULL default `អំពីយើង` | |
| `about_me` | text NOT NULL default `''` | |
| `updated_at` | timestamptz | |

### 2.5 `shop_categories`

The categories a shop uses (filters, product form). Created from the shop
type's defaults when the shop is created; owners/staff can add more from the
product form.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `shop_id` | uuid FK → shops ON DELETE CASCADE | |
| `code` | varchar(40) NOT NULL | `women`, `best-sellers`, or generated `c-xxxxxx` for owner-added ones |
| `label` | varchar(40) NOT NULL | Khmer |
| `sort_order` | int NOT NULL | new ones go just before `best-sellers` |
| | UNIQUE (`shop_id`, `code`), UNIQUE (`shop_id`, `label`) | |
| | max **20** rows per shop (enforce in API) | |

### 2.6 `users`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `shop_id` | uuid FK → shops ON DELETE CASCADE NOT NULL | every user belongs to one shop |
| `role` | enum `user_role` NOT NULL | `owner` \| `staff` (one owner per shop) |
| `is_platform_admin` | boolean NOT NULL default false | can manage all shops |
| `status` | enum `user_status` NOT NULL default `active` | `active` \| `pending` \| `disabled` |
| `name` | varchar(80) NOT NULL | |
| `title` | varchar(80) NOT NULL default `''` | e.g. `ម្ចាស់ហាង`, `បុគ្គលិក` |
| `email` | citext UNIQUE NULL | lower-cased |
| `phone` | varchar(15) UNIQUE NULL | digits only, `+855` / `855` → leading `0` |
| `avatar` | text NULL | `/uploads/{file}` |
| `password_hash` | text NOT NULL | scrypt or argon2id |
| `created_at`, `updated_at` | timestamptz | |
| | CHECK (`email IS NOT NULL OR phone IS NOT NULL`) | needed to log in |
| | UNIQUE INDEX one owner per shop: `(shop_id) WHERE role = 'owner'` | |

### 2.7 `refresh_tokens`

Login uses **JWT** ([§5](#5-endpoints--authentication)). The short-lived access
token is not stored; the long-lived **refresh token** is a random string whose
SHA-256 hash is stored here so it can be rotated and revoked.

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | also the `jti` |
| `user_id` | uuid FK → users ON DELETE CASCADE | |
| `token_hash` | char(64) UNIQUE NOT NULL | SHA-256 (hex) of the refresh token |
| `family_id` | uuid NOT NULL | same for every rotation of one login; reuse of an old token revokes the whole family |
| `expires_at` | timestamptz NOT NULL | now + 30 days |
| `revoked_at` | timestamptz NULL | set on logout, rotation, password change, user disabled, shop suspended |
| `replaced_by` | uuid NULL | the token issued when this one was rotated |
| `user_agent`, `ip` | text NULL | shown in a future "devices" list |
| `created_at` | timestamptz | |

Index: `(user_id) WHERE revoked_at IS NULL`.

### 2.8 `login_attempts`

Persistent lockout (today it is in memory and resets on restart).

| Column | Type | Rules |
|---|---|---|
| `identifier` | varchar(254) PK | normalised email or phone |
| `failures` | int NOT NULL | |
| `locked_until` | timestamptz NULL | set after the 5th failure, +15 min |
| `updated_at` | timestamptz | |

### 2.9 `products`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `shop_id` | uuid FK → shops ON DELETE CASCADE | |
| `slug` | varchar(80) NOT NULL | URL id (`/{shop}/products/{slug}`); today `{latin-name}-{6 hex}` |
| `name` | varchar(120) NOT NULL | |
| `description` | text NOT NULL | |
| `price` | numeric(12,2) NOT NULL CHECK (> 0) | USD |
| `stock` | int NOT NULL CHECK (>= 0) | "low stock" = ≤ 3 (admin), "only N left" = ≤ 5 (storefront) |
| `badge` | varchar(40) NULL | label on the image |
| `badge_tone` | enum `badge_tone` NOT NULL default `neutral` | `neutral` \| `gold` |
| `atelier` | varchar(80) NOT NULL default `''` | workshop label |
| `sort_order` | int NOT NULL | newest first (new products get the smallest value) |
| `created_at`, `updated_at` | timestamptz | |
| | UNIQUE (`shop_id`, `slug`) | |

Indexes: `(shop_id, sort_order)`, `(shop_id, price)`.

### 2.10 `product_images`

> `product_images`, `product_sizes` and `product_colors` have no `shop_id`:
> they are only ever read or written **through their product**, after the
> product was found with `WHERE shop_id = :shopId` (see [§4.1](#41-multi-shop-isolation--every-query-is-scoped-to-the-users-shop)).

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `product_id` | uuid FK → products ON DELETE CASCADE | |
| `url` | text NOT NULL | `https://…` or `/uploads/{file}` |
| `position` | int NOT NULL | 0 = main image |
| | UNIQUE (`product_id`, `position`) | at least 1 image per product (API) |

### 2.11 `product_sizes`

Only for shops whose type has a size system.

| Column | Type | Rules |
|---|---|---|
| `product_id` | uuid FK → products ON DELETE CASCADE | |
| `size` | varchar(10) NOT NULL | must be an option of the type's `size_kind` ([§12](#12-validation-rules-single-source)) |
| `position` | int NOT NULL | display order = size system order |
| | PK (`product_id`, `size`) | |

### 2.12 `product_colors`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `product_id` | uuid FK → products ON DELETE CASCADE | |
| `name` | varchar(30) NOT NULL | Khmer, e.g. `ខ្មៅ` |
| `hex` | char(7) NOT NULL | `#rrggbb` |
| `position` | int NOT NULL | first = pre-selected |
| | UNIQUE (`product_id`, `name`) | max **12** per product (API) |

### 2.13 `product_categories`

| Column | Type | Rules |
|---|---|---|
| `shop_id` | uuid NOT NULL | the tenant; part of both foreign keys |
| `product_id` | uuid | FK (`shop_id`, `product_id`) → products (`shop_id`, `id`) ON DELETE CASCADE |
| `category_id` | uuid | FK (`shop_id`, `category_id`) → shop_categories (`shop_id`, `id`) ON DELETE CASCADE |
| | PK (`product_id`, `category_id`) | at least 1 per product (API) |

The composite foreign keys make it **impossible** to link a product of one shop
to a category of another shop, even if the API has a bug.

### 2.14 `uploads`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `file_name` | varchar(80) UNIQUE NOT NULL | `{base36 time}-{12 hex}.{ext}` |
| `mime_type` | varchar(30) NOT NULL | jpeg, png, webp, gif, avif |
| `size_bytes` | int NOT NULL CHECK (≤ 5 242 880) | 5 MB |
| `shop_id` | uuid FK → shops ON DELETE CASCADE NOT NULL | the shop of the user who uploaded it; store files under `{shop_id}/` |
| `storage_key` | text NOT NULL | disk path or S3/R2 key, e.g. `shops/{shop_id}/{file_name}` |
| `uploaded_by` | uuid FK → users ON DELETE SET NULL | |
| `created_at` | timestamptz | |

### 2.15 `orders` and `order_items` (phase 2)

Today an order is only a Telegram message. Recording it gives the owner an
order list and history.

`orders`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `shop_id` | uuid FK → shops | |
| `code` | varchar(12) UNIQUE NOT NULL | short code shown in the Telegram message, e.g. `AS-7K3Q` |
| `status` | enum `order_status` NOT NULL default `new` | `new` \| `confirmed` \| `shipped` \| `completed` \| `cancelled` |
| `customer_name`, `customer_phone`, `customer_telegram` | varchar NULL | optional |
| `note` | text NULL | |
| `subtotal`, `shipping`, `total` | numeric(12,2) NOT NULL | shipping is free today |
| `created_at`, `updated_at` | timestamptz | |

`order_items`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `order_id` | uuid FK → orders ON DELETE CASCADE | |
| `product_id` | uuid FK → products ON DELETE SET NULL | |
| `product_name` | varchar(120) NOT NULL | snapshot |
| `unit_price` | numeric(12,2) NOT NULL | snapshot |
| `size`, `color` | varchar NULL | the customer's choice |
| `quantity` | int NOT NULL CHECK (> 0) | |

### 2.16 `newsletter_subscribers` (phase 2)

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `shop_id` | uuid FK → shops ON DELETE CASCADE | |
| `email` | citext NOT NULL | |
| `created_at` | timestamptz | |
| | UNIQUE (`shop_id`, `email`) | |

---

## 3. Full SQL (create script)

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

CREATE TYPE size_kind    AS ENUM ('none', 'clothing', 'shoes', 'kids');
CREATE TYPE shop_status  AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE user_role    AS ENUM ('owner', 'staff');
CREATE TYPE user_status  AS ENUM ('active', 'pending', 'disabled');
CREATE TYPE badge_tone   AS ENUM ('neutral', 'gold');
CREATE TYPE order_status AS ENUM ('new', 'confirmed', 'shipped', 'completed', 'cancelled');

CREATE TABLE shop_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        varchar(40) NOT NULL UNIQUE,
  label       varchar(40) NOT NULL UNIQUE,
  size_kind   size_kind   NOT NULL DEFAULT 'none',
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shop_type_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_type_id  uuid NOT NULL REFERENCES shop_types(id) ON DELETE CASCADE,
  code          varchar(40) NOT NULL,
  label         varchar(40) NOT NULL,
  sort_order    int NOT NULL,
  UNIQUE (shop_type_id, code)
);

CREATE TABLE shops (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          citext NOT NULL UNIQUE
                CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 40),
  status        shop_status NOT NULL DEFAULT 'pending',
  shop_type_id  uuid NOT NULL REFERENCES shop_types(id) ON DELETE RESTRICT,
  approved_at   timestamptz,
  approved_by   uuid,                       -- FK added after users exists
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shops_status_idx ON shops (status);

CREATE TABLE shop_settings (
  shop_id           uuid PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  shop_name         varchar(80)  NOT NULL,
  telegram          varchar(32)  NOT NULL CHECK (telegram ~ '^[A-Za-z0-9_]{5,32}$'),
  announcement      varchar(200) NOT NULL DEFAULT '',
  hero_title        varchar(120) NOT NULL,
  hero_subtitle     varchar(300) NOT NULL DEFAULT '',
  hero_image        text         NOT NULL,
  background_color  char(7)      NOT NULL DEFAULT '#f8f9fa' CHECK (background_color ~ '^#[0-9a-f]{6}$'),
  about_title       varchar(80)  NOT NULL DEFAULT 'អំពីយើង',
  about_me          text         NOT NULL DEFAULT '',
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE shop_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code        varchar(40) NOT NULL,
  label       varchar(40) NOT NULL,
  sort_order  int NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, code),
  UNIQUE (shop_id, label),
  UNIQUE (shop_id, id)            -- target of tenant-safe composite FKs
);

CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id            uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role               user_role   NOT NULL,
  is_platform_admin  boolean     NOT NULL DEFAULT false,
  status             user_status NOT NULL DEFAULT 'active',
  name               varchar(80) NOT NULL,
  title              varchar(80) NOT NULL DEFAULT '',
  email              citext UNIQUE,
  phone              varchar(15) UNIQUE CHECK (phone ~ '^[0-9]{8,15}$'),
  avatar             text,
  password_hash      text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE UNIQUE INDEX users_one_owner_per_shop ON users (shop_id) WHERE role = 'owner';
CREATE INDEX users_shop_idx ON users (shop_id);

ALTER TABLE shops ADD CONSTRAINT shops_approved_by_fk
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE refresh_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   char(64) NOT NULL UNIQUE,
  family_id    uuid NOT NULL,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  replaced_by  uuid REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  user_agent   text,
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_active_user_idx ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id);

CREATE TABLE login_attempts (
  identifier    varchar(254) PRIMARY KEY,
  failures      int NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  slug         varchar(80)   NOT NULL,
  name         varchar(120)  NOT NULL,
  description  text          NOT NULL,
  price        numeric(12,2) NOT NULL CHECK (price > 0),
  stock        int           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  badge        varchar(40),
  badge_tone   badge_tone    NOT NULL DEFAULT 'neutral',
  atelier      varchar(80)   NOT NULL DEFAULT '',
  sort_order   int           NOT NULL DEFAULT 0,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (shop_id, slug),
  UNIQUE (shop_id, id)            -- target of tenant-safe composite FKs
);
CREATE INDEX products_shop_order_idx ON products (shop_id, sort_order);
CREATE INDEX products_shop_price_idx ON products (shop_id, price);

CREATE TABLE product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  position    int  NOT NULL,
  UNIQUE (product_id, position)
);

CREATE TABLE product_sizes (
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        varchar(10) NOT NULL,
  position    int NOT NULL,
  PRIMARY KEY (product_id, size)
);

CREATE TABLE product_colors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        varchar(30) NOT NULL,
  hex         char(7) NOT NULL CHECK (hex ~ '^#[0-9a-f]{6}$'),
  position    int NOT NULL,
  UNIQUE (product_id, name)
);

CREATE TABLE product_categories (
  shop_id      uuid NOT NULL,
  product_id   uuid NOT NULL,
  category_id  uuid NOT NULL,
  PRIMARY KEY (product_id, category_id),
  FOREIGN KEY (shop_id, product_id)  REFERENCES products (shop_id, id)        ON DELETE CASCADE,
  FOREIGN KEY (shop_id, category_id) REFERENCES shop_categories (shop_id, id) ON DELETE CASCADE
);
CREATE INDEX product_categories_shop_category_idx ON product_categories (shop_id, category_id);

CREATE TABLE uploads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name    varchar(80) NOT NULL UNIQUE,
  mime_type    varchar(30) NOT NULL,
  size_bytes   int NOT NULL CHECK (size_bytes <= 5242880),
  shop_id      uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  storage_key  text NOT NULL,
  uploaded_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX uploads_shop_idx ON uploads (shop_id);

-- phase 2 ---------------------------------------------------------------
CREATE TABLE orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id            uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code               varchar(12) NOT NULL UNIQUE,
  status             order_status NOT NULL DEFAULT 'new',
  customer_name      varchar(80),
  customer_phone     varchar(15),
  customer_telegram  varchar(32),
  note               text,
  subtotal           numeric(12,2) NOT NULL,
  shipping           numeric(12,2) NOT NULL DEFAULT 0,
  total              numeric(12,2) NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_shop_created_idx ON orders (shop_id, created_at DESC);

CREATE TABLE order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name  varchar(120) NOT NULL,
  unit_price    numeric(12,2) NOT NULL,
  size          varchar(10),
  color         varchar(30),
  quantity      int NOT NULL CHECK (quantity > 0)
);

CREATE TABLE newsletter_subscribers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  email       citext NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, email)
);

-- seed: shop types and their default categories ----------------------------
INSERT INTO shop_types (code, label, size_kind, sort_order) VALUES
  ('couture',  'ម៉ូដសម្លៀកបំពាក់',        'clothing', 1),
  ('jewelry',  'គ្រឿងអលង្ការ',            'none',     2),
  ('ceramics', 'សេរ៉ាមិច និងវត្ថុតុបតែង',   'none',     3),
  ('leather',  'ផលិតផលស្បែក',            'none',     4);

INSERT INTO shop_type_categories (shop_type_id, code, label, sort_order)
SELECT t.id, c.code, c.label, c.sort_order
FROM shop_types t
JOIN (VALUES
  ('couture',  'women',        'នារី',            1),
  ('couture',  'men',          'បុរស',            2),
  ('couture',  'accessories',  'គ្រឿងបន្លាស់',      3),
  ('couture',  'best-sellers', 'លក់ដាច់បំផុត',     99),
  ('jewelry',  'rings',        'ចិញ្ចៀន',          1),
  ('jewelry',  'necklaces',    'ខ្សែក',            2),
  ('jewelry',  'earrings',     'ក្រវិល',           3),
  ('jewelry',  'bracelets',    'ខ្សែដៃ',           4),
  ('jewelry',  'best-sellers', 'លក់ដាច់បំផុត',     99),
  ('ceramics', 'tableware',    'ចាន និងចានគោម',    1),
  ('ceramics', 'cups',         'ពែង និងកែវ',       2),
  ('ceramics', 'vases',        'ថូផ្កា',           3),
  ('ceramics', 'decor',        'វត្ថុតុបតែង',       4),
  ('ceramics', 'best-sellers', 'លក់ដាច់បំផុត',     99),
  ('leather',  'handbags',     'កាបូបដៃ',          1),
  ('leather',  'wallets',      'កាបូបលុយ',         2),
  ('leather',  'belts',        'ខ្សែក្រវាត់',        3),
  ('leather',  'shoes',        'ស្បែកជើង',         4),
  ('leather',  'best-sellers', 'លក់ដាច់បំផុត',     99)
) AS c(type_code, code, label, sort_order) ON c.type_code = t.code;
```

Size systems are fixed in code, not a table (`SIZE_SETS` in `src/lib/shop-types.ts`):

| `size_kind` | Allowed sizes (in order) | Pre-selected for new products |
|---|---|---|
| `clothing` | XS, S, M, L, XL, XXL | S, M, L, XL |
| `shoes` | 36, 37, 38, 39, 40, 41, 42, 43, 44, 45 | 37 – 42 |
| `kids` | 0-1, 1-2, 3-4, 5-6, 7-8, 9-10, 11-12 | 1-2, 3-4, 5-6, 7-8 |
| `none` | – | – |

---

## 4. API conventions

| Topic | Rule |
|---|---|
| Base URL | `/api/v1` (examples below omit it) |
| Format | JSON in and out (`Content-Type: application/json`); file uploads use `multipart/form-data` |
| Auth | **JWT Bearer token**: `Authorization: Bearer <accessToken>` ([§5](#5-endpoints--authentication)) |
| Roles | `public` (no token), `staff`, `owner`, `platform` (= `is_platform_admin`). Higher roles include lower ones for their own shop |
| Shop scope | **Every query after login is limited to the user's shop** (`shop_id` from the database, never from the client). See [§4.1](#41-multi-shop-isolation--every-query-is-scoped-to-the-users-shop) |
| IDs in URLs | shops by `slug` (public) or `id` (platform admin); products by `slug` (public) or `id` (admin) |
| Money | number in USD, 2 decimals (`890.00`) |
| Dates | ISO 8601 UTC (`2026-10-27T08:15:00Z`) |
| Pagination | `?page=1&pageSize=10` → `{ "data": [...], "meta": { "page", "pageSize", "total", "pageCount" } }` |
| Success | `{ "data": ..., "message"?: "<Khmer text for a toast>" }` |
| Error | `{ "error": { "code": "...", "message": "<Khmer text>", "field"?: "price" } }` |

**Status codes:** `200` OK, `201` created, `204` deleted (no body), `400`
validation, `401` missing/expired/invalid token or wrong credentials, `403`
wrong role / account or shop blocked, `404` not found, `409` conflict (slug /
email / phone / name taken), `413` file too large, `415` file type not allowed,
`423` locked (too many login attempts), `429` rate limited.

**Error codes:** `VALIDATION`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`,
`TOKEN_INVALID`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `ACCOUNT_PENDING`,
`ACCOUNT_DISABLED`, `SHOP_SUSPENDED`, `LOCKED`, `FILE_TOO_LARGE`,
`UNSUPPORTED_FILE`, `RATE_LIMITED`.

Example error:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{ "error": { "code": "VALIDATION", "field": "price", "message": "តម្លៃត្រូវតែជាលេខធំជាង ០" } }
```

### 4.1 Multi-shop isolation — every query is scoped to the user's shop

This is a **service that hosts many shops (many websites) in one database**.
After login, **every** read and write must be limited to the signed-in user's
own shop. A user of shop A must never see, change or even learn about the
existence of data in shop B.

#### The rules

| # | Rule |
|---|---|
| 1 | **The shop comes from the token, never from the client.** `shopId` = the user's `shop_id`, loaded from the database using the token's `sub` (user id). Ignore any `shopId` in the URL, query or body of `/admin/...` endpoints. |
| 2 | **Every admin SQL statement has `shop_id = :shopId`** in its `WHERE` (select, update, delete) or sets `shop_id = :shopId` (insert). No exceptions. |
| 3 | **Look up by id *and* shop.** `WHERE id = :id AND shop_id = :shopId` — never `WHERE id = :id` alone. |
| 4 | **Not your shop = not found.** If the row exists but belongs to another shop, answer `404 NOT_FOUND` (not `403`), so other shops' ids can't be discovered. |
| 5 | **Child rows go through the parent.** Images, sizes, colours: first find the product with rule 3, then touch its children. |
| 6 | **References are checked inside the same shop.** Category codes, product ids in orders, upload URLs: validate against the user's shop only (composite FKs in [§3](#3-full-sql-create-script) enforce it in the database). |
| 7 | **Public endpoints are scoped by slug.** Resolve `slug` → `shop_id` (and `status = 'active'`) first, then use that `shop_id` in every following query. |
| 8 | **Only platform admins cross shops**, and only under `/platform/...` (checked with `is_platform_admin` from the database, not only the token claim). |
| 9 | **Caches are per shop.** Cache keys and invalidation tags include the shop (`shop:{id}:products`, …). Invalidating one shop never serves another shop's data. |
| 10 | **Files are per shop.** Uploads are stored under `shops/{shop_id}/` and recorded with `shop_id`. |

#### Request pipeline (every `/admin/...` request)

```mermaid
flowchart LR
    A[Authorization: Bearer JWT] --> B{signature + exp valid?}
    B -- no --> X1[401 TOKEN_EXPIRED / TOKEN_INVALID]
    B -- yes --> C[load user by sub]
    C --> D{user active?<br/>user.shop_id = token.shop?<br/>shop not suspended?}
    D -- no --> X2[401 / 403]
    D -- yes --> E["ctx = { userId, shopId: user.shop_id, role, isPlatformAdmin }"]
    E --> F{role allowed for endpoint?}
    F -- no --> X3[403 FORBIDDEN]
    F -- yes --> G["handler: every query uses ctx.shopId"]
```

Pseudo-code (Node/Express style):

```ts
async function requireShopContext(req) {
  const claims = verifyJwt(req.headers.authorization)          // 401 if bad/expired
  const user = await db.one(
    `SELECT u.id, u.shop_id, u.role, u.status, u.is_platform_admin, s.status AS shop_status
       FROM users u JOIN shops s ON s.id = u.shop_id
      WHERE u.id = $1`, [claims.sub])
  if (!user || user.status !== 'active') throw http401()
  if (user.shop_id !== claims.shop) throw http401()             // token from an old shop
  if (user.shop_status === 'suspended' && !user.is_platform_admin) throw http403('SHOP_SUSPENDED')
  return { userId: user.id, shopId: user.shop_id, role: user.role, isPlatformAdmin: user.is_platform_admin }
}

// every repository function takes the context — there is no "find by id" without a shop
productsRepo.get(ctx, id)      // SELECT … WHERE id = $id AND shop_id = ctx.shopId
productsRepo.list(ctx, filter) // SELECT … WHERE shop_id = ctx.shopId …
```

#### Scoped queries for each endpoint

`:shopId` always means **ctx.shopId** (from the database, rule 1).

| Endpoint | Query (core) |
|---|---|
| `GET /auth/me` | `SELECT … FROM users u JOIN shops s ON s.id = u.shop_id WHERE u.id = :userId` |
| `GET /admin/dashboard` | `SELECT count(*), sum(stock), sum(stock*price) FROM products WHERE shop_id = :shopId` · low stock: `… WHERE shop_id = :shopId AND stock <= 3` |
| `GET /admin/products` | `SELECT … FROM products p WHERE p.shop_id = :shopId [AND p.name ILIKE :q] [AND EXISTS (SELECT 1 FROM product_categories pc JOIN shop_categories c ON c.id = pc.category_id WHERE pc.product_id = p.id AND pc.shop_id = :shopId AND c.code = :category)] ORDER BY sort_order LIMIT :pageSize OFFSET :offset` |
| `GET /admin/products/{id}` | `SELECT … FROM products WHERE id = :id AND shop_id = :shopId` → none ⇒ `404`; then images/sizes/colours `WHERE product_id = :id` |
| `POST /admin/products` | `INSERT INTO products (shop_id, …) VALUES (:shopId, …)`; categories: `SELECT id FROM shop_categories WHERE shop_id = :shopId AND code = ANY(:codes)` (count must match, else `400`); `INSERT INTO product_categories (shop_id, product_id, category_id) …` |
| `PUT /admin/products/{id}` | `UPDATE products SET … WHERE id = :id AND shop_id = :shopId` (0 rows ⇒ `404`); replace children `DELETE … WHERE product_id = :id` **only after** the update matched |
| `DELETE /admin/products/{id}` | `DELETE FROM products WHERE id = :id AND shop_id = :shopId` (0 rows ⇒ `404`) |
| `GET /admin/categories` | `SELECT code, label FROM shop_categories WHERE shop_id = :shopId ORDER BY sort_order` |
| `POST /admin/categories` | `INSERT INTO shop_categories (shop_id, code, label, sort_order) VALUES (:shopId, …)` (unique per shop) |
| `GET/PUT /admin/settings` | `… FROM shop_settings WHERE shop_id = :shopId` / `UPDATE shop_settings SET … WHERE shop_id = :shopId` |
| `PUT /admin/profile` | `UPDATE users SET … WHERE id = :userId AND shop_id = :shopId` |
| `GET /admin/staff` | `SELECT … FROM users WHERE shop_id = :shopId` |
| `POST /admin/staff` | `INSERT INTO users (shop_id, role, …) VALUES (:shopId, 'staff', …)` |
| `PATCH/DELETE /admin/staff/{id}` | `… WHERE id = :id AND shop_id = :shopId AND role = 'staff'` (0 rows ⇒ `404`) |
| `POST /uploads` | `INSERT INTO uploads (shop_id, uploaded_by, …) VALUES (:shopId, :userId, …)`; file key `shops/{shopId}/{file}` |
| Image URLs in a product body | `/uploads/{file}` must exist in `uploads WHERE shop_id = :shopId` (or be an external `https://` URL) |
| `GET /admin/orders` (phase 2) | `SELECT … FROM orders WHERE shop_id = :shopId` |
| Public `GET /shops/{slug}/products` | `SELECT id FROM shops WHERE slug = :slug AND status = 'active'` → `:shopId`; then `… FROM products WHERE shop_id = :shopId …` |
| Public `POST /shops/{slug}/orders` | resolve `:shopId` from slug; every `productId` must match `WHERE id = ANY(:ids) AND shop_id = :shopId` |
| `/platform/...` | the only queries **without** a shop filter — allowed only when `ctx.isPlatformAdmin` |

Logins are global on purpose: `POST /auth/login` looks the user up by email
or phone across all shops (they are unique platform-wide), then the token
carries that user's single shop. One email/phone therefore belongs to one
shop; to let one person manage several shops later, add a `memberships
(user_id, shop_id, role)` table and a "switch shop" endpoint that issues a new
token for the chosen shop.

#### Safety net: PostgreSQL row-level security (recommended)

Even if a developer forgets a `WHERE shop_id`, the database refuses to return
other shops' rows. Set the shop per transaction from the request context:

```sql
-- run once
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_products ON products
  USING (shop_id = current_setting('app.shop_id', true)::uuid
         OR current_setting('app.platform_admin', true) = 'on');
-- same policy for shop_settings, shop_categories, product_categories, users, uploads, orders

-- child tables follow their product
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_product_images ON product_images
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id));   -- products policy applies inside
-- same for product_sizes, product_colors, order_items (via orders)
```

```ts
// in each request, inside one transaction
await tx.query(`SELECT set_config('app.shop_id', $1, true)`, [ctx.shopId])
await tx.query(`SELECT set_config('app.platform_admin', $1, true)`, [ctx.isPlatformAdmin ? 'on' : 'off'])
```

The API must connect as a role **without** `BYPASSRLS` (not the table owner).
Public endpoints set `app.shop_id` to the shop resolved from the slug. The
login lookup and platform-admin endpoints run with `app.platform_admin = on`.

#### Tests to keep (cross-shop access)

Create shop **A** (owner `a@test.com`) and shop **B** (owner `b@test.com`),
log in as A, and check every endpoint with B's ids:

| Test | Expected |
|---|---|
| `GET /admin/products/{productOfB}` | `404` |
| `PUT` / `DELETE /admin/products/{productOfB}` | `404`, B's product unchanged |
| `POST /admin/products` with `categories: ["<code only B has>"]` | `400` |
| `POST /admin/products` with `images: ["/uploads/<file of B>"]` | `400` |
| `PATCH` / `DELETE /admin/staff/{staffOfB}` | `404` |
| `GET /admin/products`, `/admin/staff`, `/admin/categories`, `/admin/dashboard` | only A's rows and totals |
| Request with a body/query `shopId` of B | ignored — still only A's data |
| Token of a user moved/deleted, or of a suspended shop | `401` / `403` |
| Any `/platform/...` endpoint as A (not platform admin) | `403` |
| Public `GET /shops/{B-slug}/products/{productOfA}` | `404` |

---

## 5. Endpoints — authentication

### 5.1 How JWT login works

```mermaid
sequenceDiagram
    participant C as Client (admin web / app)
    participant A as API
    participant DB as Database
    C->>A: POST /auth/login { identifier: email or phone, password }
    A->>DB: find user by email OR normalised phone, verify password
    A->>DB: insert refresh_tokens (hash)
    A-->>C: accessToken (JWT, 15 min) + refreshToken (30 days)
    C->>A: GET /admin/... Authorization: Bearer accessToken
    A-->>C: 200 data
    Note over C,A: access token expires → 401 TOKEN_EXPIRED
    C->>A: POST /auth/refresh { refreshToken }
    A->>DB: check hash, not revoked/expired → revoke old, insert new
    A-->>C: new accessToken + new refreshToken
    C->>A: POST /auth/logout { refreshToken }
    A->>DB: revoke token
```

| Item | Value |
|---|---|
| Access token | JWT, `HS256` with `JWT_SECRET` (or `RS256` with a key pair), **15 minutes** |
| Refresh token | 64 random bytes, base64url; only its SHA-256 is stored (`refresh_tokens`); **30 days**; **rotated** on every refresh |
| Where the client keeps them | Web admin: access token in memory, refresh token in an `httpOnly; Secure; SameSite=Strict` cookie on `/api/v1/auth` (recommended) or the JSON body. Mobile app: secure storage |
| Reuse detection | If an already-rotated refresh token is used again, revoke its whole `family_id` (someone copied it) |
| Revoke all tokens of a user when | password changed, user disabled or deleted, user's shop suspended or deleted |
| Every protected request | verify signature + `exp`, then load the user (status `active`, shop not suspended unless platform admin). Short access tokens keep the window small even without the DB check, but the check makes blocks instant |

**Access token payload (claims)**

```json
{
  "sub": "8b1f6a5e-3c1d-4a8e-9d4b-2f6c0a7e9b10",
  "shop": "1c9e2d4f-7a6b-4c3d-8e9f-0a1b2c3d4e5f",
  "role": "owner",
  "pa": true,
  "iat": 1793088900,
  "exp": 1793089800,
  "iss": "aura-studio",
  "aud": "aura-admin"
}
```

`sub` = user id, `shop` = shop id, `role` = `owner` | `staff`, `pa` = platform admin.

### 5.2 `POST /auth/login` — public

Login with **email or phone number** in one field, `identifier`. If it
contains `@` it is treated as an email (lower-cased); otherwise as a phone
number (non-digits removed, `+855`/`855` → leading `0`). So `012 345 678`,
`012345678`, `+855 12 345 678` and `85512345678` are the same login.

**Request — with phone number**

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "identifier": "012 345 678", "password": "sophea1234" }
```

**Request — with email**

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "identifier": "Sophea@Example.com", "password": "sophea1234" }
```

**Response 200**

```json
{
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YjFm...",
    "expiresIn": 900,
    "refreshToken": "q3Jx8m2Vb0Hn9Lk4TzR1yW7cP5eA6sD0fG2hJ8kL3mN",
    "refreshExpiresIn": 2592000,
    "user": {
      "id": "8b1f6a5e-3c1d-4a8e-9d4b-2f6c0a7e9b10",
      "name": "សុភា",
      "title": "ម្ចាស់ហាង",
      "email": "sophea@example.com",
      "phone": "012345678",
      "avatar": null,
      "role": "owner",
      "isPlatformAdmin": false
    },
    "shop": {
      "id": "1c9e2d4f-7a6b-4c3d-8e9f-0a1b2c3d4e5f",
      "slug": "sophea-shop",
      "name": "ហាងសុភា",
      "status": "pending"
    }
  }
}
```

**Errors**

| Status | `code` | `message` | When |
|---|---|---|---|
| 400 | `VALIDATION` | សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទ និងពាក្យសម្ងាត់ | empty field |
| 401 | `INVALID_CREDENTIALS` | អ៊ីមែល/លេខទូរស័ព្ទ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ | unknown account **or** wrong password (same message on purpose) |
| 423 | `LOCKED` | ព្យាយាមខុសច្រើនដងពេក។ សូមរង់ចាំ ១៥ នាទី រួចព្យាយាមម្តងទៀត។ | 5 failures for this identifier; `Retry-After` header in seconds |
| 403 | `ACCOUNT_PENDING` | គណនីរបស់អ្នកកំពុងរង់ចាំការអនុម័តពីម្ចាស់ហាង។ | correct password, user pending |
| 403 | `ACCOUNT_DISABLED` | គណនីរបស់អ្នកត្រូវបានផ្អាក។ សូមទាក់ទងម្ចាស់ហាង។ | user disabled |
| 403 | `SHOP_SUSPENDED` | ហាងរបស់អ្នកត្រូវបានផ្អាកដោយអ្នកគ្រប់គ្រងវេទិកា។ | shop suspended (not for platform admins) |

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "អ៊ីមែល/លេខទូរស័ព្ទ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ" } }
```

### 5.3 `POST /auth/refresh` — public (needs a refresh token)

**Request**

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{ "refreshToken": "q3Jx8m2Vb0Hn9Lk4TzR1yW7cP5eA6sD0fG2hJ8kL3mN" }
```

**Response 200** — a new pair; the old refresh token is now revoked.

```json
{
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YjFm...",
    "expiresIn": 900,
    "refreshToken": "Zt7Kp1Qw9Er3Ty5Ui8Op2As4Df6Gh0Jk1Lz3Xc5Vb7N",
    "refreshExpiresIn": 2592000
  }
}
```

**Errors:** `401 TOKEN_INVALID` (unknown, expired or revoked token — and if it
was already rotated, the whole family is revoked), `403 ACCOUNT_DISABLED`,
`403 SHOP_SUSPENDED`.

### 5.4 `POST /auth/logout` — public (needs the refresh token)

```http
POST /api/v1/auth/logout
Content-Type: application/json

{ "refreshToken": "Zt7Kp1Qw9Er3Ty5Ui8Op2As4Df6Gh0Jk1Lz3Xc5Vb7N" }
```

**Response:** `204 No Content` (also `204` if the token was already invalid).
The client drops its access token.

### 5.5 `GET /auth/me` — any signed-in user

```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200** — what the admin shell needs (sidebar, top bar, badges).

```json
{
  "data": {
    "user": {
      "id": "8b1f6a5e-3c1d-4a8e-9d4b-2f6c0a7e9b10",
      "name": "ម្ចាស់ហាង",
      "title": "ស្ថាបនិក និងអ្នករចនាម៉ូដ",
      "email": "yimmetra@coocon.net",
      "phone": null,
      "avatar": "/uploads/mvox9a7o-3b7cd750bec1.jpg",
      "role": "owner",
      "isPlatformAdmin": true
    },
    "shop": { "id": "1c9e2d4f-…", "slug": "aura-studio", "name": "AURA Studio", "status": "active" },
    "counts": { "pendingStaff": 0, "pendingShops": 1 }
  }
}
```

**Errors:** `401 TOKEN_EXPIRED` → call `/auth/refresh` and retry; `401 TOKEN_INVALID` → log in again.

```json
{ "error": { "code": "TOKEN_EXPIRED", "message": "សម័យប្រើប្រាស់បានផុតកំណត់ សូមចូលម្តងទៀត" } }
```

### 5.6 `PATCH /auth/password` — owner (today) · every user (recommended)

**Request**

```http
PATCH /api/v1/auth/password
Authorization: Bearer eyJ...
Content-Type: application/json

{ "currentPassword": "admin123", "newPassword": "N3wPassw0rd", "confirmPassword": "N3wPassw0rd" }
```

**Response 200** — all the user's refresh tokens are revoked and a new pair is
returned so this device stays signed in.

```json
{
  "data": { "tokenType": "Bearer", "accessToken": "eyJ...", "expiresIn": 900,
            "refreshToken": "Nw4…", "refreshExpiresIn": 2592000 },
  "message": "បានប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ"
}
```

**Errors:** `400 VALIDATION` — ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ (field
`currentPassword`), ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ, ពាក្យសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នា.

---

## 6. Endpoints — public (storefront and home)

No token needed.

### 6.1 `GET /shop-types`

Options for the "open a shop" form.

```http
GET /api/v1/shop-types
```

```json
{
  "data": [
    { "code": "couture",  "label": "ម៉ូដសម្លៀកបំពាក់",      "sizeKind": "clothing" },
    { "code": "jewelry",  "label": "គ្រឿងអលង្ការ",          "sizeKind": "none" },
    { "code": "ceramics", "label": "សេរ៉ាមិច និងវត្ថុតុបតែង", "sizeKind": "none" },
    { "code": "leather",  "label": "ផលិតផលស្បែក",          "sizeKind": "none" }
  ]
}
```

### 6.2 `GET /shops`

Active shops for the home page directory and footer.

```http
GET /api/v1/shops
```

```json
{
  "data": [
    {
      "slug": "aura-studio",
      "name": "AURA Studio",
      "type": { "code": "couture", "label": "ម៉ូដសម្លៀកបំពាក់" },
      "heroImage": "https://lh3.googleusercontent.com/aida-public/…",
      "heroSubtitle": "ការកាត់ដេររាងចម្លាក់ ជួបនឹងក្រណាត់ធម្មជាតិ…",
      "productCount": 27
    }
  ]
}
```

### 6.3 `GET /featured?perShop=4`

Home page carousel: up to `perShop` products of each active shop, interleaved.

```http
GET /api/v1/featured?perShop=4
```

```json
{
  "data": [
    {
      "id": "3f2a…", "slug": "atelier-belted-cashmere-coat",
      "name": "អាវធំកាស្មៀរមានខ្សែក្រវាត់",
      "description": "ត្បាញពីកាស្មៀរម៉ុងហ្គោលីថ្នាក់ A…",
      "price": 890.00, "stock": 3,
      "image": "https://lh3.googleusercontent.com/aida-public/…",
      "shop": { "slug": "aura-studio", "name": "AURA Studio", "telegram": "your_shop_username" }
    }
  ]
}
```

### 6.4 `GET /shops/{slug}`

Everything the storefront frame needs.

```http
GET /api/v1/shops/aura-studio
```

**Response 200 — active shop**

```json
{
  "data": {
    "slug": "aura-studio",
    "status": "active",
    "type": { "code": "couture", "label": "ម៉ូដសម្លៀកបំពាក់", "sizeKind": "clothing" },
    "settings": {
      "shopName": "AURA Studio",
      "telegram": "your_shop_username",
      "announcement": "ដឹកជញ្ជូនរហ័សឥតគិតថ្លៃ សម្រាប់ការបញ្ជាទិញលើស $២៥០…",
      "heroTitle": "តុល្យភាពដ៏អស់កល្ប",
      "heroSubtitle": "ការកាត់ដេររាងចម្លាក់…",
      "heroImage": "https://lh3.googleusercontent.com/aida-public/…",
      "backgroundColor": "#f8f9fa",
      "aboutTitle": "អំពីយើង",
      "aboutMe": "ឧទ្ទិសដល់ភាពប្រណីតបែបស្ថាបត្យកម្ម…"
    },
    "categories": [
      { "code": "women", "label": "នារី" },
      { "code": "men", "label": "បុរស" },
      { "code": "accessories", "label": "គ្រឿងបន្លាស់" },
      { "code": "c-1a2b3c", "label": "អាវយឺត" },
      { "code": "best-sellers", "label": "លក់ដាច់បំផុត" }
    ],
    "owner": { "name": "ម្ចាស់ហាង", "title": "ស្ថាបនិក…", "email": "yimmetra@coocon.net", "phone": null, "avatar": "/uploads/…" }
  }
}
```

**Response 200 — pending or suspended shop** (the page shows a notice)

```json
{ "data": { "slug": "sophea-shop", "name": "ហាងសុភា", "status": "pending" } }
```

**Errors:** `404 NOT_FOUND` — unknown slug.

### 6.5 `GET /shops/{slug}/products`

| Query | Meaning | Default |
|---|---|---|
| `category` | category code, or `all` | `all` |
| `sort` | `curated` (newest first) \| `price-asc` \| `price-desc` | `curated` |
| `q` | search name / description / badge | – |
| `page`, `pageSize` | catalogue 12, home page 8 | 1, 12 |

```http
GET /api/v1/shops/aura-studio/products?category=women&sort=price-asc&page=1&pageSize=12
```

```json
{
  "data": [
    {
      "id": "3f2a…",
      "slug": "atelier-belted-cashmere-coat",
      "name": "អាវធំកាស្មៀរមានខ្សែក្រវាត់",
      "description": "ត្បាញពីកាស្មៀរម៉ុងហ្គោលីថ្នាក់ A…",
      "price": 890.00,
      "stock": 3,
      "badge": "កាស្មៀរសុទ្ធ",
      "badgeTone": "gold",
      "atelier": "អាតេលីយេ ប៊ីយ៉ែឡា",
      "categories": ["women", "best-sellers"],
      "images": ["https://…/coat-front.jpg", "https://…/coat-back.jpg"],
      "sizes": ["S", "M", "L", "XL"],
      "colors": [ { "name": "ខ្មៅ", "hex": "#111111" } ]
    }
  ],
  "meta": {
    "page": 1, "pageSize": 12, "total": 13, "pageCount": 2,
    "categoryCounts": { "all": 27, "women": 13, "men": 9, "accessories": 5, "c-1a2b3c": 1, "best-sellers": 9 }
  }
}
```

`sizes`: the product's sizes; when it has none and the shop type has a size
system, that system's defaults; `[]` for types without sizes.
**Errors:** `404 NOT_FOUND` — unknown or not active shop.

### 6.6 `GET /shops/{slug}/products/{productSlug}`

```http
GET /api/v1/shops/aura-studio/products/atelier-belted-cashmere-coat
```

```json
{
  "data": {
    "id": "3f2a…", "slug": "atelier-belted-cashmere-coat", "name": "អាវធំកាស្មៀរមានខ្សែក្រវាត់",
    "description": "…", "price": 890.00, "stock": 3, "badge": "កាស្មៀរសុទ្ធ", "badgeTone": "gold",
    "atelier": "អាតេលីយេ ប៊ីយ៉ែឡា", "categories": ["women", "best-sellers"],
    "images": ["…", "…", "…"], "sizes": ["S", "M", "L", "XL"], "colors": [],
    "related": [
      { "slug": "sculpted-hourglass-overcoat", "name": "អាវធំរាងនាឡិកាខ្សាច់", "price": 680.00,
        "image": "…", "atelier": "ស្ទូឌីយោមីឡាន", "badge": "កម្រង រដូវ២០២៥" }
    ]
  }
}
```

**Errors:** `404 NOT_FOUND`.

### 6.7 `POST /shops/{slug}/newsletter` (phase 2)

```http
POST /api/v1/shops/aura-studio/newsletter
Content-Type: application/json

{ "email": "customer@example.com" }
```

```json
{ "message": "សូមអរគុណ! អ្នកបានចុះឈ្មោះទទួលព័ត៌មានដោយជោគជ័យ។" }
```

`201` (new) or `200` (already subscribed — don't reveal). `400` bad email, `429` rate limited.

---

## 7. Endpoints — shop sign-up

### 7.1 `POST /shops` — public

The "បើកហាងអនឡាញរបស់អ្នក" form. Email **or** phone (or both) for the owner —
that is what they log in with.

**Request**

```http
POST /api/v1/shops
Content-Type: application/json

{
  "shopName": "ហាងសុភា",
  "slug": "sophea-shop",
  "telegram": "@sophea_shop",
  "shopType": "jewelry",
  "owner": {
    "name": "សុភា",
    "email": "sophea@example.com",
    "phone": "012 345 678",
    "password": "sophea1234",
    "confirmPassword": "sophea1234"
  }
}
```

**Response 201** — the owner is signed in straight away (same token fields as login).

```json
{
  "data": {
    "shop": { "id": "1c9e2d4f-…", "slug": "sophea-shop", "name": "ហាងសុភា", "status": "pending" },
    "user": { "id": "8b1f6a5e-…", "name": "សុភា", "role": "owner", "email": "sophea@example.com", "phone": "012345678" },
    "tokenType": "Bearer",
    "accessToken": "eyJ...",
    "expiresIn": 900,
    "refreshToken": "q3Jx…",
    "refreshExpiresIn": 2592000
  },
  "message": "ហាងរបស់អ្នកត្រូវបានបង្កើត ហើយកំពុងរង់ចាំការអនុម័ត"
}
```

Server steps (one transaction): validate ([§12](#12-validation-rules-single-source));
insert `shops` (pending) + `shop_settings` (hero title = shop name, subtitle
`សូមស្វាគមន៍មកកាន់ហាងរបស់យើង។`, announcement `សូមស្វាគមន៍! បញ្ជាទិញងាយៗតាមតេឡេក្រាម។`);
copy the type's default categories into `shop_categories`; insert the owner
(`role=owner`, `status=active`, title `ម្ចាស់ហាង`); issue tokens.

**Errors**

| Status | `code` | Example `message` |
|---|---|---|
| 400 | `VALIDATION` | តំណហាងអាចមានតែអក្សរឡាតាំងតូច (a-z) លេខ និងសញ្ញា - ប៉ុណ្ណោះ (field `slug`) |
| 400 | `VALIDATION` | តំណនេះត្រូវបានរក្សាទុក សូមជ្រើសរើសឈ្មោះផ្សេង (reserved slug) |
| 400 | `VALIDATION` | ឈ្មោះអ្នកប្រើតេឡេក្រាមមិនត្រឹមត្រូវ (៥–៣២ តួអក្សរ a-z, 0-9, _) |
| 409 | `CONFLICT` | តំណហាងនេះមានគេប្រើរួចហើយ |
| 409 | `CONFLICT` | អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ / លេខទូរស័ព្ទនេះត្រូវបានប្រើរួចហើយ |
| 429 | `RATE_LIMITED` | too many sign-ups from this IP (recommended: 5 per hour) |

---

## 8. Endpoints — shop admin (own shop)

All need `Authorization: Bearer <accessToken>`. The shop is always the
signed-in user's shop, loaded from the database — every query below uses
`WHERE shop_id = :shopId` ([§4.1](#41-multi-shop-isolation--every-query-is-scoped-to-the-users-shop)).
Ids from another shop answer `404`.

### 8.1 `GET /admin/dashboard` — staff+

```http
GET /api/v1/admin/dashboard
Authorization: Bearer eyJ...
```

```json
{
  "data": {
    "totalProducts": 27,
    "totalStock": 165,
    "stockValue": 99070.00,
    "lowStock": [ { "id": "9a1b…", "name": "អាវកាក់រោមចៀមរាងដូង", "stock": 1 } ],
    "recentProducts": [ { "id": "3f2a…", "name": "អាវធំកាស្មៀរមានខ្សែក្រវាត់", "price": 890.00, "stock": 3, "image": "…" } ],
    "pendingStaff": 0
  }
}
```

`lowStock` = stock ≤ 3; `recentProducts` = 5 newest; `pendingStaff` only for owners.

### 8.2 `GET /admin/products` — staff+

```http
GET /api/v1/admin/products?q=កាបូប&category=all&page=1&pageSize=10
Authorization: Bearer eyJ...
```

```json
{
  "data": [
    { "id": "5c7d…", "slug": "architectural-leather-tote", "name": "កាបូបស្បែកបែបស្ថាបត្យកម្ម",
      "price": 540.00, "stock": 5, "badge": "ស្បែកតូស្កានី", "categories": ["accessories", "best-sellers"],
      "image": "https://…" }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 3, "pageCount": 1 }
}
```

`q` searches name and slug.

### 8.3 `GET /admin/products/{id}` — staff+

```http
GET /api/v1/admin/products/5c7d…
Authorization: Bearer eyJ...
```

```json
{
  "data": {
    "id": "5c7d…", "slug": "architectural-leather-tote", "name": "កាបូបស្បែកបែបស្ថាបត្យកម្ម",
    "description": "…", "price": 540.00, "stock": 5, "badge": "ស្បែកតូស្កានី", "badgeTone": "gold",
    "atelier": "អាតេលីយេស្បែក", "categories": ["accessories", "best-sellers"],
    "images": ["https://…", "/uploads/mvq1ucc4-55e7b13ec864.png"],
    "sizes": [], "colors": [ { "name": "ត្នោត", "hex": "#8b5e3c" } ]
  },
  "options": {
    "categories": [ { "code": "women", "label": "នារី" }, "…" ],
    "sizeKind": "clothing",
    "sizes": [ { "value": "XS", "hint": "ទំហំ ៣៤–៣៦" }, "…" ],
    "defaultSizes": ["S", "M", "L", "XL"]
  }
}
```

`options` gives the form everything it needs (the shop's categories and size system).
**Errors:** `404 NOT_FOUND` (not in your shop).

### 8.4 `POST /admin/products` — staff+

**Request** (upload images first with [`POST /uploads`](#10-endpoints--uploads))

```http
POST /api/v1/admin/products
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "name": "អាវយឺតកប្បាស",
  "description": "អាវយឺតកប្បាសសុទ្ធ ទន់ស្រួលពាក់",
  "price": 25,
  "stock": 10,
  "badge": "កប្បាសសុទ្ធ",
  "badgeTone": "neutral",
  "atelier": "ស្ទូឌីយោមីឡាន",
  "categories": ["women", "c-1a2b3c"],
  "images": ["/uploads/mvq1ucc4-55e7b13ec864.png", "https://example.com/t-shirt-back.jpg"],
  "sizes": ["S", "M", "L"],
  "colors": [ { "name": "ខ្មៅ", "hex": "#111111" }, { "name": "ក្រហមចាស់", "hex": "#7f1d1d" } ]
}
```

**Response 201**

```json
{
  "data": { "id": "e41f…", "slug": "product-d505ee", "name": "អាវយឺតកប្បាស", "price": 25.00, "stock": 10,
            "categories": ["women", "c-1a2b3c"], "images": ["…", "…"], "sizes": ["S", "M", "L"],
            "colors": [ { "name": "ខ្មៅ", "hex": "#111111" }, { "name": "ក្រហមចាស់", "hex": "#7f1d1d" } ] },
  "message": "បានបន្ថែមផលិតផលថ្មីដោយជោគជ័យ"
}
```

**Errors (400 `VALIDATION`, with `field`)**

```json
{ "error": { "code": "VALIDATION", "field": "sizes", "message": "សូមជ្រើសរើសទំហំយ៉ាងហោចណាស់មួយ" } }
```

Other messages: សូមបញ្ចូលឈ្មោះផលិតផល · តម្លៃត្រូវតែជាលេខធំជាង ០ ·
ចំនួនស្តុកត្រូវតែជាលេខគត់ ០ ឬច្រើនជាងនេះ · សូមបញ្ចូលការពិពណ៌នា ·
សូមជ្រើសរើសប្រភេទយ៉ាងហោចណាស់មួយ (also when a category is not in your shop) ·
សូមបន្ថែមរូបភាពយ៉ាងហោចណាស់មួយ · តំណរូបភាពមិនត្រឹមត្រូវ៖ {url} ·
សូមដាក់ឈ្មោះឲ្យពណ៌នីមួយៗ · កូដពណ៌មិនត្រឹមត្រូវ · ឈ្មោះពណ៌មិនអាចដដែលៗបានទេ ·
អាចបន្ថែមពណ៌បានយ៉ាងច្រើន ១២.

### 8.5 `PUT /admin/products/{id}` — staff+

Same body as create (full replacement of images, sizes, colours, categories).

**Response 200**

```json
{ "data": { "id": "e41f…", "slug": "product-d505ee", "name": "អាវយឺតកប្បាស", "…": "…" },
  "message": "បានកែប្រែផលិតផលដោយជោគជ័យ" }
```

**Errors:** same as create, plus `404 NOT_FOUND`.

### 8.6 `DELETE /admin/products/{id}` — staff+

```http
DELETE /api/v1/admin/products/e41f…
Authorization: Bearer eyJ...
```

**Response:** `204 No Content`. **Errors:** `404 NOT_FOUND`.

### 8.7 `GET /admin/categories` — staff+

```json
{ "data": [ { "code": "women", "label": "នារី" }, { "code": "c-1a2b3c", "label": "អាវយឺត" }, { "code": "best-sellers", "label": "លក់ដាច់បំផុត" } ] }
```

### 8.8 `POST /admin/categories` — staff+

Used by "បន្ថែមប្រភេទថ្មី" in the product form.

```http
POST /api/v1/admin/categories
Authorization: Bearer eyJ...
Content-Type: application/json

{ "label": "អាវយឺត" }
```

**Response 201** — inserted just before `best-sellers`.

```json
{ "data": { "code": "c-1a2b3c", "label": "អាវយឺត", "sortOrder": 4 }, "message": "បានបន្ថែមប្រភេទ «អាវយឺត»" }
```

**Errors:** `400` សូមបញ្ចូលឈ្មោះប្រភេទ · `409` មានប្រភេទឈ្មោះនេះរួចហើយ · `400` អាចមានប្រភេទបានយ៉ាងច្រើន ២០.

(Recommended later: `PATCH /admin/categories/{code}` `{ "label" }` and `DELETE /admin/categories/{code}` for owners.)

### 8.9 `GET /admin/settings` — owner

```json
{
  "data": {
    "shopName": "AURA Studio", "telegram": "your_shop_username",
    "announcement": "…", "heroTitle": "តុល្យភាពដ៏អស់កល្ប", "heroSubtitle": "…",
    "heroImage": "https://…", "backgroundColor": "#f8f9fa",
    "aboutTitle": "អំពីយើង", "aboutMe": "…"
  }
}
```

### 8.10 `PUT /admin/settings` — owner

```http
PUT /api/v1/admin/settings
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "shopName": "AURA Studio",
  "telegram": "@aura_studio",
  "announcement": "ដឹកជញ្ជូនឥតគិតថ្លៃ!",
  "heroTitle": "",
  "heroSubtitle": "ម៉ូដប្រណីតសម្រាប់អ្នក",
  "heroImage": "/uploads/mvr0abcd-0123456789ab.jpg",
  "backgroundColor": "#f5f0ea",
  "aboutTitle": "",
  "aboutMe": "យើងជាហាងសម្លៀកបំពាក់…"
}
```

**Response 200** — empty `heroTitle` → shop name, empty `aboutTitle` → `អំពីយើង`, `@` removed.

```json
{ "data": { "shopName": "AURA Studio", "telegram": "aura_studio", "heroTitle": "AURA Studio", "aboutTitle": "អំពីយើង", "…": "…" },
  "message": "បានរក្សាទុកការកំណត់ហាង" }
```

**Errors:** `400` សូមបញ្ចូលឈ្មោះហាង · ពណ៌ផ្ទៃខាងក្រោយត្រូវតែជាកូដពណ៌ (ឧ. #f8f9fa) · រូបភាពផ្ទៃខាងក្រោយមិនត្រឹមត្រូវ; `403 FORBIDDEN` for staff.

### 8.11 `PUT /admin/profile` — owner (today) · every user (recommended)

```http
PUT /api/v1/admin/profile
Authorization: Bearer eyJ...
Content-Type: application/json

{ "name": "សុខា", "title": "ស្ថាបនិក", "email": "sokha@example.com", "phone": "+855 12 999 888",
  "avatar": "/uploads/mvox9a7o-3b7cd750bec1.jpg" }
```

**Response 200** (`avatar: null` removes the photo)

```json
{ "data": { "id": "8b1f…", "name": "សុខា", "title": "ស្ថាបនិក", "email": "sokha@example.com",
            "phone": "012999888", "avatar": "/uploads/mvox9a7o-3b7cd750bec1.jpg" },
  "message": "បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួន" }
```

**Errors:** `400` ត្រូវមានអ៊ីមែល ឬលេខទូរស័ព្ទយ៉ាងហោចណាស់មួយ ដើម្បីចូលប្រើ ·
អ៊ីមែលមិនត្រឹមត្រូវ · លេខទូរស័ព្ទមិនត្រឹមត្រូវ (៨ ទៅ ១៥ ខ្ទង់); `409` អ៊ីមែល/លេខទូរស័ព្ទនេះត្រូវបានប្រើរួចហើយ.
Changing email/phone changes the login identifier.

### 8.12 `GET /admin/staff` — owner

```json
{
  "data": [
    { "id": "7d2e…", "name": "SOK KOM", "title": "player", "email": "daralon2020@gmail.com", "phone": null,
      "avatar": null, "role": "staff", "status": "active", "isMe": false },
    { "id": "8b1f…", "name": "ម្ចាស់ហាង", "title": "ស្ថាបនិក…", "email": "yimmetra@coocon.net", "phone": null,
      "avatar": "/uploads/…", "role": "owner", "status": "active", "isMe": true }
  ]
}
```

Pending first, then by name.

### 8.13 `POST /admin/staff` — owner

The staff member logs in with this **email or phone** + password.

```http
POST /api/v1/admin/staff
Authorization: Bearer eyJ...
Content-Type: application/json

{ "name": "វណ្ណា", "title": "បុគ្គលិកលក់", "email": null, "phone": "098 765 432",
  "password": "staffpass1", "confirmPassword": "staffpass1" }
```

**Response 201**

```json
{ "data": { "id": "c3f9…", "name": "វណ្ណា", "title": "បុគ្គលិកលក់", "email": null, "phone": "098765432",
            "role": "staff", "status": "active" },
  "message": "បានបង្កើតគណនីសម្រាប់ វណ្ណា" }
```

**Errors:** `400` សូមបញ្ចូលឈ្មោះបុគ្គលិក · សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទយ៉ាងហោចណាស់មួយ ·
ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ · ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នា; `409` email/phone taken.

### 8.14 `PATCH /admin/staff/{id}` — owner

```http
PATCH /api/v1/admin/staff/c3f9…
Authorization: Bearer eyJ...
Content-Type: application/json

{ "status": "disabled" }
```

**Response 200** — disabling also revokes the staff member's refresh tokens.

```json
{ "data": { "id": "c3f9…", "status": "disabled" }, "message": "បានផ្អាកគណនី" }
```

Messages: `active` → បានអនុម័តគណនី, `disabled` → បានផ្អាកគណនី, `pending` → បានកំណត់គណនីជារង់ចាំ.
**Errors:** `403` មិនអាចប្តូរស្ថានភាពគណនីម្ចាស់ហាងបានទេ (owner / yourself); `404` not in your shop.

### 8.15 `DELETE /admin/staff/{id}` — owner

**Response:** `204 No Content`. **Errors:** `403` មិនអាចលុបគណនីម្ចាស់ហាងបានទេ; `404`.

(Recommended later: `POST /admin/staff/{id}/reset-password` `{ "newPassword", "confirmPassword" }`.)

---

## 9. Endpoints — platform admin

Token must have `pa: true` (and the DB user `is_platform_admin`); otherwise `403 FORBIDDEN`.

### 9.1 `GET /platform/shops`

```http
GET /api/v1/platform/shops
Authorization: Bearer eyJ...
```

```json
{
  "data": [
    {
      "id": "1c9e…", "slug": "sophea-shop", "name": "ហាងសុភា", "status": "pending",
      "type": "គ្រឿងអលង្ការ", "productCount": 1, "accountCount": 1,
      "owner": { "name": "សុភា", "email": "sophea@example.com", "phone": "012345678" },
      "createdAt": "2026-10-27T03:10:00Z", "isMine": false
    },
    {
      "id": "0a2b…", "slug": "aura-studio", "name": "AURA Studio", "status": "active",
      "type": "ម៉ូដសម្លៀកបំពាក់", "productCount": 27, "accountCount": 2,
      "owner": { "name": "ម្ចាស់ហាង", "email": "yimmetra@coocon.net", "phone": null },
      "createdAt": null, "isMine": true
    }
  ],
  "meta": { "pending": 1 }
}
```

Sorted pending → active → suspended, then by name.

### 9.2 `PATCH /platform/shops/{id}`

```http
PATCH /api/v1/platform/shops/1c9e…
Authorization: Bearer eyJ...
Content-Type: application/json

{ "status": "active" }
```

**Response 200**

```json
{ "data": { "id": "1c9e…", "status": "active", "approvedAt": "2026-10-27T03:20:00Z" },
  "message": "ហាងត្រូវបានអនុម័ត ហើយបង្ហាញជាសាធារណៈ" }
```

`suspended` → បានផ្អាកហាង (and revoke the refresh tokens of the shop's users);
`pending` → បានកំណត់ហាងជារង់ចាំ.
**Errors:** `403` មិនអាចផ្អាកហាងរបស់អ្នកផ្ទាល់បានទេ; `404` រកមិនឃើញហាង.

### 9.3 `DELETE /platform/shops/{id}`

**Response:** `204 No Content` — deletes the shop, its settings, categories,
products and all its user accounts (cascade).
**Errors:** `403` មិនអាចលុបហាងរបស់អ្នកផ្ទាល់បានទេ; `404`.

### 9.4 Shop types (optional — no admin UI today)

| Request | Response |
|---|---|
| `GET /platform/shop-types` | `{ "data": [ { "code", "label", "sizeKind", "categories": [ { "code", "label" } ], "shopCount" } ] }` |
| `POST /platform/shop-types` `{ "label": "គ្រឿងសម្អាង", "sizeKind": "none", "categories": [ { "label": "ថែរក្សាស្បែក" } ] }` | `201 { "data": { "code": "t-3f9a1c2e", … } }` |
| `PUT /platform/shop-types/{code}` (same body) | `200` |
| `DELETE /platform/shop-types/{code}` | `204`; `409` if a shop uses it; keep at least one type |

---

## 10. Endpoints — uploads

### 10.1 `POST /uploads` — any signed-in user

```http
POST /api/v1/uploads
Authorization: Bearer eyJ...
Content-Type: multipart/form-data; boundary=----X

------X
Content-Disposition: form-data; name="file"; filename="coat.jpg"
Content-Type: image/jpeg

<binary>
------X--
```

Stored as `shops/{shopId}/{file}` with the user's `shop_id`; product and settings
endpoints only accept `/uploads/...` files of the same shop.

**Response 201**

```json
{ "data": { "id": "6e0b…", "url": "/uploads/mvq1ucc4-55e7b13ec864.jpg",
            "mimeType": "image/jpeg", "sizeBytes": 348221 } }
```

**Errors:** `415 UNSUPPORTED_FILE` អនុញ្ញាតតែឯកសាររូបភាព (JPG, PNG, WEBP, GIF, AVIF) ប៉ុណ្ណោះ ·
`413 FILE_TOO_LARGE` រូបភាពត្រូវមានទំហំមិនលើស ៥MB.

### 10.2 `GET /uploads/{fileName}` — public

```http
GET /uploads/mvq1ucc4-55e7b13ec864.jpg
```

`200` with the image and `Cache-Control: public, max-age=31536000, immutable`;
`404` when the name does not match `^[a-z0-9-]+\.(jpg|png|webp|gif|avif)$` or
the file does not exist.

---

## 11. Endpoints — orders (phase 2)

Today the cart and order buttons only open a Telegram chat. To also keep a record:

### 11.1 `POST /shops/{slug}/orders` — public

```http
POST /api/v1/shops/aura-studio/orders
Content-Type: application/json

{
  "items": [
    { "productId": "e41f…", "size": "L", "color": "ក្រហមចាស់", "quantity": 1 },
    { "productId": "5c7d…", "quantity": 2 }
  ],
  "customer": { "name": "ដារា", "phone": "011 222 333", "telegram": "dara_kh" },
  "note": "សូមដឹកនៅម៉ោង ៥ ល្ងាច"
}
```

**Response 201** — prices are re-read on the server; the client opens `telegramUrl`.

```json
{
  "data": {
    "code": "AS-7K3Q",
    "total": 1105.00,
    "telegramUrl": "https://t.me/your_shop_username?text=%E1%9E%9F...AS-7K3Q..."
  }
}
```

**Errors:** `400` unknown product / size or colour not offered / quantity < 1;
`409` not enough stock; `404` shop not active.

### 11.2 Admin order endpoints — staff+

| Request | Response |
|---|---|
| `GET /admin/orders?status=new&page=1` | `{ "data": [ { "id", "code", "status", "total", "customer", "createdAt", "itemCount" } ], "meta": {…} }` |
| `GET /admin/orders/{id}` | order + `items: [ { "productName", "unitPrice", "size", "color", "quantity" } ]` |
| `PATCH /admin/orders/{id}` `{ "status": "confirmed" }` | `200 { "data": { "id", "status" } }` — optionally decrement stock on `confirmed` |

---

## 12. Validation rules (single source)

| Field | Rule | Khmer error (as in the app) |
|---|---|---|
| Shop name | required | សូមបញ្ចូលឈ្មោះហាង |
| Shop slug | `^[a-z0-9]+(-[a-z0-9]+)*$` | តំណហាងអាចមានតែអក្សរឡាតាំងតូច (a-z) លេខ និងសញ្ញា - ប៉ុណ្ណោះ |
| | 3–40 chars | តំណហាងត្រូវមានពី ៣ ទៅ ៤០ តួអក្សរ |
| | not reserved: `admin api uploads start login register shops catalogue products settings static public assets images favicon.ico robots.txt sitemap.xml _next aura` | តំណនេះត្រូវបានរក្សាទុក សូមជ្រើសរើសឈ្មោះផ្សេង |
| | unique | តំណហាងនេះមានគេប្រើរួចហើយ |
| Telegram | `^[A-Za-z0-9_]{5,32}$` after removing `@` | ឈ្មោះអ្នកប្រើតេឡេក្រាមមិនត្រឹមត្រូវ (៥–៣២ តួអក្សរ a-z, 0-9, _) |
| Shop type | must exist | សូមជ្រើសរើសប្រភេទហាង |
| Person name | required | សូមបញ្ចូលឈ្មោះ… |
| Email / phone | at least one | សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទយ៉ាងហោចណាស់មួយ |
| Email | `^[^\s@]+@[^\s@]+\.[^\s@]+$`, stored lower-case, unique | អ៊ីមែលមិនត្រឹមត្រូវ / អ៊ីមែលនេះត្រូវបានប្រើរួចហើយ |
| Phone | digits only; `+855…`/`855…` → `0…`; 8–15 digits; unique | លេខទូរស័ព្ទមិនត្រឹមត្រូវ (៨ ទៅ ១៥ ខ្ទង់) / លេខទូរស័ព្ទនេះត្រូវបានប្រើរួចហើយ |
| Password | ≥ 8 chars; confirmation equal | ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ / ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នា |
| Login identifier | contains `@` → email (lower-cased); else phone (digits, `+855`/`855` → `0`) | អ៊ីមែល/លេខទូរស័ព្ទ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ |
| Login lockout | 5 failures / identifier → 15 min (`423`, `Retry-After`) | ព្យាយាមខុសច្រើនដងពេក… |
| Product name, description | required | សូមបញ្ចូលឈ្មោះផលិតផល / សូមបញ្ចូលការពិពណ៌នា |
| Price | number > 0 | តម្លៃត្រូវតែជាលេខធំជាង ០ |
| Stock | integer ≥ 0 | ចំនួនស្តុកត្រូវតែជាលេខគត់ ០ ឬច្រើនជាងនេះ |
| Product categories | ≥ 1, each must belong to the shop | សូមជ្រើសរើសប្រភេទយ៉ាងហោចណាស់មួយ |
| Product images | ≥ 1; each `https?://…` or `/uploads/{file}` | សូមបន្ថែមរូបភាពយ៉ាងហោចណាស់មួយ / តំណរូបភាពមិនត្រឹមត្រូវ |
| Product sizes | if the type has a size system: ≥ 1, each in that system | សូមជ្រើសរើសទំហំយ៉ាងហោចណាស់មួយ |
| Product colours | ≤ 12; name required, ≤ 30 chars, unique; hex `#rrggbb` | សូមដាក់ឈ្មោះឲ្យពណ៌នីមួយៗ / កូដពណ៌មិនត្រឹមត្រូវ / ឈ្មោះពណ៌មិនអាចដដែលៗបានទេ / អាចបន្ថែមពណ៌បានយ៉ាងច្រើន ១២ |
| New category | label required, ≤ 40 chars, unique in shop, ≤ 20 per shop | សូមបញ្ចូលឈ្មោះប្រភេទ / មានប្រភេទឈ្មោះនេះរួចហើយ / អាចមានប្រភេទបានយ៉ាងច្រើន ២០ |
| Background colour | `^#[0-9a-f]{6}$` | ពណ៌ផ្ទៃខាងក្រោយត្រូវតែជាកូដពណ៌ (ឧ. #f8f9fa) |
| Upload | jpeg/png/webp/gif/avif, ≤ 5 MB | អនុញ្ញាតតែឯកសាររូបភាព… / រូបភាពត្រូវមានទំហំមិនលើស ៥MB |

---

## 13. Current code → API mapping

Every server action in `src/app/admin/actions.ts` and its REST equivalent:

| Server action | Endpoint |
|---|---|
| `login` | `POST /auth/login` (returns JWT access + refresh token) |
| `logout` | `POST /auth/logout` (revokes the refresh token) |
| (cookie session check in `src/lib/auth.ts`) | `Authorization: Bearer` + `POST /auth/refresh` |
| `startShop` | `POST /shops` |
| `saveProduct` (no id) | `POST /admin/products` |
| `saveProduct` (with id) | `PUT /admin/products/{id}` |
| `deleteProduct` | `DELETE /admin/products/{id}` |
| `addShopCategory` | `POST /admin/categories` |
| `saveSettings` | `PUT /admin/settings` (+ `POST /uploads` for the hero image) |
| `saveProfile` | `PUT /admin/profile` (+ `POST /uploads` for the avatar) |
| `changePassword` | `PATCH /auth/password` |
| `createStaff` | `POST /admin/staff` |
| `setStaffStatus` | `PATCH /admin/staff/{id}` |
| `deleteStaff` | `DELETE /admin/staff/{id}` |
| `setShopStatus` | `PATCH /platform/shops/{id}` |
| `deleteShop` | `DELETE /platform/shops/{id}` |
| `getShops` / `getActiveShops` (`src/lib/data.ts`) | `GET /shops` |
| `getShopBySlug` | `GET /shops/{slug}` (+ `/products`) |
| `getShopTypes` | `GET /shop-types` |
| `getShopOwnerProfile` | `owner` field of `GET /shops/{slug}` |
| `src/app/uploads/[file]/route.ts` | `GET /uploads/{file}` |

**Swapping the storage:** `readStore()` and `updateStore()` in
`src/lib/store.ts` are the only functions that touch `data/store.json`. Replace
them (or the functions in `src/lib/data.ts` and the bodies of the server
actions) with database queries; the pages and components do not need to change.

---

## 14. Migrating `data/store.json` into the database

One-off script, in a single transaction:

| JSON | Tables |
|---|---|
| `shopTypes[]` | `shop_types` (`value` → `code`), `categories[]` → `shop_type_categories` |
| `shops[]` | `shops` (`specialty` → `shop_type_id` via `code`) |
| `shops[].settings` | `shop_settings` |
| `shops[].categories` (or the type's categories when missing) | `shop_categories` |
| `shops[].products[]` | `products` (`id` → `slug`, array index → `sort_order`) |
| `products[].images[]` | `product_images` (index → `position`) |
| `products[].sizes[]` | `product_sizes` (if missing and the type has sizes, insert the size system defaults) |
| `products[].colors[]` | `product_colors` |
| `products[].categories[]` | `product_categories` with the product's `shop_id` (look up `shop_categories` by `shop_id` + `code`) |
| `users[]` | `users` (`platformAdmin` → `is_platform_admin`; keep `passwordHash` — format `salt:hash`, scrypt N=16384, r=8, p=1, keylen 64; verify with Node `crypto.scrypt`, or re-hash on next login) |
| `data/uploads/*` | copy files to `shops/{shop_id}/…`; insert `uploads` rows with the `shop_id` of the shop whose product images, hero image or user avatar reference the file |
| `secret` | not migrated — the API signs JWTs with its own `JWT_SECRET`; everyone signs in once after the switch |

Afterwards, check: every shop has exactly one owner, every product has ≥ 1
image and ≥ 1 category, and all `/uploads/...` URLs resolve.
