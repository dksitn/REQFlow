'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Lock, ChevronDown, Check, X, Save, Sparkles } from 'lucide-react';

import DraftRecoveryModal from '@/modules/M02_ProjectAssessment/components/DraftRecoveryModal';
import ImageControlBox from '@/modules/M02_ProjectAssessment/components/ImageControlBox';
import AdvancedEvaluationGrid from '@/modules/M02_ProjectAssessment/components/AdvancedEvaluationGrid';

// 🛡️ 核心修復：告訴 Next.js 靜態編譯器，請幫我把以下這幾個假資料 ID 都編譯成實體的 HTML
export function generateStaticParams() {
  return [
    { id: 'REQ-2026-001' },
    { id: 'REQ-2026-002' },
    { id: 'REQ-2026-003' },
    { id: 'REQ-2026-004' },
    { id: 'REQ-2026-006' },
    { id: 'REQ-2026-008' },
  ];
}

export default function ProjectAssessmentDetailPage() {
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('應用科評估完成');
  const statusOptions = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成', 'POC案執行中', '專案處理'];

  const [isEditingPain, setIsEditingPain] = useState(false);
  const [painText, setPainText] = useState('現行消金會員推薦散落在各渠道系統，資料每週才更新一次，無法做到跨通路的即時行為標籤反饋，導致黃金行銷時間流失。');

  const appSectionOwners = ['趙俊安（應用科）', '邱仕翔（應用科）'];
  const planSectionOwners = ['任文燕（企劃科）'];
  const techSectionOwners = ['謝琇旻（科技科）', '郭珊珊（科技科）'];

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto w-full select-none max-w-[1400px] mx-auto space-y-8 pb-32">
      
      {/* 頂部頁面導航 */}
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
        
        <button 
          onClick={() => setIsDraftOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg shadow-sm hover:bg-amber-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          模擬背景偵測草稿
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm shadow-slate-100/30 flex items-center justify-between relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/40">REQ-2026-001</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full">評估中 / P1</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">全通路會員智能推薦系統</h2>
            <p className="text-xs text-slate-400 font-medium">需求單位：消金暨信用卡總處</p>
          </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">應用科負責人 (多選)</h3>
              <div className="flex flex-wrap gap-1.5">
                {appSectionOwners.map(name => <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>)}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 text-right"><span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">+ 調整人員</span></div>
          </div>

          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">企劃科負責人 (多選)</h3>
              <div className="flex flex-wrap gap-1.5">
                {planSectionOwners.map(name => <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>)}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 text-right"><span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">+ 調整人員</span></div>
          </div>

          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">科技科負責人 (多選)</h3>
              <div className="flex flex-wrap gap-1.5">
                {techSectionOwners.map(name => <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>)}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 text-right"><span className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">+ 調整人員</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">工作職掌與現行工作流程</h3>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">消金推廣人員手動自業務系統撈取上週報表，經 Excel 篩選後，再匯入個別通路系統執行單點行銷。</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm relative group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">現行作業痛點</h3>
              {!isEditingPain ? (
                <button onClick={() => setIsEditingPain(true)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">編輯</button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={() => setIsEditingPain(false)} className="p-0.5 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsEditingPain(false)} className="p-0.5 text-emerald-600 bg-emerald-50 rounded"><Save className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            {isEditingPain ? (
              <textarea rows={3} value={painText} onChange={(e) => setPainText(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-medium text-slate-700" />
            ) : (
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">{painText}</p>
            )}
          </div>

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

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">影響範圍－人員</h3>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">消金總處全體行銷企劃同仁、智金處數據架構科、資訊中台維運團隊。</p>
          </div>
        </div>

        <ImageControlBox />

      </div>

      <AdvancedEvaluationGrid />

      <DraftRecoveryModal 
        isOpen={isDraftOpen} 
        onClose={() => setIsDraftOpen(false)} 
        onRecover={() => {
          setPainText('現行消金會員推薦散落在各渠道系統，資料每週才更新一次。最新補件：且因分行通路與 App 標籤未即時連動，導致第一線臨櫃行銷發生資訊不對稱，黃金交叉銷售時間嚴重流失。');
          setIsDraftOpen(false);
        }}
      />

    </div>
  );
}