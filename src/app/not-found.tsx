import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-5 py-32 text-center">
      <span className="text-sm font-bold text-gold">៤០៤</span>
      <h1 className="text-3xl leading-[1.5] font-bold">រកមិនឃើញទំព័រនេះទេ</h1>
      <p className="text-muted-foreground">
        ទំព័រ ឬសម្លៀកបំពាក់ដែលអ្នកកំពុងស្វែងរក ប្រហែលជាត្រូវបានរក្សាទុកក្នុងបណ្ណសារហើយ។
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/" />}
        className="h-11 rounded-full px-6 text-sm font-bold"
      >
        ត្រឡប់ទៅទំព័រដើម
      </Button>
    </div>
  )
}
