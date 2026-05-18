'use client';

import React, { useState } from 'react';
import { Calendar, Building, ChevronDown, Check } from 'lucide-react';

export default function BasicInfoCard() {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('應用科評估完成');

  // 符合專案狀態設定_v1.6 的 6 大初始狀態
  const statusOptions = [
    '需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成', 'POC案執行中', '專案處理'
  ];

  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-6 shadow-sm shadow-slate-100/40 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 左側：編號與專案名稱 */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/40">
              REQ-2026-001
            </span>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
              P0 高優先級
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">全通路會員智能推薦系統</h2>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> 消金暨信用卡總處</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 建立日期：2026-05-14</span>
          </div>
        </div>

        {/* 右側：狀態彈窗膠囊 (UI-002-STATUS 實作) */}
        <div className="relative">
          <button 
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 rounded-full shadow-sm hover:bg-indigo-50 transition-all"
          >
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
            {currentStatus}
            <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          {/* 狀態單選下拉彈窗 */}
          {isStatusOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-100 mb-1">
                變更專案狀態 (單選)
              </div>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setCurrentStatus(status);
                    setIsStatusOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {status}
                  {currentStatus === status && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}