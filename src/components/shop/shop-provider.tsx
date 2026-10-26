"use client"

import * as React from "react"
import { toast } from "sonner"

import type { Product, Size } from "@/lib/products"
import { shopHref } from "@/lib/platform"
import { formatPrice, kh, telegramUrl } from "@/lib/site"

export type CartLine = {
  productId: string
  size: Size
  quantity: number
}

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
  /** Shop-relative path ("/catalogue", "/#about") → "/{slug}/..." */
  href: (path?: string) => string
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  quickView: Product | null
  openQuickView: (product: Product) => void
  closeQuickView: () => void
  addToCart: (product: Product, size?: Size, quantity?: number) => void
  updateQuantity: (productId: string, size: Size, delta: number) => void
  removeFromCart: (productId: string, size: Size) => void
  toggleWishlist: (product: Product) => void
  isWishlisted: (productId: string) => boolean
  checkoutUrl: string
}

const STORAGE_KEY = "aura-shop"

const initialState: ShopState = { cart: [], wishlist: [] }

const ShopContext = React.createContext<ShopContextValue | null>(null)

export function ShopProvider({
  children,
  products,
  shopName,
  telegram,
  slug,
}: {
  children: React.ReactNode
  products: Product[]
  shopName: string
  telegram: string
  slug: string
}) {
  const [state, setState] = React.useState<ShopState>(initialState)
  const [hydrated, setHydrated] = React.useState(false)
  const [cartOpen, setCartOpen] = React.useState(false)
  const [quickView, setQuickView] = React.useState<Product | null>(null)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}:${slug}`)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted cart after hydration
      if (saved) setState(JSON.parse(saved) as ShopState)
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
    (product: Product, size: Size = "M", quantity = 1) => {
      setState((s) => {
        const existing = s.cart.find(
          (l) => l.productId === product.id && l.size === size
        )
        const cart = existing
          ? s.cart.map((l) =>
              l === existing ? { ...l, quantity: l.quantity + quantity } : l
            )
          : [...s.cart, { productId: product.id, size, quantity }]
        return { ...s, cart }
      })
      toast.success(`បានបន្ថែម «${product.name}» ទៅក្នុងកាបូប`)
    },
    []
  )

  const updateQuantity = React.useCallback(
    (productId: string, size: Size, delta: number) => {
      setState((s) => ({
        ...s,
        cart: s.cart
          .map((l) =>
            l.productId === productId && l.size === size
              ? { ...l, quantity: l.quantity + delta }
              : l
          )
          .filter((l) => l.quantity > 0),
      }))
    },
    []
  )

  const removeFromCart = React.useCallback((productId: string, size: Size) => {
    setState((s) => ({
      ...s,
      cart: s.cart.filter((l) => !(l.productId === productId && l.size === size)),
    }))
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
      ...lines.map(
        (l) =>
          `- ${l.product!.name} (ទំហំ៖ ${l.size}, ចំនួន៖ ${kh(l.quantity)}) — ${formatPrice(l.product!.price * l.quantity)}`
      ),
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
  }, [state, products, shopName, telegram, slug, cartOpen, quickView, addToCart, updateQuantity, removeFromCart, toggleWishlist])

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
  size: Size,
  quantity: number
) {
  return [
    `សួស្តី ${shopName}! ខ្ញុំចង់បញ្ជាទិញ៖`,
    `- ${product.name}`,
    `- ទំហំ៖ ${size}`,
    `- ចំនួន៖ ${kh(quantity)}`,
    `- តម្លៃរាយ៖ ${formatPrice(product.price)}`,
    `សរុប៖ ${formatPrice(product.price * quantity)}`,
  ].join("\n")
}
