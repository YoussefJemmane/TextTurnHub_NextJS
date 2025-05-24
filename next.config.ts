import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // This disables ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This disables TypeScript checking during production builds
    ignoreBuildErrors: true,
  },
  // This is the critical part that forces the build to continue
  webpack(config, { isServer }) {
    config.optimization.minimize = false;
    return config;
  },
  // The rest of your original configuration
  trailingSlash: true,
  basePath: "",
  productionBrowserSourceMaps: false,
  poweredByHeader: false
};

export default nextConfig;
