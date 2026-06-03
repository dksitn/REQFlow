'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Check, X, Sparkles, Loader2, Search, Building2, Edit2 } from 'lucide-react';
import { supabase } from '@/core/client/supabase';

// 引入其他元件 (若有用到)
import DraftRecoveryModal from './DraftRecoveryModal';
import ImageControlBox from './ImageControlBox';
import AdvancedEvaluationGrid from './AdvancedEvaluationGrid';

interface ProjectDetails {
  id: string;
  name: string;
  unit: string;
  status: string;
  priority: string;
  department: string;
  team_members: Record<string, string[]>;
}

// UI 配色
const DEPT_STYLES: Record<string, any> = {
  '應用科': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', xBtn: 'hover:bg-emerald-200 hover:text-emerald-800' },
  '企劃科': { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', xBtn: 'hover:bg-blue-200 hover:text-blue-800' },
  '科技科': { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', xBtn: 'hover:bg-purple-200 hover:text-purple-800' },
};

export default function ProjectAssessmentClient() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 全站唯一真相來源：m01_users (包含姓名、Email、科別)
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // 狀態與草稿
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusOptions = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成', 'POC案執行中', '專案處理'];
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  
  // 痛點編輯
  const [isEditingPain, setIsEditingPain] = useState(false);
  const [painText, setPainText] = useState('現行消金會員推薦散落在各渠道系統，資料每週才更新一次，無法做到跨通路的即時行為標籤反饋。');

  // 選人彈窗狀態
  const [assigneeModal, setAssigneeModal] = useState<{ isOpen: boolean; dept: string | null }>({ isOpen: false, dept: null });
  const [tempSelections, setTempSelections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        // 1. 載入專案資料
        const { data: projData } = await supabase.from('m01_projects').select('*').eq('id', projectId).maybeSingle();
        
        const projDetails: ProjectDetails = projData ? {
          id: projData.id,
          name: projData.name || projData.project_name || '未命名專案',
          unit: projData.unit_name_snapshot || '未指定單位',
          status: projData.status_name_snapshot || '需求單位討論',
          priority: projData.priority || 'P1',
          department: projData.department || '未指定',
          team_members: projData.team_members || { '應用科': [], '企劃科': [], '科技科': [] }
        } : {
          id: projectId, name: '讀取中或無此專案', unit: '系統預設', status: '需求單位討論', priority: 'P1', department: '', team_members: { '應用科': [], '企劃科': [], '科技科': [] }
        };
        setProject(projDetails);

        // 2. 載入全站真實帳號 (SSOT)
        const { data: usersData } = await supabase.from('m01_users').select('*').order('created_at', { ascending: false });
        if (usersData) setSystemUsers(usersData);

      } catch (error) { console.error('讀取資料失敗:', error); } 
      finally { setIsLoading(false); }
    }
    fetchData();
  }, [projectId]);

  // --- 選人邏輯 (純選擇，寫回專案) ---
  const openAssigneeModal = (dept: string) => {
    setTempSelections(project?.team_members[dept] || []); 
    setSearchTerm('');
    setAssigneeModal({ isOpen: true, dept });
  };

  const toggleSelection = (name: string) => {
    setTempSelections(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const confirmAssignees = async () => {
    if (!project || !assigneeModal.dept) return;
    const dept = assigneeModal.dept;
    const newMembers = { ...project.team_members, [dept]: tempSelections };
    
    // 樂觀更新畫面
    setProject({ ...project, team_members: newMembers });
    setAssigneeModal({ isOpen: false, dept: null });

    // 寫回資料庫 m01_projects
    await supabase.from('m01_projects').update({ team_members: newMembers }).eq('id', projectId);
  };

  const removeAssignee = async (dept: string, nameToRemove: string) => {
    if (!project) return;
    const newMembers = { ...project.team_members, [dept]: project.team_members[dept].filter(n => n !== nameToRemove) };
    setProject({ ...project, team_members: newMembers });
    await supabase.from('m01_projects').update({ team_members: newMembers }).eq('id', projectId);
  };

  const updateStatus = async (newStatus: string) => {
    if (!project) return;
    setProject({ ...project, status: newStatus });
    setIsStatusOpen(false);
    await supabase.from('m01_projects').update({ status_name_snapshot: newStatus }).eq('id', projectId);
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8FAFC]"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (!project) return <div className="p-8 font-bold text-slate-600">找不到此專案</div>;

  return (
    <div className="flex-1 bg-slate-50/50 p-8 overflow-y-auto w-full select-none max-w-[1400px] mx-auto space-y-8 pb-32">
      
      {/* 頂部導覽列 */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 shadow-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">個別專案綜合評估</h1>
        </div>
        <button onClick={() => setIsDraftOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />草稿紀錄
        </button>
      </div>

      <div className="space-y-6">
        
        {/* 專案標頭卡片 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">單位</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700">
              <Building2 className="w-4 h-4 text-slate-400" />{project.department || project.unit}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">專案名稱 <Edit2 className="w-3 h-3 text-slate-300" /></p>
            <p className="text-base font-black text-slate-800 truncate">{project.name}</p>
          </div>
          <div className="relative">
            <p className="text-[11px] font-bold text-slate-400 mb-1.5">專案狀態</p>
            <button onClick={() => setIsStatusOpen(!isStatusOpen)} className="w-full flex items-center justify-between px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all">
              <span className="text-sm font-black text-indigo-700">{project.status}</span><ChevronDown className="w-4 h-4 text-indigo-400" />
            </button>
            {isStatusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50">
                  {statusOptions.map((status) => (
                    <button key={status} onClick={() => updateStatus(status)} className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-bold text-slate-700 hover:bg-slate-50">
                      {status}{project.status === status && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 專案負責人區塊 */}
        <div className="px-2">
          <h3 className="text-sm font-black text-slate-800 mb-4 tracking-tight">專案負責人</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {['應用科', '企劃科', '科技科'].map((dept) => {
              const style = DEPT_STYLES[dept];
              const assignees = project.team_members[dept] || [];

              return (
                <div key={dept} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full min-h-[140px]">
                  <div>
                    <h4 className={`text-xs font-black mb-3 ${style.text}`}>{dept}</h4>
                    <div className="flex flex-wrap gap-2">
                      {assignees.length === 0 ? <span className="text-xs font-bold text-slate-300">尚未指派</span> : (
                        assignees.map(name => (
                          <div key={name} className={`flex items-center gap-1.5 text-[11px] font-bold ${style.bg} ${style.text} ${style.border} border px-2.5 py-1 rounded-md shadow-sm`}>
                            {name}
                            <button onClick={() => removeAssignee(dept, name)} className={`p-0.5 rounded-sm transition-colors ${style.xBtn}`}><X className="w-3 h-3" /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button onClick={() => openAssigneeModal(dept)} className="mt-4 w-full border border-dashed border-slate-300 rounded-lg py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 flex justify-center gap-1">
                    選擇人員 +
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 痛點編輯區 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-indigo-600 mb-3">工作職掌與現行工作流程</h3>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">消金推廣人員手動自業務系統撈取上週報表，經 Excel 篩選後，再匯入個別通路系統執行單點行銷。</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm relative group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-rose-600">現行作業痛點</h3>
              {!isEditingPain ? (
                <button onClick={() => setIsEditingPain(true)} className="text-[10px] font-bold text-slate-500 border bg-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 shadow-sm">點擊編輯</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingPain(false)} className="px-3 py-1 text-[10px] font-bold text-slate-500 border rounded-md">取消</button>
                  <button onClick={() => setIsEditingPain(false)} className="px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 rounded-md shadow-sm">確認計分</button>
                </div>
              )}
            </div>
            {isEditingPain ? (
              <textarea rows={3} value={painText} onChange={(e) => setPainText(e.target.value)} className="w-full text-xs border rounded-lg p-3 focus:outline-none focus:border-indigo-400 font-bold text-slate-700 bg-slate-50/50" />
            ) : <p className="text-xs text-slate-600 font-bold leading-relaxed">{painText}</p>}
          </div>
        </div>

        <ImageControlBox />
      </div>

      <AdvancedEvaluationGrid />

      {/* 🚀 選擇人員彈窗 (純淨勾選版，改接 m01_users) */}
      {assigneeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div className="px-5 py-4 border-b flex justify-between bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800">管理 {assigneeModal.dept} 專案成員</h2>
              <button onClick={() => setAssigneeModal({ isOpen: false, dept: null })} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋姓名..." className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400" />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {systemUsers
                  .filter(u => u.department === assigneeModal.dept) // 篩選科別
                  .filter(u => u.full_name.includes(searchTerm))    // 關鍵字搜尋
                  .length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs font-bold text-slate-400">系統中無符合條件的人員</p>
                      <p className="text-[10px] font-bold text-rose-500 mt-1">※ 若需新增人員，請聯繫 Admin 至「權限管理」建檔。</p>
                    </div>
                ) : (
                  systemUsers
                    .filter(u => u.department === assigneeModal.dept)
                    .filter(u => u.full_name.includes(searchTerm))
                    .map(u => {
                      const isSelected = tempSelections.includes(u.full_name);
                      return (
                        <div key={u.id} onClick={() => toggleSelection(u.full_name)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${isSelected ? 'border-blue-400 bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`}>{u.full_name.charAt(0)}</div>
                            <div className="flex flex-col"><span className={`text-xs font-black ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{u.full_name}</span><span className="text-[10px] font-bold text-slate-400">{u.email}</span></div>
                          </div>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white'}`}>{isSelected && <Check className="w-3.5 h-3.5 text-white" />}</div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t flex gap-3 bg-slate-50/50">
              <button onClick={() => setAssigneeModal({ isOpen: false, dept: null })} className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white border rounded-xl hover:bg-slate-50 shadow-sm">取消</button>
              <button onClick={confirmAssignees} className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm">確認名單 ({tempSelections.length})</button>
            </div>
          </div>
        </div>
      )}

      <DraftRecoveryModal isOpen={isDraftOpen} onClose={() => setIsDraftOpen(false)} onRecover={() => setIsDraftOpen(false)} />
    </div>
  );
}