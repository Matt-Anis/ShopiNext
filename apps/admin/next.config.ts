import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/db", "@repo/ui"],
}

export default nextConfig
