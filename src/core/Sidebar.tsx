'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UserCheck, FileText, Shield, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  // 內部狀態控制左側折疊
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { label: '彙整全部專案', href: '/', icon: <LayoutDashboard className="w-4 h-4" />, isActive: pathname === '/' },
    { label: '我的負責案件', href: '/my-projects', icon: <UserCheck className="w-4 h-4" />, isActive: pathname === '/my-projects' },
    { label: '個別專案評估表', href: '/project/REQ-2026-001', icon: <FileText className="w-4 h-4" />, isActive: pathname.startsWith('/project') },
    { label: '權限管理', href: '/permissions', icon: <Shield className="w-4 h-4" />, isActive: pathname === '/permissions' },
  ];

  return (
    <aside 
      className={`bg-white text-slate-700 min-h-screen flex flex-col border-r border-slate-200/80 select-none shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 系統標誌區 + 折疊控制鈕 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 gap-2 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
          {!isCollapsed && (
            <span className="font-bold text-base tracking-wider text-slate-900 font-sans truncate animate-in fade-in duration-200">
              REQflow
            </span>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 導覽功能矩陣 */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-semibold transition-all ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'
            } ${
              item.isActive
                ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className={item.isActive ? 'text-indigo-600' : 'text-slate-400'}>
              {item.icon}
            </span>
            {!isCollapsed && <span className="truncate animate-in fade-in duration-200">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* 底部使用者資訊區：沈廷翼 Admin */}
      <div className={`p-3 border-t border-slate-100 flex items-center bg-slate-50/50 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200/30 shrink-0">
          廷翼
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
            <span className="text-sm font-bold text-slate-800 truncate">沈廷翼</span>
            <span className="text-xs font-semibold text-slate-400 truncate">智金處 / Admin</span>
          </div>
        )}
      </div>
    </aside>
  );
}