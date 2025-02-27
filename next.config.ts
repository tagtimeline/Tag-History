import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'discord.com',
      'crafthead.net',
      'visage.surgeplay.com',
      'textures.minecraft.net',
      'sessionserver.mojang.com',
      'laby.net',
      'api.crafty.gg',
      'api.capes.dev',
      'api.hypixel.net',
      'imgur.com',
      'i.imgur.com'
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;