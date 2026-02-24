import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['@mosque-digital-clock/shared-types'],
};

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
