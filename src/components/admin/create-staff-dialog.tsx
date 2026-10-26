"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { createStaff } from "@/app/admin/actions"
import { useFormAction } from "@/components/admin/use-form-action"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const inputClass = "h-11 rounded-2xl bg-surface-low px-4"

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="font-bold">
        {label}
      </Label>
      {children}
    </div>
  )
}

function CreateStaffForm({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const { state, pending, onSubmit } = useFormAction(createStaff)

  React.useEffect(() => {
    if (!state.ok) return
    toast.success(state.message)
    router.refresh()
    onDone()
  }, [state, router, onDone])

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ឈ្មោះ *" htmlFor="staff-name">
          <Input id="staff-name" name="name" required autoFocus className={inputClass} />
        </Field>
        <Field label="តួនាទី" htmlFor="staff-title">
          <Input id="staff-title" name="title" placeholder="បុគ្គលិកលក់" className={inputClass} />
        </Field>
        <Field label="អ៊ីមែល" htmlFor="staff-email">
          <Input id="staff-email" name="email" type="email" placeholder="name@example.com" className={inputClass} />
        </Field>
        <Field label="លេខទូរស័ព្ទ" htmlFor="staff-phone">
          <Input id="staff-phone" name="phone" type="tel" placeholder="012 345 678" className={inputClass} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        បញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទយ៉ាងហោចណាស់មួយ — បុគ្គលិកនឹងប្រើវាដើម្បីចូល។
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ពាក្យសម្ងាត់ *" htmlFor="staff-password">
          <Input
            id="staff-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label="បញ្ជាក់ពាក្យសម្ងាត់ *" htmlFor="staff-confirm">
          <Input
            id="staff-confirm"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
      </div>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-11 rounded-full font-bold">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        បង្កើតគណនី
      </Button>
    </form>
  )
}

export function CreateStaffDialog() {
  const [open, setOpen] = React.useState(false)
  const close = React.useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-10 rounded-full px-5 font-bold" />}>
        <UserPlus className="size-4" />
        បង្កើតគណនីបុគ្គលិក
      </DialogTrigger>
      <DialogContent className="no-scrollbar max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-lg">
        <DialogTitle className="text-xl font-bold">បង្កើតគណនីបុគ្គលិក</DialogTitle>
        <DialogDescription>
          គណនីអាចប្រើបានភ្លាមៗ។ ប្រាប់ពាក្យសម្ងាត់ដល់បុគ្គលិក ហើយឲ្យពួកគេប្តូរវានៅពេលចូលលើកដំបូង។
        </DialogDescription>
        {/* Remount the form each time so a reopened dialog starts empty. */}
        {open && <CreateStaffForm onDone={close} />}
      </DialogContent>
    </Dialog>
  )
}
