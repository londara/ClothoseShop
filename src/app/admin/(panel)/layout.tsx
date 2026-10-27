import type { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdmin } from "@/lib/auth"

export const metadata: Metadata = {
  title: { default: "ផ្ទាំងគ្រប់គ្រង", template: "%s | ផ្ទាំងគ្រប់គ្រង" },
  robots: { index: false, follow: false },
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, shop, counts } = await requireAdmin()
  return (
    <AdminShell
      profile={{ name: user.name, title: user.title, avatar: user.avatar }}
      isOwner={user.role === "owner"}
      isPlatformAdmin={user.platformAdmin}
      pendingCount={counts.pendingStaff}
      pendingShops={counts.pendingShops}
      shop={{ name: shop.name, slug: shop.slug, status: shop.status }}
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
