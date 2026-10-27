import { NextResponse, type NextRequest } from "next/server"

import { api, type ApiTokens } from "@/lib/api"
import { ACCESS_COOKIE, REFRESH_COOKIE, writeTokenCookies } from "@/lib/session-cookie"

/**
 * Admin gate + token refresh. The access cookie expires shortly before the JWT;
 * when it is gone but a refresh token remains, we rotate the pair here so pages
 * and server actions always get a valid token. Without any token, admin pages
 * redirect to the login page.
 */

/**
 * The API rotates refresh tokens and treats a second use of an old one as theft
 * (it then logs the whole session out). The browser often sends several requests
 * at once (prefetches), so concurrent refreshes with the same token share one call,
 * and its result is reused briefly for requests that still carry the old cookie.
 */
const inflight = new Map<string, Promise<ApiTokens | null>>()
const REUSE_MS = 60_000

function refresh(refreshToken: string) {
  let pending = inflight.get(refreshToken)
  if (!pending) {
    pending = api<ApiTokens>("/api/v1/auth/refresh", { method: "POST", body: { refreshToken } })
      .then(({ data }) => data)
      .catch(() => null)
    inflight.set(refreshToken, pending)
    setTimeout(() => inflight.delete(refreshToken), REUSE_MS)
  }
  return pending
}

export async function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login"
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (!request.cookies.has(ACCESS_COOKIE) && refreshToken) {
    const tokens = await refresh(refreshToken)
    if (tokens) {
      // Pass the new token to this request's pages/actions and store it in the browser.
      request.cookies.set(ACCESS_COOKIE, tokens.accessToken)
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken)
      const response = NextResponse.next({ request: { headers: request.headers } })
      writeTokenCookies(response.cookies, tokens)
      return response
    }
    const response = isLogin
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/admin/login", request.url))
    response.cookies.delete(REFRESH_COOKIE)
    return response
  }

  if (!isLogin && !request.cookies.has(ACCESS_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
