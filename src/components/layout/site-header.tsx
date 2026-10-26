"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BadgeCheck, Heart, Menu, ShoppingBag, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SearchDialog } from "@/components/shop/search-dialog"
import { useShop } from "@/components/shop/shop-provider"
import { BrandMark } from "@/components/layout/brand-mark"
import { navLinks, kh } from "@/lib/site"
import { cn } from "@/lib/utils"

function CountBadge({ value, tone }: { value: number; tone: "gold" | "dark" }) {
  if (value <= 0) return null
  return (
    <span
      className={cn(
        "absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full text-[9px] leading-none font-bold",
        tone === "gold" ? "bg-gold text-white" : "bg-primary text-primary-foreground"
      )}
    >
      {kh(value)}
    </span>
  )
}

const navStyles = {
  desktop: {
    base: "text-sm font-bold text-muted-foreground transition-colors duration-200 hover:text-foreground",
    active: "text-primary",
  },
  mobile: {
    base: "rounded-2xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground",
    active: "font-bold text-foreground",
  },
}

function NavItems({
  variant,
  pathname,
}: {
  variant: keyof typeof navStyles
  pathname?: string
}) {
  const styles = navStyles[variant]
  const { href } = useShop()
  return navLinks.map((link) => (
    <Link
      key={link.label}
      href={href(link.href)}
      className={cn(
        styles.base,
        pathname && !link.match.includes("#") && pathname.startsWith(href(link.match)) && styles.active
      )}
    >
      {link.label}
    </Link>
  ))
}

function ActiveNavItems({ variant }: { variant: keyof typeof navStyles }) {
  return <NavItems variant={variant} pathname={usePathname()} />
}

/**
 * The pathname is request data, so the active highlight streams in behind a
 * Suspense boundary while the static shell shows the plain links.
 */
function HeaderNav({ variant }: { variant: keyof typeof navStyles }) {
  return (
    <Suspense fallback={<NavItems variant={variant} />}>
      <ActiveNavItems variant={variant} />
    </Suspense>
  )
}

export function SiteHeader({ announcement }: { announcement: string }) {
  const { cartCount, wishlist, setCartOpen, shopName, href } = useShop()

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-col">
      <aside
        aria-label="សេចក្តីប្រកាស"
        className="flex w-full items-center justify-center bg-primary px-4 py-1.5 text-primary-foreground md:px-6"
      >
        <p className="flex items-center gap-2 text-center text-[11px] leading-5 sm:text-xs">
          <BadgeCheck className="size-3.5 shrink-0 text-gold-soft" />
          <span className="line-clamp-1">{announcement}</span>
        </p>
      </aside>

      <header className="glass w-full border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="flex h-20 w-full items-center justify-between gap-5 px-5 md:px-12">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="rounded-full md:hidden"
                    aria-label="បើកម៉ឺនុយ"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-background">
                <SheetHeader className="border-b border-outline-variant/30 p-5">
                  <SheetTitle>
                    <BrandMark name={shopName} />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-3">
                  <HeaderNav variant="mobile" />
                </nav>
              </SheetContent>
            </Sheet>
            <Link href={href()} className="group focus:outline-none">
              <BrandMark name={shopName} />
            </Link>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <HeaderNav variant="desktop" />
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <SearchDialog />
            <Button
              variant="ghost"
              size="icon-lg"
              className="relative hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
              aria-label="បញ្ជីប្រាថ្នា"
              nativeButton={false}
              render={<Link href={href("/catalogue")} />}
            >
              <Heart className="size-[20px]" />
              <CountBadge value={wishlist.length} tone="gold" />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              className="relative rounded-full text-muted-foreground hover:text-foreground"
              aria-label="កាបូបទិញទំនិញ"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-[20px]" />
              <CountBadge value={cartCount} tone="dark" />
            </Button>
            <Link
              href="/admin"
              aria-label="គណនីរបស់ខ្ញុំ"
              className="ml-1 hidden size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 sm:flex"
            >
              <User className="size-4" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  )
}
