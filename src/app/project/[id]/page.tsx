'use client';

export const runtime = 'edge';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, FileDown, Lock, Edit3, X, UserPlus, Image as ImageIcon, Unlock, Building2 } from 'lucide-react';
import { toPng } from 'html-to-image'; 
import jsPDF from 'jspdf';

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
    if (!confirm('確定解除所有鎖定？')) return;
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
        const pdf = new jsPDF('portrait', 'mm', 'a4'); // 改為直式 A4，以符合公文格式
        const pdfWidth = 210; 
        const pages = [pdfPage1Ref.current, pdfPage2Ref.current, pdfPage3Ref.current];
        for (let i = 0; i < pages.length; i++) {
          const element = pages[i];
          if (!element) continue;
          const imgData = await toPng(element, { pixelRatio: 2, backgroundColor: '#ffffff' });
          const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        pdf.save(`${projectData?.project_code || '專案'}_綜合評估報告.pdf`);
      } catch (error) {
        alert('匯出 PDF 時發生錯誤');
      } finally { setIsExporting(false); }
    }, 300); 
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-[#00457C]" /></div>;
  if (!projectData) return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;

  const totalGrids = 11; 
  const completedGrids = Object.keys(confirmedFields).filter(k => confirmedFields[k]).length;
  const completeness = Math.round((completedGrids / totalGrids) * 100);

  // --- 網頁專用的彩色 Grid UI (不影響 PDF) ---
  const GridBlock = ({ title, dbField, type = 'textarea' }: { title: string, dbField: string, type?: 'textarea' | 'image' }) => {
    const isEditing = editingField === dbField;
    const isCompleted = confirmedFields[dbField];
    const value = projectData[dbField] || '';
    const isLockedByOther = locks[dbField] && locks[dbField].user_id !== currentUser?.id;

    return (
      <div className={`flex flex-col bg-white border-2 ${isCompleted ? 'border-[#00457C]' : isEditing ? 'border-[#009B77] shadow-lg ring-1 ring-[#009B77]' : 'border-slate-200'} rounded-lg shadow-sm transition-all overflow-hidden`}>
        <div className={`px-4 py-2.5 flex items-center justify-between border-b ${isCompleted ? 'bg-[#00457C]/5' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-2">
             <div className={`w-1.5 h-4 rounded-full ${isCompleted ? 'bg-[#00457C]' : 'bg-slate-300'}`}></div>
             <h3 className="text-sm font-bold text-[#333] tracking-tight">{title}</h3>
          </div>
          <div className="flex gap-2">
            {isLockedByOther ? (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 flex items-center gap-1"><Lock className="w-3 h-3"/> {locks[dbField].user_name} 編輯中</span>
            ) : (
              <>
                {!isEditing && !isCompleted && (
                  <button onClick={() => handleEdit(dbField, value)} className="text-xs font-bold text-[#00457C] hover:bg-slate-100 px-2 py-1 rounded transition-colors flex items-center gap-1"><Edit3 className="w-3 h-3"/> 編輯</button>
                )}
                {isCompleted && (
                  <span className="text-xs font-bold text-[#00457C] flex items-center gap-1"><Check className="w-4 h-4"/> 已確認</span>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-0 relative">
          {isEditing ? (
            type === 'textarea' ? (
              <div className="p-4 flex flex-col gap-3">
                <textarea value={drafts[dbField] || ''} onChange={(e) => setDrafts({...drafts, [dbField]: e.target.value})} className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded p-3 text-sm outline-none focus:border-[#00457C] resize-none" />
                <div className="flex justify-end gap-2">
                   <button onClick={() => handleCancel(dbField)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded">取消</button>
                   <button onClick={() => handleSaveGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-[#00457C] text-white rounded hover:bg-[#003560]">儲存內容</button>
                </div>
              </div>
            ) : null
          ) : (
            <div className={`p-4 text-sm whitespace-pre-wrap ${value || images[dbField] ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {type === 'image' && images[dbField] ? (
                 <img src={images[dbField]} className="w-full h-auto block" alt={title}/> 
              ) : type === 'image' ? (
                 <div className="py-12 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded m-2">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <span className="text-xs font-bold text-slate-400">尚未上傳系統架構圖</span>
                 </div>
              ) : value || '尚未填入評估資訊...'}
            </div>
          )}

          {type === 'image' && !isCompleted && !isLockedByOther && (
             <label className="absolute bottom-4 right-4 cursor-pointer bg-white/90 backdrop-blur shadow-md text-xs font-bold text-[#00457C] border border-slate-200 px-3 py-2 rounded-full hover:bg-white flex items-center gap-2">
               <ImageIcon className="w-4 h-4"/> 更換圖片
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, dbField as 'AS-IS'|'TO-BE')} />
             </label>
          )}

          {!isEditing && !isCompleted && (value || images[dbField]) && !isLockedByOther && (
            <div className="px-4 pb-4 flex justify-end">
              <button onClick={() => handleCompleteGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-[#009B77] text-white hover:bg-[#008260] rounded flex items-center gap-1 shadow-sm"><Check className="w-3.5 h-3.5"/> 確認完成</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans pb-24 overflow-x-hidden relative">
      
      {/* --- 網頁上方導覽列 (不影響 PDF) --- */}
      <div className="sticky top-0 z-40 bg-[#00457C] text-white border-b border-[#003560] shadow-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => router.back()} className="p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded tracking-widest">{projectData.project_code}</span>
                  <div className="flex items-center bg-white/10 border border-white/20 rounded px-2 py-0.5">
                    <Building2 className="w-3 h-3 mr-1.5 text-white/60" />
                    <select value={projectData.department || '未指定'} onChange={(e) => handleDepartmentChange(e.target.value)} disabled={isExporting} className="text-xs font-bold bg-transparent outline-none cursor-pointer">
                      {DEPARTMENTS.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                    </select>
                  </div>
                </div>
                <h1 className="text-xl font-bold tracking-tight">{projectData.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-white/60 tracking-widest">目前案件狀態</span>
                <select value={projectData.status_name_snapshot} onChange={(e) => handleStatusChange(e.target.value)} disabled={isExporting} className="px-3 py-1.5 bg-white text-[#00457C] border-none rounded font-black text-sm outline-none cursor-pointer">
                  {statusDict.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-5 py-2 bg-[#009B77] text-white text-sm font-bold rounded shadow-md hover:bg-[#008260] transition-all active:scale-95 disabled:opacity-50">
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
                匯出評估報告
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-[#009B77] transition-all duration-700" style={{ width: `${completeness}%` }}></div>
            </div>
            <span className="text-[11px] font-black text-white/80 whitespace-nowrap tracking-widest uppercase">Completeness {completeness}%</span>
          </div>
        </div>
      </div>

      {/* --- 網頁主內容區 --- */}
      <div className="max-w-[1600px] mx-auto w-full px-6 py-8 flex flex-col gap-10">
        <section className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-[#00457C] mb-5 flex items-center gap-2"><Lock className="w-4 h-4"/> 專案權責指派編制</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['應用科', '企劃科', '科技科'].map(dept => (
              <div key={dept} className="flex flex-col p-4 bg-slate-50/80 border border-slate-100 rounded">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{dept}</span>
                  <button onClick={() => openUserModal(dept)} className="text-[10px] font-black bg-[#00457C] text-white px-2.5 py-1 rounded hover:bg-[#003560] flex items-center gap-1 transition-colors"><UserPlus className="w-3 h-3"/> 指派</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(projectData.team_members?.[dept] || []).length > 0 ? 
                    projectData.team_members[dept].map((name: string) => (
                      <span key={name} className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-700 shadow-sm flex items-center gap-1">
                        <div className="w-1 h-1 bg-[#009B77] rounded-full"></div> {name}
                      </span>
                    )) : <span className="text-xs text-slate-400 italic">尚未指派負責經辦</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GridBlock title="現行工作職掌與工作流程" dbField="workflow_text" />
          <GridBlock title="現行作業痛點需求" dbField="pain_points_text" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GridBlock title="影響範圍 - 人員" dbField="impact_people_text" />
          <GridBlock title="影響範圍 - 時間" dbField="impact_time_text" />
          <GridBlock title="影響範圍 - 效益" dbField="impact_benefit_text" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GridBlock title="現行系統架構圖 (AS-IS)" dbField="AS-IS" type="image" />
          <GridBlock title="未來規劃系統架構圖 (TO-BE)" dbField="TO-BE" type="image" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GridBlock title="業務可行性評估" dbField="eval_business" />
          <GridBlock title="技術可行性評估" dbField="eval_technical" />
          <GridBlock title="專案成效追蹤指標 (KPI)" dbField="eval_kpi" />
          <GridBlock title="評估委員會綜合結論" dbField="eval_conclusion" />
        </div>
      </div>

      {currentUser?.system_role === 'admin' && Object.keys(locks).length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button onClick={handleUnlockAll} className="bg-rose-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold hover:bg-rose-700 hover:scale-105 transition-all">
            <Unlock className="w-6 h-6"/> 解除全站編輯鎖定
          </button>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-[#00457C]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-[#00457C] flex items-center gap-2"><UserPlus className="w-5 h-5"/> 指派 {activeDept} 人員</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
              {usersList.filter(u => u.department === activeDept).map(user => {
                const isSelected = projectData.team_members?.[activeDept]?.includes(user.full_name);
                return (
                  <div key={user.id} onClick={() => toggleUserSelection(user.full_name)} className={`flex items-center justify-between p-4 rounded border-2 cursor-pointer transition-all ${isSelected ? 'bg-[#00457C]/5 border-[#00457C]' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                    <span className={`text-sm font-bold ${isSelected ? 'text-[#00457C]' : 'text-slate-700'}`}>{user.full_name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#00457C]" />}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsUserModalOpen(false)} className="px-8 py-2 bg-[#00457C] text-white font-bold rounded hover:bg-[#003560]">確認指派</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 隱藏 PDF 區塊 (完全比照上傳的 PDF 檔案排版) */}
      <div className="absolute left-[-9999px] top-0 bg-white">
        
        {/* PDF 頁面共用標題元件 */}
        {(() => {
          const PDFHeader = ({ pageNum }: { pageNum: number }) => (
            <div className="w-full mb-6">
              <div className="text-center text-slate-400 font-mono tracking-widest mb-4">--- PAGE {pageNum} ---</div>
              <div className="text-center text-xl font-bold mb-4">{projectData?.name} - 綜合評估報告</div>
              <div className="text-center text-sm font-bold text-slate-600 border-b-2 border-black pb-4">
                專案編號: {projectData?.project_code} | 提案單位: {projectData?.department || '未指定'}
              </div>
            </div>
          );

          return (
            <>
              {/* === PAGE 1 === */}
              <div ref={pdfPage1Ref} className="w-[794px] h-[1123px] p-[20mm] bg-white flex flex-col font-serif">
                <PDFHeader pageNum={1} />
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {['應用科', '企劃科', '科技科'].map(dept => (
                    <div key={dept} className="flex flex-col">
                      <span className="font-bold text-sm mb-1">{dept}負責人</span>
                      <span className="text-sm text-slate-700">{(projectData?.team_members?.[dept] || []).join(', ') || '未指派'}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-6 flex-1">
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">現行工作職掌與工作流程</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.workflow_text || '無'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">現行作業痛點</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.pain_points_text || '無'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">影響範圍 - 人員</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.impact_people_text || '無'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">影響範圍 - 時間</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.impact_time_text || '無'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">影響範圍 - 效益</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.impact_benefit_text || '無'}</div>
                  </div>
                </div>
              </div>

              {/* === PAGE 2 === */}
              <div ref={pdfPage2Ref} className="w-[794px] h-[1123px] p-[20mm] bg-white flex flex-col font-serif">
                <PDFHeader pageNum={2} />
                
                <div className="font-bold text-lg mb-6 text-center">系統架構圖 (AS-IS / TO-BE)</div>
                
                <div className="flex flex-col gap-8 flex-1">
                  <div className="flex flex-col gap-2">
                    <div className="font-bold text-md border-b border-black pb-1">現行系統架構 (AS-IS)</div>
                    <div className="flex-1 min-h-[300px] border border-slate-300 p-2 flex items-center justify-center">
                      {images['AS-IS'] ? <img src={images['AS-IS']} className="max-w-full max-h-full object-contain" /> : <span className="text-slate-400">無圖片</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="font-bold text-md border-b border-black pb-1">未來系統架構 (TO-BE)</div>
                    <div className="flex-1 min-h-[300px] border border-slate-300 p-2 flex items-center justify-center">
                      {images['TO-BE'] ? <img src={images['TO-BE']} className="max-w-full max-h-full object-contain" /> : <span className="text-slate-400">無圖片</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* === PAGE 3 === */}
              <div ref={pdfPage3Ref} className="w-[794px] h-[1123px] p-[20mm] bg-white flex flex-col font-serif">
                <PDFHeader pageNum={3} />
                
                <div className="font-bold text-lg mb-6 text-center">綜合評估與簽核</div>

                <div className="flex flex-col gap-6 flex-1">
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">業務面評估</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.eval_business || '無'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">技術面評估</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.eval_technical || '無'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">成效追蹤指標 (KPI)</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.eval_kpi || '無'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-md border-b border-black pb-1 mb-2">綜合評估結論</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{projectData?.eval_conclusion || '無'}</div>
                  </div>
                </div>

                <div className="border border-black mt-8">
                  <div className="grid grid-cols-6 w-full">
                    {['需求單位經辦', '需求單位科主管', '需求單位主管', '智金處經辦', '智金處科主管', '智金處主管'].map((role, idx) => (
                      <div key={idx} className={`flex flex-col h-[120px] ${idx !== 5 ? 'border-r border-black' : ''}`}>
                        <div className="border-b border-black py-2 text-center text-xs font-bold">{role}</div>
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