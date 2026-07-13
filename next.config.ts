import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Avoid scanning the automation sidecar (old file: symlink broke Turbopack)
  outputFileTracingExcludes: {
    "*": ["./mini-services/**/*"],
  },
  images: {
    unoptimized: false,
    remotePatterns: [],
  },
};

export default nextConfig;
