'use client';

export const runtime = 'edge';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, FileDown, Lock, Edit3, X, UserPlus, Image as ImageIcon, Unlock, Building2 } from 'lucide-react';
import { toPng } from 'html-to-image'; 
import jsPDF from 'jspdf';

//插畫風格圖標 (供網頁使用)
const IllustrativeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'target': return <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c1.5 0 3 .5 3 2m0 0c0 1.5-.5 3-2 3s-3-.5-3-2m0 0c0-1.5.5-3 2-3m0 0a9 9 0 110 18 9 9 0 010-18z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>;
    case 'workflow': return <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
    case 'pain': return <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'people': return <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case 'business': return <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
    case 'technical': return <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'final': return <svg className="w-12 h-12 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-8.061 3.42 3.42 0 014.438-4.438 3.42 3.42 0 008.061 1.946 3.42 3.42 0 014.438 4.438 3.42 3.42 0 00-1.946 8.061 3.42 3.42 0 01-4.438 4.438 3.42 3.42 0 00-8.061-1.946 3.42 3.42 0 01-4.438-4.438z" /></svg>;
    default: return <ImageIcon className="w-12 h-12 text-emerald-300" />;
  }
};

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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (!projectData) return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;

  const totalGrids = 11; 
  const completedGrids = Object.keys(confirmedFields).filter(k => confirmedFields[k]).length;
  const completeness = Math.round((completedGrids / totalGrids) * 100);

  // === 🚀 網頁專用插畫亮綠色 GridBlock UI (不影響 PDF) ===
  const GridBlock = ({ title, dbField, type = 'textarea', iconType = 'target' }: { title: string, dbField: string, type?: 'textarea' | 'image', iconType?: string }) => {
    const isEditing = editingField === dbField;
    const isCompleted = confirmedFields[dbField];
    const value = projectData[dbField] || '';
    const isLockedByOther = locks[dbField] && locks[dbField].user_id !== currentUser?.id;

    return (
      <div className={`flex flex-col bg-white border-4 ${isCompleted ? 'border-emerald-500' : isEditing ? 'border-amber-400 shadow-2xl ring-2 ring-amber-300' : 'border-emerald-100'} rounded-3xl transition-all overflow-hidden`}>
        <div className={`px-6 py-4 flex items-center justify-between border-b-2 ${isCompleted ? 'bg-emerald-50' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-3">
             <IllustrativeIcon type={iconType} />
             <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
          </div>
          <div className="flex gap-2">
            {isLockedByOther ? (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border-2 border-amber-100 flex items-center gap-1"><Lock className="w-3.5 h-3.5"/> {locks[dbField].user_name} 正在編輯...</span>
            ) : (
              <>
                {!isEditing && !isCompleted && (
                  <button onClick={() => handleEdit(dbField, value)} className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5"/> 點擊編輯</button>
                )}
                {isCompleted && (
                  <span className="text-sm font-black text-emerald-600 flex items-center gap-1.5"><Check className="w-5 h-5"/> 已確認完成</span>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-6 relative gap-4">
          {isEditing ? (
            type === 'textarea' ? (
              <div className="flex flex-col gap-4">
                <textarea value={drafts[dbField] || ''} onChange={(e) => setDrafts({...drafts, [dbField]: e.target.value})} className="w-full min-h-[150px] bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-base outline-none focus:border-amber-400 resize-none" />
                <div className="flex justify-end gap-2.5">
                   <button onClick={() => handleCancel(dbField)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">取消編輯</button>
                   <button onClick={() => handleSaveGrid(dbField)} className="px-5 py-2 text-sm font-black bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">儲存變更</button>
                </div>
              </div>
            ) : null
          ) : (
            <div className={`p-1 text-base whitespace-pre-wrap ${value || images[dbField] ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {type === 'image' && images[dbField] ? (
                 <img src={images[dbField]} className="w-full h-auto block rounded-xl border-4 border-emerald-100" alt={title}/> 
              ) : type === 'image' ? (
                 <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border-4 border-dashed border-emerald-100 rounded-xl m-2">
                    <IllustrativeIcon type='image'/>
                    <span className="text-sm font-black text-slate-400 mt-3">尚未上傳系統架構圖</span>
                 </div>
              ) : value || '尚未填入評估資訊，點擊右上角編輯開始撰寫...'}
            </div>
          )}

          {type === 'image' && !isCompleted && !isLockedByOther && (
             <label className="absolute bottom-6 right-6 cursor-pointer bg-emerald-600 text-white shadow-xl text-xs font-black px-4 py-2.5 rounded-full hover:bg-emerald-700 flex items-center gap-2">
               <ImageIcon className="w-4 h-4"/> 點擊更換架構圖
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, dbField as 'AS-IS'|'TO-BE')} />
             </label>
          )}

          {!isEditing && !isCompleted && (value || images[dbField]) && !isLockedByOther && (
            <div className="px-1 pt-4 flex justify-end">
              <button onClick={() => handleCompleteGrid(dbField)} className="px-5 py-2 text-sm font-black bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center gap-2 shadow-lg"><Check className="w-4 h-4"/> 確認本區塊完成</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-sans pb-24 overflow-x-hidden relative">
      
      {/* ---插畫風格亮綠色頂部導覽列 --- */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b-4 border-emerald-100 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => router.back()} className="p-3 -ml-3 text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full tracking-widest">{projectData.project_code}</span>
                  <div className="flex items-center bg-slate-50 border-2 border-slate-200 rounded-full px-3 py-1">
                    <Building2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                    <select value={projectData.department || '未指定'} onChange={(e) => handleDepartmentChange(e.target.value)} disabled={isExporting} className="text-xs font-bold text-emerald-900 bg-transparent outline-none cursor-pointer">
                      {DEPARTMENTS.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                    </select>
                  </div>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">{projectData.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-bold text-emerald-700 tracking-widest uppercase">目前專案狀態</span>
                <select value={projectData.status_name_snapshot} onChange={(e) => handleStatusChange(e.target.value)} disabled={isExporting} className="px-4 py-2.5 bg-emerald-600 text-white border-none rounded-full font-black text-sm outline-none cursor-pointer shadow-lg hover:bg-emerald-700 transition-colors">
                  {statusDict.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2.5 px-6 py-3 bg-white text-emerald-700 text-base font-black rounded-full shadow-lg border-4 border-emerald-100 hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50">
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />} 
                匯出綜合評估報告PDF
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-full border-2 border-emerald-50">
            <div className="flex-1 h-3 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100 shadow-inner">
              <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${completeness}%` }}></div>
            </div>
            <span className="text-sm font-black text-emerald-900 whitespace-nowrap tracking-widest uppercase">Completeness {completeness}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-8 py-10 flex flex-col gap-12">
        
        {/* 負責人區域 */}
        <section className="bg-white rounded-3xl p-8 shadow-xl border-4 border-emerald-100">
          <h2 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-3"><Lock className="w-6 h-6 text-emerald-300"/> 專案權責指派與負責經辦</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['應用科', '企劃科', '科技科'].map(dept => (
              <div key={dept} className="flex flex-col p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-slate-200">
                  <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{dept}</span>
                  <button onClick={() => openUserModal(dept)} className="text-xs font-black bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"><UserPlus className="w-4 h-4"/> 指派人選</button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(projectData.team_members?.[dept] || []).length > 0 ? 
                    projectData.team_members[dept].map((name: string) => (
                      <span key={name} className="text-sm font-bold bg-white border-2 border-emerald-100 px-4 py-1.5 rounded-full text-emerald-900 shadow-md flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> {name}
                      </span>
                    )) : <span className="text-sm text-slate-400 italic py-2">尚未指派負責經辦人員</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 網格系統 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <GridBlock title="現行工作職掌與工作流程" dbField="workflow_text" iconType='workflow'/>
          <GridBlock title="現行作業痛點需求" dbField="pain_points_text" iconType='pain'/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <GridBlock title="影響範圍 - 人員" dbField="impact_people_text" iconType='people'/>
          <GridBlock title="影響範圍 - 時間" dbField="impact_time_text" iconType='people'/>
          <GridBlock title="影響範圍 - 效益" dbField="impact_benefit_text" iconType='people'/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <GridBlock title="現行系統架構圖 (AS-IS)" dbField="AS-IS" type="image" iconType='image'/>
          <GridBlock title="未來規劃系統架構圖 (TO-BE)" dbField="TO-BE" type="image" iconType='image'/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <GridBlock title="業務可行性評估" dbField="eval_business" iconType='business'/>
          <GridBlock title="技術可行性評估" dbField="eval_technical" iconType='technical'/>
          <GridBlock title="專案成效追蹤指標 (KPI)" dbField="eval_kpi" iconType='technical'/>
          <GridBlock title="評估委員會綜合結論" dbField="eval_conclusion" iconType='final'/>
        </div>
      </div>

      {/* Admin 解除鎖定按鈕 */}
      {currentUser?.system_role === 'admin' && Object.keys(locks).length > 0 && (
        <div className="fixed bottom-10 right-10 z-50">
          <button onClick={handleUnlockAll} className="bg-rose-600 text-white p-5 rounded-full shadow-3xl flex items-center gap-3 font-bold hover:bg-rose-700 hover:scale-105 transition-all">
            <Unlock className="w-7 h-7"/> 解除全站編輯鎖定
          </button>
        </div>
      )}

      {/* 人員選擇 Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-3xl overflow-hidden flex flex-col border-4 border-emerald-100">
            <div className="px-7 py-5 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2.5"><UserPlus className="w-5 h-5 text-emerald-400"/> 指派 {activeDept} 負責人員</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-6 h-6"/></button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
              {usersList.filter(u => u.department === activeDept).map(user => {
                const isSelected = projectData.team_members?.[activeDept]?.includes(user.full_name);
                return (
                  <div key={user.id} onClick={() => toggleUserSelection(user.full_name)} className={`flex items-center justify-between p-5 rounded-xl border-4 cursor-pointer transition-all ${isSelected ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-100 hover:border-emerald-100'}`}>
                    <span className={`text-base font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{user.full_name}</span>
                    {isSelected && <Check className="w-5 h-5 text-emerald-600" />}
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t-2 border-slate-100 bg-slate-50 flex justify-end gap-3">
               <button onClick={() => setIsUserModalOpen(false)} className="px-6 py-2.5 bg-emerald-600 text-white font-black text-sm rounded-lg hover:bg-emerald-700">確認指派</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 隱藏 PDF 區塊 (完全改回專業區塊藍 / 橫式 A4 / 比照附檔 PDF)             */}
      {/* ========================================================================= */}
      <div className="absolute left-[-9999px] top-0 bg-white text-black font-sans">
        
        {/* PDF 共用標題元件 */}
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

          // PDF 公文區塊元件
          const PDFBlock = ({ title, content, colSpan = 1, className = "" }: { title: string, content: string | React.ReactNode, colSpan?: 1 | 2 | 3, className?: string }) => (
            <div className={`border-2 border-black rounded-xl p-5 bg-white flex flex-col ${colSpan === 2 ? 'col-span-2' : colSpan === 3 ? 'col-span-3' : ''} ${className}`}>
              <div className="text-base font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-3 tracking-tight">{title}</div>
              <div className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap flex-1">{content || '（無內容）'}</div>
            </div>
          );

          // A4 橫式像素大小 (297mm x 210mm, 假設 96dpi 約為 1122x793)
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
                   <PDFBlock title="影響範圍 - 人員" content={projectData?.impact_people_text} iconType='people'/>
                   <PDFBlock title="影響範圍 - 時間" content={projectData?.impact_time_text} iconType='people'/>
                   <PDFBlock title="影響範圍 - 效益" content={projectData?.impact_benefit_text} iconType='people'/>
                </div>
              </div>

              {/* === PAGE 2 === */}
              <div ref={pdfPage2Ref} className={PAGE_CLASS}>
                <PDFHeader pageNum={2} title="系統架構圖 (Current AS-IS / Planned TO-BE)" />
                <div className="grid grid-cols-2 gap-8 flex-1 h-full pb-4">
                  <div className="flex flex-col border-[4px] border-[#00457C] rounded-2xl overflow-hidden h-full">
                    <div className="bg-[#00457C] text-white px-5 py-3 text-sm font-black text-center tracking-widest uppercase">現行系統架構圖 (Current AS-IS)</div>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 p-2">
                      {images['AS-IS'] ? <img src={images['AS-IS']} className="max-w-full max-h-[500px] object-contain" /> : <IllustrativeIcon type='image'/>}
                    </div>
                  </div>
                  <div className="flex flex-col border-[4px] border-[#00457C] rounded-2xl overflow-hidden h-full">
                    <div className="bg-[#00457C] text-white px-5 py-3 text-sm font-black text-center tracking-widest uppercase">未來規劃系統架構圖 (Planned TO-BE)</div>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 p-2">
                      {images['TO-BE'] ? <img src={images['TO-BE']} className="max-w-full max-h-[500px] object-contain" /> : <IllustrativeIcon type='image'/>}
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
                      <PDFBlock title="綜合評估結論" content={projectData?.eval_conclusion} className="border-emerald-300"/>
                   </div>
                </div>

                {/* 簽核表單固定在底部 */}
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