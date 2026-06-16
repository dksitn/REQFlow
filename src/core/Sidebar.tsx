'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UserCheck, Shield, ChevronLeft, ChevronRight, Menu, X, Rocket } from 'lucide-react';
import AuthWidget from '@/components/AuthWidget';

export default function Sidebar() {
  const pathname = usePathname();
  // 💻 控制左側折疊 (電腦版)
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 📱 控制手機版選單滑出 (手機版 RWD)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 切換路徑時，手機版選單自動收起
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const menuItems = [
    { label: '彙整全部專案', href: '/', icon: <LayoutDashboard className="w-5 h-5" />, isActive: pathname === '/' },
    { label: '我的負責案件', href: '/my-projects', icon: <UserCheck className="w-5 h-5" />, isActive: pathname === '/my-projects' },
    { label: '權限管理', href: '/admin', icon: <Shield className="w-5 h-5" />, isActive: pathname === '/admin' },
  ];

  return (
    <>
      {/* 📱 手機版漢堡按鈕 (固定在左下角) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-[60] w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-700 transition-transform active:scale-95"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* 📱 手機版半透明遮罩 (點擊關閉) */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[50] animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 🖥️ 側邊欄主體 */}
      <aside
        className={`
          bg-white text-slate-700 min-h-screen flex flex-col border-r border-slate-200/80 select-none shrink-0 transition-all duration-300 ease-in-out
          fixed md:static inset-y-0 left-0 z-[55] shadow-2xl md:shadow-none
          ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header (Logo) */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0 ${isCollapsed ? 'md:justify-center' : ''}`}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="font-black text-lg text-slate-800 tracking-tight md:block hidden">REQFlow</span>
              <span className="font-black text-lg text-slate-800 tracking-tight md:hidden">REQFlow</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="bg-indigo-600 text-white p-1.5 rounded-lg hidden md:block">
              <Rocket className="w-5 h-5" />
            </Link>
          )}

          {/* 電腦版：折疊按鈕 */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-8 h-8 rounded-full bg-slate-50 border border-slate-200 items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* 手機版：關閉按鈕 */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 導覽選單 */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-lg text-sm font-semibold transition-all ${
                isCollapsed ? 'md:justify-center md:p-2.5 px-4 py-2.5' : 'gap-3 px-4 py-2.5'
              } ${
                item.isActive
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={item.isActive ? 'text-indigo-600' : 'text-slate-400'}>
                {item.icon}
              </span>
              <span className={`truncate transition-all duration-200 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* 底部 AuthWidget */}
        <div className={`p-3 border-t border-slate-100 flex flex-col items-center bg-slate-50/50 ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}>
          {!isCollapsed && <AuthWidget />}
          {isCollapsed && <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">U</div>}
        </div>
      </aside>
    </>
  );
}