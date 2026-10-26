import Link from "next/link"
import { Camera, Send } from "lucide-react"

import { NewsletterForm } from "@/components/layout/newsletter-form"
import { PLATFORM_NAME, shopHref } from "@/lib/platform"
import type { Settings } from "@/lib/settings"
import { telegramUrl } from "@/lib/site"

const careLinks = [
  "ជំនួយការឯកជន",
  "ការដឹកជញ្ជូន និងពន្ធគយ",
  "ការប្តូរ និងការត្រឡប់ទំនិញ",
  "ការថែរក្សាសម្លៀកបំពាក់",
]

export function SiteFooter({ settings, slug }: { settings: Settings; slug: string }) {
  return (
    <footer
      className="w-full border-t border-outline-variant/30 bg-surface-low pt-14 pb-8"
    >
      <div className="mx-auto w-full px-5 md:px-12">
        <div className="mb-14 grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6">
          <div className="flex flex-col gap-5 md:col-span-5">
            <span className="text-xl font-bold tracking-tight uppercase">{settings.shopName}</span>
            <p className="line-clamp-4 max-w-sm text-[13px] leading-relaxed whitespace-pre-line text-muted-foreground">
              {settings.aboutMe}
            </p>
            <div className="flex max-w-md flex-col gap-1.5 pt-3">
              <span className="text-sm font-bold">ព័ត៌មានពីអាតេលីយេ</span>
              <p className="text-[13px] text-muted-foreground">
                ទទួលបានព័ត៌មានការដាក់លក់ថ្មី និងការអញ្ជើញពិសេស។
              </p>
              <NewsletterForm />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <span className="text-sm font-bold">អាតេលីយេ</span>
            <address className="flex flex-col gap-3 text-[13px] text-muted-foreground not-italic">
              <p>
                <strong className="block text-foreground">សាឡុងប៉ារីស</strong>
                ៣២ ផ្លូវ ដឺ លុយនីវែរស៊ីតេ
                <br />
                ៧៥០០៧ ប៉ារីស ប្រទេសបារាំង
              </p>
              <p>
                <strong className="block text-foreground">ស្ទូឌីយោមីឡាន</strong>
                ១៤ ផ្លូវ ម៉ុងតេណាប៉ូលេអូណេ
                <br />
                ២០១២១ មីឡាន ប្រទេសអ៊ីតាលី
              </p>
            </address>
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <span className="text-sm font-bold">សេវាអតិថិជន</span>
            <nav className="flex flex-col gap-1.5 text-[13px]">
              {careLinks.map((label) => (
                <Link
                  key={label}
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3 md:col-span-3">
            <span className="text-sm font-bold">ទំនាក់ទំនងផ្ទាល់</span>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              ភ្ជាប់ទំនាក់ទំនងភ្លាមៗជាមួយបុគ្គលិកហាងរបស់យើង
              សម្រាប់ការណាត់ជួប និងការទូទាត់តាមតេឡេក្រាម។
            </p>
            <div className="flex flex-col gap-1.5 pt-1.5">
              <a
                href={telegramUrl(settings.telegram)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:text-gold"
              >
                <Send className="size-4" />
                តេឡេក្រាមហាងផ្ទាល់
              </a>
              <Link
                href={shopHref(slug, "/#editorial")}
                className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:text-gold"
              >
                <Camera className="size-4" />
                ទស្សនាវដ្ដីរូបភាព
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/30 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>
            © {settings.shopName}។ រក្សាសិទ្ធិគ្រប់យ៉ាង។ ·{" "}
            <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
              ដំណើរការដោយ {PLATFORM_NAME}
            </Link>
          </p>
          <div className="flex items-center gap-5">
            <Link href="#" className="transition-colors hover:text-foreground">
              គោលការណ៍ឯកជនភាព
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              លក្ខខណ្ឌនៃការលក់
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              ភាពងាយស្រួលប្រើប្រាស់
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
