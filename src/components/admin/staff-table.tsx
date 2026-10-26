"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Ban, Check, Mail, Phone, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteStaff, setStaffStatus, type ActionState } from "@/app/admin/actions"
import { ProfileAvatar } from "@/components/admin/admin-shell"
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
import type { PublicUser, UserStatus } from "@/lib/store"
import { cn } from "@/lib/utils"

const statusStyles: Record<UserStatus, { label: string; className: string }> = {
  active: { label: "សកម្ម", className: "bg-emerald-100 text-emerald-800" },
  pending: { label: "រង់ចាំអនុម័ត", className: "bg-gold-soft text-on-gold-soft" },
  disabled: { label: "បានផ្អាក", className: "bg-destructive/10 text-destructive" },
}

function useStaffAction() {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const run = (action: () => Promise<ActionState>) =>
    startTransition(async () => {
      const result = await action()
      if (result.error) toast.error(result.error)
      else if (result.message) toast.success(result.message)
      router.refresh()
    })
  return { pending, run }
}

function StaffRow({ user, isMe }: { user: PublicUser; isMe: boolean }) {
  const { pending, run } = useStaffAction()
  const status = statusStyles[user.status]
  const locked = isMe || user.role === "owner"

  return (
    <li className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-card p-5 shadow-sm md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ProfileAvatar profile={user} className="size-12" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            {user.name}
            {user.role === "owner" && (
              <span className="rounded-full bg-primary px-2 text-[11px] text-primary-foreground">
                ម្ចាស់ហាង
              </span>
            )}
            {isMe && <span className="text-xs font-normal text-muted-foreground">(អ្នក)</span>}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {user.email && (
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" />
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" />
                {user.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold", status.className)}>
          {status.label}
        </span>
        {!locked && (
          <>
            {user.status !== "active" && (
              <Button
                size="sm"
                disabled={pending}
                className="h-8 rounded-full px-3"
                onClick={() => run(() => setStaffStatus(user.id, "active"))}
              >
                {user.status === "pending" ? <Check className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                {user.status === "pending" ? "អនុម័ត" : "បើកឡើងវិញ"}
              </Button>
            )}
            {user.status !== "disabled" && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                className="h-8 rounded-full px-3"
                onClick={() => run(() => setStaffStatus(user.id, "disabled"))}
              >
                <Ban className="size-3.5" />
                {user.status === "pending" ? "បដិសេធ" : "ផ្អាក"}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full text-destructive hover:bg-destructive/10"
                    aria-label={`លុប ${user.name}`}
                  />
                }
              >
                <Trash2 className="size-4" />
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>លុបគណនីនេះមែនទេ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    គណនីរបស់ «{user.name}» នឹងត្រូវលុបជាអចិន្ត្រៃយ៍ ហើយមិនអាចចូលប្រើបានទៀតទេ។
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">បោះបង់</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="rounded-full"
                    disabled={pending}
                    onClick={() => run(() => deleteStaff(user.id))}
                  >
                    លុប
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

export function StaffTable({
  users,
  currentUserId,
}: {
  users: PublicUser[]
  currentUserId: string
}) {
  return (
    <ul className="flex flex-col gap-3">
      {users.map((user) => (
        <StaffRow key={user.id} user={user} isMe={user.id === currentUserId} />
      ))}
    </ul>
  )
}
