// Lets `node --test` run the TypeScript sources directly (Node strips the types):
// resolves the "@/…" import alias of tsconfig.json to src/… and adds the .ts/.tsx extension.
import { existsSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath } from "node:url"

const src = new URL("../", import.meta.url)

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../")
    if (specifier.startsWith("@/") || (relative && context.parentURL && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier))) {
      const base = specifier.startsWith("@/")
        ? new URL(specifier.slice(2), src).href
        : new URL(specifier, context.parentURL).href
      for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
        if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate, context)
      }
    }
    return nextResolve(specifier, context)
  },
})
