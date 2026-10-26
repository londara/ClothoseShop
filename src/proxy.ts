import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE } from "@/lib/session-cookie"

/**
 * Optimistic gate for the admin: visitors without a session cookie are sent to
 * the login page before any admin UI renders. The cookie signature itself is
 * verified by `requireAdmin()` in every admin page and server action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)

  if (pathname === "/admin/login") return NextResponse.next()
  if (!hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
