import Link from "next/link"
import { LogIn, Store } from "lucide-react"

import { PLATFORM_NAME } from "@/lib/platform"

export function PlatformFooter({ shops }: { shops: { slug: string; name: string }[] }) {
  return (
    <footer className="w-full border-t border-outline-variant/30 bg-surface-low pt-14 pb-8">
      <div className="mx-auto w-full px-5 md:px-12">
        <div className="mb-14 grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6">
          <div className="flex flex-col gap-4 md:col-span-5">
            <span className="text-xl font-bold tracking-tight uppercase">{PLATFORM_NAME}</span>
            <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              វេទិកាហាងអនឡាញប្រណីតសម្រាប់អ្នករចនាម៉ូដ និងសិប្បករ។
              បើកហាងរបស់អ្នក ឬស្វែងរកសម្លៀកបំពាក់ចំនួនកំណត់
              ជាមួយការបញ្ជាទិញផ្ទាល់តាមតេឡេក្រាម។
            </p>
          </div>
          <div className="flex flex-col gap-3 md:col-span-4">
            <span className="text-sm font-bold">ហាងនៅលើវេទិកា</span>
            <nav className="flex flex-col gap-1.5 text-[13px]">
              {shops.slice(0, 6).map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}`}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Store className="size-3.5" />
                  {s.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-3 md:col-span-3">
            <span className="text-sm font-bold">សម្រាប់ម្ចាស់ហាង</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:text-gold"
            >
              <LogIn className="size-4" />
              ចូលគ្រប់គ្រងហាង
            </Link>
            <a href="#gateway" className="text-[13px] text-muted-foreground hover:text-foreground">
              បើកហាងថ្មី
            </a>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant/30 pt-8 text-xs text-muted-foreground md:flex-row">
          <p>© {PLATFORM_NAME}។ រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
          <div className="flex items-center gap-5">
            <span>គោលការណ៍ឯកជនភាព</span>
            <span>លក្ខខណ្ឌប្រើប្រាស់</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
