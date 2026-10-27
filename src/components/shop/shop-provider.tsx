"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  defaultChoice,
  describeChoice,
  type CategoryOption,
  type Choice,
  type Product,
} from "@/lib/products"
import { shopHref } from "@/lib/platform"
import type { SizeKind } from "@/lib/shop-types"
import { formatPrice, kh, telegramUrl } from "@/lib/site"

export type CartLine = Choice & {
  productId: string
  quantity: number
}

/** Identifies a cart line: same product in another size/colour is a separate line. */
export const lineKey = (l: Pick<CartLine, "productId" | "size" | "color">) =>
  `${l.productId}|${l.size}|${l.color}`

type ShopState = {
  cart: CartLine[]
  wishlist: string[]
}

type ShopContextValue = ShopState & {
  products: Product[]
  getProduct: (id: string) => Product | undefined
  shopName: string
  telegram: string
  slug: string
  /** Size system of the shop's type ("none" when products have no sizes). */
  sizeKind: SizeKind
  /** Product categories of this shop's specialty. */
  categories: CategoryOption[]
  /** Shop-relative path ("/catalogue", "/#about") → "/{slug}/..." */
  href: (path?: string) => string
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  quickView: Product | null
  openQuickView: (product: Product) => void
  closeQuickView: () => void
  /** Without a choice, the product's default size/colour is used. */
  addToCart: (product: Product, choice?: Choice, quantity?: number) => void
  updateQuantity: (key: string, delta: number) => void
  removeFromCart: (key: string) => void
  toggleWishlist: (product: Product) => void
  isWishlisted: (productId: string) => boolean
  checkoutUrl: string
}

const STORAGE_KEY = "aura-shop"

const initialState: ShopState = { cart: [], wishlist: [] }

const ShopContext = React.createContext<ShopContextValue | null>(null)

/** Carts saved before colours existed have no `color`; treat it as none. */
function restore(saved: string): ShopState {
  const parsed = JSON.parse(saved) as ShopState
  return {
    wishlist: parsed.wishlist ?? [],
    cart: (parsed.cart ?? []).map((l) => ({ ...l, size: l.size ?? "", color: l.color ?? "" })),
  }
}

export function ShopProvider({
  children,
  products,
  shopName,
  telegram,
  slug,
  sizeKind,
  categories,
}: {
  children: React.ReactNode
  products: Product[]
  shopName: string
  telegram: string
  slug: string
  sizeKind: SizeKind
  categories: CategoryOption[]
}) {
  const [state, setState] = React.useState<ShopState>(initialState)
  const [hydrated, setHydrated] = React.useState(false)
  const [cartOpen, setCartOpen] = React.useState(false)
  const [quickView, setQuickView] = React.useState<Product | null>(null)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}:${slug}`)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted cart after hydration
      if (saved) setState(restore(saved))
    } catch {
      // Storage can be unavailable (private mode); keep the default state.
    }
    setHydrated(true)
  }, [slug])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(`${STORAGE_KEY}:${slug}`, JSON.stringify(state))
    } catch {
      // Ignore write failures; the cart still works for this session.
    }
  }, [state, hydrated, slug])

  const addToCart = React.useCallback(
    (product: Product, choice?: Choice, quantity = 1) => {
      const picked = choice ?? defaultChoice(product, sizeKind)
      const key = lineKey({ productId: product.id, ...picked })
      setState((s) => {
        const existing = s.cart.find((l) => lineKey(l) === key)
        const cart = existing
          ? s.cart.map((l) => (l === existing ? { ...l, quantity: l.quantity + quantity } : l))
          : [...s.cart, { productId: product.id, ...picked, quantity }]
        return { ...s, cart }
      })
      toast.success(`បានបន្ថែម «${product.name}» ទៅក្នុងកាបូប`)
    },
    [sizeKind]
  )

  const updateQuantity = React.useCallback((key: string, delta: number) => {
    setState((s) => ({
      ...s,
      cart: s.cart
        .map((l) => (lineKey(l) === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    }))
  }, [])

  const removeFromCart = React.useCallback((key: string) => {
    setState((s) => ({ ...s, cart: s.cart.filter((l) => lineKey(l) !== key) }))
  }, [])

  const toggleWishlist = React.useCallback(
    (product: Product) => {
      const has = state.wishlist.includes(product.id)
      toast(has ? "បានដកចេញពីបញ្ជីប្រាថ្នា" : "បានរក្សាទុកក្នុងបញ្ជីប្រាថ្នា")
      setState((s) => ({
        ...s,
        wishlist: has
          ? s.wishlist.filter((id) => id !== product.id)
          : [...s.wishlist, product.id],
      }))
    },
    [state.wishlist]
  )

  const value = React.useMemo<ShopContextValue>(() => {
    const getProduct = (id: string) => products.find((p) => p.id === id)
    const lines = state.cart
      .map((l) => ({ ...l, product: getProduct(l.productId) }))
      .filter((l) => l.product)
    const cartCount = lines.reduce((n, l) => n + l.quantity, 0)
    const cartTotal = lines.reduce((n, l) => n + l.quantity * l.product!.price, 0)

    const message = [
      `សំណើបញ្ជាទិញពី ${shopName}៖`,
      ...lines.map((l) => {
        const details = [describeChoice(l), `ចំនួន៖ ${kh(l.quantity)}`].filter(Boolean).join(", ")
        return `- ${l.product!.name} (${details}) — ${formatPrice(l.product!.price * l.quantity)}`
      }),
      `សរុប៖ ${formatPrice(cartTotal)}`,
      "ការដឹកជញ្ជូន៖ ឥតគិតថ្លៃ",
      "សូមបញ្ជាក់ពីស្តុក និងកាលបរិច្ឆេទដឹកជញ្ជូន។",
    ].join("\n")

    return {
      ...state,
      products,
      getProduct,
      shopName,
      telegram,
      slug,
      sizeKind,
      categories,
      href: (path?: string) => shopHref(slug, path),
      cartCount,
      cartTotal,
      cartOpen,
      setCartOpen,
      quickView,
      openQuickView: setQuickView,
      closeQuickView: () => setQuickView(null),
      addToCart,
      updateQuantity,
      removeFromCart,
      toggleWishlist,
      isWishlisted: (id) => state.wishlist.includes(id),
      checkoutUrl: telegramUrl(telegram, message),
    }
  }, [state, products, shopName, telegram, slug, sizeKind, categories, cartOpen, quickView, addToCart, updateQuantity, removeFromCart, toggleWishlist])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = React.useContext(ShopContext)
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>")
  return ctx
}

export function productOrderMessage(
  shopName: string,
  product: Product,
  choice: Choice,
  quantity: number
) {
  return [
    `សួស្តី ${shopName}! ខ្ញុំចង់បញ្ជាទិញ៖`,
    `- ${product.name}`,
    choice.size && `- ទំហំ៖ ${choice.size}`,
    choice.color && `- ពណ៌៖ ${choice.color}`,
    `- ចំនួន៖ ${kh(quantity)}`,
    `- តម្លៃរាយ៖ ${formatPrice(product.price)}`,
    `សរុប៖ ${formatPrice(product.price * quantity)}`,
  ]
    .filter(Boolean)
    .join("\n")
}
