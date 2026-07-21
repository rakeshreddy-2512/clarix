import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "axios-cookiejar-support",
    "tough-cookie",
    "cheerio",
    "axios",
  ],
};

export default nextConfig;