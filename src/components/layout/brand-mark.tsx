export function BrandMark({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/80 font-serif text-base leading-none transition-transform duration-300 group-hover:scale-105">
        {Array.from(name.trim())[0]?.toUpperCase() ?? "A"}
      </span>
      <span className="line-clamp-1 text-xl font-bold tracking-tight text-foreground uppercase">
        {name}
      </span>
    </span>
  )
}
