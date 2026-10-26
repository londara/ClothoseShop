import type { Metadata } from "next"

import { CreateStaffDialog } from "@/components/admin/create-staff-dialog"
import { PageHeader } from "@/components/admin/page-header"
import { StaffTable } from "@/components/admin/staff-table"
import { requireOwner, requireShopAdmin } from "@/lib/auth"
import { kh } from "@/lib/site"
import { toPublicUser } from "@/lib/store"

export const metadata: Metadata = { title: "បុគ្គលិក" }

export default async function StaffPage() {
  await requireOwner()
  const { me, shop, data } = await requireShopAdmin()
  const users = data.users.filter((u) => u.shopId === shop.id)
  const pending = users.filter((u) => u.status === "pending").length

  // Pending accounts first, then everyone else by name.
  const sorted = [...users].sort(
    (a, b) =>
      Number(b.status === "pending") - Number(a.status === "pending") ||
      a.name.localeCompare(b.name)
  )

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
      <StaffTable users={sorted.map(toPublicUser)} currentUserId={me.id} />
    </>
  )
}
