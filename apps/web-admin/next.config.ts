import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  transpilePackages: ['@mosque-digital-clock/shared-types'],
  serverExternalPackages: ['prom-client', 'bintrees', 'adhan'],
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/media/:path*',
      },
    ];
  },
};

export default withPWA(nextConfig);
