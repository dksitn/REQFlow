'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import {
  Loader2, ArrowLeft, Building2, Activity,
  LayoutGrid, FileImage, X, Check, UploadCloud, Eye, RefreshCw,
  Columns, Lock, Save, FileText, Printer, CheckCircle2,
  ChevronDown, ChevronRight, Plus, Edit2, Search, LogOut, User as UserIcon
} from 'lucide-react';

// ==========================================
// 🚀 元件 1：協作鎖文字編輯卡片 (EditableCard)
// ==========================================
function EditableCard({ title, fieldKey, projectId, initialValue, currentUserId, onSave, onConfirm, isConfirmed, placeholder, theme = 'slate' }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialValue || '');
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockOwnerName, setLockOwnerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (!isEditing) setText(initialValue || ''); }, [initialValue, isEditing]);
  
  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase.from('m01_edit_locks').select('locked_by, m01_users(full_name)').eq('project_id', projectId).eq('field_name', fieldKey).single();
      if (data && data.locked_by !== currentUserId) { 
        setIsLockedByOther(true); 
        // 🚀 TS 防呆修復：Supabase Join 預設推斷為陣列，需安全轉型與取值
        const usersData: any = data.m01_users;
        const ownerName = Array.isArray(usersData) ? usersData[0]?.full_name : usersData?.full_name;
        setLockOwnerName(ownerName || '其他同事'); 
      } 
      else { setIsLockedByOther(false); }
    };
    checkLock();
    const interval = setInterval(checkLock, 5000);
    return () => clearInterval(interval);
  }, [projectId, fieldKey, currentUserId]);

  const handleEdit = async () => {
    setIsLoading(true);
    try {
      if (!currentUserId) { setIsEditing(true); return; }
      const { error } = await supabase.from('m01_edit_locks').upsert({ project_id: projectId, field_name: fieldKey, locked_by: currentUserId, locked_at: new Date().toISOString() }, { onConflict: 'project_id,field_name' });
      if (error) throw error;
      setIsEditing(true);
    } catch (err) { console.error(err); setIsEditing(true); } finally { setIsLoading(false); }
  };

  const handleCancel = async () => {
    setIsEditing(false); setText(initialValue || '');
    if (currentUserId) await supabase.from('m01_edit_locks').delete().eq('project_id', projectId).eq('field_name', fieldKey);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try { await onSave(fieldKey, text); setIsEditing(false); if (currentUserId) await supabase.from('m01_edit_locks').delete().eq('project_id', projectId).eq('field_name', fieldKey); } 
    catch (err) { alert('儲存失敗'); } finally { setIsLoading(false); }
  };

  const themeStyles: Record<string, any> = {
    slate:   { bg: 'bg-slate-50/50',   border: 'border-slate-100',   hover: 'hover:border-slate-200',   title: 'text-slate-800' },
    emerald: { bg: 'bg-emerald-50/40', border: 'border-emerald-100', hover: 'hover:border-emerald-200', title: 'text-emerald-800' },
    purple:  { bg: 'bg-purple-50/40',  border: 'border-purple-100',  hover: 'hover:border-purple-200',  title: 'text-purple-800' },
    orange:  { bg: 'bg-orange-50/40',  border: 'border-orange-100',  hover: 'hover:border-orange-200',  title: 'text-orange-800' },
    blue:    { bg: 'bg-blue-50/40',    border: 'border-blue-100',    hover: 'hover:border-blue-200',    title: 'text-blue-800' },
    rose:    { bg: 'bg-rose-50/40',    border: 'border-rose-100',    hover: 'hover:border-rose-200',    title: 'text-rose-800' },
    teal:    { bg: 'bg-teal-50/40',    border: 'border-teal-100',    hover: 'hover:border-teal-200',    title: 'text-teal-800' }
  };
  const styles = themeStyles[theme] || themeStyles.slate;

  return (
    <div className={`${styles.bg} p-6 rounded-2xl border shadow-sm flex flex-col transition-all min-h-[220px] ${isEditing ? 'ring-2 ring-blue-500/20 border-blue-400' : `${styles.border} ${styles.hover} hover:shadow-md`}`}>
      <div className="flex items-center justify-between mb-4"><h3 className={`text-sm font-black ${styles.title}`}>{title}</h3><div className="flex gap-2">{!isEditing && isConfirmed && (<span className="text-[10px] bg-white text-emerald-600 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm border border-emerald-100"><Check className="w-3 h-3"/> 已確認</span>)}{!isEditing && isLockedByOther && (<span className="flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded"><Lock className="w-3 h-3" /> {lockOwnerName} 編輯中</span>)}</div></div>
      {isEditing ? (
        <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={isLoading} className="flex-1 w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:border-blue-400 transition-all min-h-[100px] shadow-inner" placeholder={placeholder} />
          <div className="flex justify-between items-center mt-4"><span className="text-[10px] text-amber-600 font-bold">⚠️ 儲存將退回草稿</span><div className="flex gap-2"><button onClick={handleCancel} disabled={isLoading} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">取消</button><button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3B82F6] text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm">{isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 儲存</button></div></div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between group h-full">
          <div className={`text-xs leading-relaxed overflow-y-auto mb-4 font-medium ${isLockedByOther ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'}`}>{text ? (text.split('\n').map((line: string, i: number) => (<React.Fragment key={i}>{line}<br/></React.Fragment>))) : (<span className="text-slate-400 italic font-normal">{placeholder}</span>)}</div>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
            <button onClick={() => !isLockedByOther && !isLoading && handleEdit()} disabled={isLockedByOther} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"><Edit2 className="w-3.5 h-3.5" /> 點擊編輯</button>
            {text && !isLockedByOther && !isConfirmed && (<button onClick={(e) => { e.stopPropagation(); onConfirm(fieldKey); }} className="flex items-center gap-1 px-3 py-1 bg-white text-emerald-600 border border-emerald-200 shadow-sm text-[11px] font-extrabold rounded-md hover:bg-emerald-500 hover:text-white transition-all hover:-translate-y-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> 確認計分</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🚀 元件 2：單位選擇彈窗 (DepartmentSelector)
// ==========================================
const DepartmentSelector = ({ currentDept, onSave, onClose }: any) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selected, setSelected] = useState(currentDept);
  const [isLoading, setIsLoading] = useState(true);
  const [newDeptName, setNewDeptName] = useState('');
  
  const fetchDepts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('m01_departments').select('*').order('created_at');
    if (error) console.error('單位讀取失敗', error);
    if (data) setDepartments(data);
    setIsLoading(false);
  };
  useEffect(() => { fetchDepts(); }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-extrabold text-slate-800">選擇所屬單位</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50 space-y-2">
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : departments.length === 0 ? (
            <p className="text-center text-sm font-bold text-slate-400 py-8">找不到單位，請至 Admin 新增</p>
          ) : (
            departments.map(dept => (
              <div 
                key={dept.id} 
                onClick={() => setSelected(dept.name)} 
                className={`px-4 py-3 rounded-xl border cursor-pointer font-bold text-sm transition-all flex items-center justify-between ${selected === dept.name ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {dept.name} {selected === dept.name && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">取消</button>
          <button onClick={() => onSave(selected)} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#3B82F6] rounded-lg hover:bg-blue-600 shadow-sm transition-all">確認儲存</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 元件 3：人員搜尋彈窗 (MemberSelector)
// ==========================================
const MemberSelector = ({ deptKey, deptName, currentMembers, onSave, onClose }: any) => {
  const [directory, setDirectory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([...currentMembers]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPersonnel = async () => {
      const { data, error } = await supabase.from('m01_personnel').select('*').eq('role_type', deptName);
      if (error) console.error('人員讀取失敗', error);
      if (data) setDirectory(data);
      setIsLoading(false);
    };
    fetchPersonnel();
  }, [deptName]);

  const filteredUsers = directory.filter(u => u.name.includes(searchTerm));
  
  const toggleMember = (name: string) => { 
    setSelectedMembers(prev => prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]); 
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">管理 {deptName} 專案成員</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" placeholder="搜尋姓名..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
            />
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50 space-y-1.5">
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-sm font-bold text-slate-400 py-8">該科別找不到人員，請至 Admin 新增</p>
          ) : (
            filteredUsers.map(user => {
              const isSelected = selectedMembers.includes(user.name);
              return (
                <div 
                  key={user.id} 
                  onClick={() => toggleMember(user.name)} 
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{user.name.charAt(0)}</div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-black ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{user.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{user.role_type}</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">取消</button>
          <button onClick={() => onSave(deptKey, selectedMembers)} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#3B82F6] rounded-lg hover:bg-blue-600 shadow-sm transition-all">確認名單 ({selectedMembers.length})</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 元件 4：報表輔助元件 (Report Preview)
// ==========================================
const ReportMiniHeader = ({ project }: any) => (
  <div className="flex items-end justify-between border-b border-slate-800 pb-3 mb-5 shrink-0">
    <div className="flex items-baseline gap-4">
      <h1 className="text-2xl font-black text-slate-900">{project?.name}</h1>
      <span className="text-sm font-bold text-slate-500">{project?.project_code}</span>
    </div>
    <div className="flex gap-4 text-[11px] font-bold text-slate-600">
      <span>單位：{project?.department}</span>
      <span>狀態：{project?.status_name_snapshot}</span>
    </div>
  </div>
);

const ReportTextCard = ({ title, content }: any) => (
  <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0">
    <h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">{title}</h3>
    <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{content || '尚未填寫'}</p>
  </div>
);

// ==========================================
// 🚀 主頁面 (ProjectAssessmentPage)
// ==========================================
export default function ProjectAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // ----------------------------------------
  // 彈窗與狀態
  // ----------------------------------------
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [memberModalConfig, setMemberModalConfig] = useState<{ isOpen: boolean, deptKey: string, deptName: string } | null>(null);

  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [pendingStatusId, setPendingStatusId] = useState<string>('');
  const [pendingStatusName, setPendingStatusName] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const [images, setImages] = useState<{ AS_IS: any; TO_BE: any }>({ AS_IS: null, TO_BE: null });
  const [isUploading, setIsUploading] = useState<{ AS_IS: boolean; TO_BE: boolean }>({ AS_IS: false, TO_BE: false });
  const asIsInputRef = useRef<HTMLInputElement>(null);
  const toBeInputRef = useRef<HTMLInputElement>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'SINGLE_AS_IS' | 'SINGLE_TO_BE' | 'DUAL'>('DUAL');
  const [isReportOpen, setIsReportOpen] = useState(false);

  // ----------------------------------------
  // 🚀 防禦性資料讀取
  // ----------------------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        const { data: projData, error: projError } = await supabase
          .from('m01_projects')
          .select('*, m01_project_responsibles(responsible_name_snapshot)')
          .eq('id', projectId)
          .maybeSingle(); 
          
        if (projError) throw projError;
        if (!projData) {
          console.warn('找不到此專案資料');
          setIsLoading(false);
          return;
        }

        if (!projData.team_members) projData.team_members = { app: [], planning: [], tech: [] };
        
        setProject(projData);
        setPendingStatusId(projData.status_id || '');
        setPendingStatusName(projData.status_name_snapshot || '');

        const { data: statuses } = await supabase.from('m01_project_status_options').select('*').eq('is_active', true).order('display_order');
        if (statuses) setStatusOptions(statuses);

        const { data: imgData, error: imgError } = await supabase.from('m01_project_assessment_images').select('*').eq('project_id', projectId).eq('is_current', true);
        if (imgError) console.error('圖片讀取錯誤', imgError);
        
        if (imgData && imgData.length > 0) {
          setImages({ 
            AS_IS: imgData.find(img => img.image_type === 'AS_IS') || null, 
            TO_BE: imgData.find(img => img.image_type === 'TO_BE') || null 
          });
        } else {
          setImages({ AS_IS: null, TO_BE: null });
        }

      } catch (error) { 
        console.error('讀取失敗:', error); 
      } finally { 
        setIsLoading(false); 
      }
    }
    if (projectId) fetchData();
  }, [projectId]);

  const handleConfirmField = async (fieldKey: string) => {
    const updatedConfirmed = { ...(project.confirmed_fields || {}), [fieldKey]: true };
    const { error } = await supabase.from('m01_projects').update({ confirmed_fields: updatedConfirmed }).eq('id', projectId);
    if (!error) setProject({ ...project, confirmed_fields: updatedConfirmed });
  };

  const handleSaveText = async (fieldKey: string, newText: string) => {
    const updatedConfirmed = { ...(project.confirmed_fields || {}), [fieldKey]: false };
    const { error } = await supabase.from('m01_projects').update({ [fieldKey]: newText, confirmed_fields: updatedConfirmed }).eq('id', projectId);
    if (!error) setProject((prev: any) => ({ ...prev, [fieldKey]: newText, confirmed_fields: updatedConfirmed }));
  };

  const handleUpdateStatus = async () => {
    if (!pendingStatusId || pendingStatusId === project.status_id) return setIsStatusModalOpen(false);
    setIsUpdatingStatus(true);
    try {
      await supabase.from('m01_projects').update({ status_id: pendingStatusId, status_name_snapshot: pendingStatusName }).eq('id', projectId);
      setProject({ ...project, status_id: pendingStatusId, status_name_snapshot: pendingStatusName });
      setIsStatusModalOpen(false);
    } finally { setIsUpdatingStatus(false); }
  };

  const handleSaveDept = async (newDept: string) => {
    if(!newDept) return setIsDeptModalOpen(false);
    try {
      await supabase.from('m01_projects').update({ department: newDept }).eq('id', projectId);
      setProject((prev: any) => ({ ...prev, department: newDept }));
    } catch(e) { console.error(e); } finally { setIsDeptModalOpen(false); }
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) { setEditingName(false); return; }
    try {
      await supabase.from('m01_projects').update({ name: nameValue.trim() }).eq('id', projectId);
      setProject((prev: any) => ({ ...prev, name: nameValue.trim() }));
    } catch(e) { console.error(e); } finally { setEditingName(false); }
  };

  const handleSaveMembers = async (deptKey: string, membersArray: string[]) => {
    const newMembers = { ...(project.team_members || { app: [], planning: [], tech: [] }), [deptKey]: membersArray };
    await supabase.from('m01_projects').update({ team_members: newMembers }).eq('id', projectId);
    setProject({ ...project, team_members: newMembers });
    setMemberModalConfig(null);
  };

  const handleRemoveMemberInline = async (deptKey: string, index: number) => {
    if(!window.confirm('確定要移除此人員嗎？')) return;
    const updatedArray = [...(project.team_members?.[deptKey] || [])];
    updatedArray.splice(index, 1);
    const newMembers = { ...(project.team_members || {}), [deptKey]: updatedArray };
    await supabase.from('m01_projects').update({ team_members: newMembers }).eq('id', projectId);
    setProject({ ...project, team_members: newMembers });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'AS_IS' | 'TO_BE') => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(prev => ({ ...prev, [type]: true }));
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const fieldKey = type === 'AS_IS' ? 'image_as_is' : 'image_to_be';
        const updatedConfirmed = { ...(project.confirmed_fields || {}), [fieldKey]: false };
        await supabase.from('m01_project_assessment_images').update({ is_current: false }).eq('project_id', projectId).eq('image_type', type);
        const { data } = await supabase.from('m01_project_assessment_images').insert({ project_id: projectId, image_type: type, file_name: file.name, file_mime_type: file.type, image_binary: base64, thumbnail_binary: base64, is_current: true }).select().single();
        await supabase.from('m01_projects').update({ confirmed_fields: updatedConfirmed }).eq('id', projectId);
        setImages(prev => ({ ...prev, [type]: data }));
        setProject((prev: any) => ({ ...prev, confirmed_fields: updatedConfirmed }));
      } finally { setIsUploading(prev => ({ ...prev, [type]: false })); event.target.value = ''; }
    };
    reader.readAsDataURL(file);
  };

  const openViewer = (mode: 'SINGLE_AS_IS' | 'SINGLE_TO_BE' | 'DUAL') => { setViewerMode(mode); setIsViewerOpen(true); };

  if (isLoading) return <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" /></div>;
  if (!project) return <div className="p-8 font-bold text-slate-600">找不到此專案 (可能 ID 錯誤或無權限存取)</div>;

  const confirmedFields = project.confirmed_fields || {};
  const teamConfig = [
    { key: 'app', name: '應用科', textClass: 'text-emerald-600', bgClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 border-emerald-200' },
    { key: 'planning', name: '企劃科', textClass: 'text-blue-600', bgClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 border-blue-200' },
    { key: 'tech', name: '科技科', textClass: 'text-purple-600', bgClass: 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 border-purple-200' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] w-full h-screen overflow-y-auto relative font-sans">
      <div className="px-8 py-6 max-w-[1400px] mx-auto w-full flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"><ArrowLeft className="w-4 h-4" /> 返回列表</button>
        <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all shadow-sm"><FileText className="w-4 h-4" /> 預覽總結報告</button>
      </div>

      <div className="px-8 pb-24 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">個別專案綜合評估</h1>
          <div className="flex items-center gap-2"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-black border border-emerald-100">評估中</span><span className="px-3 py-1 bg-[#F97316] text-white rounded text-xs font-black shadow-sm">P1</span></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">單位</p>
            <button onClick={() => setIsDeptModalOpen(true)} className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" /><span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{project.department || '請選擇單位'}</span></div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
            </button>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">專案名稱 <Edit2 className="w-3 h-3 text-slate-300" /></p>
            <div className="px-2 py-2.5 cursor-pointer rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-colors group" onClick={() => { setNameValue(project.name); setEditingName(true); }}>
              {editingName ? (<input autoFocus value={nameValue} onChange={e => setNameValue(e.target.value)} onBlur={handleSaveName} onKeyDown={e => e.key === 'Enter' && handleSaveName()} className="w-full bg-white text-base font-black text-slate-800 border border-blue-400 rounded px-2 focus:outline-none shadow-sm" onClick={e => e.stopPropagation()} />) : (<p className="text-base font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">{project.name}</p>)}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2">專案狀態</p>
            <button onClick={() => setIsStatusModalOpen(true)} className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm transition-all group">
              <span className="text-sm font-black text-[#3B82F6]">{project.status_name_snapshot}</span><ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-800 mb-6">專案負責人</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamConfig.map(team => {
               const members = project.team_members?.[team.key] || [];
               return (
                 <div key={team.key} className="flex flex-col gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                   <h3 className={`text-xs font-black ${team.textClass}`}>{team.name}</h3>
                   <div className="flex flex-wrap gap-2">
                     {members.map((member: string, idx: number) => (
                       <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold shadow-sm group transition-colors ${team.bgClass}`}>
                         {member} <X onClick={() => handleRemoveMemberInline(team.key, idx)} className="w-3 h-3 opacity-50 hover:opacity-100 cursor-pointer transition-opacity" />
                       </span>
                     ))}
                   </div>
                   <button onClick={() => setMemberModalConfig({ isOpen: true, deptKey: team.key, deptName: team.name })} className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all bg-white">
                     選擇人員 <Plus className="w-3.5 h-3.5" />
                   </button>
                 </div>
               );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-800 mb-6">第一階段：專案基本評估</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EditableCard theme="blue" title="工作職掌與現行工作流程" fieldKey="workflow_text" projectId={projectId} initialValue={project.workflow_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['workflow_text']} placeholder="完整說明：科別、各流程職責分配..." />
            <EditableCard theme="rose" title="現行作業痛點" fieldKey="as_is_text" projectId={projectId} initialValue={project.as_is_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['as_is_text']} placeholder="聚焦流程冗長、資訊分散..." />
            <EditableCard theme="emerald" title="專案目標" fieldKey="to_be_text" projectId={projectId} initialValue={project.to_be_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['to_be_text']} placeholder="設定數位化需求管理平台，提升效率..." />
            <EditableCard theme="purple" title="影響範圍－人員" fieldKey="impact_people_text" projectId={projectId} initialValue={project.impact_people_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['impact_people_text']} placeholder="專案影響人員、業務相關人員等..." />
            <EditableCard theme="orange" title="影響範圍－時間" fieldKey="impact_time_text" projectId={projectId} initialValue={project.impact_time_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['impact_time_text']} placeholder="預估每月可節省約多少小時..." />
            <EditableCard theme="teal" title="影響範圍－效益" fieldKey="impact_benefit_text" projectId={projectId} initialValue={project.impact_benefit_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['impact_benefit_text']} placeholder="提升需求處理效率與準確性..." />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-6"><FileImage className="w-4 h-4 text-blue-500" /><h2 className="text-sm font-black text-slate-800">第二階段：流程架構圖 (As-Is / To-Be)</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative border border-slate-200 rounded-xl overflow-hidden min-h-[260px] flex flex-col group bg-slate-50/50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700">As-Is 現行流程圖</h3>
                <div className="flex gap-2">
                  {images.AS_IS && <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded shadow-sm">已上傳</span>}
                  {confirmedFields['image_as_is'] && <span className="text-[10px] bg-white border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3"/> 已確認</span>}
                </div>
              </div>
              <div className="flex-1 relative flex items-center justify-center flex-col">
                <input type="file" ref={asIsInputRef} onChange={(e) => handleImageUpload(e, 'AS_IS')} accept="image/png, image/jpeg" className="hidden" />
                {isUploading.AS_IS ? (<div className="flex flex-col items-center text-blue-500"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">上傳中...</span></div>) : images.AS_IS ? (
                  <><img src={images.AS_IS.thumbnail_binary} alt="As-Is" className="w-full h-full object-cover absolute inset-0" /><div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm"><button onClick={() => openViewer('SINGLE_AS_IS')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-100 shadow-sm transition-all"><Eye className="w-4 h-4" /> 檢視</button><button onClick={() => asIsInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 border border-white/30 transition-all"><RefreshCw className="w-4 h-4" /> 替換</button></div>{!confirmedFields['image_as_is'] && (<div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-100 group-hover:opacity-0 transition-opacity"><button onClick={() => handleConfirmField('image_as_is')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-full hover:bg-emerald-600 shadow-lg animate-bounce"><CheckCircle2 className="w-4 h-4" /> 點此確認圖片無誤</button></div>)}</>
                ) : (<div onClick={() => asIsInputRef.current?.click()} className="flex flex-col items-center text-slate-400 hover:text-blue-600 hover:bg-white w-full h-full justify-center transition-all cursor-pointer"><UploadCloud className="w-8 h-8 mb-2" /><span className="text-sm font-bold">上傳 As-Is 圖片</span></div>)}
              </div>
            </div>

            <div className="relative border border-slate-200 rounded-xl overflow-hidden min-h-[260px] flex flex-col group bg-slate-50/50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700">To-Be 目標流程圖</h3>
                <div className="flex gap-2">
                  {images.TO_BE && <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded shadow-sm">已上傳</span>}
                  {confirmedFields['image_to_be'] && <span className="text-[10px] bg-white border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3"/> 已確認</span>}
                </div>
              </div>
              <div className="flex-1 relative flex items-center justify-center flex-col">
                <input type="file" ref={toBeInputRef} onChange={(e) => handleImageUpload(e, 'TO_BE')} accept="image/png, image/jpeg" className="hidden" />
                {isUploading.TO_BE ? (<div className="flex flex-col items-center text-blue-500"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">上傳中...</span></div>) : images.TO_BE ? (
                  <><img src={images.TO_BE.thumbnail_binary} alt="To-Be" className="w-full h-full object-cover absolute inset-0" /><div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm"><button onClick={() => openViewer('SINGLE_TO_BE')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-100 shadow-sm transition-all"><Eye className="w-4 h-4" /> 檢視</button><button onClick={() => toBeInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 border border-white/30 transition-all"><RefreshCw className="w-4 h-4" /> 替換</button></div>{!confirmedFields['image_to_be'] && (<div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-100 group-hover:opacity-0 transition-opacity"><button onClick={() => handleConfirmField('image_to_be')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-full hover:bg-emerald-600 shadow-lg animate-bounce"><CheckCircle2 className="w-4 h-4" /> 點此確認圖片無誤</button></div>)}</>
                ) : (<div onClick={() => toBeInputRef.current?.click()} className="flex flex-col items-center text-slate-400 hover:text-blue-600 hover:bg-white w-full h-full justify-center transition-all cursor-pointer"><UploadCloud className="w-8 h-8 mb-2" /><span className="text-sm font-bold">上傳 To-Be 圖片</span></div>)}
              </div>
            </div>
            {(images.AS_IS && images.TO_BE) && (<div className="col-span-1 md:col-span-2 flex justify-center mt-2"><button onClick={() => openViewer('DUAL')} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-blue-200 text-blue-600 text-xs font-black rounded-full hover:bg-blue-50 transition-all shadow-sm"><Columns className="w-4 h-4" /> 進入雙圖對照模式</button></div>)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-6"><Activity className="w-4 h-4 text-emerald-500" /><h2 className="text-sm font-black text-slate-800">第三階段：進階評估分析</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableCard theme="emerald" title="業務面評估 (Business)" fieldKey="eval_business" projectId={projectId} initialValue={project.eval_business} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_business']} placeholder="點擊開始輸入業務價值、成本效益分析..." />
            <EditableCard theme="purple" title="技術面評估 (Technical)" fieldKey="eval_technical" projectId={projectId} initialValue={project.eval_technical} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_technical']} placeholder="點擊開始輸入架構設計、資安風險、技術可行性..." />
            <EditableCard theme="orange" title="成效追蹤指標 (KPIs)" fieldKey="eval_kpi" projectId={projectId} initialValue={project.eval_kpi} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_kpi']} placeholder="點擊開始設定上線後的追蹤指標..." />
            <EditableCard theme="blue" title="智金處綜合評估 (Conclusion)" fieldKey="eval_conclusion" projectId={projectId} initialValue={project.eval_conclusion} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_conclusion']} placeholder="點擊開始填寫最終核定意見與建議..." />
          </div>
        </div>
      </div>
      
      {/* 🚀 彈窗渲染區 */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0"><h2 className="text-base font-extrabold text-slate-800">選擇專案狀態</h2><button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50 space-y-2">
                {statusOptions.map((opt) => {
                  const isSelected = pendingStatusId === opt.status_id;
                  return (
                    <label key={opt.status_id} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-3"><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>{isSelected && <div className="w-2 h-2 bg-blue-600 rounded-full" />}</div><span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{opt.status_name}</span></div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      <input type="radio" className="hidden" checked={isSelected} onChange={() => { setPendingStatusId(opt.status_id); setPendingStatusName(opt.status_name); }} />
                    </label>
                  );
                })}
            </div>
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3 shrink-0"><button onClick={() => setIsStatusModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">取消</button><button onClick={handleUpdateStatus} disabled={isUpdatingStatus} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#3B82F6] rounded-lg hover:bg-blue-600 shadow-sm transition-all">{isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : '確認變更'}</button></div>
          </div>
        </div>
      )}

      {isDeptModalOpen && <DepartmentSelector currentDept={project.department} onSave={handleSaveDept} onClose={() => setIsDeptModalOpen(false)} />}
      
      {memberModalConfig?.isOpen && <MemberSelector deptKey={memberModalConfig.deptKey} deptName={memberModalConfig.deptName} currentMembers={project.team_members?.[memberModalConfig.deptKey] || []} onSave={handleSaveMembers} onClose={() => setMemberModalConfig(null)} />}
      
      {isReportOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-400/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 print:bg-white print:p-0">
          <style dangerouslySetInnerHTML={{__html: ` @media print { @page { size: A4 landscape; margin: 10mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } ::-webkit-scrollbar { display: none; } }`}} />
          <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 print:hidden shadow-sm"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><FileText className="w-5 h-5" /></div><h2 className="font-extrabold text-slate-800 text-lg">專案評估總結報告</h2></div><div className="flex gap-3"><button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all"><Printer className="w-4 h-4" /> 列印 / 匯出 PDF</button><button onClick={() => setIsReportOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"><X className="w-5 h-5" /></button></div></div>
          <div className="flex flex-col items-center gap-12 py-12 print:block print:py-0 print:gap-0">
            <article className="w-[297mm] h-[210mm] max-w-full bg-white shadow-2xl p-10 flex flex-col shrink-0 print:w-full print:h-screen print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page overflow-hidden"><ReportMiniHeader project={project} /><h2 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4 shrink-0">第一階段：專案基本評估</h2><div className="flex-1 grid grid-cols-3 grid-rows-2 gap-4 min-h-0"><ReportTextCard title="工作職掌與現行工作流程" content={project.workflow_text} /><ReportTextCard title="現行作業痛點" content={project.as_is_text} /><ReportTextCard title="專案目標" content={project.to_be_text} /><ReportTextCard title="影響範圍－人員" content={project.impact_people_text} /><ReportTextCard title="影響範圍－時間" content={project.impact_time_text} /><ReportTextCard title="影響範圍－效益" content={project.impact_benefit_text} /></div></article>
            <article className="w-[297mm] h-[210mm] max-w-full bg-white shadow-2xl p-10 flex flex-col shrink-0 print:w-full print:h-screen print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page overflow-hidden"><ReportMiniHeader project={project} /><h2 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4 shrink-0">第二階段：流程架構圖 (As-Is / To-Be)</h2><div className="flex-1 grid grid-cols-2 gap-6 min-h-0"><div className="flex flex-col border border-slate-200 rounded-lg p-3 bg-slate-50/30"><h3 className="text-xs font-black text-slate-700 mb-3 shrink-0">現行流程 (As-Is)</h3><div className="flex-1 flex items-center justify-center min-h-0">{images.AS_IS ? <img src={images.AS_IS.image_binary} className="max-w-full max-h-full object-contain" /> : <span className="text-slate-400 font-bold text-xs">尚無圖片</span>}</div></div><div className="flex flex-col border border-slate-200 rounded-lg p-3 bg-slate-50/30"><h3 className="text-xs font-black text-slate-700 mb-3 shrink-0">目標流程 (To-Be)</h3><div className="flex-1 flex items-center justify-center min-h-0">{images.TO_BE ? <img src={images.TO_BE.image_binary} className="max-w-full max-h-full object-contain" /> : <span className="text-slate-400 font-bold text-xs">尚無圖片</span>}</div></div></div></article>
            <article className="w-[297mm] h-[210mm] max-w-full bg-white shadow-2xl p-10 flex flex-col shrink-0 print:w-full print:h-screen print:border-none print:shadow-none print:p-0 print:m-0 overflow-hidden"><ReportMiniHeader project={project} /><h2 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4 shrink-0">第三階段：進階評估分析</h2><div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6 min-h-0"><ReportTextCard title="業務面評估 (Business)" content={project.eval_business} /><ReportTextCard title="技術面評估 (Technical)" content={project.eval_technical} /><ReportTextCard title="成效追蹤指標 (KPIs)" content={project.eval_kpi} /><ReportTextCard title="智金處綜合評估 (Conclusion)" content={project.eval_conclusion} /></div><footer className="mt-6 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium shrink-0">Report generated by REQflow - 內部機密文件，請勿外流</footer></article>
          </div>
        </div>
      )}

      {/* 🚀 圖片檢視器 (Viewer) */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10"><div className="flex items-center gap-4"><h2 className="text-white font-bold text-sm flex items-center gap-2"><Eye className="w-5 h-5 text-blue-400" /> 流程圖檢視器</h2>{viewerMode === 'DUAL' && <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded">雙圖對照模式</span>}</div><button onClick={() => setIsViewerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"><X className="w-5 h-5" /></button></div>
          <div className="flex-1 flex overflow-hidden p-6 gap-6">
            {(viewerMode === 'SINGLE_AS_IS' || viewerMode === 'DUAL') && images.AS_IS && (<div className="flex-1 flex flex-col items-center bg-black/50 rounded-xl border border-white/10 shadow-2xl overflow-hidden relative group"><div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white text-xs font-bold">現行流程 (As-Is)</div><img src={images.AS_IS.image_binary} alt="As-Is Full" className="w-full h-full object-contain p-2" /></div>)}
            {(viewerMode === 'SINGLE_TO_BE' || viewerMode === 'DUAL') && images.TO_BE && (<div className="flex-1 flex flex-col items-center bg-black/50 rounded-xl border border-white/10 shadow-2xl overflow-hidden relative group"><div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-emerald-500/30 text-emerald-400 text-xs font-bold">目標流程 (To-Be)</div><img src={images.TO_BE.image_binary} alt="To-Be Full" className="w-full h-full object-contain p-2" /></div>)}
          </div>
        </div>
      )}
    </div>
  );
}