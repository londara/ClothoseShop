import Link from "next/link"
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  PackagePlus,
  Settings,
  UserPlus,
} from "lucide-react"

import { PageHeader } from "@/components/admin/page-header"
import Image from "@/components/shop/smart-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ApiProductListItem } from "@/lib/api"
import { adminRead, requireAdmin } from "@/lib/auth"
import { formatPrice, kh } from "@/lib/site"

type Dashboard = {
  totalProducts: number
  totalStock: number
  stockValue: number
  lowStock: { id: string; name: string; stock: number }[]
  recentProducts: ApiProductListItem[]
  pendingStaff: number
}

export default async function AdminDashboard() {
  const { user: me } = await requireAdmin()
  const { data } = await adminRead<Dashboard>("/api/v1/admin/dashboard")
  const { lowStock, pendingStaff: pending } = data
  const products = data.recentProducts.map((p) => ({ ...p, price: Number(p.price) }))

  const stats = [
    { label: "ផលិតផលសរុប", value: kh(data.totalProducts), icon: Package },
    { label: "ចំនួនស្តុកសរុប", value: kh(data.totalStock), icon: Boxes },
    { label: "តម្លៃស្តុកសរុប", value: formatPrice(Number(data.stockValue)), icon: DollarSign },
    { label: "ស្តុកជិតអស់", value: kh(lowStock.length), icon: AlertTriangle },
  ]

  return (
    <>
      <PageHeader title={`សួស្តី ${me.name}!`} description="ទិដ្ឋភាពទូទៅនៃហាងរបស់អ្នក">
        <Button
          nativeButton={false}
          render={<Link href="/admin/products/new" />}
          className="h-10 rounded-full px-5 font-bold"
        >
          <PackagePlus className="size-4" />
          បន្ថែមផលិតផល
        </Button>
      </PageHeader>

      {pending > 0 && (
        <Link
          href="/admin/staff"
          className="mb-4 flex items-center gap-3 rounded-3xl border border-gold/30 bg-gold-soft/60 px-5 py-3 text-sm text-on-gold-soft transition-colors hover:bg-gold-soft"
        >
          <UserPlus className="size-4" />
          មានគណនីបុគ្គលិកថ្មី {kh(pending)} កំពុងរង់ចាំការអនុម័តរបស់អ្នក
          <span className="ml-auto font-bold underline underline-offset-4">ពិនិត្យ</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-3xl">
            <CardContent className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-on-gold-soft">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-bold">ផលិតផលថ្មីៗ</CardTitle>
            <Link href="/admin/products" className="text-xs text-gold underline underline-offset-4">
              មើលទាំងអស់
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {products.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}/edit`}
                className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface-low"
              >
                <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                  {p.image && (
                    <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">ស្តុក៖ {kh(p.stock)}</span>
                </span>
                <span className="text-sm font-bold">{formatPrice(p.price)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-bold">ស្តុកជិតអស់</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {lowStock.length === 0 ? (
                <p className="text-muted-foreground">ផលិតផលទាំងអស់មានស្តុកគ្រប់គ្រាន់ ✨</p>
              ) : (
                lowStock.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/products/${p.id}/edit`}
                    className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-surface-low"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 text-xs font-bold text-destructive">
                      {kh(p.stock)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
          {me.role === "owner" && (
            <Card className="rounded-3xl">
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  ប្តូរឈ្មោះហាង ផ្ទៃខាងក្រោយ អំពីខ្ញុំ និងប្រវត្តិរូបរបស់អ្នក។
                </p>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/admin/settings" />}
                  className="h-10 rounded-full font-bold"
                >
                  <Settings className="size-4" />
                  ទៅកាន់ការកំណត់
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
