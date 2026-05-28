import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 已經刪除 output: 'export'
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;