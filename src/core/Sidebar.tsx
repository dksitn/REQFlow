'use client';

import React from 'react';
import { LayoutDashboard, FileText, ShieldAlert, Layers } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: '彙整全部專案', active: true },
    { icon: <FileText className="w-5 h-5" />, label: '個別專案評估表', active: false },
    { icon: <ShieldAlert className="w-5 h-5" />, label: '權限管理', active: false },
  ];

  return (
    <aside className="w-64 bg-white text-slate-700 min-h-screen flex flex-col border-r border-slate-200/80">
      {/* 系統 LOGO 區 */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2.5">
        <Layers className="w-5 h-5 text-indigo-600" />
        <span className="font-bold text-base tracking-wider text-slate-900 font-sans">REQflow</span>
        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60 font-mono">
          v1.6
        </span>
      </div>

      {/* 導覽選單 */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              item.active
                ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className={item.active ? 'text-indigo-600' : 'text-slate-400'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* 底部使用者資訊快照 */}
      <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200/30">
          廷翼
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-slate-800 truncate">沈廷翼</span>
          <span className="text-xs font-medium text-slate-400 truncate">智金處 / Admin</span>
        </div>
      </div>
    </aside>
  );
}