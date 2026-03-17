import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import { resolve } from "path";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: resolve(import.meta.dirname ?? "."),
  },
  webpack: (config) => {
    // Ensure webpack resolves from the project dir, not a stray parent package.json
    config.resolve.modules = [
      resolve(import.meta.dirname ?? ".", "node_modules"),
      "node_modules",
    ];
    return config;
  },
};

export default withPWA(nextConfig);
