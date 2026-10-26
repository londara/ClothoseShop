/** Telegram deep link; `username` comes from the shop settings. */
export const telegramUrl = (username: string, text?: string) => {
  const handle = username.replace(/^@/, "")
  return text
    ? `https://t.me/${handle}?text=${encodeURIComponent(text)}`
    : `https://t.me/${handle}`
}

export const navLinks = [
  { href: "/#catalogue-section", label: "មកដល់ថ្មី", match: "/#catalogue-section" },
  { href: "/catalogue", label: "កម្រងសម្លៀកបំពាក់", match: "/catalogue" },
  { href: "/#editorial", label: "អត្ថបទម៉ូដ", match: "/#editorial" },
  { href: "/#about", label: "អំពីយើង", match: "/#about" },
] as const

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"]

/** Render a number with Khmer numerals, keeping thousands separators. */
export function kh(value: number | string) {
  const text =
    typeof value === "number" ? value.toLocaleString("en-US") : value
  return text.replace(/[0-9]/g, (d) => KHMER_DIGITS[Number(d)])
}

export const formatPrice = (value: number) => `$${kh(value)}`
