import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
    ],
  },
  // Uploaded images are stored and served by the API (aura-backend).
  async rewrites() {
    const api = (process.env.API_URL || "http://localhost:8080").replace(/\/+$/, "")
    return [{ source: "/uploads/:file", destination: `${api}/uploads/:file` }]
  },
  // Links from before the multi-shop platform pointed at the single shop.
  async redirects() {
    return [
      { source: "/catalogue", destination: "/aura-studio/catalogue", permanent: true },
      { source: "/products/:id", destination: "/aura-studio/products/:id", permanent: true },
    ]
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
