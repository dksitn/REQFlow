import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 啟動純靜態輸出模式
  output: 'export',
  
  // 關閉 Next.js 預設需要 Node.js 伺服器的圖片優化功能
  images: {
    unoptimized: true,
  },
};

export default nextConfig;