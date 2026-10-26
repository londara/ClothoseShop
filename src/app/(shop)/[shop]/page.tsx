import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowDown, BadgeCheck, Hammer, Mail, Phone, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductBrowser } from "@/components/shop/product-browser"
import Image from "@/components/shop/smart-image"
import { getShopBySlug, getShopOwnerProfile } from "@/lib/data"
import { shopHref } from "@/lib/platform"
import { editorialImages } from "@/lib/products"
import { FIRST_SHOP_SLUG } from "@/lib/store"
import { telegramUrl } from "@/lib/site"

const heroBadges = [
  { icon: null, label: "កម្រងរដូវ ២០២៥ ដាក់លក់ហើយ", always: true },
  { icon: BadgeCheck, label: "ក្រណាត់តាមដានប្រភពបាន ១០០%" },
  { icon: Hammer, label: "បញ្ចប់ដោយដៃនៅទីក្រុងមីឡាន" },
]

const stats = [
  { value: "១០០%", label: "សរសៃធម្មជាតិ" },
  { value: "៨០", label: "ឈុតក្នុងមួយការកាត់" },
  { value: "០", label: "មីក្រូប្លាស្ទិក" },
]

export default async function ShopHomePage({ params }: PageProps<"/[shop]">) {
  const shop = await getShopBySlug((await params).shop)
  // The layout shows the "pending / suspended" notice; nothing to render here.
  if (!shop) notFound()
  if (shop.status !== "active") return null
  const { settings, products } = shop
  const profile = await getShopOwnerProfile(shop.id)
  const featuredProducts = products.slice(0, 8)
  // The demo story, badges and photos describe the original AURA Studio shop.
  const isFlagship = shop.slug === FIRST_SHOP_SLUG

  return (
    <div className="relative flex w-full flex-col">
      {/* Hero */}
      <section className="relative -mt-28 flex min-h-[92vh] w-full items-end overflow-hidden pb-14 md:pb-28">
        <div className="absolute inset-0 z-0">
          <Image
            src={settings.heroImage}
            alt={`យុទ្ធនាការរបស់ ${settings.shopName}`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-[0.88] saturate-[0.9]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/20" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-36 md:px-12">
          <div className="flex max-w-3xl flex-col gap-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {isFlagship && heroBadges.map(({ icon: Icon, label, always }) => (
                <span
                  key={label}
                  className={`glass items-center gap-1.5 rounded-full border border-outline-variant/30 px-3 py-0.5 text-[11px] font-bold shadow-sm ${always ? "inline-flex" : "hidden sm:inline-flex"}`}
                >
                  {Icon ? (
                    <Icon className="size-3 text-gold" />
                  ) : (
                    <span className="size-1.5 animate-pulse rounded-full bg-gold" />
                  )}
                  {label}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl leading-[1.5] font-bold drop-shadow-sm md:text-6xl md:leading-[1.4]">
                {settings.heroTitle}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                {settings.heroSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1.5">
              <Button
                nativeButton={false}
                render={<Link href="#catalogue-section" />}
                className="h-12 rounded-full px-8 text-sm font-bold shadow-xl shadow-primary/10"
              >
                ស្វែងរកកម្រងម៉ូដ
                <ArrowDown className="size-4" />
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href={telegramUrl(settings.telegram)} target="_blank" rel="noopener noreferrer" />}
                className="glass h-12 rounded-full border-outline-variant/30 px-8 text-sm font-bold shadow-md"
              >
                <Send className="size-4 text-gold" />
                បញ្ជាទិញផ្ទាល់តាមតេឡេក្រាម
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section
        id="catalogue-section"
        className="mx-auto w-full max-w-7xl scroll-mt-28 px-5 py-14 md:px-12"
      >
        <ProductBrowser products={featuredProducts} />
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={shopHref(shop.slug, "/catalogue")} />}
            className="h-11 rounded-full border-outline-variant/50 px-8 text-sm font-bold"
          >
            មើលកម្រងទាំងមូល
          </Button>
        </div>
      </section>

      {/* Editorial story */}
      {isFlagship && (
      <section id="editorial" className="my-8 w-full scroll-mt-28 bg-surface-low py-14">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-5 md:grid-cols-12 md:px-12">
          <div className="space-y-5 md:col-span-5">
            <span className="text-sm font-bold text-gold">គោលការណ៍សម្ភារៈ</span>
            <h2 className="text-3xl leading-[1.5] font-bold md:text-4xl">
              ភាពបរិសុទ្ធនៃក្រណាត់ ដោយគ្មានការសម្របសម្រួល។
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              យើងកំណត់ម៉ូដនីមួយៗត្រឹមតែ ៨០ ឈុតមានលេខស៊េរី ក្នុងមួយជុំផលិត។
              រោមចៀម កាស្មៀរ និងសូត្រមនគ្រប់បាច់
              ត្រូវបានបញ្ជាក់ថាអាចបំបែកជាជីបាន
              និងជ្រលក់ពណ៌ដោយសារធាតុរុក្ខជាតិសុទ្ធ គ្មានសារធាតុគីមីសំយោគ។
            </p>
            <div className="flex items-center divide-x divide-outline-variant/40 pt-1.5">
              {stats.map((s) => (
                <div key={s.label} className="px-6 first:pl-0">
                  <span className="block text-2xl font-bold">{s.value}</span>
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 md:col-span-7">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-container">
              <Image
                src={editorialImages.fiber}
                alt="សរសៃកាស្មៀរធម្មជាតិកំពុងត្រួតពិនិត្យដោយដៃ"
                fill
                sizes="(min-width: 768px) 30vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative mt-8 aspect-[4/5] overflow-hidden rounded-3xl bg-surface-container">
              <Image
                src={editorialImages.cutting}
                alt="ការគូសបន្ទាត់កាត់ដេរលើក្រណាត់រោមចៀមនៅមីឡាន"
                fill
                sizes="(min-width: 768px) 30vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      )}

      {/* About the owner — edited under Admin → Settings */}
      <section id="about" className="mx-auto w-full max-w-7xl scroll-mt-28 px-5 py-14 md:px-12">
        <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-outline-variant/30 bg-card p-8 shadow-sm md:grid-cols-12 md:p-12">
          <div className="flex flex-col items-center gap-3 text-center md:col-span-4">
            <div className="relative size-40 overflow-hidden rounded-full bg-surface-container ring-4 ring-gold-soft">
              {profile.avatar ? (
                <Image src={profile.avatar} alt={profile.name} fill sizes="160px" className="object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-5xl font-bold text-gold">
                  {Array.from(profile.name)[0]}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-bold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
            </div>
          </div>
          <div className="space-y-4 md:col-span-8">
            <span className="text-sm font-bold text-gold">{settings.shopName}</span>
            <h2 className="text-3xl leading-[1.5] font-bold">{settings.aboutTitle}</h2>
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
              {settings.aboutMe}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-sm">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 rounded-full bg-surface-low px-4 py-2 hover:bg-surface-high">
                  <Mail className="size-4 text-gold" />
                  {profile.email}
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-2 rounded-full bg-surface-low px-4 py-2 hover:bg-surface-high">
                  <Phone className="size-4 text-gold" />
                  {profile.phone}
                </a>
              )}
              <a href={telegramUrl(settings.telegram)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground">
                <Send className="size-4" />
                តេឡេក្រាម
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
