import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { SettingsTabs, type SettingsTab } from "@/components/admin/settings-forms"
import { requireOwner, requireShopAdmin } from "@/lib/auth"
import { toPublicUser } from "@/lib/store"

export const metadata: Metadata = { title: "ការកំណត់" }

const TABS: SettingsTab[] = ["shop", "profile", "security"]

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireOwner()
  const [{ me, shop }, { tab }] = await Promise.all([requireShopAdmin(), searchParams])
  const { settings } = shop
  const { name, title, email, phone, avatar } = toPublicUser(me)
  const initialTab = TABS.find((t) => t === tab) ?? "shop"

  return (
    <>
      <PageHeader
        title="ការកំណត់"
        description="គ្រប់គ្រងព័ត៌មានហាង និងប្រវត្តិរូបរបស់អ្នក"
      />
      <SettingsTabs
        settings={settings}
        profile={{ name, title, email, phone, avatar }}
        initialTab={initialTab}
      />
    </>
  )
}
