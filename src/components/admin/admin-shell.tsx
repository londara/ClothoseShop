"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Settings,
  Store,
  Users,
} from "lucide-react"

import { logout } from "@/app/admin/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { kh } from "@/lib/site"
import type { ShopStatus } from "@/lib/store"
import { cn } from "@/lib/utils"

type Access = "all" | "owner" | "platform"

const nav: { href: string; label: string; icon: typeof Store; exact: boolean; access: Access }[] = [
  { href: "/admin", label: "ផ្ទាំងគ្រប់គ្រង", icon: LayoutDashboard, exact: true, access: "all" },
  { href: "/admin/products", label: "ផលិតផលទាំងអស់", icon: Package, exact: true, access: "all" },
  { href: "/admin/products/new", label: "បន្ថែមផលិតផល", icon: PackagePlus, exact: true, access: "all" },
  { href: "/admin/staff", label: "បុគ្គលិក", icon: Users, exact: false, access: "owner" },
  { href: "/admin/settings", label: "ការកំណត់", icon: Settings, exact: false, access: "owner" },
  { href: "/admin/shops", label: "ហាងទាំងអស់", icon: Store, exact: false, access: "platform" },
]

type ShellAccess = {
  isOwner: boolean
  isPlatformAdmin: boolean
  /** Staff accounts in this shop waiting for approval. */
  pendingCount: number
  /** Shops on the platform waiting for approval (platform admins only). */
  pendingShops: number
}

type ShellShop = { name: string; slug: string; status: ShopStatus }
type ShellProfile = { name: string; title: string; avatar: string }

function NavLinks({
  onNavigate,
  isOwner,
  isPlatformAdmin,
  pendingCount,
  pendingShops,
}: ShellAccess & { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href || (href === "/admin/products" && /^\/admin\/products\/[^/]+\/edit$/.test(pathname))
      : pathname.startsWith(href)
  const allowed = (access: Access) =>
    access === "all" || (access === "owner" && isOwner) || (access === "platform" && isPlatformAdmin)
  const badge = (href: string) =>
    href === "/admin/staff" ? pendingCount : href === "/admin/shops" ? pendingShops : 0

  return (
    <nav className="flex flex-col gap-1">
      {nav
        .filter((item) => allowed(item.access))
        .map(({ href, label, icon: Icon, exact, access }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-colors",
              access === "platform" && "mt-3",
              isActive(href, exact)
                ? "bg-primary font-bold text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
            {badge(href) > 0 && (
              <span className="ml-auto rounded-full bg-gold px-2 text-[11px] font-bold text-white">
                {kh(badge(href))}
              </span>
            )}
          </Link>
        ))}
    </nav>
  )
}

export function ProfileAvatar({
  profile,
  className,
}: {
  profile: Pick<ShellProfile, "name" | "avatar">
  className?: string
}) {
  return (
    <Avatar className={className}>
      {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name} />}
      <AvatarFallback className="bg-gold-soft font-bold text-on-gold-soft">
        {Array.from(profile.name)[0]}
      </AvatarFallback>
    </Avatar>
  )
}

function ProfileChip({ profile }: { profile: ShellProfile }) {
  return (
    <>
      <span className="text-right leading-tight">
        <span className="block text-sm font-bold">{profile.name}</span>
        <span className="text-[11px] text-muted-foreground">{profile.title}</span>
      </span>
      <ProfileAvatar profile={profile} className="size-9" />
    </>
  )
}

function Sidebar({
  shop,
  onNavigate,
  ...access
}: ShellAccess & { shop: ShellShop; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/admin" className="flex items-center gap-2.5 px-2 pt-2" onClick={onNavigate}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
          {Array.from(shop.name)[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-bold">{shop.name}</span>
          <span className="block truncate text-xs text-muted-foreground">/{shop.slug}</span>
        </span>
      </Link>
      <NavLinks onNavigate={onNavigate} {...access} />
      <div className="mt-auto flex flex-col gap-1">
        <Link
          href={`/${shop.slug}`}
          target="_blank"
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-surface-high hover:text-foreground"
        >
          <ExternalLink className="size-4" />
          មើលហាងរបស់ខ្ញុំ
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            ចាកចេញ
          </button>
        </form>
      </div>
    </div>
  )
}

export function AdminShell({
  children,
  profile,
  shop,
  ...access
}: ShellAccess & {
  children: React.ReactNode
  profile: ShellProfile
  shop: ShellShop
}) {
  return (
    <div className="flex min-h-screen flex-1 bg-surface-low">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-outline-variant/30 bg-card lg:block">
        <Sidebar shop={shop} {...access} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-outline-variant/30 px-4 md:px-8">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-lg" className="rounded-full lg:hidden" aria-label="បើកម៉ឺនុយ" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-card p-0">
              <SheetTitle className="sr-only">ម៉ឺនុយគ្រប់គ្រង</SheetTitle>
              <Sidebar shop={shop} {...access} />
            </SheetContent>
          </Sheet>
          <span className="hidden text-sm text-muted-foreground lg:block">
            សូមស្វាគមន៍ត្រឡប់មកវិញ 👋
          </span>
          {access.isOwner ? (
            <Link
              href="/admin/settings?tab=profile"
              className="flex items-center gap-3 rounded-full py-1 pr-1 pl-3 transition-colors hover:bg-surface-high"
            >
              <ProfileChip profile={profile} />
            </Link>
          ) : (
            <div className="flex items-center gap-3 py-1 pr-1 pl-3">
              <ProfileChip profile={profile} />
            </div>
          )}
        </header>
        {shop.status === "pending" && (
          <div className="flex items-center gap-3 border-b border-gold/30 bg-gold-soft/60 px-4 py-2.5 text-sm text-on-gold-soft md:px-8">
            <Clock className="size-4 shrink-0" />
            ហាងរបស់អ្នកកំពុងរង់ចាំការអនុម័ត។ អ្នកអាចរៀបចំផលិតផល និងការកំណត់បានរួចហើយ —
            ហាងនឹងបង្ហាញជាសាធារណៈនៅពេលត្រូវបានអនុម័ត។
          </div>
        )}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
