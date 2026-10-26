"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, KeyRound, Loader2, Save, Store, UserRound } from "lucide-react"
import { toast } from "sonner"

import {
  changePassword,
  saveProfile,
  saveSettings,
  type ActionState,
} from "@/app/admin/actions"
import { ProfileAvatar } from "@/components/admin/admin-shell"
import { useFormAction } from "@/components/admin/use-form-action"
import Image from "@/components/shop/smart-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { backgroundPresets, type Profile, type Settings } from "@/lib/settings"
import { cn } from "@/lib/utils"

const inputClass = "h-11 rounded-2xl bg-surface-low px-4"
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif"

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="font-bold">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-outline-variant/30 bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Shows a toast for each new action result and refreshes server data on success. */
function useResultToast(state: ActionState) {
  const router = useRouter()
  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      router.refresh()
    }
    if (state.error) toast.error(state.error)
  }, [state, router])
}

function SubmitBar({ pending, label }: { pending: boolean; label: string }) {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={pending} className="h-11 rounded-full px-8 font-bold">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {label}
      </Button>
    </div>
  )
}

function useFilePreview() {
  const [preview, setPreview] = React.useState<string | null>(null)
  React.useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPreview(file ? URL.createObjectURL(file) : null)
  }
  return { preview, onChange }
}

// ── Shop settings ───────────────────────────────────────────────────────────

function ShopSettingsForm({ settings }: { settings: Settings }) {
  const { state, pending, onSubmit } = useFormAction(saveSettings)
  useResultToast(state)
  const [background, setBackground] = React.useState(settings.backgroundColor)
  const [heroUrl, setHeroUrl] = React.useState(settings.heroImage)
  const [shopName, setShopName] = React.useState(settings.shopName)
  const hero = useFilePreview()
  const heroFileRef = React.useRef<HTMLInputElement>(null)
  const heroSrc = hero.preview ?? heroUrl

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Panel title="ព័ត៌មានហាង" description="ឈ្មោះ និងទំនាក់ទំនងដែលបង្ហាញនៅលើគេហទំព័រ">
          <Field label="ឈ្មោះហាង *" htmlFor="shopName">
            <Input
              id="shopName"
              name="shopName"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="ឈ្មោះអ្នកប្រើតេឡេក្រាម" htmlFor="telegram" hint="ការបញ្ជាទិញទាំងអស់នឹងផ្ញើទៅគណនីនេះ (t.me/...)">
            <Input id="telegram" name="telegram" defaultValue={settings.telegram} placeholder="your_shop" className={inputClass} />
          </Field>
          <Field label="សេចក្តីប្រកាសលើរបារខាងលើ" htmlFor="announcement">
            <Input id="announcement" name="announcement" defaultValue={settings.announcement} className={inputClass} />
          </Field>
        </Panel>

        <Panel title="អំពីខ្ញុំ" description="បង្ហាញនៅផ្នែក «អំពីយើង» លើទំព័រដើម និងនៅខាងក្រោមគេហទំព័រ">
          <Field label="ចំណងជើង" htmlFor="aboutTitle">
            <Input id="aboutTitle" name="aboutTitle" defaultValue={settings.aboutTitle} className={inputClass} />
          </Field>
          <Field label="អត្ថបទអំពីខ្ញុំ" htmlFor="aboutMe">
            <Textarea
              id="aboutMe"
              name="aboutMe"
              rows={7}
              defaultValue={settings.aboutMe}
              className="rounded-2xl bg-surface-low px-4 py-3 leading-relaxed"
            />
          </Field>
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        <Panel title="ផ្ទៃខាងក្រោយ" description="រូបភាពធំនៅទំព័រដើម និងពណ៌ផ្ទៃខាងក្រោយរបស់គេហទំព័រ">
          <div
            className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-outline-variant/30"
            style={{ backgroundColor: background }}
          >
            {heroSrc && (
              <Image src={heroSrc} alt="" fill sizes="600px" unoptimized={!!hero.preview} className="object-cover opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-(--preview-bg) to-transparent" style={{ "--preview-bg": background } as React.CSSProperties} />
            <span className="absolute bottom-4 left-4 text-2xl font-bold drop-shadow-sm">{shopName}</span>
            <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-0.5 text-[11px] text-white">មើលជាមុន</span>
          </div>

          <Field label="រូបភាពផ្ទៃខាងក្រោយ (Hero)">
            <input type="hidden" name="heroImage" value={heroUrl} />
            <div className="flex gap-2">
              <Input
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="https://..."
                className={cn(inputClass, "flex-1 text-xs")}
                aria-label="តំណរូបភាពផ្ទៃខាងក្រោយ"
              />
              <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => heroFileRef.current?.click()}>
                <ImagePlus className="size-4" />
                ផ្ទុកឡើង
              </Button>
            </div>
            <input ref={heroFileRef} type="file" name="heroImageFile" accept={IMAGE_ACCEPT} hidden onChange={hero.onChange} />
            {hero.preview && <p className="text-xs text-gold">រូបភាពថ្មីនឹងត្រូវផ្ទុកឡើងពេលរក្សាទុក</p>}
          </Field>

          <Field label="ពណ៌ផ្ទៃខាងក្រោយ">
            <div className="flex flex-wrap items-center gap-2">
              {backgroundPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setBackground(preset.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all",
                    background.toLowerCase() === preset.value
                      ? "border-primary ring-2 ring-primary/15"
                      : "border-outline-variant/40 hover:border-primary"
                  )}
                >
                  <span className="size-4 rounded-full border border-black/10" style={{ backgroundColor: preset.value }} />
                  {preset.label}
                </button>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
                ពណ៌ផ្ទាល់ខ្លួន
              </label>
            </div>
            <input type="hidden" name="backgroundColor" value={background} />
          </Field>
        </Panel>

        <Panel title="អត្ថបទទំព័រដើម">
          <Field label="ចំណងជើងធំ" htmlFor="heroTitle">
            <Input id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} className={inputClass} />
          </Field>
          <Field label="អត្ថបទរង" htmlFor="heroSubtitle">
            <Textarea
              id="heroSubtitle"
              name="heroSubtitle"
              rows={3}
              defaultValue={settings.heroSubtitle}
              className="rounded-2xl bg-surface-low px-4 py-3 leading-relaxed"
            />
          </Field>
        </Panel>
      </div>

      <div className="xl:col-span-2">
        <SubmitBar pending={pending} label="រក្សាទុកការកំណត់ហាង" />
      </div>
    </form>
  )
}

