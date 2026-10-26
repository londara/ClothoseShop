import Link from "next/link"
import { BadgeCheck, LogIn, Sparkles } from "lucide-react"

import { StartShopDialog } from "@/components/platform/start-shop-dialog"
import { Button } from "@/components/ui/button"
import { PLATFORM_NAME } from "@/lib/platform"

const links = [
  { href: "#shops", label: "ហាងទាំងអស់" },
  { href: "#featured", label: "ម៉ូដពិសេស" },
  { href: "#features", label: "មុខងារ" },
  { href: "#gateway", label: "បើកហាង" },
]

export function PlatformHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-col">
      <aside
        aria-label="សេចក្តីប្រកាស"
        className="flex w-full items-center justify-center bg-primary px-4 py-1.5 text-primary-foreground"
      >
        <p className="flex items-center gap-2 text-center text-[11px] leading-5 sm:text-xs">
          <BadgeCheck className="size-3.5 shrink-0 text-gold-soft" />
          <span className="line-clamp-1">
            ដឹកជញ្ជូនរហ័សឥតគិតថ្លៃ សម្រាប់ការបញ្ជាទិញលើស $២៥០ • កម្រងរដូវ ២០២៥ បានដាក់លក់ហើយ
          </span>
        </p>
      </aside>
      <header className="glass w-full border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="flex h-20 w-full items-center justify-between gap-5 px-5 md:px-12">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full border border-primary/80 font-serif text-base leading-none transition-transform duration-300 group-hover:scale-105">
              A
            </span>
            <span className="text-xl font-bold tracking-tight uppercase">{PLATFORM_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/admin/login" />}
              className="h-10 rounded-full px-4 text-sm font-bold"
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline">ចូល</span>
            </Button>
            <StartShopDialog className="hidden h-10 rounded-full px-5 text-sm font-bold sm:inline-flex">
              <Sparkles className="size-4" />
              បើកហាង
            </StartShopDialog>
          </div>
        </div>
      </header>
    </div>
  )
}
