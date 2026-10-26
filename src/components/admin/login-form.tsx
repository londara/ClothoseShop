"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Loader2, LogIn } from "lucide-react"

import { login, type ActionState } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {})

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="identifier">អ៊ីមែល ឬលេខទូរស័ព្ទ</Label>
        <Input
          id="identifier"
          name="identifier"
          required
          autoFocus
          autoComplete="username"
          placeholder="name@example.com ឬ 012 345 678"
          className="h-11 rounded-full px-5"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">ពាក្យសម្ងាត់</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-full px-5"
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-11 rounded-full font-bold">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        ចូល
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        មិនទាន់មានគណនី? សូមស្នើម្ចាស់ហាងឲ្យបង្កើតគណនីបុគ្គលិកសម្រាប់អ្នក។
      </p>
      <Link href="/" className="text-center text-xs text-muted-foreground hover:text-foreground">
        ត្រឡប់ទៅហាង
      </Link>
    </form>
  )
}
