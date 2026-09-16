import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mksdrawadrawno.pl" },
    ],
  },
  headers: async () => [
    {
      source: '/manifest.webmanifest',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      ],
    },
  ],
};

export default nextConfig;
