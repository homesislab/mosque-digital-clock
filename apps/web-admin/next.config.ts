import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@mosque-digital-clock/shared-types'],
  serverExternalPackages: ['prom-client', 'bintrees'],
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/media/:path*',
      },
    ];
  },
};

export default nextConfig;
