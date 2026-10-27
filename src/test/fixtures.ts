import { readFileSync } from "node:fs"

/**
 * A real API response recorded by the backend test ContractFixturesTest
 * (aura-backend: `mvn test -Dtest=ContractFixturesTest` refreshes src/test/contract/*.json).
 */
export function fixture<T = Record<string, unknown>>(name: string): T {
  return JSON.parse(readFileSync(new URL(`./contract/${name}.json`, import.meta.url), "utf8")) as T
}
