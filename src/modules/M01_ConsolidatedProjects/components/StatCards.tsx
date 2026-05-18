'use client';

import React, { useMemo } from 'react';
import { ClipboardList, Activity, Clock, Layers } from 'lucide-react';

interface RawStatItem {
  key: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  desc: string;
}

export default function StatCards() {
  // 1. 唯一核心真實假數據源 (未來直連 Supabase 聚合結果)
  const rawStats = useMemo<RawStatItem[]>(() => [
    { key: 'EVAL', label: '評估案總數', count: 12, icon: <ClipboardList className="w-4 h-4 text-indigo-600" />, desc: '智金處專案架構評估中' },
    { key: 'POC', label: 'POC案執行中', count: 4, icon: <Activity className="w-4 h-4 text-emerald-600" />, desc: '技術概念驗證與階段開發' },
    { key: 'PEND', label: 'Pending中案件', count: 2, icon: <Clock className="w-4 h-4 text-amber-600" />, desc: '等待需求單位補充文件' }
  ], []);

  // 2. 自動防禦工程：動態加總，確保總數完全等於子案型加總，不穿幫
  const totalCases = useMemo(() => {
    return rawStats.reduce((sum, item) => sum + item.count, 0);
  }, [rawStats]);

  return (
    <div className="space-y-4 select-none">
      {/* 總計數據留痕條 */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">智金處列管案源總計</span>
        </div>
        <span className="text-xs font-bold bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 shadow-sm font-mono">
          {totalCases} Active Projects
        </span>
      </div>

      {/* 三大案型卡片矩陣 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rawStats.map((stat) => (
          <div 
            key={stat.key} 
            className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm shadow-slate-100/40 hover:border-slate-300/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                {stat.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">{stat.count}</span>
              <span className="text-xs font-bold text-slate-400">件</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}