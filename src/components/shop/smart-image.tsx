import NextImage, { type ImageProps } from "next/image"

const OPTIMIZED_HOSTS = ["lh3.googleusercontent.com"]

function canOptimize(src: ImageProps["src"]) {
  if (typeof src !== "string") return true
  if (src.startsWith("/")) return true
  try {
    return OPTIMIZED_HOSTS.includes(new URL(src).hostname)
  } catch {
    return false
  }
}

/**
 * next/image that falls back to an unoptimized <img> for image URLs from hosts
 * not listed in next.config `remotePatterns` (e.g. links pasted in the admin).
 */
export default function Image(props: ImageProps) {
  return <NextImage {...props} unoptimized={props.unoptimized ?? !canOptimize(props.src)} />
}
