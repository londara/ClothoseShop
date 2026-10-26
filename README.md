# AURA Studio — Khmer fashion shop platform

Next.js 16 + shadcn/ui + Tailwind CSS, Khmer only (Battambang font).

## Run

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## URLs

| URL | What |
|---|---|
| `/` | Platform home: shop directory, featured pieces, "បើកហាង" (create a shop) |
| `/{shop-link}` | A shop's storefront, e.g. `/aura-studio` |
| `/{shop-link}/catalogue`, `/{shop-link}/products/{id}` | Catalogue and product pages |
| `/admin` | Admin for the signed-in user's own shop |

Old single-shop links (`/catalogue`, `/products/...`) redirect to `/aura-studio/...`.

## Accounts and shops

- **Create a shop:** anyone can use "បើកហាង" on the home page (shop name, a Latin
  link such as `sophea-shop`, Telegram, specialty, and the owner's email/phone +
  password). The shop starts **pending**: the owner can log in and add products,
  but the public page shows "waiting for approval" until a platform admin approves it.
- **Platform admin** (the original AURA Studio owner, `ADMIN_EMAIL`): extra menu
  **ហាងទាំងអស់** to approve, suspend or delete shops. Suspending a shop hides it
  and logs out its owner and staff.
- **Shop owner:** products, staff accounts (only they can create them), settings.
- **Staff:** dashboard and products of their shop only.
- Log in with **email or phone number** + password. 5 wrong passwords lock that
  login for 15 minutes.

| | Platform admin | Shop owner | Staff |
|---|---|---|---|
| Products of own shop | ✓ | ✓ | ✓ |
| Staff + Settings of own shop | ✓ | ✓ | – |
| All shops (approve / suspend / delete) | ✓ | – | – |

## Data

- `data/store.json` — shops (settings + products) and user accounts; created on
  first run, upgraded automatically from older single-shop stores.
- `data/uploads/` — uploaded images, served at `/uploads/...`

Set `DATA_DIR` to keep it elsewhere (e.g. a Docker volume). Back up this folder.
Because it is a local file store, deploy on a server with a persistent disk
(VPS, Docker volume, etc.); serverless hosts such as Vercel do not keep written files.
