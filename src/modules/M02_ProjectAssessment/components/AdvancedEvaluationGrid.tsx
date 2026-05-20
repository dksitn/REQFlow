'use client';

import React from 'react';

export default function AdvancedEvaluationGrid() {
  return (
    <div className="space-y-4 select-none">
      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <span>▼ 第二段：進階綜合評估矩陣 (同一路由垂直滾動解鎖)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. 業務評估 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-800">業務評估 (Business Evaluation)</h4>
            <span className="text-[10px] font-bold text-slate-400">卡片級鎖定可用</span>
          </div>
          <div className="space-y-3 text-xs font-medium text-slate-600">
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">質化效益:</span> 提升消金使用者跨通路行銷體驗，強化全通路一致性品牌黏著度與服務感知。</p>
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">量化效益:</span> 預期提升全通路跨售轉換率達 14.5%，第一年度帶動手續費淨收益顯著增長。</p>
          </div>
        </div>

        {/* 2. 技術評估 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-800">技術評估 (Technical Assessment)</h4>
            <span className="text-[10px] font-bold text-slate-400">卡片級鎖定可用</span>
          </div>
          <div className="space-y-3 text-xs font-medium text-slate-600">
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">AI應用技術:</span> 即時動態協同過濾與線上深度學習特徵推薦模型陣列。</p>
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">資料準備程度:</span> 消金核心資料已完成靜態清點，需打通智金中台即時串流 Kafka 數據線路。</p>
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">基礎建設環境:</span> 現有 GPU 運算叢集算力充足，需搭配增設高速記憶體資料庫緩衝節點。</p>
          </div>
        </div>

        {/* 3. 成效追蹤指標 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-800">成效追蹤指標 (Tracking Metrics)</h4>
            <span className="text-[10px] font-bold text-slate-400">卡片級鎖定可用</span>
          </div>
          <div className="space-y-3 text-xs font-medium text-slate-600">
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">品質指標:</span> 推薦模型精準度評估值 (MAP@5) 於生產環境需穩定維持在 82% 以上。</p>
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">效益指標:</span> 行銷點擊率達成 8% 戰略目標，推薦 API 平均底層響應時間限制小於 50ms。</p>
          </div>
        </div>

        {/* 4. 綜合評估 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-800">綜合評估 (Comprehensive Judgment)</h4>
            <span className="text-[10px] font-bold text-slate-400">卡片級鎖定可用</span>
          </div>
          <div className="space-y-2 text-xs font-medium text-slate-600">
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">綜合判斷:</span> 本案技術地基明確，戰略擴張價值高，整體投資報酬比極佳。</p>
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">主要風險:</span> 高峰開戶行銷期，即時高併發讀取對核心資料中台產生的負載壓力。</p>
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">推動建議:</span> 建議核准進行第一階段 P0 MVP 建置，由消金總處共同派員協作驗證。</p>
            <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">複用性 / 下一步:</span> 核心計算模組具高度封裝性，未來可直接輻射推廣至海外分行系統。</p>
          </div>
        </div>

      </div>
    </div>
  );
}