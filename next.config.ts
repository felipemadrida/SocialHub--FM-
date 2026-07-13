import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Avoid scanning the automation sidecar (old file: symlink broke Turbopack)
  outputFileTracingExcludes: {
    "*": ["./mini-services/**/*"],
  },
  turbopack: {
    // Keep Turbopack rooted at the app, not nested installs
  },
};

export default nextConfig;
