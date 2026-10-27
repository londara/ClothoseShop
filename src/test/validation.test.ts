import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { isImageRef } from "@/lib/mappers"

/**
 * The frontend's image-URL check must agree with the API (Validators.isRemoteUrl,
 * covered by aura-backend InputSecurityApiTest): same cases, same answers. Otherwise a
 * form would pass in the browser and then fail in the API, or the other way round.
 */
describe("isImageRef (same rules as the API)", () => {
  const accepted = [
    "https://example.com/image.jpg",
    "https://lh3.googleusercontent.com/aida-public/AB6AXu-abc_123",
    "https://cdn.shop.com/a/b.png?w=600&h=800",
    "/uploads/lx9a2k-3f9c1a2b4d5e.jpg",
    "/uploads/abc-123.webp",
  ]
  const refused = [
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "http://example.com/a.jpg", // https only
    `https://example.com/${"a".repeat(2100)}`, // over 2,048 characters
    'https://x.com/a".jpg onerror=alert(1)', // quote breaks out of the attribute
    "https://x.com/<script>",
    "https://x.com/a b.jpg",
    "https:///no-host.jpg",
    "/uploads/../../etc/passwd",
    "/uploads/x.svg", // only the image types the API stores
    "/uploads/X.JPG",
    "",
  ]

  for (const url of accepted) it(`accepts ${url.slice(0, 60)}`, () => assert.equal(isImageRef(url), true))
  for (const url of refused) it(`refuses ${url.slice(0, 60) || "(empty)"}`, () => assert.equal(isImageRef(url), false))
})
