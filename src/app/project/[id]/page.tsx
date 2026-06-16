'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, FileDown, Lock, Edit3, X, UserPlus, Image as ImageIcon } from 'lucide-react';

export default function ProjectEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // 資料狀態
  const [projectData, setProjectData] = useState<any>(null);
  const [statusDict, setStatusDict] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 編輯與鎖定狀態 (模擬 m01_edit_drafts / m01_edit_locks)
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [confirmedFields, setConfirmedFields] = useState<Record<string, boolean>>({});

  // 人員選擇 Modal 狀態
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<string>('');

  useEffect(() => {
    async function fetchAllData() {
      try {
        const [projRes, statRes, usersRes] = await Promise.all([
          supabase.from('m01_projects').select('*').eq('id', projectId).single(),
          supabase.from('m01_status_dict').select('*').order('sort_order', { ascending: true }),
          supabase.from('m01_users').select('*')
        ]);

        if (projRes.data) {
          setProjectData(projRes.data);
          setConfirmedFields(projRes.data.confirmed_fields || {});
          
          // 確保 team_members 結構存在
          if (!projRes.data.team_members) {
            projRes.data.team_members = { '應用科': [], '企劃科': [], '科技科': [] };
          }
        }
        if (statRes.data) setStatusDict(statRes.data);
        if (usersRes.data) setUsersList(usersRes.data);

      } catch (error) {
        console.error('資料載入失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllData();
  }, [projectId]);

  // --- 核心操作邏輯 ---
  const saveProjectToDB = async (updates: any) => {
    try {
      await supabase.from('m01_projects').update(updates).eq('id', projectId);
      setProjectData((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('儲存失敗', error);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    saveProjectToDB({ status_name_snapshot: newStatus });
  };

  // 格子編輯邏輯
  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setDrafts(prev => ({ ...prev, [field]: currentValue || '' }));
  };

  const handleCancel = (field: string) => {
    setEditingField(null);
    setDrafts(prev => ({ ...prev, [field]: '' }));
  };

  const handleSaveGrid = async (field: string) => {
    await saveProjectToDB({ [field]: drafts[field] });
    setEditingField(null);
  };

  const handleCompleteGrid = async (field: string) => {
    const newConfirmed = { ...confirmedFields, [field]: true };
    await saveProjectToDB({ confirmed_fields: newConfirmed });
    setConfirmedFields(newConfirmed);
  };

  // 人員選擇邏輯
  const openUserModal = (dept: string) => {
    setActiveDept(dept);
    setIsUserModalOpen(true);
  };

  const toggleUserSelection = async (userName: string) => {
    const currentTeam = projectData.team_members || { '應用科': [], '企劃科': [], '科技科': [] };
    const deptUsers = currentTeam[activeDept] || [];
    
    let newDeptUsers;
    if (deptUsers.includes(userName)) {
      newDeptUsers = deptUsers.filter((n: string) => n !== userName);
    } else {
      newDeptUsers = [...deptUsers, userName];
    }

    const newTeam = { ...currentTeam, [activeDept]: newDeptUsers };
    await saveProjectToDB({ team_members: newTeam });
  };

  // 輸出 PDF
  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!projectData) return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;

  // 計算資料完整度 (定義總共有 11 個需要完成的格子)
  const totalGrids = 11; 
  const completedGrids = Object.keys(confirmedFields).filter(k => confirmedFields[k]).length;
  const completeness = Math.round((completedGrids / totalGrids) * 100);

  // --- 共用的格子 UI 元件 ---
  const GridBlock = ({ title, dbField, type = 'textarea' }: { title: string, dbField: string, type?: 'textarea' | 'image' }) => {
    const isEditing = editingField === dbField;
    const isCompleted = confirmedFields[dbField];
    const value = projectData[dbField] || '';

    return (
      <div className={`flex flex-col bg-white border ${isCompleted ? 'border-emerald-200 shadow-emerald-50' : isEditing ? 'border-indigo-300 shadow-md ring-1 ring-indigo-500' : 'border-slate-200'} rounded-xl shadow-sm overflow-hidden transition-all h-full`}>
        <div className={`px-4 py-3 flex items-center justify-between border-b ${isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isEditing ? 'bg-indigo-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <h3 className="text-sm font-black text-slate-800">{title}</h3>
          </div>
          <div className="flex gap-2">
            {!isEditing && !isCompleted && (
              <button onClick={() => handleEdit(dbField, value)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded flex items-center gap-1"><Edit3 className="w-3.5 h-3.5"/> 編輯</button>
            )}
            {isCompleted && (
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4"/> 已完成</span>
            )}
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col gap-3">
          {isEditing ? (
            type === 'textarea' ? (
              <textarea 
                value={drafts[dbField] !== undefined ? drafts[dbField] : value} 
                onChange={(e) => setDrafts({...drafts, [dbField]: e.target.value})}
                className="w-full flex-1 min-h-[120px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 resize-none"
              />
            ) : (
              <div className="w-full flex-1 min-h-[120px] border-2 border-dashed border-indigo-200 rounded-lg flex flex-col items-center justify-center bg-indigo-50 text-indigo-500 cursor-pointer hover:bg-indigo-100">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold">點擊上傳圖片至 m01_project_assessment_images</span>
              </div>
            )
          ) : (
            <div className={`flex-1 text-sm ${value ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {type === 'image' && value ? '已上傳圖片' : value || '尚未填寫資料...'}
            </div>
          )}

          {/* 按鈕操作區 */}
          {isEditing && (
            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
              <button onClick={() => handleCancel(dbField)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md flex items-center gap-1"><X className="w-3.5 h-3.5"/> 取消</button>
              <button onClick={() => handleSaveGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-md flex items-center gap-1"><Save className="w-3.5 h-3.5"/> 儲存</button>
            </div>
          )}
          {!isEditing && !isCompleted && value && (
            <div className="flex justify-end mt-2 pt-3 border-t border-slate-100">
              <button onClick={() => handleCompleteGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-md flex items-center gap-1"><Check className="w-3.5 h-3.5"/> 標記為完成</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24">
      
      {/* 🚀 第一層格子：頂部固定資訊列 */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono border border-indigo-200">{projectData.project_code}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{projectData.department}</span>
                </div>
                <h1 className="text-xl font-black text-slate-900 mt-1">{projectData.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 專案狀態 (動態資料庫選單) */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-slate-400">專案狀態</span>
                <select value={projectData.status_name_snapshot} onChange={(e) => handleStatusChange(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500 cursor-pointer">
                  {statusDict.map(status => (
                    <option key={status.id} value={status.name}>{status.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:bg-slate-50 hover:text-indigo-600"><FileDown className="w-4 h-4" /> 輸出 PDF</button>
            </div>
          </div>

          {/* 資料完整度進度條 */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-600 whitespace-nowrap">資料完整度 {completeness}%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${completeness === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${completeness}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
        {/* 🚀 第二層格子：專案負責人 (應用科、企劃科、科技科) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400"/> 專案負責人編制</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['應用科', '企劃科', '科技科'].map(dept => (
              <div key={dept} className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-slate-700">{dept}</span>
                  <button onClick={() => openUserModal(dept)} className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1"><UserPlus className="w-3 h-3"/> 加入</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(projectData.team_members?.[dept] || []).length > 0 ? 
                    projectData.team_members[dept].map((name: string) => (
                      <span key={name} className="text-xs font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-600">{name}</span>
                    )) : <span className="text-xs text-slate-400">尚未指派</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🚀 第三層格子：每行兩個 (現行工作職掌、作業痛點) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行工作職掌與工作流程" dbField="workflow_text" />
          <GridBlock title="現行作業痛點" dbField="pain_points_text" />
        </div>

        {/* 🚀 第四層格子：每行三個 (影響範圍-人員、時間、效益) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GridBlock title="影響範圍 - 人員" dbField="impact_people_text" />
          <GridBlock title="影響範圍 - 時間" dbField="impact_time_text" />
          <GridBlock title="影響範圍 - 效益" dbField="impact_benefit_text" />
        </div>

        {/* 🚀 第五層格子：每行兩個 (AS-IS, TO-BE 圖片) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行系統架構 (AS-IS)" dbField="image_as_is" type="image" />
          <GridBlock title="未來系統架構 (TO-BE)" dbField="image_to_be" type="image" />
        </div>

        {/* 🚀 第六層格子：每行兩個 (業務評估、技術評估、KPI、綜合評估) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="業務面評估" dbField="eval_business" />
          <GridBlock title="技術面評估" dbField="eval_technical" />
          <GridBlock title="成效追蹤指標 (KPI)" dbField="eval_kpi" />
          <GridBlock title="綜合評估結論" dbField="eval_conclusion" />
        </div>

      </div>

      {/* 🚀 彈出視窗：人員選擇 Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800">指派 {activeDept} 負責人</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
              {usersList.filter(u => u.department === activeDept).length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-8">該部門目前無人員資料</div>
              ) : (
                usersList.filter(u => u.department === activeDept).map(user => {
                  const isSelected = projectData.team_members?.[activeDept]?.includes(user.full_name);
                  return (
                    <div 
                      key={user.id} 
                      onClick={() => toggleUserSelection(user.full_name)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{user.full_name}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsUserModalOpen(false)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">完成設定</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}