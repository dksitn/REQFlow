'use client';

import React, { useState } from 'react';
import { CheckCircle2, PieChart, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyWorkspaceSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={`bg-slate-50/30 border-l border-slate-200/80 min-h-[calc(100vh-64px)] flex flex-col justify-between shrink-0 relative transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-0 border-l-0' : 'w-80 p-5'
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute top-4 z-50 bg-white border border-slate-200 shadow-sm p-1.5 rounded-l-md hover:bg-slate-50 text-slate-400 cursor-pointer transition-all ${
          isCollapsed ? '-left-8 border-r rounded-r-md' : '-left-7'
        }`}
      >
        {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      <div className={`flex flex-col gap-6 h-full w-full ${isCollapsed ? 'hidden overflow-hidden' : 'animate-in fade-in duration-200'}`}>
        
        {/* 1. 待處理事項 */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 tracking-tight">待處理事項 (To-Do)</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-sm border-l-2 border-l-rose-500">
              <p className="text-[11px] font-bold text-slate-800 mb-1">REQ-2026-006 專案狀態逾期</p>
              <p className="text-[10px] text-slate-500">已停滯於「需求單位討論」超過 3 個工作天，請推進狀態。</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-800 mb-1">REQ-2026-001 流程圖缺漏</p>
              <p className="text-[10px] text-slate-500">等待應用科上傳 To-Be 目標架構圖草稿。</p>
            </div>
          </div>
        </div>

        {/* 2. 我的角色分布 */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 tracking-tight">角色分布</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-slate-200 rounded p-2 text-center">
              <div className="text-[10px] text-slate-500 font-bold mb-1">Project Owner</div>
              <div className="text-lg font-extrabold text-slate-800">1</div>
            </div>
            <div className="bg-white border border-slate-200 rounded p-2 text-center">
              <div className="text-[10px] text-slate-500 font-bold mb-1">Contributor</div>
              <div className="text-lg font-extrabold text-slate-800">3</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}