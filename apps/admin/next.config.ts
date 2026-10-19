import type { NextConfig } from "next"

function getStorageRemotePatterns() {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
    {
      protocol: "http",
      hostname: "localhost",
      port: "8333",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "**.amazonaws.com",
    },
    {
      protocol: "https",
      hostname: "picsum.photos",
    },
  ]

  const storageUrl = process.env.STORAGE_PUBLIC_URL || process.env.STORAGE_ENDPOINT
  if (storageUrl) {
    try {
      const parsed = new URL(storageUrl)
      const protocol = parsed.protocol.replace(":", "") as "http" | "https"
      if (parsed.hostname !== "localhost") {
        patterns.push({
          protocol,
          hostname: parsed.hostname,
          port: parsed.port || undefined,
          pathname: "/**",
        })
      }
    } catch {
      // Ignore invalid URL
    }
  }

  return patterns
}

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/db", "@repo/ui"],
  images: {
    remotePatterns: getStorageRemotePatterns(),
  },
}

export default nextConfig
