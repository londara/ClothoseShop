import { Send } from "lucide-react"

import { telegramUrl } from "@/lib/site"

export function TelegramFab({ telegram }: { telegram: string }) {
  return (
    <div className="fixed right-6 bottom-6 z-40">
      <a
        href={telegramUrl(telegram)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-primary py-3 pr-4 pl-3 text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105"
      >
        <span className="relative flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-soft opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-gold" />
        </span>
        <Send className="size-5 text-gold-soft" />
        <span className="text-xs font-bold">ជំនួយការតេឡេក្រាម</span>
      </a>
    </div>
  )
}
