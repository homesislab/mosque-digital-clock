import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@mosque-digital-clock/shared-types'],
  // turbopack: {},
};

export default nextConfig;
