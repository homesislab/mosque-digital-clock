import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['@mosque-digital-clock/shared-types'],
};

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        runtimeCaching: [
            // ── Audio files (all formats) — CacheFirst, 7 days ──────────────
            // This covers .mp3, .m4a, .aac, .ogg, .wav, .flac from any origin
            {
                urlPattern: /\.(?:mp3|m4a|aac|ogg|wav|flac|opus|wma)(\?.*)?$/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'audio-cache',
                    expiration: {
                        maxEntries: 500,
                        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year — invalidated by config version
                    },
                    rangeRequests: true, // Required for audio seeking
                },
            },
            // ── Images — StaleWhileRevalidate, 30 days ───────────────────────
            {
                urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)(\?.*)?$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'image-cache',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60 * 24 * 30,
                    },
                },
            },
            // ── Fonts — CacheFirst, 1 year ───────────────────────────────────
            {
                urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts',
                    expiration: {
                        maxEntries: 20,
                        maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                },
            },
        ],
    },
});

export default withPWA(nextConfig);
