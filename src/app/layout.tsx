import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthWidget from '@/components/AuthWidget';
import Link from 'next/link';
import { FolderKanban, LayoutDashboard, Settings } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

// ----------------------------------------------------------------------
// 🔍 1. Google SEO 與社群分享標籤 (Meta Tags & Open Graph)
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

const inter = Inter({ subsets: ['latin'] });

// ----------------------------------------------------------------------
// 🧱 2. 全域根佈局 (Root Layout)
// ----------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased h-screen flex overflow-hidden`}>
        
        {/* 🖥️ 全站左側導覽列 (Global Sidebar) */}
        <nav className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0">
          {/* Logo 區塊 */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg text-slate-800 tracking-tight">REQFlow</span>
            </Link>
          </div>

          {/* 主要選單 */}
          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              專案總覽
            </Link>
            <Link href="/my-projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
              <FolderKanban className="w-4 h-4" />
              我的負責案件
            </Link>
            
            {/* 權限管理 (指向 /admin) */}
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
              <Settings className="w-4 h-4" />
              權限管理
            </Link>
          </div>

          {/* 🔐 將 AuthWidget 放在最底部，訪客永遠看得到它以便登入 */}
          <AuthWidget />
        </nav>

        {/* 📄 核心內容區塊 (Main Content)
          🚀 關鍵修復：將 overflow-hidden 改為 overflow-y-auto，釋放拉桿封印！ 
        */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative custom-scrollbar">
          <AuthGuard>
            {children}
          </AuthGuard>
        </main>

      </body>
    </html>
  );
}