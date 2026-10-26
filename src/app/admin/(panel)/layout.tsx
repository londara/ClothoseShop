import type { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import { requireShopAdmin } from "@/lib/auth"

export const metadata: Metadata = {
  title: { default: "ផ្ទាំងគ្រប់គ្រង", template: "%s | ផ្ទាំងគ្រប់គ្រង" },
  robots: { index: false, follow: false },
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const { me, shop, data } = await requireShopAdmin()
  return (
    <AdminShell
      profile={{ name: me.name, title: me.title, avatar: me.avatar }}
      isOwner={me.role === "owner"}
      isPlatformAdmin={!!me.platformAdmin}
      pendingCount={data.users.filter((u) => u.shopId === shop.id && u.status === "pending").length}
      pendingShops={me.platformAdmin ? data.shops.filter((s) => s.status === "pending").length : 0}
      shop={{ name: shop.settings.shopName, slug: shop.slug, status: shop.status }}
    >
      {children}
    </AdminShell>
  )
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  )
}