// ── Profile ─────────────────────────────────────────────────────────────────

function ProfileForm({ profile }: { profile: Profile }) {
  const { state, pending, onSubmit } = useFormAction(saveProfile)
  useResultToast(state)
  const avatar = useFilePreview()
  const avatarRef = React.useRef<HTMLInputElement>(null)
  const [name, setName] = React.useState(profile.name)

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-6">
      <Panel title="ប្រវត្តិរូបរបស់ខ្ញុំ" description="ព័ត៌មាននេះបង្ហាញនៅផ្នែក «អំពីយើង» លើទំព័រដើម">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {avatar.preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={avatar.preview} alt="" className="size-24 rounded-full object-cover ring-4 ring-gold-soft" />
          ) : (
            <ProfileAvatar profile={{ name, avatar: profile.avatar }} className="size-24 text-3xl ring-4 ring-gold-soft" />
          )}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Button type="button" variant="outline" className="h-10 rounded-full" onClick={() => avatarRef.current?.click()}>
              <ImagePlus className="size-4" />
              ប្តូររូបប្រវត្តិរូប
            </Button>
            <input ref={avatarRef} type="file" name="avatarFile" accept={IMAGE_ACCEPT} hidden onChange={avatar.onChange} />
            {profile.avatar && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="removeAvatar" className="accent-destructive" />
                លុបរូបប្រវត្តិរូប
              </label>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="ឈ្មោះ *" htmlFor="profile-name">
            <Input id="profile-name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="តួនាទី" htmlFor="profile-title">
            <Input id="profile-title" name="title" defaultValue={profile.title} className={inputClass} />
          </Field>
          <Field label="អ៊ីមែល" htmlFor="profile-email">
            <Input id="profile-email" name="email" type="email" defaultValue={profile.email} className={inputClass} />
          </Field>
          <Field label="លេខទូរស័ព្ទ" htmlFor="profile-phone" hint="អ្នកអាចចូលដោយប្រើអ៊ីមែល ឬលេខទូរស័ព្ទនេះ">

            <Input id="profile-phone" name="phone" type="tel" defaultValue={profile.phone} className={inputClass} />
          </Field>
        </div>
      </Panel>
      <SubmitBar pending={pending} label="រក្សាទុកប្រវត្តិរូប" />
    </form>
  )
}

// ── Password ────────────────────────────────────────────────────────────────

function PasswordForm() {
  const { state, pending, onSubmit } = useFormAction(changePassword)
  useResultToast(state)
  const formRef = React.useRef<HTMLFormElement>(null)
  React.useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-6">
      <Panel title="ប្តូរពាក្យសម្ងាត់" description="ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៨ តួអក្សរ">
        <Field label="ពាក្យសម្ងាត់បច្ចុប្បន្ន" htmlFor="currentPassword">
          <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
        <Field label="ពាក្យសម្ងាត់ថ្មី" htmlFor="newPassword">
          <Input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី" htmlFor="confirmPassword">
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
      </Panel>
      <SubmitBar pending={pending} label="ប្តូរពាក្យសម្ងាត់" />
    </form>
  )
}

export type SettingsTab = "shop" | "profile" | "security"

export function SettingsTabs({
  settings,
  profile,
  initialTab,
}: {
  settings: Settings
  profile: Profile
  initialTab: SettingsTab
}) {
  const router = useRouter()
  // Controlled, because the tab can change from outside (e.g. the header's
  // profile link navigates to ?tab=profile while this page is mounted).
  const [tab, setTab] = React.useState<SettingsTab>(initialTab)
  const [syncedTab, setSyncedTab] = React.useState(initialTab)
  if (initialTab !== syncedTab) {
    setSyncedTab(initialTab)
    setTab(initialTab)
  }

  const tabs = [
    { value: "shop" as const, label: "ការកំណត់ហាង", icon: Store },
    { value: "profile" as const, label: "ប្រវត្តិរូប", icon: UserRound },
    { value: "security" as const, label: "សុវត្ថិភាព", icon: KeyRound },
  ]

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as SettingsTab)
        router.replace(`/admin/settings?tab=${value}`, { scroll: false })
      }}
      className="gap-6"
    >
      <TabsList className="h-auto rounded-full bg-card p-1 shadow-sm group-data-horizontal/tabs:h-auto">
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="rounded-full px-4 py-2 data-active:bg-primary data-active:text-primary-foreground"
          >
            <Icon className="size-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="shop">
        <ShopSettingsForm settings={settings} />
      </TabsContent>
      <TabsContent value="profile">
        <ProfileForm profile={profile} />
      </TabsContent>
      <TabsContent value="security">
        <PasswordForm />
      </TabsContent>
    </Tabs>
  )
}
