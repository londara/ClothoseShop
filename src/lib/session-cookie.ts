import type { ApiTokens } from "@/lib/api"

/**
 * The API's JWT pair, kept in httpOnly cookies (shared by proxy.ts and lib/auth).
 * The access cookie expires a minute before the token, so proxy.ts refreshes
 * with the refresh token before the API would answer TOKEN_EXPIRED.
 */
export const ACCESS_COOKIE = "aura_access"
export const REFRESH_COOKIE = "aura_refresh"

type CookieJar = {
  set(name: string, value: string, options: Record<string, unknown>): unknown
}

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

export function writeTokenCookies(jar: CookieJar, tokens: ApiTokens) {
  jar.set(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: Math.max(tokens.expiresIn - 60, 30) })
  jar.set(REFRESH_COOKIE, tokens.refreshToken, { ...base, maxAge: tokens.refreshExpiresIn })
}
