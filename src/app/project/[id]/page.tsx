'use client';

export const runtime = 'edge';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, FileDown, Lock, Edit3, X, UserPlus, Image as ImageIcon, Unlock, Building2 } from 'lucide-react';
import { toPng } from 'html-to-image'; 
import jsPDF from 'jspdf';

// 提案單位清單
const DEPARTMENTS = ['未指定', '作業服務總部', '應用科', '企劃科', '科技科', '智慧金融處', '資訊處', '業務部', '永續發展部'];

const fetchImageAsBase64 = async (url: string | null | undefined): Promise<string> => {
  if (!url) return ''; 
  if (url.startsWith('data:image')) return url; 
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return url || ''; 
  }
};

export default function ProjectEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [statusDict, setStatusDict] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [images, setImages] = useState<Record<string, string>>({}); 
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); 

  const [locks, setLocks] = useState<Record<string, any>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [confirmedFields, setConfirmedFields] = useState<Record<string, boolean>>({});

  const pdfPage1Ref = useRef<HTMLDivElement>(null);
  const pdfPage2Ref = useRef<HTMLDivElement>(null);
  const pdfPage3Ref = useRef<HTMLDivElement>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<string>('');

  useEffect(() => {
    async function fetchAllData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('m01_users').select('*').eq('email', user.email).single();
          setCurrentUser(profile);
        }

        const [projRes, statRes, usersRes, locksRes, imagesRes] = await Promise.all([
          supabase.from('m01_projects').select('*').eq('id', projectId).single(),
          supabase.from('m01_status_dict').select('*').order('sort_order', { ascending: true }),
          supabase.from('m01_users').select('*'),
          supabase.from('m01_edit_locks').select('*').eq('project_id', projectId),
          supabase.from('m01_project_assessment_images').select('*').eq('project_id', projectId)
        ]);

        if (projRes.data) {
          setProjectData(projRes.data);
          setConfirmedFields(projRes.data.confirmed_fields || {});
          if (!projRes.data.team_members) projRes.data.team_members = { '應用科': [], '企劃科': [], '科技科': [] };
        }
        if (statRes.data) setStatusDict(statRes.data);
        if (usersRes.data) setUsersList(usersRes.data);

        if (locksRes.data) {
          const lockMap: Record<string, any> = {};
          locksRes.data.forEach(l => lockMap[l.field_name] = l);
          setLocks(lockMap);
        }

        if (imagesRes.data) {
          const imgMap: Record<string, string> = {};
          for (const img of imagesRes.data) {
            if (img.image_url) imgMap[img.image_type] = await fetchImageAsBase64(img.image_url);
          }
          setImages(imgMap);
        }
      } catch (error) {
        console.error('載入失敗', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllData();

    const lockSubscription = supabase.channel('locks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'm01_edit_locks', filter: `project_id=eq.${projectId}` }, payload => {
        setLocks(prev => {
          const newLocks = { ...prev };
          if (payload.eventType === 'DELETE') {
            delete newLocks[payload.old.field_name];
          } else {
            newLocks[payload.new.field_name] = payload.new;
          }
          return newLocks;
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(lockSubscription);
    };
  }, [projectId]);

  const saveProjectToDB = async (updates: any) => {
    try {
      await supabase.from('m01_projects').update(updates).eq('id', projectId);
      setProjectData((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {}
  };

  const handleStatusChange = (newStatus: string) => saveProjectToDB({ status_name_snapshot: newStatus });
  const handleDepartmentChange = (newDept: string) => saveProjectToDB({ department: newDept });

  const handleEdit = async (field: string, currentValue: string) => {
    if (locks[field] && locks[field].user_id !== currentUser?.id) return; 
    setEditingField(field);
    setDrafts(prev => ({ ...prev, [field]: currentValue || '' }));
    await supabase.from('m01_edit_locks').upsert({ project_id: projectId, field_name: field, user_id: currentUser?.id, user_name: currentUser?.full_name, locked_at: new Date().toISOString() });
  };

  const handleCancel = async (field: string) => {
    setEditingField(null);
    await supabase.from('m01_edit_locks').delete().match({ project_id: projectId, field_name: field });
  };

  const handleSaveGrid = async (field: string) => {
    await saveProjectToDB({ [field]: drafts[field] });
    setEditingField(null);
    await supabase.from('m01_edit_locks').delete().match({ project_id: projectId, field_name: field });
  };

  const handleCompleteGrid = async (field: string) => {
    const newConfirmed = { ...confirmedFields, [field]: true };
    await saveProjectToDB({ confirmed_fields: newConfirmed });
    setConfirmedFields(newConfirmed);
  };

  const handleUnlockAll = async () => {
    if (!confirm('確定解除全站所有人的編輯鎖定嗎？')) return;
    await supabase.from('m01_edit_locks').delete().eq('project_id', projectId);
    setLocks({});
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'AS-IS' | 'TO-BE') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await supabase.from('m01_project_assessment_images').upsert({ project_id: projectId, image_type: type, image_url: base64String });
      setImages(prev => ({ ...prev, [type]: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const openUserModal = (dept: string) => { setActiveDept(dept); setIsUserModalOpen(true); };
  const toggleUserSelection = async (userName: string) => {
    const currentTeam = projectData.team_members || { '應用科': [], '企劃科': [], '科技科': [] };
    const deptUsers = currentTeam[activeDept] || [];
    const newDeptUsers = deptUsers.includes(userName) ? deptUsers.filter((n: string) => n !== userName) : [...deptUsers, userName];
    await saveProjectToDB({ team_members: { ...currentTeam, [activeDept]: newDeptUsers } });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      try {
        const pdf = new jsPDF('landscape', 'mm', 'a4'); 
        const pdfWidth = 297; 
        const pages = [pdfPage1Ref.current, pdfPage2Ref.current, pdfPage3Ref.current];
        
        for (let i = 0; i < pages.length; i++) {
          const element = pages[i];
          if (!element) continue;
          
          const imgData = await toPng(element, { 
            pixelRatio: 2, 
            backgroundColor: '#ffffff'
          });
          
          const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save(`${projectData?.project_code || '專案'}_綜合評估報告.pdf`);
      } catch (error) {
        console.error(error);
        alert('匯出 PDF 時發生錯誤。');
      } finally { 
        setIsExporting(false); 
      }
    }, 500); 
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!projectData) return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;

  const totalGrids = 11; 
  const completedGrids = Object.keys(confirmedFields).filter(k => confirmedFields[k]).length;
  const completeness = Math.round((completedGrids / totalGrids) * 100);

  // === 🚀 網頁專用簡約風格 GridBlock UI ===
  const GridBlock = ({ title, dbField, type = 'textarea' }: { title: string, dbField: string, type?: 'textarea' | 'image' }) => {
    const isEditing = editingField === dbField;
    const isCompleted = confirmedFields[dbField];
    const value = projectData[dbField] || '';
    const isLockedByOther = locks[dbField] && locks[dbField].user_id !== currentUser?.id;

    return (
      <div className={`flex flex-col bg-white border ${isCompleted ? 'border-emerald-200' : isEditing ? 'border-blue-400 shadow-md ring-1 ring-blue-400' : 'border-slate-200'} rounded-xl shadow-sm transition-all overflow-hidden`}>
        <div className={`px-5 py-3 flex items-center justify-between border-b ${isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isLockedByOther ? 'bg-rose-500' : isEditing ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
             <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          </div>
          <div className="flex gap-2">
            {isLockedByOther ? (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 flex items-center gap-1"><Lock className="w-3 h-3"/> {locks[dbField].user_name} 編輯中</span>
            ) : (
              <>
                {!isEditing && !isCompleted && (
                  <button onClick={() => handleEdit(dbField, value)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"><Edit3 className="w-3.5 h-3.5"/> 編輯</button>
                )}
                {isCompleted && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4"/> 已完成</span>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-4 relative">
          {isEditing ? (
            type === 'textarea' ? (
              <div className="flex flex-col gap-3">
                <textarea value={drafts[dbField] || ''} onChange={(e) => setDrafts({...drafts, [dbField]: e.target.value})} className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-400 resize-none" />
                <div className="flex justify-end gap-2">
                   <button onClick={() => handleCancel(dbField)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">取消</button>
                   <button onClick={() => handleSaveGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">儲存</button>
                </div>
              </div>
            ) : null
          ) : (
            <div className={`flex-1 text-sm whitespace-pre-wrap ${value || images[dbField] ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {type === 'image' && images[dbField] ? (
                 <img src={images[dbField]} className="w-full h-auto block rounded-lg border border-slate-100" alt={title}/> 
              ) : type === 'image' ? (
                 <div className="py-12 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-lg m-1">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <span className="text-xs font-bold text-slate-400">尚未上傳圖片</span>
                 </div>
              ) : value || '尚未填寫資料...'}
            </div>
          )}

          {type === 'image' && !isCompleted && !isLockedByOther && (
             <label className="absolute bottom-4 right-4 cursor-pointer bg-white shadow-sm border border-slate-200 text-xs font-bold text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1.5">
               <ImageIcon className="w-3.5 h-3.5"/> 上傳/更換圖片
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, dbField as 'AS-IS'|'TO-BE')} />
             </label>
          )}

          {!isEditing && !isCompleted && (value || images[dbField]) && !isLockedByOther && (
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <button onClick={() => handleCompleteGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center gap-1"><Check className="w-3.5 h-3.5"/> 標記為完成</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 overflow-x-hidden relative">
      
      {/* --- 網頁上方導覽列 (簡潔淺色風格) --- */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded tracking-wider">{projectData.project_code}</span>
                  <div className="flex items-center bg-slate-100 rounded px-2 py-0.5 border border-slate-200 hover:bg-slate-200 transition-colors">
                    <Building2 className="w-3 h-3 mr-1 text-slate-500" />
                    <select value={projectData.department || '未指定'} onChange={(e) => handleDepartmentChange(e.target.value)} disabled={isExporting} className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-slate-900">{projectData.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-slate-400">目前案件狀態</span>
                <select value={projectData.status_name_snapshot} onChange={(e) => handleStatusChange(e.target.value)} disabled={isExporting} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100">
                  {statusDict.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
                匯出綜合評估報告
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap uppercase tracking-wider">Completeness {completeness}%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${completeness}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 網頁主內容區 --- */}
      <div className="max-w-[1600px] mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
        {/* 第 2 層：專案負責人 */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400"/> 專案負責人編制</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['應用科', '企劃科', '科技科'].map(dept => (
              <div key={dept} className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-600">{dept}</span>
                  <button onClick={() => openUserModal(dept)} className="text-[10px] font-bold bg-white border border-slate-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1 transition-colors"><UserPlus className="w-3 h-3"/> 指派</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(projectData.team_members?.[dept] || []).length > 0 ? 
                    projectData.team_members[dept].map((name: string) => (
                      <span key={name} className="text-xs font-bold bg-white border border-slate-200 px-2.5 py-1 rounded text-slate-700 shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {name}
                      </span>
                    )) : <span className="text-xs text-slate-400 italic">尚未指派</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 第 3 層 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行工作職掌與工作流程" dbField="workflow_text" />
          <GridBlock title="現行作業痛點需求" dbField="pain_points_text" />
        </div>

        {/* 第 4 層 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GridBlock title="影響範圍 - 人員" dbField="impact_people_text" />
          <GridBlock title="影響範圍 - 時間" dbField="impact_time_text" />
          <GridBlock title="影響範圍 - 效益" dbField="impact_benefit_text" />
        </div>

        {/* 第 5 層：左右滿版 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行系統架構圖 (AS-IS)" dbField="AS-IS" type="image" />
          <GridBlock title="未來規劃系統架構圖 (TO-BE)" dbField="TO-BE" type="image" />
        </div>

        {/* 第 6 層 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="業務面可行性評估" dbField="eval_business" />
          <GridBlock title="技術面可行性評估" dbField="eval_technical" />
          <GridBlock title="專案成效追蹤指標 (KPI)" dbField="eval_kpi" />
          <GridBlock title="評估委員會綜合結論" dbField="eval_conclusion" />
        </div>
      </div>

      {/* Admin 解除鎖定按鈕 */}
      {currentUser?.system_role === 'admin' && Object.keys(locks).length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button onClick={handleUnlockAll} className="bg-rose-600 text-white p-3.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold hover:bg-rose-700 hover:scale-105 transition-all">
            <Unlock className="w-5 h-5"/> 解除編輯鎖定
          </button>
        </div>
      )}

      {/* 人員選擇 Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><UserPlus className="w-4 h-4 text-slate-400"/> 指派 {activeDept} 人員</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
              {usersList.filter(u => u.department === activeDept).map(user => {
                const isSelected = projectData.team_members?.[activeDept]?.includes(user.full_name);
                return (
                  <div key={user.id} onClick={() => toggleUserSelection(user.full_name)} className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-blue-100'}`}>
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{user.full_name}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsUserModalOpen(false)} className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded hover:bg-blue-700">完成指派</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 隱藏的 PDF 專用排版區塊 (完全還原 PDF 附檔: 公文格式 / 橫式 A4)             */}
      {/* ========================================================================= */}
      <div className="absolute left-[-9999px] top-0 bg-white text-black font-sans">
        
        {(() => {
          const PDFHeader = ({ pageNum, title }: { pageNum: number, title: string }) => (
            <div className="w-full mb-6 flex flex-col border-b-[6px] border-[#00457C] pb-4">
              <div className="text-center text-slate-400 font-mono text-sm tracking-widest mb-4">--- PAGE {pageNum} ---</div>
              <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-black text-[#00457C]">{title}</h1>
                  <div className="text-right flex flex-col items-end">
                     <span className="text-sm font-bold text-slate-500 tracking-widest">綜合評估報告 Assessment Report</span>
                     <span className="text-lg font-black text-slate-900 mt-1">{projectData?.project_code}</span>
                  </div>
              </div>
            </div>
          );

          const PDFBlock = ({ title, content, colSpan = 1, className = "" }: { title: string, content: string | React.ReactNode, colSpan?: 1 | 2 | 3, className?: string }) => (
            <div className={`border-2 border-black rounded-xl p-5 bg-white flex flex-col ${colSpan === 2 ? 'col-span-2' : colSpan === 3 ? 'col-span-3' : ''} ${className}`}>
              <div className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-3 tracking-tight">{title}</div>
              <div className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap flex-1">{content || '（無內容）'}</div>
            </div>
          );

          const PAGE_CLASS = "w-[1122px] h-[793px] p-[15mm] bg-white flex flex-col box-border border-[10px] border-[#00457C]";

          return (
            <>
              {/* === PAGE 1 === */}
              <div ref={pdfPage1Ref} className={PAGE_CLASS}>
                <PDFHeader pageNum={1} title={`${projectData?.name} - 綜合評估報告`} />
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {['應用科', '企劃科', '科技科'].map(dept => (
                    <div key={dept} className="flex flex-col p-4 border-2 border-black rounded-lg bg-slate-50">
                      <span className="font-bold text-sm text-slate-600 mb-2">{dept}負責人</span>
                      <span className="text-base font-black text-slate-950">{(projectData?.team_members?.[dept] || []).join(', ') || '尚未指派'}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6 flex-1 h-full mb-6">
                   <PDFBlock title="現行工作職掌與工作流程" content={projectData?.workflow_text} />
                   <PDFBlock title="現行作業痛點需求" content={projectData?.pain_points_text} />
                </div>

                <div className="grid grid-cols-3 gap-6 flex-1 h-full border-t border-black pt-6">
                   <PDFBlock title="影響範圍 - 人員" content={projectData?.impact_people_text} />
                   <PDFBlock title="影響範圍 - 時間" content={projectData?.impact_time_text} />
                   <PDFBlock title="影響範圍 - 效益" content={projectData?.impact_benefit_text} />
                </div>
              </div>

              {/* === PAGE 2 === */}
              <div ref={pdfPage2Ref} className={PAGE_CLASS}>
                <PDFHeader pageNum={2} title="系統架構圖 (Current AS-IS / Planned TO-BE)" />
                <div className="grid grid-cols-2 gap-8 flex-1 h-full pb-4">
                  <div className="flex flex-col border-[4px] border-[#00457C] rounded-2xl overflow-hidden h-full">
                    <div className="bg-[#00457C] text-white px-5 py-3 text-sm font-black text-center tracking-widest uppercase">現行系統架構圖 (Current AS-IS)</div>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 p-2">
                      {images['AS-IS'] ? <img src={images['AS-IS']} className="max-w-full max-h-[500px] object-contain" /> : <span className="text-slate-400">無圖片</span>}
                    </div>
                  </div>
                  <div className="flex flex-col border-[4px] border-[#00457C] rounded-2xl overflow-hidden h-full">
                    <div className="bg-[#00457C] text-white px-5 py-3 text-sm font-black text-center tracking-widest uppercase">未來規劃系統架構圖 (Planned TO-BE)</div>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 p-2">
                      {images['TO-BE'] ? <img src={images['TO-BE']} className="max-w-full max-h-[500px] object-contain" /> : <span className="text-slate-400">無圖片</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* === PAGE 3 === */}
              <div ref={pdfPage3Ref} className={PAGE_CLASS}>
                <PDFHeader pageNum={3} title="綜合評估與核決簽章 (Final Conclusion & Approvals)" />
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1 mb-6">
                   <PDFBlock title="業務可行性評估" content={projectData?.eval_business} />
                   <PDFBlock title="技術可行性評估" content={projectData?.eval_technical} />
                   <div className="col-span-2 grid grid-cols-2 gap-8 border-t border-black pt-6">
                      <PDFBlock title="專案成效追蹤指標 (KPI)" content={projectData?.eval_kpi} />
                      <PDFBlock title="綜合評估結論" content={projectData?.eval_conclusion} className="border-[#00457C]"/>
                   </div>
                </div>

                <div className="border border-black mt-auto">
                  <div className="grid grid-cols-6 w-full h-[140px]">
                    {['需求單位經辦', '需求單位科主管', '需求單位主管', '智慧金融處經辦', '智慧金融處科主管', '智慧金融處主管'].map((role, idx) => (
                      <div key={idx} className={`flex flex-col ${idx !== 5 ? 'border-r border-black' : ''}`}>
                        <div className="border-b border-black py-2 text-center text-xs font-bold bg-slate-100">{role}</div>
                        <div className="flex-1 bg-white"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}