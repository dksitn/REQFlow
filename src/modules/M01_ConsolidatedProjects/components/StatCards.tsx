'use client';

import React from 'react';
import { ClipboardList, Activity, Clock, Layers } from 'lucide-react';

export default function StatCards() {
  // 1. 這是我們唯一的數據源 (Single Source of Truth)
  const rawStats = [
    { key: 'EVAL', label: '評估案總數', count: 12, icon: <ClipboardList className="w-5 h-5 text-indigo-600" />, desc: '智金處專案架構評估中' },
    { key: 'POC', label: 'POC案執行中', count: 4, icon: <Activity className="w-5 h-5 text-emerald-600" />, desc: '技術概念驗證與階段開發' },
    { key: 'PEND', label: 'Pending中案件', count: 2, icon: <Clock className="w-5 h-5 text-amber-600" />, desc: '等待需求單位補充文件' },
  ];

  // 2. 自動防禦工程：用 .reduce() 動態算出「絕對精準」的加總，拒絕人工寫死
  const totalCases = rawStats.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-5">
      {/* 全域總數看板 (若你的 a 處是指全站大標頭旁的總計，這行就能完美對齊) */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">智金處列管案源總計</span>
        </div>
        <span className="text-sm font-bold bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 shadow-sm font-mono">
          {totalCases} Active Projects
        </span>
      </div>

      {/* 三大案型卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rawStats.map((stat) => (
          <div 
            key={stat.key} 
            className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm shadow-slate-100/40 hover:border-slate-300/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                {stat.stat_icon || stat.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight font-sans">{stat.count}</span>
              <span className="text-xs font-semibold text-slate-400">件</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}