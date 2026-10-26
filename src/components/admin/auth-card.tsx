import { Suspense } from "react"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { PLATFORM_NAME } from "@/lib/platform"

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/admin")
  return null
}

/** Centered card for the login page. */
export async function AuthCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  const shopName = PLATFORM_NAME

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-low px-5 py-16">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm rounded-3xl border border-outline-variant/30 bg-card p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {Array.from(shopName)[0]?.toUpperCase()}
          </span>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description ?? shopName}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
