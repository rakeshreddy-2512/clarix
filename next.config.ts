import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["cheerio", "tough-cookie", "axios-cookiejar-support"],
};
export default nextConfig;