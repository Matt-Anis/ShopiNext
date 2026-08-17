import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/db", "@repo/ui"],
  images: {
    remotePatterns: [{ hostname: "picsum.photos" }],
  },
};

export default nextConfig;
