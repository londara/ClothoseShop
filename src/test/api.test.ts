import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { api, apiAll, ApiError, type ApiTokens } from "@/lib/api"
import { ACCESS_COOKIE, REFRESH_COOKIE, writeTokenCookies } from "@/lib/session-cookie"

import { fixture } from "./fixtures"

/**
 * The API client (src/lib/api.ts) against the real responses recorded by the backend
 * (src/test/contract/*.json): no server runs, `fetch` is replaced per test.
 */

type Call = { url: string; init: RequestInit }
const realFetch = globalThis.fetch

function mockFetch(...responses: { status: number; body?: unknown }[]) {
  const calls: Call[] = []
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    const next = responses.shift() ?? { status: 500 }
    return new Response(next.body === undefined ? null : JSON.stringify(next.body), {
      status: next.status,
      headers: { "Content-Type": "application/json" },
    })
  }) as typeof fetch
  return calls
}

afterEach(() => {
  globalThis.fetch = realFetch
})

describe("api()", () => {
  it("returns the envelope and sends JSON, the Bearer token and the client IP", async () => {
    const calls = mockFetch({ status: 200, body: fixture("login") })
    const result = await api<{ tokenType: string }>("/api/v1/auth/login", {
      method: "POST",
      body: { identifier: "012345678", password: "x" },
      token: "abc",
      clientIp: "203.0.113.7",
    })
    assert.equal(result.data.tokenType, "Bearer")
    const headers = calls[0].init.headers as Record<string, string>
    assert.equal(calls[0].url, "http://localhost:8080/api/v1/auth/login")
    assert.equal(calls[0].init.method, "POST")
    assert.equal(headers.Authorization, "Bearer abc")
    assert.equal(headers["Content-Type"], "application/json")
    assert.equal(headers["X-Forwarded-For"], "203.0.113.7")
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { identifier: "012345678", password: "x" })
  })

  it("turns the API's validation error into ApiError with the Khmer message and field", async () => {
    const body = fixture<{ error: { code: string; message: string; field: string } }>("error-validation")
    mockFetch({ status: 400, body })
    await assert.rejects(api("/api/v1/admin/products", { method: "POST", body: {} }), (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 400)
      assert.equal(error.code, "VALIDATION")
      assert.equal(error.field, body.error.field)
      assert.equal(error.message, body.error.message) // shown as-is in the form
      return true
    })
  })

  it("keeps 401 and 404 distinguishable (login redirect / not-found page)", async () => {
    mockFetch({ status: 401, body: fixture("error-unauthorized") }, { status: 404, body: fixture("error-not-found") })
    await assert.rejects(api("/api/v1/admin/products"), (e: unknown) => e instanceof ApiError && e.status === 401)
    await assert.rejects(api("/api/v1/shops/x"), (e: unknown) => e instanceof ApiError && e.status === 404)
  })

  it("reports an unreachable API as a Khmer 503, and handles 204", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed")
    }) as typeof fetch
    await assert.rejects(api("/api/v1/shops"), (e: unknown) => e instanceof ApiError && e.code === "UNAVAILABLE")
    mockFetch({ status: 204 })
    assert.equal((await api("/api/v1/admin/products/1", { method: "DELETE" })).data, undefined)
  })
})

describe("apiAll()", () => {
  it("follows meta.pageCount and joins the pages", async () => {
    const page = fixture<{ data: unknown[]; meta: object }>("admin-products")
    const calls = mockFetch(
      { status: 200, body: { ...page, meta: { ...page.meta, page: 1, pageCount: 2 } } },
      { status: 200, body: { ...page, meta: { ...page.meta, page: 2, pageCount: 2 } } }
    )
    const items = await apiAll("/api/v1/admin/products", 100, "tok")
    assert.equal(items.length, page.data.length * 2)
    assert.match(calls[0].url, /\?page=1&pageSize=100$/)
    assert.match(calls[1].url, /\?page=2&pageSize=100$/)
  })
})

describe("token cookies", () => {
  it("expire the access cookie a minute before the JWT and keep the refresh token 30 days", () => {
    const login = fixture<{ data: { expiresIn: number; refreshExpiresIn: number } }>("login").data
    const set: Record<string, { value: string; options: Record<string, unknown> }> = {}
    writeTokenCookies(
      { set: (name, value, options) => (set[name] = { value, options }) },
      { ...(login as unknown as ApiTokens), accessToken: "A", refreshToken: "R" }
    )
    assert.equal(set[ACCESS_COOKIE].value, "A")
    assert.equal(set[ACCESS_COOKIE].options.maxAge, login.expiresIn - 60)
    assert.equal(set[ACCESS_COOKIE].options.httpOnly, true)
    assert.equal(set[REFRESH_COOKIE].options.maxAge, login.refreshExpiresIn)
    assert.equal(set[REFRESH_COOKIE].options.sameSite, "lax")
  })
})
