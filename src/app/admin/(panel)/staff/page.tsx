import type { Metadata } from "next"

import { CreateStaffDialog } from "@/components/admin/create-staff-dialog"
import { PageHeader } from "@/components/admin/page-header"
import { StaffTable } from "@/components/admin/staff-table"
import { adminRead, requireOwner } from "@/lib/auth"
import { toStaffUser, type ApiStaff } from "@/lib/mappers"
import { kh } from "@/lib/site"

export const metadata: Metadata = { title: "បុគ្គលិក" }

export default async function StaffPage() {
  const { user: me } = await requireOwner()
  // Only this shop's accounts, pending first (sorted by the API).
  const { data } = await adminRead<ApiStaff[]>("/api/v1/admin/staff")
  const users = data.map(toStaffUser)
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
