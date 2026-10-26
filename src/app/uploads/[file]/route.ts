import { promises as fs } from "node:fs"
import path from "node:path"

import { UPLOAD_DIR } from "@/lib/store"

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
}

/** Serves images uploaded through the admin from `data/uploads`. */
export async function GET(_request: Request, ctx: RouteContext<"/uploads/[file]">) {
  const { file } = await ctx.params
  if (!/^[a-z0-9-]+\.(jpg|png|webp|gif|avif)$/.test(file)) {
    return new Response("Not found", { status: 404 })
  }
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, file))
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[path.extname(file)],
        // Upload names are unique, so the file never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
