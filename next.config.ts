import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['crafthead.net', 'visage.surgeplay.com'],
  },
};

export default nextConfig;