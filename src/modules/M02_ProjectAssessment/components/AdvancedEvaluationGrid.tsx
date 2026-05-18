'use client';

import React from 'react';
import { Award, Code2, LineChart, ShieldAlert } from 'lucide-react';

export default function AdvancedEvaluationGrid() {
  const cards = [
    { title: '業務面向評估 (Business)', icon: <Award className="w-4 h-4 text-amber-600" />, text: '符合本行消金數位化策略轉型戰略，預期上線後可提升全通路跨售轉換率達 14.5%，帶動手續費淨收益增長。' },
    { title: '技術面向評估 (Technical)', icon: <Code2 className="w-4 h-4 text-blue-600" />, text: '需整合中台核心系統與實時標籤運算庫，前端採用靜態託管搭配邊緣函數可保障高流量低延遲，架構可攜性佳。' },
    { title: '成效追蹤指標 (Tracking)', icon: <LineChart className="w-4 h-4 text-emerald-600" />, text: 'KPI 定義：MAU 推薦點擊率（目標 8%）、推薦 API 平均響應時間（目標 < 50ms）、活動上線天數縮短 30%。' },
    { title: '綜合評估決策 (Comprehensive)', icon: <ShieldAlert className="w-4 h-4 text-indigo-600" />, text: '建議核准進行第一階段 P0 MVP 建置，由消金總處共同派員參與技術概念驗證（POC案），預計耗時 4 週。' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        ▼ 第二段：2x2 進階綜合評估矩陣 (縱向下滑解鎖)
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card, i) => (
          <div key={i} className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm shadow-slate-100/40 hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-3.5 border-b border-slate-50 pb-2">
              {card.icon}
              {card.title}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{card.text}</p>
            <div className="text-right mt-4">
              <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600">編輯評估內容 →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}