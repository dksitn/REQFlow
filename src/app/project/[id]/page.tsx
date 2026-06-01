'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Loader2, ArrowLeft, Building2, UserCircle, Activity, LayoutGrid, FileImage, X, Check, UploadCloud, Eye, RefreshCw, Columns, Lock, Edit3, Save } from 'lucide-react';

// ==========================================
// 🚀 可重用元件：協作鎖文字編輯卡片 (附帶高保真色彩主題)
// ==========================================
function EditableCard({ title, fieldKey, projectId, initialValue, currentUserId, onSave, placeholder, theme = 'slate' }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialValue || '');
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockOwnerName, setLockOwnerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 確保外部資料更新時，內部 state 也能同步
  useEffect(() => {
    if (!isEditing) setText(initialValue || '');
  }, [initialValue, isEditing]);

  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase.from('m01_edit_locks').select('locked_by, m01_users(full_name)').eq('project_id', projectId).eq('field_name', fieldKey).single();
      if (data && data.locked_by !== currentUserId) {
        setIsLockedByOther(true);
        setLockOwnerName(data.m01_users?.full_name || '其他同事');
      } else {
        setIsLockedByOther(false);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 5000);
    return () => clearInterval(interval);
  }, [projectId, fieldKey, currentUserId]);

  const handleEdit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('m01_edit_locks').upsert(
        { project_id: projectId, field_name: fieldKey, locked_by: currentUserId, locked_at: new Date().toISOString() },
        { onConflict: 'project_id,field_name' }
      );
      if (error) throw error;
      setIsEditing(true);
    } catch (err) {
      alert('無法編輯：該區塊正被其他人編輯中！');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsEditing(false);
    setText(initialValue || '');
    await supabase.from('m01_edit_locks').delete().eq('project_id', projectId).eq('field_name', fieldKey);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(fieldKey, text);
      setIsEditing(false);
      await supabase.from('m01_edit_locks').delete().eq('project_id', projectId).eq('field_name', fieldKey);
    } catch (err) {
      alert('儲存失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 精準還原高保真色彩主題字典
  const themeStyles: Record<string, any> = {
    slate: { title: 'text-slate-700', borderHover: 'hover:border-slate-300', focusRing: 'border-slate-500 ring-slate-500/20', borderB: 'border-slate-100' },
    emerald: { title: 'text-emerald-700', borderHover: 'hover:border-emerald-300', focusRing: 'border-emerald-500 ring-emerald-500/20', borderB: 'border-emerald-100' },
    purple: { title: 'text-purple-700', borderHover: 'hover:border-purple-300', focusRing: 'border-purple-500 ring-purple-500/20', borderB: 'border-purple-100' },
    orange: { title: 'text-orange-700', borderHover: 'hover:border-orange-300', focusRing: 'border-orange-500 ring-orange-500/20', borderB: 'border-orange-100' },
    blue: { title: 'text-blue-700', borderHover: 'hover:border-blue-300', focusRing: 'border-blue-500 ring-blue-500/20', borderB: 'border-blue-100' }
  };
  const styles = themeStyles[theme] || themeStyles.slate;

  return (
    <div className={`bg-white p-5 rounded-xl border shadow-sm min-h-[200px] flex flex-col transition-all ${isEditing ? `ring-2 ${styles.focusRing}` : `border-slate-200 ${styles.borderHover}`}`}>
      <div className={`flex items-center justify-between mb-3 border-b ${styles.borderB} pb-2`}>
        <h3 className={`text-sm font-bold ${styles.title}`}>{title}</h3>
        {!isEditing && isLockedByOther && (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded border border-rose-100"><Lock className="w-3 h-3" /> {lockOwnerName} 編輯中</span>
        )}
      </div>
      
      {isEditing ? (
        <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <textarea 
            value={text} onChange={(e) => setText(e.target.value)} disabled={isLoading}
            className="flex-1 w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:border-blue-400 focus:bg-white transition-all min-h-[120px]"
            placeholder={placeholder}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={handleCancel} disabled={isLoading} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
            <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-sm">
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 儲存
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !isLockedByOther && !isLoading && handleEdit()} 
          className={`flex-1 text-sm leading-relaxed p-2 -mx-2 rounded-lg transition-colors relative group ${isLockedByOther ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 cursor-text hover:bg-slate-50'}`}
        >
          {text ? text.split('\n').map((line: string, i: number) => <React.Fragment key={i}>{line}<br/></React.Fragment>) : <span className="text-slate-400 italic">{placeholder}</span>}
          {!isLockedByOther && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 shadow-sm">
              <Edit3 className="w-3 h-3" /> 點擊編輯
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🚀 主頁面
// ==========================================
export default function ProjectAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // --- 狀態彈窗 States ---
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [pendingStatusId, setPendingStatusId] = useState<string>('');
  const [pendingStatusName, setPendingStatusName] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // --- 圖片管理 States ---
  const [images, setImages] = useState<{ AS_IS: any; TO_BE: any }>({ AS_IS: null, TO_BE: null });
  const [isUploading, setIsUploading] = useState<{ AS_IS: boolean; TO_BE: boolean }>({ AS_IS: false, TO_BE: false });
  const asIsInputRef = useRef<HTMLInputElement>(null);
  const toBeInputRef = useRef<HTMLInputElement>(null);
  
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'SINGLE_AS_IS' | 'SINGLE_TO_BE' | 'DUAL'>('DUAL');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        const { data: projData, error: projError } = await supabase.from('m01_projects').select(`*, m01_project_responsibles(responsible_name_snapshot)`).eq('id', projectId).single();
        if (projError) throw projError;
        setProject(projData);
        setPendingStatusId(projData.status_id || '');
        setPendingStatusName(projData.status_name_snapshot || '');

        const { data: statuses } = await supabase.from('m01_project_status_options').select('*').eq('is_active', true).order('display_order');
        if (statuses) setStatusOptions(statuses);

        const { data: imgData } = await supabase.from('m01_project_assessment_images').select('*').eq('project_id', projectId).eq('is_current', true);
        if (imgData) setImages({ AS_IS: imgData.find(img => img.image_type === 'AS_IS'), TO_BE: imgData.find(img => img.image_type === 'TO_BE') });
      } catch (error) {
        console.error('讀取失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (projectId) fetchData();
  }, [projectId]);

  const handleUpdateStatus = async () => {
    if (!pendingStatusId || pendingStatusId === project.status_id) return setIsStatusModalOpen(false);
    setIsUpdatingStatus(true);
    try {
      await supabase.from('m01_projects').update({ status_id: pendingStatusId, status_name_snapshot: pendingStatusName }).eq('id', projectId);
      setProject({ ...project, status_id: pendingStatusId, status_name_snapshot: pendingStatusName });
      setIsStatusModalOpen(false);
    } finally { setIsUpdatingStatus(false); }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'AS_IS' | 'TO_BE') => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(prev => ({ ...prev, [type]: true }));
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        await supabase.from('m01_project_assessment_images').update({ is_current: false }).eq('project_id', projectId).eq('image_type', type);
        const { data } = await supabase.from('m01_project_assessment_images').insert({ project_id: projectId, image_type: type, file_name: file.name, file_mime_type: file.type, image_binary: base64, thumbnail_binary: base64, is_current: true }).select().single();
        setImages(prev => ({ ...prev, [type]: data }));
      } finally { setIsUploading(prev => ({ ...prev, [type]: false })); event.target.value = ''; }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveText = async (fieldKey: string, newText: string) => {
    const { error } = await supabase.from('m01_projects').update({ [fieldKey]: newText }).eq('id', projectId);
    if (error) throw error;
    setProject((prev: any) => ({ ...prev, [fieldKey]: newText }));
  };

  const openViewer = (mode: 'SINGLE_AS_IS' | 'SINGLE_TO_BE' | 'DUAL') => { setViewerMode(mode); setIsViewerOpen(true); };

  if (isLoading) return <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" /><p className="text-sm font-bold text-slate-500">載入中...</p></div>;
  if (!project) return <div className="p-8 font-bold text-slate-600">找不到此專案</div>;

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 w-full h-screen overflow-y-auto relative">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900">{project.name}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">{project.project_code}</span>
              <button onClick={() => setIsStatusModalOpen(true)} className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm group">
                {project.status_name_snapshot} <Activity className="w-3 h-3 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {project.department}</span>
              <span className="flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5 text-slate-400" /> {project.m01_project_responsibles?.[0]?.responsible_name_snapshot || '未指定'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-12 pb-24">
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2"><LayoutGrid className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-extrabold text-slate-800">第一階段：專案基本評估</h2></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableCard 
              title="現行作業痛點 (As-Is)" fieldKey="as_is_text" projectId={projectId} initialValue={project.as_is_text} currentUserId={currentUserId} onSave={handleSaveText}
              placeholder="點擊此處開始編輯痛點內容..." theme="slate"
            />
            <EditableCard 
              title="專案預期目標 (To-Be)" fieldKey="to_be_text" projectId={projectId} initialValue={project.to_be_text} currentUserId={currentUserId} onSave={handleSaveText}
              placeholder="點擊此處開始編輯目標內容..." theme="slate"
            />
          </div>

          {/* 圖片上傳區 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group min-h-[220px] flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileImage className="w-4 h-4 text-slate-400" /> As-Is 現行流程圖</h3>{images.AS_IS && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">已上傳</span>}</div>
              <div className="flex-1 relative flex items-center justify-center bg-slate-50">
                <input type="file" ref={asIsInputRef} onChange={(e) => handleImageUpload(e, 'AS_IS')} accept="image/png, image/jpeg" className="hidden" />
                {isUploading.AS_IS ? (
                  <div className="flex flex-col items-center text-blue-500"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">上傳中...</span></div>
                ) : images.AS_IS ? (
                  <>
                    <img src={images.AS_IS.thumbnail_binary} alt="As-Is" className="w-full h-full object-cover absolute inset-0" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                      <button onClick={() => openViewer('SINGLE_AS_IS')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 shadow-sm transition-all"><Eye className="w-4 h-4" /> 檢視</button>
                      <button onClick={() => asIsInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 border border-white/30 transition-all"><RefreshCw className="w-4 h-4" /> 替換</button>
                    </div>
                  </>
                ) : (
                  <div onClick={() => asIsInputRef.current?.click()} className="flex flex-col items-center text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 w-full h-full justify-center transition-all cursor-pointer"><UploadCloud className="w-8 h-8 mb-2" /><span className="text-sm font-bold">上傳 As-Is 圖片</span><span className="text-xs mt-1">支援 PNG, JPG (Max 5MB)</span></div>
                )}
              </div>
            </div>
            <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group min-h-[220px] flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileImage className="w-4 h-4 text-slate-400" /> To-Be 目標流程圖</h3>{images.TO_BE && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">已上傳</span>}</div>
              <div className="flex-1 relative flex items-center justify-center bg-slate-50">
                <input type="file" ref={toBeInputRef} onChange={(e) => handleImageUpload(e, 'TO_BE')} accept="image/png, image/jpeg" className="hidden" />
                {isUploading.TO_BE ? (
                  <div className="flex flex-col items-center text-blue-500"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">上傳中...</span></div>
                ) : images.TO_BE ? (
                  <>
                    <img src={images.TO_BE.thumbnail_binary} alt="To-Be" className="w-full h-full object-cover absolute inset-0" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                      <button onClick={() => openViewer('SINGLE_TO_BE')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 shadow-sm transition-all"><Eye className="w-4 h-4" /> 檢視</button>
                      <button onClick={() => toBeInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 border border-white/30 transition-all"><RefreshCw className="w-4 h-4" /> 替換</button>
                    </div>
                  </>
                ) : (
                  <div onClick={() => toBeInputRef.current?.click()} className="flex flex-col items-center text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 w-full h-full justify-center transition-all cursor-pointer"><UploadCloud className="w-8 h-8 mb-2" /><span className="text-sm font-bold">上傳 To-Be 圖片</span><span className="text-xs mt-1">支援 PNG, JPG (Max 5MB)</span></div>
                )}
              </div>
            </div>
            {(images.AS_IS && images.TO_BE) && (
              <div className="col-span-1 md:col-span-2 flex justify-center mt-2">
                <button onClick={() => openViewer('DUAL')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 text-sm font-bold rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm transition-all">
                  <Columns className="w-4 h-4" /> 進入雙圖對照模式 (As-Is vs To-Be)
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2"><Activity className="w-5 h-5 text-emerald-600" /><h2 className="text-lg font-extrabold text-slate-800">第二階段：進階評估 (2x2)</h2></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableCard 
              title="業務面評估 (Business)" fieldKey="eval_business" projectId={projectId} initialValue={project.eval_business} currentUserId={currentUserId} onSave={handleSaveText}
              placeholder="點擊開始輸入業務價值、成本效益分析..." theme="emerald"
            />
            <EditableCard 
              title="技術面評估 (Technical)" fieldKey="eval_technical" projectId={projectId} initialValue={project.eval_technical} currentUserId={currentUserId} onSave={handleSaveText}
              placeholder="點擊開始輸入架構設計、資安風險、技術可行性..." theme="purple"
            />
            <EditableCard 
              title="成效追蹤指標 (KPIs)" fieldKey="eval_kpi" projectId={projectId} initialValue={project.eval_kpi} currentUserId={currentUserId} onSave={handleSaveText}
              placeholder="點擊開始設定上線後的追蹤指標..." theme="orange"
            />
            <EditableCard 
              title="智金處綜合評估 (Conclusion)" fieldKey="eval_conclusion" projectId={projectId} initialValue={project.eval_conclusion} currentUserId={currentUserId} onSave={handleSaveText}
              placeholder="點擊開始填寫最終核定意見與建議..." theme="blue"
            />
          </div>
        </section>
      </div>

      {/* 純白檢視器 */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
            <div className="flex items-center gap-6">
              <h2 className="text-slate-800 font-extrabold text-sm flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> 流程圖檢視器</h2>
              {images.AS_IS && images.TO_BE && (
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200/60 shadow-inner">
                  <button onClick={() => setViewerMode('SINGLE_AS_IS')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewerMode === 'SINGLE_AS_IS' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>現行 (As-Is)</button>
                  <button onClick={() => setViewerMode('DUAL')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${viewerMode === 'DUAL' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}><Columns className="w-3.5 h-3.5"/> 雙圖對照</button>
                  <button onClick={() => setViewerMode('SINGLE_TO_BE')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewerMode === 'SINGLE_TO_BE' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>目標 (To-Be)</button>
                </div>
              )}
            </div>
            <button onClick={() => setIsViewerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex overflow-hidden p-6 gap-6 bg-slate-50/50">
            {(viewerMode === 'SINGLE_AS_IS' || viewerMode === 'DUAL') && images.AS_IS && (
              <div className="flex-1 flex flex-col items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg border border-slate-200 text-slate-700 text-xs font-bold shadow-sm">現行流程 (As-Is)</div>
                <img src={images.AS_IS.image_binary} alt="As-Is Full" className="w-full h-full object-contain p-4" />
              </div>
            )}
            {(viewerMode === 'SINGLE_TO_BE' || viewerMode === 'DUAL') && images.TO_BE && (
              <div className="flex-1 flex flex-col items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">目標流程 (To-Be)</div>
                <img src={images.TO_BE.image_binary} alt="To-Be Full" className="w-full h-full object-contain p-4" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 狀態彈窗 Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h2 className="text-base font-extrabold text-slate-800">選擇專案狀態</h2><button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="p-6"><div className="space-y-2.5">
              {statusOptions.map((opt) => {
                const isSelected = pendingStatusId === opt.status_id;
                return (
                  <label key={opt.status_id} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3"><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>{isSelected && <div className="w-2 h-2 bg-blue-600 rounded-full" />}</div><span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{opt.status_name}</span></div>{isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    <input type="radio" className="hidden" checked={isSelected} onChange={() => { setPendingStatusId(opt.status_id); setPendingStatusName(opt.status_name); }} />
                  </label>
                );
              })}
            </div></div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsStatusModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all">取消</button>
              <button onClick={handleUpdateStatus} disabled={isUpdatingStatus} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-70">{isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : '確認變更'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}