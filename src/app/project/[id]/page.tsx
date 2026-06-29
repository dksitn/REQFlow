'use client';

export const runtime = 'edge';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, FileDown, Lock, Edit3, X, UserPlus, Image as ImageIcon, Unlock, Building2, ZoomIn, Pencil, Trash2, AlertTriangle, ChevronDown, SplitSquareHorizontal } from 'lucide-react';
import { toPng } from 'html-to-image'; 
import jsPDF from 'jspdf';

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
  
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  
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

  // Modal 狀態
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<string>('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  // 放大圖片、雙圖對照與預覽 PDF 狀態
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<string[]>([]); 
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const VALID_EVAL_FIELDS = [
    'workflow_text', 'as_is_text', 
    'impact_people_text', 'impact_time_text', 'impact_benefit_text',
    'AS-IS', 'TO-BE',
    'eval_business', 'eval_technical', 'eval_kpi', 'eval_conclusion'
  ];

  useEffect(() => {
    async function fetchAllData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('m01_users').select('*').eq('email', user.email).single();
          setCurrentUser(profile);
        }

        const [projRes, statRes, usersRes, locksRes, imagesRes, deptsRes] = await Promise.all([
          supabase.from('m01_projects').select('*').eq('id', projectId).single(),
          supabase.from('m01_status_dict').select('*').order('sort_order', { ascending: true }),
          supabase.from('m01_users').select('*'),
          supabase.from('m01_edit_locks').select('*').eq('project_id', projectId),
          supabase.from('m01_project_assessment_images').select('*').eq('project_id', projectId),
          supabase.from('m01_departments').select('*').order('created_at', { ascending: true }) 
        ]);

        if (projRes.data) {
          setProjectData(projRes.data);
          setTitleDraft(projRes.data.name);
          
          const rawConfirmed = projRes.data.confirmed_fields || {};
          const cleanConfirmed: Record<string, boolean> = {};
          VALID_EVAL_FIELDS.forEach(f => {
            if (rawConfirmed[f] === true) cleanConfirmed[f] = true;
          });
          setConfirmedFields(cleanConfirmed);

          if (!projRes.data.team_members) {
            projRes.data.team_members = { '應用科': [], '企劃科': [], '科技科': [], '唯讀檢視者': [] };
          } else if (!projRes.data.team_members['唯讀檢視者']) {
            projRes.data.team_members['唯讀檢視者'] = [];
          }
        }
        if (statRes.data) setStatusDict(statRes.data);
        if (usersRes.data) setUsersList(usersRes.data);
        
        if (deptsRes.data && deptsRes.data.length > 0) {
            setDepartmentsList(deptsRes.data);
        } else {
            setDepartmentsList([]);
        }

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
        console.error('載入資料失敗', error);
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

    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => { 
      supabase.removeChannel(lockSubscription); 
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [projectId]);

  const saveProjectToDB = async (updates: any) => {
    try {
      await supabase.from('m01_projects').update(updates).eq('id', projectId);
      setProjectData((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {}
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsStatusDropdownOpen(false);
    await saveProjectToDB({ status_name_snapshot: newStatus });
  };
  
  const saveTitle = async () => {
    if (!titleDraft.trim()) {
       setTitleDraft(projectData.name);
       return setIsTitleEditing(false);
    }
    await saveProjectToDB({ name: titleDraft });
    setIsTitleEditing(false);
  };

  const selectDepartment = async (deptName: string) => {
    await saveProjectToDB({ department: deptName });
    setIsDeptModalOpen(false);
  };

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

  const handleUndoComplete = async (field: string) => {
    const newConfirmed = { ...confirmedFields };
    newConfirmed[field] = false;
    await saveProjectToDB({ confirmed_fields: newConfirmed });
    setConfirmedFields(newConfirmed);
  };

  const handleUnlockAll = async () => {
    if (!confirm('確定解除全站所有人的編輯鎖定嗎？')) return;
    await supabase.from('m01_edit_locks').delete().eq('project_id', projectId);
    setLocks({});
  };

  const handleDeleteProject = async () => {
    if (currentUser?.system_role !== 'admin') return;
    setIsDeleting(true);
    try {
      await supabase.from('m01_projects').delete().eq('id', projectId);
      router.push('/my-projects'); 
    } catch (error) {
      console.error('刪除案件失敗:', error);
      alert('刪除失敗，請稍後再試。');
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'AS-IS' | 'TO-BE') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const { error } = await supabase.from('m01_project_assessment_images').upsert({ project_id: projectId, image_type: type, image_url: base64String });
        if (error) throw error;
        setImages(prev => ({ ...prev, [type]: base64String }));
      } catch (err) {
        console.error('圖片上傳失敗', err);
        alert('圖片上傳失敗，請確認資料庫 m01_project_assessment_images 設定。');
      }
    };
    reader.readAsDataURL(file);
  };

  const openUserModal = (dept: string) => { setActiveDept(dept); setIsUserModalOpen(true); };
  const toggleUserSelection = async (userName: string) => {
    const currentTeam = projectData.team_members || { '應用科': [], '企劃科': [], '科技科': [], '唯讀檢視者': [] };
    const deptUsers = currentTeam[activeDept] || [];
    const newDeptUsers = deptUsers.includes(userName) ? deptUsers.filter((n: string) => n !== userName) : [...deptUsers, userName];
    await saveProjectToDB({ team_members: { ...currentTeam, [activeDept]: newDeptUsers } });
  };

  const handlePreviewPDF = async () => {
    setIsExporting(true);
    setPdfPreviewData([]);
    
    setTimeout(async () => {
      try {
        const pages = [pdfPage1Ref.current, pdfPage2Ref.current, pdfPage3Ref.current];
        const previewImages = [];
        
        for (let i = 0; i < pages.length; i++) {
          const element = pages[i];
          if (!element) continue;
          
          const imgData = await toPng(element, { 
            pixelRatio: 2, 
            backgroundColor: '#ffffff'
          });
          previewImages.push(imgData);
        }
        
        setPdfPreviewData(previewImages);
        setIsPreviewModalOpen(true);
      } catch (error) {
        console.error(error);
        alert('產生預覽畫面時發生錯誤。');
      } finally { 
        setIsExporting(false); 
      }
    }, 500); 
  };

  const handleDownloadPDF = () => {
    if (pdfPreviewData.length === 0) return;
    const pdf = new jsPDF('landscape', 'mm', 'a4'); 
    const pdfWidth = 297; 
    const pdfHeight = 210; 
    
    pdfPreviewData.forEach((imgData, index) => {
      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    });
    
    pdf.save(`${projectData?.project_code || '專案'}_綜合評估報告.pdf`);
    setIsPreviewModalOpen(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!projectData) return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;

  const totalGrids = VALID_EVAL_FIELDS.length; 
  const completedGrids = VALID_EVAL_FIELDS.filter(k => confirmedFields[k]).length;
  const completeness = Math.min(100, Math.round((completedGrids / totalGrids) * 100));

  // === 網頁 UI ===
  const GridBlock = ({ title, dbField, type = 'textarea' }: { title: string, dbField: string, type?: 'textarea' | 'image' }) => {
    const isEditing = editingField === dbField;
    const isCompleted = confirmedFields[dbField];
    const value = projectData[dbField] || '';
    const isLockedByOther = locks[dbField] && locks[dbField].user_id !== currentUser?.id;

    return (
      <div className={`flex flex-col bg-white border ${isCompleted ? 'border-emerald-200' : isEditing ? 'border-blue-400 shadow-md ring-1 ring-blue-400' : 'border-slate-200'} rounded-xl shadow-sm transition-all overflow-hidden relative`}>
        <div className={`px-5 py-3 flex items-center justify-between border-b ${isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isLockedByOther ? 'bg-rose-500' : isEditing ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></div>
             <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          </div>
          <div className="flex gap-2 items-center">
            {type === 'image' && images['AS-IS'] && images['TO-BE'] && !isEditing && (
               <button onClick={() => setIsCompareModalOpen(true)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1 mr-2">
                  <SplitSquareHorizontal className="w-3.5 h-3.5"/> 雙圖對照
               </button>
            )}

            {isLockedByOther ? (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 flex items-center gap-1"><Lock className="w-3 h-3"/> {locks[dbField].user_name} 編輯中</span>
            ) : (
              <>
                {!isEditing && !isCompleted && type !== 'image' && (
                  <button onClick={() => handleEdit(dbField, value)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-blue-50 px-2 py-1 rounded transition-all flex items-center gap-1"><Edit3 className="w-3.5 h-3.5"/> 編輯</button>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4"/> 已完成</span>
                     <button onClick={() => handleUndoComplete(dbField)} className="text-[11px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors flex items-center gap-1">
                       <Edit3 className="w-3 h-3" /> 重新修改
                     </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col p-4 relative group min-h-[160px]">
          {isEditing ? (
            type === 'textarea' ? (
              <div className="flex flex-col gap-3 h-full">
                <textarea value={drafts[dbField] || ''} onChange={(e) => setDrafts({...drafts, [dbField]: e.target.value})} className="flex-1 w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-shadow" />
                <div className="flex justify-end gap-2">
                   <button onClick={() => handleCancel(dbField)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-lg transition-all">取消</button>
                   <button onClick={() => handleSaveGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg transition-all">儲存</button>
                </div>
              </div>
            ) : null
          ) : (
            <div className={`flex-1 text-sm whitespace-pre-wrap ${value || images[dbField] ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {type === 'image' && images[dbField] ? (
                 <div className="relative w-full flex justify-center items-center h-full">
                   <img src={images[dbField]} className="max-w-full max-h-[300px] object-contain rounded-lg border border-slate-100 cursor-pointer" onClick={() => setZoomedImage(images[dbField])} alt={title}/> 
                   <button onClick={() => setZoomedImage(images[dbField])} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"><ZoomIn className="w-5 h-5"/></button>
                 </div>
              ) : type === 'image' ? (
                 <div className="py-12 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-lg m-1 h-full">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <span className="text-xs font-bold text-slate-400">尚未上傳圖片</span>
                 </div>
              ) : value || '尚未填寫資料...'}
            </div>
          )}

          {type === 'image' && !isCompleted && !isLockedByOther && (
             <label className="absolute bottom-4 right-4 cursor-pointer bg-white shadow-sm border border-slate-200 text-xs font-bold text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-400 flex items-center gap-1.5 z-10 transition-all">
               <ImageIcon className="w-3.5 h-3.5"/> 上傳/更換圖片
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, dbField as 'AS-IS'|'TO-BE')} />
             </label>
          )}

          {!isEditing && !isCompleted && (value || images[dbField]) && !isLockedByOther && (
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <button onClick={() => handleCompleteGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 rounded-lg flex items-center gap-1 transition-all"><Check className="w-3.5 h-3.5"/> 標記為完成</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 overflow-x-hidden relative">
      
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded tracking-wider">{projectData.project_code}</span>
                  
                  <button onClick={() => setIsDeptModalOpen(true)} className="flex items-center bg-slate-100 rounded px-2.5 py-1 border border-slate-200 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all">
                    <Building2 className="w-3 h-3 mr-1.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">{projectData.department || '設定提案單位'}</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2 group">
                  {isTitleEditing ? (
                    <input 
                      autoFocus
                      type="text" 
                      value={titleDraft} 
                      onChange={(e) => setTitleDraft(e.target.value)} 
                      onBlur={saveTitle}
                      onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                      className="text-xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none focus:ring-0 bg-transparent"
                    />
                  ) : (
                    <button onClick={() => setIsTitleEditing(true)} className="text-xl font-bold text-slate-900 cursor-pointer hover:text-blue-700 focus:outline-none focus:text-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded transition-all text-left">
                      {projectData.name}
                    </button>
                  )}
                  {!isTitleEditing && <button onClick={() => setIsTitleEditing(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-all"><Pencil className="w-4 h-4"/></button>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              
              {currentUser?.system_role === 'admin' && (
                <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-rose-600 text-sm font-bold rounded-lg hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all border border-transparent hover:border-rose-200 mr-2">
                  <Trash2 className="w-4 h-4" /> 刪除此案件
                </button>
              )}

              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-slate-400">目前案件狀態</span>
                
                <div className="relative" ref={statusDropdownRef}>
                  <button 
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    disabled={isExporting}
                    className="flex items-center justify-between min-w-[140px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow disabled:opacity-50"
                  >
                    {projectData.status_name_snapshot}
                    <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
                  </button>
                  
                  {isStatusDropdownOpen && (
                    <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
                      {statusDict.map(s => (
                        <button 
                          key={s.id}
                          onClick={() => handleStatusChange(s.name)}
                          className={`px-4 py-2 text-sm font-bold text-left transition-colors ${projectData.status_name_snapshot === s.name ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <button onClick={handlePreviewPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all disabled:opacity-50">
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
                {isExporting ? '生成預覽中...' : '預覽並匯出報告'}
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

      <div className="max-w-[1600px] mx-auto w-full px-6 py-8 flex flex-col gap-6">
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400"/> 專案負責人編制</h2>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {['應用科', '企劃科', '科技科', '唯讀檢視者'].map(dept => (
              <div key={dept} className={`flex flex-col p-4 rounded-lg border ${dept === '唯讀檢視者' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-bold ${dept === '唯讀檢視者' ? 'text-indigo-600' : 'text-slate-600'}`}>{dept}</span>
                  <button onClick={() => openUserModal(dept)} className="text-[10px] font-bold bg-white border border-slate-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-1 transition-all"><UserPlus className="w-3 h-3"/> 指派</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(projectData.team_members?.[dept] || []).length > 0 ? 
                    projectData.team_members[dept].map((name: string) => (
                      <span key={name} className={`text-xs font-bold bg-white border px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 ${dept === '唯讀檢視者' ? 'border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dept === '唯讀檢視者' ? 'bg-indigo-500' : 'bg-blue-500'}`}></div> {name}
                      </span>
                    )) : <span className="text-xs text-slate-400 italic">尚未指派</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行工作職掌與工作流程" dbField="workflow_text" />
          <GridBlock title="現行作業痛點需求" dbField="as_is_text" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GridBlock title="影響範圍 - 人員" dbField="impact_people_text" />
          <GridBlock title="影響範圍 - 時間" dbField="impact_time_text" />
          <GridBlock title="影響範圍 - 效益" dbField="impact_benefit_text" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行系統架構圖 (AS-IS)" dbField="AS-IS" type="image" />
          <GridBlock title="未來規劃系統架構圖 (TO-BE)" dbField="TO-BE" type="image" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="業務面可行性評估" dbField="eval_business" />
          <GridBlock title="技術面可行性評估" dbField="eval_technical" />
          <GridBlock title="專案成效追蹤指標 (KPI)" dbField="eval_kpi" />
          <GridBlock title="評估委員會綜合結論" dbField="eval_conclusion" />
        </div>
      </div>

      {currentUser?.system_role === 'admin' && Object.keys(locks).length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button onClick={handleUnlockAll} className="bg-rose-600 text-white p-3.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-300 hover:scale-105 transition-all">
            <Unlock className="w-5 h-5"/> 解除編輯鎖定
          </button>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
               <AlertTriangle className="w-8 h-8" />
               <h3 className="font-bold text-lg text-slate-900">確認刪除案件？</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              您即將刪除案件 <strong className="text-slate-800">[{projectData?.project_code}] {projectData?.name}</strong>。<br/>
              此操作無法復原，與該案件相關的所有評估資料、圖片及鎖定紀錄都將一併被永久移除。
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-lg transition-all disabled:opacity-50">取消</button>
              <button onClick={handleDeleteProject} disabled={isDeleting} className="px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} 
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400"/> 選擇提案單位</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 rounded"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto grid grid-cols-2 gap-3">
              {departmentsList.map((dept, index) => {
                const displayName = dept.name || dept.dept_name || '未命名單位';
                const deptId = dept.id || index;
                const isSelected = projectData?.department === displayName;

                return (
                  <button 
                    key={deptId} 
                    onClick={() => selectDepartment(displayName)} 
                    className={`p-3 rounded-lg border text-sm font-bold transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${isSelected ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                  >
                    {displayName}
                  </button>
                );
              })}
              {departmentsList.length === 0 && (
                 <div className="col-span-2 text-center text-slate-400 text-sm py-4">查無單位資料</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><UserPlus className="w-4 h-4 text-slate-400"/> 指派 {activeDept} 人員</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 rounded"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-2">
              {usersList.filter(u => u.department === activeDept).map(user => {
                const isSelected = projectData.team_members?.[activeDept]?.includes(user.full_name);
                return (
                  <div key={user.id} onClick={() => toggleUserSelection(user.full_name)} className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-blue-100'}`}>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{user.full_name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setIsUserModalOpen(false)} className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all">完成指派</button>
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white"><X className="w-8 h-8"/></button>
          <img src={zoomedImage} className="max-w-full max-h-full object-contain shadow-2xl rounded" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {isCompareModalOpen && images['AS-IS'] && images['TO-BE'] && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex flex-col p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-white text-xl font-bold flex items-center gap-2"><SplitSquareHorizontal className="w-5 h-5"/> AS-IS / TO-BE 雙圖對照</h2>
            <button onClick={() => setIsCompareModalOpen(false)} className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-6 h-6"/></button>
          </div>
          <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
            <div className="flex-1 bg-slate-800 rounded-xl flex flex-col overflow-hidden border border-slate-700">
               {/* 🚀 加入標記完成與重新修改按鈕 */}
               <div className="bg-slate-700 text-slate-300 px-4 py-2 flex items-center justify-between shrink-0">
                 <span className="text-xs font-bold tracking-widest uppercase">現行架構 (AS-IS)</span>
                 <div>
                   {!confirmedFields['AS-IS'] ? (
                     <button onClick={() => handleCompleteGrid('AS-IS')} className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                       <Check className="w-3 h-3"/> 標記為完成
                     </button>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3"/> 已完成</span>
                       <button onClick={() => handleUndoComplete('AS-IS')} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded transition-colors flex items-center gap-1">
                         <Edit3 className="w-3 h-3" /> 重新修改
                       </button>
                     </div>
                   )}
                 </div>
               </div>
               <div className="flex-1 p-4 min-h-0 flex items-center justify-center overflow-hidden">
                  <img src={images['AS-IS']} className="max-w-full max-h-full object-contain rounded" />
               </div>
            </div>
            
            <div className="flex-1 bg-slate-800 rounded-xl flex flex-col overflow-hidden border border-slate-700">
               {/* 🚀 加入標記完成與重新修改按鈕 */}
               <div className="bg-slate-700 text-slate-300 px-4 py-2 flex items-center justify-between shrink-0">
                 <span className="text-xs font-bold tracking-widest uppercase">未來架構 (TO-BE)</span>
                 <div>
                   {!confirmedFields['TO-BE'] ? (
                     <button onClick={() => handleCompleteGrid('TO-BE')} className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                       <Check className="w-3 h-3"/> 標記為完成
                     </button>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3"/> 已完成</span>
                       <button onClick={() => handleUndoComplete('TO-BE')} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded transition-colors flex items-center gap-1">
                         <Edit3 className="w-3 h-3" /> 重新修改
                       </button>
                     </div>
                   )}
                 </div>
               </div>
               <div className="flex-1 p-4 min-h-0 flex items-center justify-center overflow-hidden">
                  <img src={images['TO-BE']} className="max-w-full max-h-full object-contain rounded" />
               </div>
            </div>
          </div>
        </div>
      )}

      {isPreviewModalOpen && pdfPreviewData.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex flex-col p-6 animate-in fade-in">
          <div className="flex items-center justify-between bg-white rounded-t-xl px-6 py-4 border-b border-slate-200 shadow-xl">
             <h2 className="text-lg font-bold text-slate-800">PDF 匯出預覽 (共 {pdfPreviewData.length} 頁)</h2>
             <div className="flex gap-4">
               <button onClick={() => setIsPreviewModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-lg transition-all">取消</button>
               <button onClick={handleDownloadPDF} className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 shadow flex items-center gap-2 transition-all"><FileDown className="w-4 h-4"/> 另存為 PDF</button>
             </div>
          </div>
          <div className="flex-1 bg-slate-200 overflow-y-auto p-8 flex flex-col gap-8 items-center rounded-b-xl shadow-inner">
             {pdfPreviewData.map((img, i) => (
                <div key={i} className="relative group">
                  <div className="absolute -left-12 top-0 text-sm font-bold text-slate-400">P.{i+1}</div>
                  <img src={img} className="max-w-[900px] shadow-2xl rounded-sm border border-slate-300" />
                </div>
             ))}
          </div>
        </div>
      )}

      <div className="absolute left-[-9999px] top-0 bg-white text-black font-sans">
        {(() => {
          const PDFHeader = ({ pageNum, title }: { pageNum: number, title: string }) => (
            <div className="w-full mb-6 flex flex-col border-b-[2px] border-slate-200 pb-3">
              <div className="text-center text-slate-400 font-mono text-[10px] tracking-widest mb-3">--- PAGE {pageNum} ---</div>
              <div className="flex items-center justify-between">
                  <h1 className="text-xl font-black text-slate-800">{title}</h1>
                  <div className="text-right flex flex-col items-end">
                     <span className="text-[10px] font-bold text-slate-500 tracking-widest">綜合評估報告 Assessment Report</span>
                     <span className="text-base font-black text-slate-900">{projectData?.project_code}</span>
                  </div>
              </div>
            </div>
          );

          const PDFBlock = ({ title, content, colSpan = 1, className = "" }: { title: string, content: string | React.ReactNode, colSpan?: 1 | 2 | 3, className?: string }) => (
            <div className={`border border-slate-200 rounded-lg p-4 bg-white flex flex-col shadow-sm ${colSpan === 2 ? 'col-span-2' : colSpan === 3 ? 'col-span-3' : ''} ${className}`}>
              <div className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 mb-3 bg-slate-50 -mx-4 -mt-4 px-4 pt-3 rounded-t-lg">{title}</div>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">{content || '（無內容）'}</div>
            </div>
          );

          const PAGE_CLASS = "w-[1122px] h-[793px] p-[15mm] bg-white flex flex-col box-border overflow-hidden";

          return (
            <>
              {/* PAGE 1 */}
              <div ref={pdfPage1Ref} className={PAGE_CLASS}>
                <PDFHeader pageNum={1} title={`${projectData?.name} - 綜合評估報告`} />
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {['應用科', '企劃科', '科技科'].map(dept => (
                    <div key={dept} className="flex flex-col p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                      <span className="font-bold text-[10px] text-slate-400 mb-1 tracking-widest uppercase">{dept}負責人</span>
                      <span className="text-sm font-black text-slate-800">{(projectData?.team_members?.[dept] || []).join(', ') || '尚未指派'}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1 h-[250px] mb-4">
                   <PDFBlock title="現行工作職掌與工作流程" content={projectData?.workflow_text} />
                   <PDFBlock title="現行作業痛點需求" content={projectData?.as_is_text} />
                </div>

                <div className="grid grid-cols-3 gap-4 flex-1 h-[200px]">
                   <PDFBlock title="影響範圍 - 人員" content={projectData?.impact_people_text} />
                   <PDFBlock title="影響範圍 - 時間" content={projectData?.impact_time_text} />
                   <PDFBlock title="影響範圍 - 效益" content={projectData?.impact_benefit_text} />
                </div>
              </div>

              {/* PAGE 2 */}
              <div ref={pdfPage2Ref} className={PAGE_CLASS}>
                <PDFHeader pageNum={2} title="系統架構圖 (Current AS-IS / Planned TO-BE)" />
                <div className="grid grid-cols-2 gap-6 flex-1 h-full pb-4">
                  <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden h-full shadow-sm">
                    <div className="bg-slate-50 text-slate-700 border-b border-slate-200 px-4 py-3 text-xs font-black text-center tracking-widest uppercase">現行系統架構圖 (Current AS-IS)</div>
                    <div className="flex-1 flex items-center justify-center bg-white p-4 overflow-hidden">
                      {images['AS-IS'] ? <img src={images['AS-IS']} className="max-w-full max-h-[550px] object-contain" /> : <span className="text-slate-400 text-sm">無圖片</span>}
                    </div>
                  </div>
                  <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden h-full shadow-sm">
                    <div className="bg-slate-50 text-slate-700 border-b border-slate-200 px-4 py-3 text-xs font-black text-center tracking-widest uppercase">未來規劃系統架構圖 (Planned TO-BE)</div>
                    <div className="flex-1 flex items-center justify-center bg-white p-4 overflow-hidden">
                      {images['TO-BE'] ? <img src={images['TO-BE']} className="max-w-full max-h-[550px] object-contain" /> : <span className="text-slate-400 text-sm">無圖片</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 3 */}
              <div ref={pdfPage3Ref} className={PAGE_CLASS}>
                <PDFHeader pageNum={3} title="綜合評估與核決簽章 (Final Conclusion & Approvals)" />
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 flex-1 mb-4 h-[400px]">
                   <PDFBlock title="業務可行性評估" content={projectData?.eval_business} />
                   <PDFBlock title="技術可行性評估" content={projectData?.eval_technical} />
                   <PDFBlock title="專案成效追蹤指標 (KPI)" content={projectData?.eval_kpi} />
                   <PDFBlock title="綜合評估結論" content={projectData?.eval_conclusion} className="border-[2px] border-blue-400 bg-blue-50/10"/>
                </div>

                <div className="border border-slate-200 rounded-lg mt-auto overflow-hidden shadow-sm">
                  <div className="grid grid-cols-6 w-full h-[100px] divide-x divide-slate-200">
                    {['需求單位經辦', '需求單位科主管', '需求單位主管', '智慧金融處經辦', '智慧金融處科主管', '智慧金融處主管'].map((role, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="border-b border-slate-200 py-2 text-center text-[10px] font-bold bg-slate-50 text-slate-600">{role}</div>
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