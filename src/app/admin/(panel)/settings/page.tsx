import type { Metadata } from "next"

import { PageHeader } from "@/components/admin/page-header"
import { SettingsTabs, type SettingsTab } from "@/components/admin/settings-forms"
import { authed, requireOwner } from "@/lib/auth"
import type { Settings } from "@/lib/settings"

export const metadata: Metadata = { title: "ការកំណត់" }

const TABS: SettingsTab[] = ["shop", "profile", "security"]

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const [{ user }, { tab }] = await Promise.all([requireOwner(), searchParams])
  const { data: settings } = await authed<Settings>("/api/v1/admin/settings")
  const { name, title, email, phone, avatar } = user
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
