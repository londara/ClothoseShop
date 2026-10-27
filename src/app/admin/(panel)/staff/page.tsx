import type { Metadata } from "next"

import { CreateStaffDialog } from "@/components/admin/create-staff-dialog"
import { PageHeader } from "@/components/admin/page-header"
import { StaffTable } from "@/components/admin/staff-table"
import type { ApiUser } from "@/lib/api"
import { adminRead, requireOwner } from "@/lib/auth"
import { kh } from "@/lib/site"
import type { PublicUser, UserStatus } from "@/lib/types"

export const metadata: Metadata = { title: "បុគ្គលិក" }

type ApiStaff = Omit<ApiUser, "isPlatformAdmin"> & { status: UserStatus; isMe: boolean }

export default async function StaffPage() {
  const { user: me } = await requireOwner()
  // Only this shop's accounts, pending first (sorted by the API).
  const { data } = await adminRead<ApiStaff[]>("/api/v1/admin/staff")
  const users: PublicUser[] = data.map((u) => ({
    id: u.id,
    name: u.name,
    title: u.title ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    avatar: u.avatar ?? "",
    role: u.role,
    status: u.status,
  }))
  const pending = users.filter((u) => u.status === "pending").length

  return (
    <>
      <PageHeader
        title="បុគ្គលិក"
        description={
          pending > 0
            ? `មានគណនី ${kh(pending)} កំពុងរង់ចាំការអនុម័ត`
            : "បង្កើត ផ្អាក ឬលុបគណនីបុគ្គលិក"
        }
      >
        <CreateStaffDialog />
      </PageHeader>
      <StaffTable users={users} currentUserId={me.id} />
    </>
  )
}
