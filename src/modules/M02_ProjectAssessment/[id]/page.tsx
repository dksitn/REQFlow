'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Lock, ChevronDown, Check, UploadCloud, Eye, Save, X } from 'lucide-react';

export default function ProjectAssessmentDetail() {
  // --- 專案狀態彈窗控制 ---
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('應用科評估完成');
  const statusOptions = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成', 'POC案執行中', '專案處理'];

  // --- 區塊級編輯與協作鎖狀態仿真 ---
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [painpointText, setPainpointText] = useState('現行消金會員推薦散落在各渠道系統，資料每週才更新一次，無法做到跨通路（App、臨櫃、ATM）的即時行為標籤反饋，導致黃金行銷時間流失。');

  // --- 三科別指派多選名單 (依據 2.2 限定同仁配置) ---
  const appSection = ['趙俊安（應用科）', '邱仕翔（應用科）'];
  const planSection = ['任文燕（企劃科）'];
  const techSection = ['謝琇旻（科技科）', '郭珊珊（科技科）'];

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto w-full select-none max-w-[1400px] mx-auto space-y-8 pb-32">
      
      {/* 頂部頁面導航標頭 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">個別專案綜合評估</h1>
            <p className="text-[11px] text-slate-400 font-medium">
              審查人員：<span className="text-slate-600 font-bold">沈廷翼 Admin</span>
            </p>
          </div>
        </div>
        <HelpCircle className="w-4 h-4 text-slate-300 cursor-pointer hover:text-slate-500" />
      </div>

      {/* =========================================================================
          第一段：基本資料 + 專案負責人 + 6大評估內容 + 圖片對照
          ========================================================================= */}
      <div className="space-y-6">
        
        {/* 基本資訊與客製化狀態單選彈窗 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm shadow-slate-100/30 flex items-center justify-between relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/40">REQ-2026-001</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full">評估中 / P1</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">全通路會員智能推薦系統</h2>
            <p className="text-xs text-slate-400 font-medium">需求單位：消金暨信用卡總處</p>
          </div>

          {/* 狀態變更核心元件 */}
          <div className="relative">
            <button 
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 rounded-full shadow-sm hover:bg-indigo-50 transition-all"
            >
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
              {currentStatus}
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {isStatusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1">選擇專案狀態 (單選)</div>
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => { setCurrentStatus(status); setIsStatusOpen(false); }}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span>{status}</span>
                      {currentStatus === status && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 三科別負責人指派區 (多選架構展示) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 應用科 */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">應用科負責人</h3>
              <div className="flex flex-wrap gap-1.5">
                {appSection.map(name => (
                  <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 text-right"><span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">+ 新增人員</span></div>
          </div>
          {/* 企劃科 */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">企劃科負責人</h3>
              <div className="flex flex-wrap gap-1.5">
                {planSection.map(name => (
                  <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 text-right"><span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">+ 新增人員</span></div>
          </div>
          {/* 科技科 */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">科技科負責人</h3>
              <div className="flex flex-wrap gap-1.5">
                {techSection.map(name => (
                  <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 text-right"><span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">+ 新增人員</span></div>
          </div>
        </div>

        {/* 上半部 6 大專案評估內容卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. 工作職掌與現行工作流程 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">工作職掌與現行工作流程</h3>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">消金推廣人員手動自業務系統撈取上週報表，經 Excel 篩選後，再匯入個別通路系統執行單點行銷。</p>
          </div>

          {/* 2. 現行作業痛點 (展示欄位級協作鎖與編輯切換) */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm relative group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">現行作業痛點</h3>
              {editingCard !== 'painpoint' ? (
                <button onClick={() => setEditingCard('painpoint')} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">編輯</button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditingCard(null)} className="p-0.5 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingCard(null)} className="p-0.5 text-emerald-600 bg-emerald-50 rounded"><Save className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            {editingCard === 'painpoint' ? (
              <textarea rows={3} value={painpointText} onChange={(e) => setPainpointText(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-medium text-slate-700" />
            ) : (
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">{painpointText}</p>
            )}
          </div>

          {/* 3. 專案目標 (展示被他人鎖定之狀態) */}
          <div className="bg-slate-50/50 border border-slate-200/40 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[0.5px] flex items-center justify-center z-10">
              <div className="bg-white border border-slate-200 shadow-sm px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Lock className="w-3 h-3 text-amber-500 animate-bounce" />
                <span>任文燕（企劃科） 正在編輯此區塊...</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">專案目標</h3>
            <p className="text-xs text-slate-300 font-medium">建立大數據實時行銷標籤計算核心，將跨通路反饋時效由 7 天降至 3 秒內。</p>
          </div>

          {/* 4. 影響範圍－人員 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">影響範圍－人員</h3>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">消金總處全體行銷企劃同仁、智金處數據架構科、資訊中台維運團隊。</p>
          </div>

          {/* 5. 影響範圍－時間 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">影響範圍－時間</h3>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">預計前置架構調整耗時 2 週，模型部署與通路端 API 對接測試耗時 2 週。</p>
          </div>

          {/* 6. 影響範圍－效益 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">影響範圍－效益</h3>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">省去人工拉表過濾時間，每月釋放約 45 個工作人時，且行銷時效轉為即時。</p>
          </div>
        </div>

        {/* As-Is / To-Be 流程圖區塊 (嚴格置於第一段正下方，標註單張不超過 2MB) */}
        <div className="border border-slate-200/80 bg-white rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">四、現況與目標流程圖對照 (As-Is / To-Be)</div>
          <div className="text-[10px] text-slate-400 font-medium mb-4">提示規則：支援 <span className="font-mono">JPG / PNG / WebP</span>，單張不超過 <span className="text-indigo-600 font-bold">2MB</span></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-700">As-Is 流程圖草圖</span>
              <div className="flex items-center gap-2 mt-4">
                <button className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600 shadow-sm"><Eye className="w-3 h-3" /> 檢視</button>
                <button className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded text-slate-400 cursor-not-allowed"><UploadCloud className="w-3 h-3" /> 上傳</button>
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-700">To-Be 目標架構圖</span>
              <div className="flex items-center gap-2 mt-4">
                <button className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600 shadow-sm"><Eye className="w-3 h-3" /> 檢視</button>
                <button className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded shadow-sm"><UploadCloud className="w-3 h-3" /> 上傳</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          第二段：進階評估 2x2 矩陣排列 (同一頁向下捲動解鎖，完美平鋪無切頁)
          ========================================================================= */}
      <div className="pt-8 border-t border-slate-200/80 space-y-4">
        <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
          ▼ 第二段：進階綜合評估矩陣
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. 業務評估 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">業務評估 (Business)</h4>
            <div className="space-y-2.5 text-xs font-medium text-slate-600">
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">質化效益:</span> 提升消金使用者跨通路行銷體驗，強化全通路一致性品牌黏著度。</p>
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">量化效益:</span> 預期提升全通路跨售轉換率達 14.5%，帶動手續費淨收益增長。</p>
            </div>
          </div>

          {/* 2. 技術評估 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">技術評估 (Technical)</h4>
            <div className="space-y-2.5 text-xs font-medium text-slate-600">
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">AI應用技術:</span> 即時動態協同過濾與線上深度學習推薦模型。</p>
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">資料準備程度:</span> 消金核心資料已清點，需打通即時串流 Kafka 數據線路。</p>
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">基礎建設（含AI環境）:</span> 現有 GPU 叢集運算力充足，需增設即時快取記憶體資料庫節點。</p>
            </div>
          </div>

          {/* 3. 成效追蹤指標 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">成效追蹤指標 (Tracking)</h4>
            <div className="space-y-2.5 text-xs font-medium text-slate-600">
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">品質指標:</span> 推薦模型精準度 (MAP@5) 穩定維持在 82% 以上。</p>
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">效益指標:</span> MAU 點擊率達成 8% 戰略目標，推薦 API 平均響應時間小於 50ms。</p>
            </div>
          </div>

          {/* 4. 綜合評估 */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
            <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">綜合評估 (Comprehensive)</h4>
            <div className="space-y-2.5 text-xs font-medium text-slate-600">
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">綜合判斷:</span> 本案戰略價值高，技術地基明確，具備高可行性。</p>
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">主要風險:</span> 高峰期即時高併發對核心中台造成的讀取負載壓力。</p>
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">推動建議:</span> 建議核准進行第一階段 P0 MVP 建置，由消金總處共同派員參與技術概念驗證。</p>
              <p><span className="text-[10px] font-bold text-slate-400 block mb-0.5">複用性 / 下一步:</span> 模組設計具高度可攜性，未來可直接輻射推廣至海外分行核心系統。</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}