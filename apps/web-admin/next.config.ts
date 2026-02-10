import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@mosque-digital-clock/shared-types'],
  serverExternalPackages: ['prom-client', 'bintrees'],
};

export default nextConfig;
