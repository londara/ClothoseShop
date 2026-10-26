import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Hourglass,
  Lock,
  MessageCircle,
  Palette,
  Send,
  Shirt,
  ShieldCheck,
  Sparkles,
  Store,
  WandSparkles,
  Zap,
} from "lucide-react"

import { FeaturedRail, type FeaturedPiece } from "@/components/platform/featured-rail"
import { PlatformFooter } from "@/components/platform/platform-footer"
import { PlatformHeader } from "@/components/platform/platform-header"
import { StartShopDialog } from "@/components/platform/start-shop-dialog"
import Image from "@/components/shop/smart-image"
import { Button } from "@/components/ui/button"
import { getActiveShops } from "@/lib/data"
import { images } from "@/lib/images"
import { PLATFORM_NAME, specialtyLabel } from "@/lib/platform"
import { kh } from "@/lib/site"
import { FIRST_SHOP_SLUG } from "@/lib/store"

const patronPerks = [
  "ការដាក់លក់មានលេខស៊េរី ជាមួយកាតបញ្ជាក់ប្រភពពិតប្រាកដ",
  "ដឹកជញ្ជូនរហ័សឥតគិតថ្លៃ សម្រាប់ការបញ្ជាទិញធំ",
  "ជំនួយផ្ទាល់ពីអ្នករចនាម៉ូដ និងការណែនាំទំហំ",
]

const creatorPerks = [
  "ដំណើរការក្នុងរយៈពេលតិចជាង ៣ នាទី ជាមួយរចនាប័ទ្មប្រណីតស្រាប់",
  "ទទួលការបញ្ជាទិញផ្ទាល់តាមតេឡេក្រាម និងបែងចែកអតិថិជន VIP",
  "គ្មានថ្លៃជាវប្រចាំខែ — គិតតែកម្រៃជើងសារតិចតួចប៉ុណ្ណោះ",
]

const protocols = [
  {
    icon: Hourglass,
    no: "០១",
    title: "កំណត់ត្រឹម ៨០ ឈុត",
    body: "រក្សាភាពកម្រពិតប្រាកដ។ ស្លាករាប់ថយក្រោយ និងចំនួនស្តុកជូនដំណឹងអតិថិជន នៅពេលម៉ូដជិតអស់ពីទីផ្សារ។",
    tag: "ការចាក់សោភាពកម្រ",
    tagIcon: Lock,
  },
  {
    icon: Send,
    no: "០២",
    title: "ទំនាក់ទំនងអតិថិជនផ្ទាល់",
    body: "លែងមានកន្ត្រកទំនិញដែលគេបោះបង់។ ការបញ្ជាទិញនីមួយៗផ្ញើជាវិក្កយបត្រផ្ទាល់ទៅតេឡេក្រាមរបស់អ្នក។",
    tag: "តេឡេក្រាមមួយចុច",
    tagIcon: MessageCircle,
  },
  {
    icon: Sparkles,
    no: "០៣",
    title: "អក្សរសាស្ត្រកម្រិតសារមន្ទីរ",
    body: "រចនាជាមួយពុម្ពអក្សរបាត់ដំបង ខ្សែបន្ទាត់ស្រាលៗ និងផ្ទាំងកញ្ចក់ព្រិល សម្រាប់អេក្រង់គុណភាពខ្ពស់។",
    tag: "ប្រព័ន្ធរចនាបត់បែន",
    tagIcon: Palette,
  },
]

