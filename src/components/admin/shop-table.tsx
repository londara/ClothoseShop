"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Ban, Check, ExternalLink, Mail, Package, Phone, RotateCcw, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { deleteShop, setShopStatus, type ActionState } from "@/app/admin/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { kh } from "@/lib/site"
import type { ShopStatus } from "@/lib/store"
import { cn } from "@/lib/utils"

export type ShopRow = {
  id: string
  slug: string
  name: string
  status: ShopStatus
  /** Shop type label (from Admin → ប្រភេទហាង). */
  specialty: string
  products: number
  staff: number
  owner: { name: string; email: string; phone: string } | null
  createdAt: string | null
  isMine: boolean
}

const statusStyles: Record<ShopStatus, { label: string; className: string }> = {
  active: { label: "សកម្ម", className: "bg-emerald-100 text-emerald-800" },
  pending: { label: "រង់ចាំអនុម័ត", className: "bg-gold-soft text-on-gold-soft" },
  suspended: { label: "បានផ្អាក", className: "bg-destructive/10 text-destructive" },
}

function ShopCard({ shop }: { shop: ShopRow }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const run = (action: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await action()
      if (result.error) toast.error(result.error)
      else if (result.message) toast.success(result.message)
      router.refresh()
    })
  const status = statusStyles[shop.status]

  return (
    <li className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-card p-5 shadow-sm lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          {Array.from(shop.name)[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            {shop.name}
            <span className="text-xs font-normal text-muted-foreground">/{shop.slug}</span>
            {shop.isMine && (
              <span className="rounded-full bg-primary px-2 text-[11px] text-primary-foreground">
                ហាងរបស់អ្នក
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{shop.specialty}</span>
            <span className="flex items-center gap-1">
              <Package className="size-3.5" />
              ផលិតផល {kh(shop.products)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              គណនី {kh(shop.staff)}
            </span>
          </div>
          {shop.owner && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">ម្ចាស់៖ {shop.owner.name}</span>
              {shop.owner.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {shop.owner.email}
                </span>
              )}
              {shop.owner.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {shop.owner.phone}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold", status.className)}>
          {status.label}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-full px-3"
          nativeButton={false}
          render={<Link href={`/${shop.slug}`} target="_blank" />}
        >
          <ExternalLink className="size-3.5" />
          មើល
        </Button>
        {!shop.isMine && (
          <>
            {shop.status !== "active" && (
              <Button
                size="sm"
                disabled={pending}
                className="h-8 rounded-full px-3"
                onClick={() => run(() => setShopStatus(shop.id, "active"))}
              >
                {shop.status === "pending" ? <Check className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                {shop.status === "pending" ? "អនុម័ត" : "បើកឡើងវិញ"}
              </Button>
            )}
            {shop.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                className="h-8 rounded-full px-3"
                onClick={() => run(() => setShopStatus(shop.id, "suspended"))}
              >
                <Ban className="size-3.5" />
                ផ្អាក
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full text-destructive hover:bg-destructive/10"
                    aria-label={`លុប ${shop.name}`}
                  />
                }
              >
                <Trash2 className="size-4" />
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>លុបហាងនេះមែនទេ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ហាង «{shop.name}» ផលិតផលទាំងអស់ និងគណនីម្ចាស់ហាង/បុគ្គលិក {kh(shop.staff)}
                    នឹងត្រូវលុបជាអចិន្ត្រៃយ៍ ហើយមិនអាចយកមកវិញបានទេ។
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">បោះបង់</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="rounded-full"
                    disabled={pending}
                    onClick={() => run(() => deleteShop(shop.id))}
                  >
                    លុបហាង
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </li>
  )
}

export function ShopTable({ shops }: { shops: ShopRow[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </ul>
  )
}
