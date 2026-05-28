'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // 👈 引入網址參數讀取器
import { ArrowLeft, HelpCircle, Lock, ChevronDown, Check, X, Save, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/core/client/supabase'; // 👈 引入資料庫連線

import DraftRecoveryModal from './DraftRecoveryModal';
import ImageControlBox from './ImageControlBox';
import AdvancedEvaluationGrid from './AdvancedEvaluationGrid';

interface ProjectDetails {
  id: string;
  name: string;
  unit: string;
  status: string;
  priority: string;
}

export default function ProjectAssessmentClient() {
  const params = useParams();
  const projectId = params.id as string; // 👈 從網址抓下 REQ-2026-XXX

  // --- 動態資料狀態 ---
  const [projectData, setProjectData] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 舊有的 UI 狀態 ---
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusOptions = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成', 'POC案執行中', '專案處理'];

  const [isEditingPain, setIsEditingPain] = useState(false);
  const [painText, setPainText] = useState('現行消金會員推薦散落在各渠道系統，資料每週才更新一次，無法做到跨通路的即時行為標籤反饋，導致黃金行銷時間流失。');

  const appSectionOwners = ['趙俊安（應用科）', '邱仕翔（應用科）'];
  const planSectionOwners = ['任文燕（企劃科）'];
  const techSectionOwners = ['謝琇旻（科技科）', '郭珊珊（科技科）'];

  // 🛡️ 核心邏輯：當元件載入時，去 Supabase 撈取這筆 ID 的真實資料
  useEffect(() => {
    async function fetchProjectDetail() {
      if (!projectId) return;
      
      try {
        const { data, error } = await supabase
          .from('m01_projects')
          .select('*')
          .eq('project_code', projectId)
          .single(); // 我們只要唯一的一筆

        if (error) throw error;

        if (data) {
          setProjectData({
            id: data.project_code,
            name: data.project_name,
            unit: data.unit_name_snapshot || '未指定單位',
            status: data.status_name_snapshot || '未指定狀態',
            priority: data.priority
          });
        }
      } catch (error) {
        console.error('讀取專案詳情失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjectDetail();
  }, [projectId]);

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto w-full select-none max-w-[1400px] mx-auto space-y-8 pb-32">
      
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
        
        {/* 🛡️ 替換為動態資料區塊 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm shadow-slate-100/30 flex items-center justify-between relative min-h-[90px]">
          {isLoading ? (
            <div className="flex items-center gap-3 text-indigo-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold animate-pulse">正在載入專案資料...</span>
            </div>
          ) : projectData ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/40">
                    {projectData.id} {/* 👈 真實 ID */}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${projectData.priority === 'P0' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                    {projectData.priority} 優先級 {/* 👈 真實優先級 */}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{projectData.name} {/* 👈 真實名稱 */}</h2>
                <p className="text-xs text-slate-400 font-medium">需求單位：{projectData.unit} {/* 👈 真實單位 */}</p>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 rounded-full shadow-sm hover:bg-indigo-50 transition-all"
                >
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                  {projectData.status} {/* 👈 真實狀態 */}
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
                          onClick={() => { 
                            setProjectData({...projectData, status}); 
                            setIsStatusOpen(false); 
                            // 💡 下一步我們可以在這裡接上 API 寫回資料庫的更新功能
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span>{status}</span>
                          {projectData.status === status && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm font-bold text-rose-500">找不到專案資料，請確認網址是否正確。</div>
          )}
        </div>

        {/* --- 以下保持不變 (負責人、文字框、圖表) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">應用科負責人 (多選)</h3>
              <div className="flex flex-wrap gap-1.5">
                {appSectionOwners.map(name => <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>)}
              </div>
            </div>
          </div>
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">企劃科負責人 (多選)</h3>
              <div className="flex flex-wrap gap-1.5">
                {planSectionOwners.map(name => <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>)}
              </div>
            </div>
          </div>
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">科技科負責人 (多選)</h3>
              <div className="flex flex-wrap gap-1.5">
                {techSectionOwners.map(name => <span key={name} className="text-[11px] font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{name}</span>)}
              </div>
            </div>
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