'use client';

import React, { useState } from 'react';
import { Lock, FileEdit, Check, X } from 'lucide-react';

export default function AssessmentTextCards() {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('現行消金會員推薦散落在各渠道系統，資料每週才更新一次，無法做到跨通路（App、臨櫃、ATM）的即時行為標籤反饋，導致黃金行銷時間流失。');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* 卡片 1：現行作業痛點 (展示協作鎖切換功能) */}
      <div className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm shadow-slate-100/40 relative group">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">一、現行作業流程與痛點</h3>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              <FileEdit className="w-3 h-3" /> 點擊編輯
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setIsEditing(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
              <button onClick={() => setIsEditing(false)} className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded"><Check className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea 
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 bg-slate-50/30 text-slate-700 font-medium"
          />
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{text}</p>
        )}
      </div>

      {/* 卡片 2：目標優化設計 (展示被他人鎖定唯讀的防禦性 UI-002-LOCK) */}
      <div className="bg-slate-50/50 border border-slate-200/40 rounded-xl p-5 relative overflow-hidden">
        {/* 他人正在編輯遮罩 */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[0.5px] flex items-center justify-center z-10">
          <div className="bg-white border border-slate-200 shadow-lg px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Lock className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span>任文燕 正在編輯此區塊...</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">二、目標藍圖與優化設計</h3>
        </div>
        <p className="text-sm text-slate-400 select-none leading-relaxed font-medium">
          導入實時串流資料架構（Kafka + Flink），將會員即時標籤計算時效由 7 天縮短至 3 秒內。右側側邊欄提供完整 API 規格對接說明...
        </p>
      </div>
    </div>
  );
}