import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// 🚀 關鍵修正：精準對齊你的 Sidebar 實際存放路徑 (src/core/Sidebar.tsx)
import Sidebar from '@/core/Sidebar'; 

import AuthGuard from '@/components/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

// ----------------------------------------------------------------------
// 🔍 1. Google SEO 與社群分享標籤 (Meta Tags & Open Graph) - 純 Server 屬性
// ----------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    template: '%s | REQFlow 企業級專案管理', 
    default: 'REQFlow | 智金處專案架構與資源列管平台', 
  },
  description: '專為智金處打造的高效專案架構、資源列管與需求評估系統。支援動態架構圖、雙向追蹤與權限隔離。',
  keywords: ['專案管理', '系統架構', '需求評估', 'SaaS', '智金處'],
  openGraph: {
    title: 'REQFlow | 智金處專案架構與資源列管平台',
    description: '專為智金處打造的高效專案架構、資源列管與需求評估系統。',
    siteName: 'REQFlow',
    type: 'website',
    locale: 'zh_TW',
  },
  robots: {
    index: true, 
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// ----------------------------------------------------------------------
// 根佈局主體
// ----------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full bg-slate-50">
      <head>
        {/* Next.js 14+ 會自動將 metadata 轉換為 head 標籤，此處保持標準結構 */}
      </head>
      <body className={`${inter.className} h-full antialiased flex overflow-hidden selection:bg-indigo-100 selection:text-indigo-900`}>
        
        {/* 🚀 載入剛才修改好、帶有「手機版漢堡選單與 RWD 邏輯」的 Client Sidebar */}
        <Sidebar />
        
        {/* 右側主要內容呈現區 */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full overflow-hidden">
          <AuthGuard>
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
              {children}
            </div>
          </AuthGuard>
        </main>

      </body>
    </html>
  );
}