export default async function PlatformHomePage() {
  const shops = await getActiveShops()
  const flagship = shops.find((s) => s.slug === FIRST_SHOP_SLUG) ?? shops[0]

  // A few pieces from every shop, interleaved so no single shop fills the rail.
  const perShop = shops.map((s) =>
    s.products.slice(0, 4).map<FeaturedPiece>((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.images[0],
      stock: p.stock,
      shopSlug: s.slug,
      shopName: s.settings.shopName,
      telegram: s.settings.telegram,
    }))
  )
  const pieces: FeaturedPiece[] = []
  for (let i = 0; i < 4; i++) for (const list of perShop) if (list[i]) pieces.push(list[i])

  const totalPieces = shops.reduce((n, s) => n + s.products.length, 0)

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <PlatformHeader />

      <main className="w-full flex-1 pt-28">
        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-5 pt-14 pb-10 text-center md:pt-20">
          <span className="flex items-center gap-1.5 rounded-full bg-surface-high px-3 py-0.5 text-[11px] font-bold">
            <WandSparkles className="size-3.5 text-gold" />
            អាតេលីយេឌីជីថល • ទីសក្ការៈអនឡាញ
          </span>
          <h1 className="text-4xl leading-[1.5] font-bold md:text-6xl md:leading-[1.4]">
            សូមស្វាគមន៍មកកាន់ {PLATFORM_NAME}
            <span className="mt-1 block text-3xl text-gold italic md:text-5xl">
              សិល្បៈនៃភាពទំនើបដែលអាចប៉ះពាល់បាន
            </span>
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-lg">
            ទីសក្ការៈដ៏ស្ងប់ស្ងាត់នៃវិន័យស្ថាបត្យកម្ម សម្លៀកបំពាក់កម្រងមានលេខស៊េរី
            និងការសន្ទនាផ្ទាល់ជាមួយសិប្បករ។ ស្វែងរកសម្លៀកបំពាក់ដែលអ្នកស្រឡាញ់
            ឬបើកហាងប្រណីតផ្ទាល់ខ្លួនរបស់អ្នក។
          </p>
          <Button
            nativeButton={false}
            render={<a href="#shops" />}
            className="mt-2 h-12 rounded-full px-8 text-sm font-bold shadow-xl shadow-primary/10"
          >
            ស្វែងរកហាងអនឡាញ
            <ArrowRight className="size-4" />
          </Button>
        </section>

        {/* Bento */}
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-5 pb-20 md:px-12 lg:grid-cols-12">
          <div className="relative min-h-80 overflow-hidden rounded-3xl bg-surface-container shadow-lg lg:col-span-7 lg:min-h-[26rem]">
            <Image
              src={images.platform.showroom}
              alt="ស្ទូឌីយោបង្ហាញម៉ូដប្រណីត"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 flex flex-wrap items-end justify-between gap-3 text-white">
              <div>
                <span className="text-[11px] font-bold opacity-80">កម្រងអចិន្ត្រៃយ៍ ០៨</span>
                <p className="text-2xl font-bold">រាងមានវិន័យ និងភាពរុងរឿងស្ងប់ស្ងាត់</p>
              </div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
                សរុប {kh(totalPieces)} ម៉ូដ
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className="flex flex-1 flex-col justify-between gap-6 rounded-3xl border border-outline-variant/30 bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-gold">ម៉ាស៊ីនអាតេលីយេ</span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  ប្រព័ន្ធកំពុងដំណើរការ
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">ពាណិជ្ជកម្មម៉ាកផ្ទាល់ខ្លួន</h2>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  រចនាឡើងសម្រាប់អ្នករចនាម៉ូដឯករាជ្យ សិប្បករសេរ៉ាមិច និងគ្រឿងអលង្ការ
                  ដែលចង់បានភាពសាមញ្ញ និងការទូទាត់រហ័សតាមតេឡេក្រាម។
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {shops.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      title={s.settings.shopName}
                      className="flex size-9 items-center justify-center rounded-full border-2 border-card bg-gold-soft text-xs font-bold text-on-gold-soft"
                    >
                      {Array.from(s.settings.shopName)[0]?.toUpperCase()}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-bold text-gold">ហាងសរុប {kh(shops.length)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-3xl bg-surface-high/70 p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-on-gold-soft">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-bold">ពិធីការធានាសុវត្ថិភាព</p>
                <p className="text-[13px] text-muted-foreground">
                  ការបញ្ជាទិញតាមតេឡេក្រាម ធានាដោយហាងដែលបានផ្ទៀងផ្ទាត់ និងអនុម័ត។
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gateway */}
        <section id="gateway" className="mx-auto w-full max-w-7xl scroll-mt-28 px-5 pb-20 md:px-12">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold text-gold">ទីសក្ការៈពីរ</span>
            <h2 className="text-3xl leading-[1.5] font-bold md:text-4xl">ជ្រើសរើសផ្លូវរបស់អ្នក</h2>
            <p className="text-sm text-muted-foreground">
              ទិញសម្លៀកបំពាក់សិប្បកម្មដ៏កម្រ ឬបើកហាងបង្ហាញម៉ូដឌីជីថលផ្ទាល់ខ្លួន។
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-6 rounded-3xl border border-outline-variant/30 bg-card p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-surface-high px-3 py-0.5 text-[11px] font-bold">
                  សម្រាប់អតិថិជន និងអ្នកប្រមូល
                </span>
                <Shirt className="size-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">ចូលទៅកាន់ហាង {flagship?.settings.shopName ?? PLATFORM_NAME}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  ស្វែងរកកម្រងសម្លៀកបំពាក់មានលេខស៊េរី៖ អាវធំកាស្មៀរ រ៉ូបសូត្រត្បាញដៃ
                  និងគ្រឿងបន្លាស់ស្បែកសម្លាប់ដោយរុក្ខជាតិ ដែលផលិតត្រឹម ៨០ ឈុតប៉ុណ្ណោះ។
                </p>
              </div>
              <ul className="space-y-2 text-[13px]">
                {patronPerks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Button
                nativeButton={false}
                render={<Link href={flagship ? `/${flagship.slug}` : "#shops"} />}
                className="mt-auto h-12 rounded-full text-sm font-bold"
              >
                ចូលហាង
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-6 rounded-3xl bg-surface-high/80 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gold-soft px-3 py-0.5 text-[11px] font-bold text-on-gold-soft">
                  សម្រាប់អ្នកបង្កើត និងអាតេលីយេ
                </span>
                <Store className="size-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">បង្កើតហាងអនឡាញរបស់អ្នក</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  បើកហាងប្រណីតបែបស្ថាបត្យកម្មដោយមិនចាំបាច់មានជំនាញបច្ចេកទេស។
                  ទទួលការបញ្ជាទិញភ្លាមៗតាមតេឡេក្រាម កំណត់ចំនួនម៉ូដ និងបង្ហាញកម្រងតាមរដូវ។
                </p>
              </div>
              <ul className="space-y-2 text-[13px]">
                {creatorPerks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Zap className="mt-0.5 size-4 shrink-0 text-gold" />
                    {perk}
                  </li>
                ))}
              </ul>
              <StartShopDialog className="mt-auto h-12 rounded-full bg-gold text-sm font-bold text-white hover:bg-gold/90">
                ចាប់ផ្តើមបង្កើតហាង
                <ArrowRight className="size-4" />
              </StartShopDialog>
            </div>
          </div>
        </section>

        {/* Protocols */}
        <section id="features" className="w-full scroll-mt-28 bg-surface-low py-20">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-12">
            <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <span className="text-xs font-bold text-gold">ម៉ាស៊ីនអាតេលីយេ</span>
                <h2 className="text-3xl leading-[1.5] font-bold md:text-4xl">ស្ថាបត្យកម្មរូបភាពតាមតម្រូវការ</h2>
              </div>
              <p className="max-w-sm text-[13px] text-muted-foreground">
                ហេដ្ឋារចនាសម្ព័ន្ធឌីជីថលដែលបង្កើតឡើងជាពិសេសសម្រាប់អ្នកបង្កើត
                ដែលមិនចង់បានគំរូហាងអនឡាញធម្មតា។
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {protocols.map(({ icon: Icon, no, title, body, tag, tagIcon: TagIcon }) => (
                <div key={no} className="flex flex-col gap-4 rounded-3xl border border-outline-variant/20 bg-card p-7 shadow-sm">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-high">
                    <Icon className="size-5" />
                  </span>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-gold">ពិធីការ {no}</span>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                  <span className="mt-auto flex items-center gap-1.5 text-[11px] font-bold">
                    {tag}
                    <TagIcon className="size-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shop directory */}
        <section id="shops" className="mx-auto w-full max-w-7xl scroll-mt-28 px-5 py-20 md:px-12">
          <div className="mb-8">
            <span className="text-xs font-bold text-gold">ហាងដែលបានផ្ទៀងផ្ទាត់</span>
            <h2 className="text-3xl leading-[1.5] font-bold md:text-4xl">ហាងនៅលើវេទិកា</h2>
          </div>
          {shops.length === 0 ? (
            <p className="rounded-3xl bg-surface-low p-10 text-center text-muted-foreground">
              មិនទាន់មានហាងនៅឡើយទេ។ ក្លាយជាហាងដំបូងគេ!
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/${s.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-outline-variant/20 bg-card shadow-sm transition-shadow hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                      <Image
                        src={s.settings.heroImage}
                        alt={s.settings.shopName}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="glass absolute top-3 left-3 flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-bold">
                        <BadgeCheck className="size-3.5 text-gold" />
                        {specialtyLabel(s.specialty)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-5">
                      <span className="text-lg font-bold">{s.settings.shopName}</span>
                      <span className="line-clamp-2 text-[13px] text-muted-foreground">
                        {s.settings.heroSubtitle}
                      </span>
                      <span className="mt-auto flex items-center justify-between pt-3 text-xs">
                        <span className="text-muted-foreground">ផលិតផល {kh(s.products.length)}</span>
                        <span className="flex items-center gap-1 font-bold group-hover:text-gold">
                          ចូលហាង
                          <ArrowRight className="size-3.5" />
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Featured pieces */}
        {pieces.length > 0 && (
          <section id="featured" className="mx-auto w-full max-w-7xl scroll-mt-28 px-5 pb-20 md:px-12">
            <FeaturedRail pieces={pieces} />
          </section>
        )}
      </main>

      <PlatformFooter shops={shops.map((s) => ({ slug: s.slug, name: s.settings.shopName }))} />
    </div>
  )
}
