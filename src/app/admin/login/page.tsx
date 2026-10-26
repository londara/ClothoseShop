import type { Metadata } from "next"

import { AuthCard } from "@/components/admin/auth-card"
import { LoginForm } from "@/components/admin/login-form"

export const metadata: Metadata = { title: "ចូលប្រព័ន្ធគ្រប់គ្រង" }

export default function LoginPage() {
  return (
    <AuthCard title="ចូលប្រព័ន្ធគ្រប់គ្រង">
      <LoginForm />
    </AuthCard>
  )
}
