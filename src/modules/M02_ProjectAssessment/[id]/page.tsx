'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Check, X, Save, Sparkles, Loader2, Search } from 'lucide-react';
import { supabase } from '@/core/client/supabase';

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

// UI 配色設定檔案
const DEPT_STYLES: Record<string, any> = {
  '應用科': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', xBtn: 'hover:bg-emerald-200 hover:text-emerald-800' },
  '企劃科': { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', xBtn: 'hover:bg-blue-200 hover:text-blue-800' },
  '科技科': { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', xBtn: 'hover:bg-purple-200 hover:text-purple-800' },
};

export default function ProjectAssessmentClient() {
  const params = useParams();
  const projectId = params.id as string;

  // --- 動態資料狀態 ---
  const [projectData, setProjectData] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 人員名單庫 (來自資料庫) ---
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  
  // --- 專案已選取的負責人 ---
  const [selectedAssignees, setSelectedAssignees] = useState<Record<string, string[]>>({
    '應用科': [],
    '企劃科': [],
    '科技科': []
  });

  // --- 彈窗與編輯狀態 ---
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusOptions = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成', 'POC案執行中', '專案處理'];
  const [isEditingPain, setIsEditingPain] = useState(false);
  const [painText, setPainText] = useState('現行消金會員推薦散落在各渠道系統，資料每週才更新一次，無法做到跨通路的即時行為標籤反饋，導致黃金行銷時間流失。');
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  // --- 選人彈窗 (Modal) 狀態 ---
  const [assigneeModal, setAssigneeModal] = useState<{ isOpen: boolean; dept: string | null }>({ isOpen: false, dept: null });
  const [tempSelections, setTempSelections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 🛡️ 核心邏輯：載入專案資料 & 全站人員清單
  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        // 1. 撈取專案資訊
        const { data: projData, error: projErr } = await supabase.from('m01_projects').select('*').eq('project_code', projectId).single();
        if (projData) {
          setProjectData({
            id: projData.project_code,
            name: projData.project_name,
            unit: projData.unit_name_snapshot || '未指定單位',
            status: projData.status_name_snapshot || '未指定狀態',
            priority: projData.priority
          });
        }

        // 2. 撈取全站負責人清單 (SSOT 真相來源)
        const { data: pData } = await supabase.from('m01_personnel').select('*');
        if (pData) setPersonnelList(pData);

      } catch (error) {
        console.error('讀取資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  // --- 選人彈窗控制邏輯 ---
  const openAssigneeModal = (dept: string) => {
    setTempSelections(selectedAssignees[dept] || []); // 載入目前已選的
    setSearchTerm('');
    setAssigneeModal({ isOpen: true, dept });
  };

  const toggleSelection = (name: string) => {
    if (tempSelections.includes(name)) {
      setTempSelections(tempSelections.filter(n => n !== name));
    } else {
      setTempSelections([...tempSelections, name]);
    }
  };

  const confirmAssignees = () => {
    if (assigneeModal.dept) {
      setSelectedAssignees(prev => ({ ...prev, [assigneeModal.dept!]: tempSelections }));
    }
    setAssigneeModal({ isOpen: false, dept: null });
    // 💡 未來可在此呼叫 API，將 selectedAssignees 寫回 m01_projects
  };

  // 從外層卡片直接移除人員
  const removeAssignee = (dept: string, nameToRemove: string) => {
    setSelectedAssignees(prev => ({
      ...prev,
      [dept]: prev[dept].filter(name => name !== nameToRemove)
    }));
  };

  return (
    <div className="flex-1 bg-slate-50/50 p-8 overflow-y-auto w-full select-none max-w-[1400px] mx-auto space-y-8 pb-32">
      
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">個別專案綜合評估</h1>
          </div>
        </div>
        
        <button onClick={() => setIsDraftOpen(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          草稿紀錄
        </button>
      </div>

      <div className="space-y-6">
        
        {/* 專案標頭卡片 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between relative min-h-[90px]">
          {isLoading ? (
            <div className="flex items-center gap-3 text-indigo-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold">載入中...</span>
            </div>
          ) : projectData ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/50">{projectData.id}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${projectData.priority === 'P0' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                    {projectData.priority}
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-800">{projectData.name}</h2>
                <p className="text-xs text-slate-400 font-bold flex items-center gap-1">單位：{projectData.unit}</p>
              </div>

              <div className="relative">
                <button onClick={() => setIsStatusOpen(!isStatusOpen)} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 rounded-lg shadow-sm hover:bg-indigo-50 transition-all">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                  {projectData.status}
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                </button>

                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1">選擇狀態 (單選)</div>
                      {statusOptions.map((status) => (
                        <button key={status} onClick={() => { setProjectData({...projectData, status}); setIsStatusOpen(false); }} className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors">
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
            <div className="text-sm font-bold text-rose-500">找不到專案資料</div>
          )}
        </div>

        <div className="px-2">
          <h3 className="text-sm font-black text-slate-800 mb-4 tracking-tight">專案負責人</h3>
          {/* 🛡️ 負責人選擇區塊 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {['應用科', '企劃科', '科技科'].map((dept) => {
              const style = DEPT_STYLES[dept];
              const assignees = selectedAssignees[dept];

              return (
                <div key={dept} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full min-h-[140px]">
                  <div>
                    <h4 className={`text-xs font-black mb-3 ${style.text}`}>{dept}</h4>
                    <div className="flex flex-wrap gap-2">
                      {assignees.length === 0 ? (
                        <span className="text-xs font-bold text-slate-300">尚未指派</span>
                      ) : (
                        assignees.map(name => (
                          <div key={name} className={`flex items-center gap-1.5 text-[11px] font-bold ${style.bg} ${style.text} ${style.border} border px-2.5 py-1 rounded-md shadow-sm`}>
                            {name}
                            <button onClick={() => removeAssignee(dept, name)} className={`p-0.5 rounded-sm transition-colors ${style.xBtn}`}><X className="w-3 h-3" /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button onClick={() => openAssigneeModal(dept)} className="mt-4 w-full border border-dashed border-slate-300 rounded-lg py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-1">
                    選擇人員 +
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 痛點編輯區 --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-indigo-600 mb-3">工作職掌與現行工作流程</h3>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">消金推廣人員手動自業務系統撈取上週報表，經 Excel 篩選後，再匯入個別通路系統執行單點行銷。</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm relative group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-rose-600">現行作業痛點</h3>
              {!isEditingPain ? (
                <button onClick={() => setIsEditingPain(true)} className="text-[10px] font-bold text-slate-500 border border-slate-200 bg-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 shadow-sm">點擊編輯</button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditingPain(false)} className="px-3 py-1 text-[10px] font-bold text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50">取消</button>
                  <button onClick={() => setIsEditingPain(false)} className="px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm flex items-center gap-1"><Check className="w-3 h-3"/> 確認計分</button>
                </div>
              )}
            </div>
            {isEditingPain ? (
              <textarea rows={3} value={painText} onChange={(e) => setPainText(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-indigo-400 font-bold text-slate-700 shadow-inner bg-slate-50/50" />
            ) : (
              <p className="text-xs text-slate-600 font-bold leading-relaxed">{painText}</p>
            )}
          </div>
        </div>

        <ImageControlBox />
      </div>

      <AdvancedEvaluationGrid />

      {/* 🚀 選擇人員彈窗 (純消費者模式：無新增功能) */}
      {assigneeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">管理 {assigneeModal.dept} 專案成員</h2>
              <button onClick={() => setAssigneeModal({ isOpen: false, dept: null })} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4"/></button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* 純搜尋框 */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋姓名..." 
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm"
                />
              </div>

              {/* ⚠️ 依照需求：拔除「快速新增」的輸入框與按鈕，只顯示名單！ */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {personnelList
                  .filter(p => p.role_type === assigneeModal.dept)
                  .filter(p => p.name.includes(searchTerm))
                  .length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs font-bold text-slate-400">系統中無符合條件的人員</p>
                      <p className="text-[10px] font-bold text-rose-500 mt-1">※ 若需增加人員，請聯繫 Admin 至「權限管理」頁面統一建檔。</p>
                    </div>
                ) : (
                  personnelList
                    .filter(p => p.role_type === assigneeModal.dept)
                    .filter(p => p.name.includes(searchTerm))
                    .map(p => {
                      const isSelected = tempSelections.includes(p.name);
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => toggleSelection(p.name)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-400 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`}>
                              {p.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-xs font-black ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{p.name}</span>
                              <span className="text-[10px] font-bold text-slate-400">{p.role_type}</span>
                            </div>
                          </div>
                          {/* 客製化 Checkbox 視覺 */}
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => setAssigneeModal({ isOpen: false, dept: null })} className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all">取消</button>
              <button onClick={confirmAssignees} className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 transition-all">
                確認名單 ({tempSelections.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <DraftRecoveryModal 
        isOpen={isDraftOpen} 
        onClose={() => setIsDraftOpen(false)} 
        onRecover={() => { setPainText('備份內容恢復測試'); setIsDraftOpen(false); }}
      />
    </div>
  );
}