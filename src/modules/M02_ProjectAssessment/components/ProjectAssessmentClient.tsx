'use client';

export const runtime = 'edge';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import {
  Loader2, ArrowLeft, Building2, Eye, X, Check, UploadCloud, RefreshCw,
  Columns, Lock, Save, FileText, Printer, CheckCircle2, Unlock, FileImage,
  ChevronDown, Plus, Edit2, Search, LogOut, User as UserIcon
} from 'lucide-react';

// ==========================================
// 🚀 元件 1：協作鎖文字編輯卡片 (自動解鎖機制)
// ==========================================
function EditableCard({ 
  title, fieldKey, projectId, initialValue, currentUserId, 
  onSave, onConfirm, isConfirmed, placeholder, theme = 'slate', minHeight = 'min-h-[220px]',
  isReadOnlyMember // 🚀 接收唯讀狀態
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialValue || '');
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockOwnerName, setLockOwnerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { 
    if (!isEditing) setText(initialValue || ''); 
  }, [initialValue, isEditing]);
  
  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase
        .from('m01_edit_locks')
        .select('locked_by, locked_at, m01_users(full_name)')
        .eq('project_id', projectId)
        .eq('field_name', fieldKey)
        .maybeSingle();

      if (data) {
        const lockedTime = new Date(data.locked_at).getTime();
        const now = Date.now();
        
        if (now - lockedTime > 30 * 60 * 1000) {
          await supabase.from('m01_edit_locks').delete().eq('project_id', projectId).eq('field_name', fieldKey);
          setIsLockedByOther(false);
        } else if (data.locked_by !== currentUserId) {
          setIsLockedByOther(true); 
          const usersData: any = data.m01_users;
          const ownerName = Array.isArray(usersData) ? usersData[0]?.full_name : usersData?.full_name;
          setLockOwnerName(ownerName || '其他同事'); 
        } else {
          setIsLockedByOther(false); 
        }
      } else {
        setIsLockedByOther(false); 
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 5000);
    return () => clearInterval(interval);
  }, [projectId, fieldKey, currentUserId]);

  const handleEdit = async () => {
    if (isReadOnlyMember) return alert('您目前為唯讀權限，無法編輯。');
    setIsLoading(true);
    try {
      if (!currentUserId) { setIsEditing(true); return; }

      const { data: existingLock } = await supabase.from('m01_edit_locks').select('locked_by, locked_at').eq('project_id', projectId).eq('field_name', fieldKey).maybeSingle();
      if (existingLock) {
        const isExpired = (Date.now() - new Date(existingLock.locked_at).getTime()) > 30 * 60 * 1000;
        if (!isExpired && existingLock.locked_by !== currentUserId) {
          alert('此區塊剛被他人鎖定，無法編輯。');
          return;
        }
      }

      const { error } = await supabase
        .from('m01_edit_locks')
        .upsert(
          { project_id: projectId, field_name: fieldKey, locked_by: currentUserId, locked_at: new Date().toISOString() }, 
          { onConflict: 'project_id,field_name' }
        );
      if (error) throw error;
      setIsEditing(true);
    } catch (err) { 
      console.error(err); 
      setIsEditing(true); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleCancel = async () => {
    setIsEditing(false); 
    setText(initialValue || '');
    if (currentUserId) {
      await supabase.from('m01_edit_locks').delete().eq('project_id', projectId).eq('field_name', fieldKey);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try { 
      await onSave(fieldKey, text); 
      setIsEditing(false); 
      if (currentUserId) {
        await supabase.from('m01_edit_locks').delete().eq('project_id', projectId).eq('field_name', fieldKey);
      }
    } catch (err) { 
      alert('儲存失敗'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const themeStyles: Record<string, any> = {
    slate:   { bg: 'bg-slate-50/50', border: 'border-slate-100', hover: 'hover:border-slate-200', title: 'text-slate-800' },
    emerald: { bg: 'bg-emerald-50/40', border: 'border-emerald-100', hover: 'hover:border-emerald-200', title: 'text-emerald-800' },
    purple:  { bg: 'bg-purple-50/40', border: 'border-purple-100', hover: 'hover:border-purple-200', title: 'text-purple-800' },
    orange:  { bg: 'bg-orange-50/40', border: 'border-orange-100', hover: 'hover:border-orange-200', title: 'text-orange-800' },
    blue:    { bg: 'bg-blue-50/40', border: 'border-blue-100', hover: 'hover:border-blue-200', title: 'text-blue-800' },
    rose:    { bg: 'bg-rose-50/40', border: 'border-rose-100', hover: 'hover:border-rose-200', title: 'text-rose-800' },
    teal:    { bg: 'bg-teal-50/40', border: 'border-teal-100', hover: 'hover:border-teal-200', title: 'text-teal-800' }
  };
  const styles = themeStyles[theme] || themeStyles.slate;

  return (
    <div className={`${styles.bg} p-6 rounded-2xl border shadow-sm flex flex-col transition-all ${minHeight} ${isEditing ? 'ring-2 ring-blue-500/20 border-blue-400' : `${styles.border} ${styles.hover} hover:shadow-md`}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-black ${styles.title}`}>{title}</h3>
        <div className="flex gap-2">
          {!isEditing && isConfirmed && (
            <span className="text-[10px] bg-white text-emerald-600 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm border border-emerald-100">
              <Check className="w-3 h-3"/> 已確認
            </span>
          )}
          {!isEditing && isLockedByOther && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded">
              <Lock className="w-3 h-3" /> {lockOwnerName} 編輯中
            </span>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            disabled={isLoading} 
            className="flex-1 w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:border-blue-400 transition-all min-h-[100px] shadow-inner custom-scrollbar" 
            placeholder={placeholder} 
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-[10px] text-amber-600 font-bold">⚠️ 確認後計入完整度</span>
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={isLoading} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">取消</button>
              <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3B82F6] text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} 儲存
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between group h-full">
          <div className={`text-xs leading-relaxed overflow-y-auto custom-scrollbar mb-4 font-medium ${isLockedByOther ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'}`}>
            {text ? (
              text.split('\n').map((line: string, i: number) => (<React.Fragment key={i}>{line}<br/></React.Fragment>))
            ) : (
              <span className="text-slate-400 italic font-normal">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
            {!isReadOnlyMember && (
              <button 
                onClick={() => !isLockedByOther && !isLoading && handleEdit()} 
                disabled={isLockedByOther} 
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                <Edit2 className="w-3.5 h-3.5" /> 點擊編輯
              </button>
            )}
            {!isReadOnlyMember && text && !isLockedByOther && !isConfirmed && (
              <button 
                onClick={(e) => { e.stopPropagation(); onConfirm(fieldKey); }} 
                className="flex items-center gap-1 px-3 py-1 bg-white text-emerald-600 border border-emerald-200 shadow-sm text-[11px] font-extrabold rounded-md hover:bg-emerald-500 hover:text-white transition-all hover:-translate-y-0.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> 確認計分
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🚀 元件 2：單位選擇彈窗
// ==========================================
const DepartmentSelector = ({ currentDept, onSave, onClose }: any) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selected, setSelected] = useState(currentDept);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const fetchDepts = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.from('core_units').select('*').order('created_at');
      if (error) {
        setFetchError(error.message);
        setDepartments([]);
      } else if (data && data.length > 0) {
        setDepartments(data);
      } else {
        const defaultDepts = [{ id: '1', name: '智能金融處' }, { id: '2', name: '資訊處' }, { id: '3', name: '消金處' }];
        setDepartments(defaultDepts);
      }
    } catch (err: any) {
        setFetchError(err.message || '未知錯誤');
        setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => { fetchDepts(); }, []);

  const handleAddDept = async () => {
    if(!newDeptName.trim()) return;
    setIsAdding(true);
    try {
      const { error } = await supabase.from('core_units').insert({ name: newDeptName.trim() });
      if (error) throw error;
      const addedName = newDeptName.trim();
      setNewDeptName(''); 
      setSelected(addedName);
      await fetchDepts(); 
    } catch (error) {
      console.error('新增單位錯誤:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h2 className="text-base font-extrabold text-slate-800">選擇所屬單位</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto bg-white space-y-2 custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 mb-2 px-1">點擊選擇現有單位：</div>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : fetchError ? (
            <div className="text-center py-6 text-xs font-bold text-rose-500 bg-rose-50 rounded-lg p-3">讀取失敗: {fetchError}</div>
          ) : departments.length === 0 ? (
            <div className="text-center py-6 text-xs font-bold text-slate-400 bg-slate-50 rounded-lg">目前無單位，請在下方新增</div>
          ) : (
            departments.map(dept => (
              <div 
                key={dept.id} 
                onClick={() => setSelected(dept.name)} 
                className={`px-4 py-3 rounded-xl border cursor-pointer font-bold text-sm transition-all flex items-center justify-between group ${selected === dept.name ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'}`}
              >
                {dept.name} 
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selected === dept.name ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  {selected === dept.name && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-4 bg-slate-50 border-t border-b border-slate-100 flex flex-col gap-2 shrink-0">
          <div className="text-[10px] font-bold text-slate-400 px-1">如果列表中沒有，請在此新增：</div>
          <div className="flex gap-2">
            <input type="text" placeholder="輸入新單位名稱..." value={newDeptName} onChange={(e)=>setNewDeptName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddDept()} disabled={isAdding} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all font-medium" />
            <button onClick={handleAddDept} disabled={isAdding || !newDeptName.trim()} className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-50 min-w-[70px] shadow-sm transition-colors">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : '新增'}
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-white flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors">取消</button>
          <button onClick={() => onSave(selected)} disabled={!selected} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">確認選取</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 主頁面 (實裝唯讀權限邏輯 & 完整渲染)
// ==========================================
export default function ProjectAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // 🚀 判定當前使用者是否為「唯讀檢視者」
  const [isReadOnlyMember, setIsReadOnlyMember] = useState(false);

  // 系統人員清單
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // 彈窗與狀態
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [memberModalConfig, setMemberModalConfig] = useState<{ isOpen: boolean, deptKey: string } | null>(null);
  const [tempSelections, setTempSelections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const statusOptions = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成', 'POC案執行中', '專案處理', '暫緩案'];
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  // 圖片上傳狀態
  const [images, setImages] = useState<{ AS_IS: any; TO_BE: any }>({ AS_IS: null, TO_BE: null });
  const [isUploading, setIsUploading] = useState<{ AS_IS: boolean; TO_BE: boolean }>({ AS_IS: false, TO_BE: false });
  const asIsInputRef = useRef<HTMLInputElement>(null);
  const toBeInputRef = useRef<HTMLInputElement>(null); 
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState<'SINGLE_AS_IS' | 'SINGLE_TO_BE' | 'DUAL'>('DUAL');
  
  // A4 簡報狀態
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        let loggedInName = '';
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserEmail(user.email || '');
          const { data: profile } = await supabase.from('m01_users').select('full_name').eq('email', user.email).maybeSingle();
          if (profile?.full_name) {
            loggedInName = profile.full_name;
            setCurrentUserName(loggedInName);
          }
        }

        const { data: projData } = await supabase.from('m01_projects').select('*').eq('id', projectId).maybeSingle();
        if (!projData) { setIsLoading(false); return; }
        
        // 確保有「唯讀檢視者」的陣列結構
        if (!projData.team_members) projData.team_members = { '應用科': [], '企劃科': [], '科技科': [], '唯讀檢視者': [] };
        if (!projData.team_members['唯讀檢視者']) projData.team_members['唯讀檢視者'] = [];
        
        setProject(projData);

        // 🚀 邏輯判定：如果此人的名字存在於「唯讀檢視者」陣列中，將唯讀鎖定開啟！
        if (loggedInName && projData.team_members['唯讀檢視者'].includes(loggedInName)) {
            setIsReadOnlyMember(true);
        }

        const { data: usersData } = await supabase.from('m01_users').select('*');
        if (usersData) setSystemUsers(usersData);

        const { data: imgData } = await supabase.from('m01_project_assessment_images').select('*').eq('project_id', projectId).eq('is_current', true);
        if (imgData && imgData.length > 0) {
          setImages({ 
            AS_IS: imgData.find(img => img.image_type === 'AS_IS') || null, 
            TO_BE: imgData.find(img => img.image_type === 'TO_BE') || null 
          });
        }
      } catch (error) { 
        console.error('讀取失敗:', error); 
      } finally { 
        setIsLoading(false); 
      }
    }
    if (projectId) fetchData();
  }, [projectId]);

  const handleSignOut = async () => { 
    await supabase.auth.signOut(); 
    router.push('/auth'); 
  };

  const handleGlobalUnlock = async () => {
    if (isReadOnlyMember) return;
    if (confirm('⚠️ 警告：確定要強制解除此專案的「所有編輯鎖定」嗎？\n\n這將會中斷其他人的編輯，並直接捨棄他們尚未儲存的草稿！')) {
      setIsUnlocking(true);
      try {
        await supabase.from('m01_edit_locks').delete().eq('project_id', projectId);
        alert('已成功解除所有鎖定！畫面將重新載入最新資料庫內容。');
        window.location.reload(); 
      } catch (error) {
        console.error(error);
        alert('解鎖失敗，請稍後再試。');
        setIsUnlocking(false);
      }
    }
  };

  // 計算 11 格完整度
  const confirmedFields = project?.confirmed_fields || {};
  const completenessFields = ['workflow_text', 'as_is_text', 'impact_people_text', 'impact_time_text', 'impact_benefit_text', 'image_as_is', 'image_to_be', 'eval_business', 'eval_technical', 'eval_kpi', 'eval_conclusion'];
  const completedCount = completenessFields.filter(f => confirmedFields[f]).length;
  const completenessPercent = Math.round((completedCount / 11) * 100) || 0;

  const handleConfirmField = async (fieldKey: string) => {
    if (isReadOnlyMember) return;
    const updatedConfirmed = { ...(project.confirmed_fields || {}), [fieldKey]: true };
    const { error } = await supabase.from('m01_projects').update({ confirmed_fields: updatedConfirmed }).eq('id', projectId);
    if (!error) setProject({ ...project, confirmed_fields: updatedConfirmed });
  };

  const handleSaveText = async (fieldKey: string, newText: string) => {
    if (isReadOnlyMember) return;
    const updatedConfirmed = { ...(project.confirmed_fields || {}), [fieldKey]: false };
    const { error } = await supabase.from('m01_projects').update({ [fieldKey]: newText, confirmed_fields: updatedConfirmed }).eq('id', projectId);
    if (!error) setProject((prev: any) => ({ ...prev, [fieldKey]: newText, confirmed_fields: updatedConfirmed }));
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (isReadOnlyMember) return setIsStatusModalOpen(false);
    await supabase.from('m01_projects').update({ status_name_snapshot: newStatus }).eq('id', projectId);
    setProject({ ...project, status_name_snapshot: newStatus });
    setIsStatusModalOpen(false);
  };

  const handleSaveDept = async (newDept: string) => {
    if (isReadOnlyMember || !newDept) return setIsDeptModalOpen(false);
    await supabase.from('m01_projects').update({ department: newDept }).eq('id', projectId);
    setProject((prev: any) => ({ ...prev, department: newDept }));
    setIsDeptModalOpen(false);
  };

  const handleSaveName = async () => {
    if (isReadOnlyMember || !nameValue.trim()) { setEditingName(false); return; }
    await supabase.from('m01_projects').update({ name: nameValue.trim() }).eq('id', projectId);
    setProject((prev: any) => ({ ...prev, name: nameValue.trim() }));
    setEditingName(false);
  };

  const openAssigneeModal = (dept: string) => {
    if (isReadOnlyMember) return; // 唯讀不可指派人員
    setTempSelections(project?.team_members[dept] || []); 
    setSearchTerm('');
    setMemberModalConfig({ isOpen: true, deptKey: dept });
  };

  const toggleSelection = (name: string) => {
    setTempSelections(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const confirmAssignees = async () => {
    if (!memberModalConfig || isReadOnlyMember) return;
    const newMembers = { ...project.team_members, [memberModalConfig.deptKey]: tempSelections };
    setProject({ ...project, team_members: newMembers });
    setMemberModalConfig(null);
    await supabase.from('m01_projects').update({ team_members: newMembers }).eq('id', projectId);
  };

  const handleRemoveMemberInline = async (deptKey: string, nameToRemove: string) => {
    if (isReadOnlyMember) return;
    const updatedArray = project.team_members[deptKey].filter((n: string) => n !== nameToRemove);
    const newMembers = { ...project.team_members, [deptKey]: updatedArray };
    setProject({ ...project, team_members: newMembers });
    await supabase.from('m01_projects').update({ team_members: newMembers }).eq('id', projectId);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'AS_IS' | 'TO_BE') => {
    if (isReadOnlyMember) return;
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
        
        const { data } = await supabase
          .from('m01_project_assessment_images')
          .insert({ project_id: projectId, image_type: type, file_name: file.name, file_mime_type: file.type, image_binary: base64, thumbnail_binary: base64, is_current: true })
          .select()
          .single();
          
        await supabase.from('m01_projects').update({ confirmed_fields: updatedConfirmed }).eq('id', projectId);
        
        setImages(prev => ({ ...prev, [type]: data }));
        setProject((prev: any) => ({ ...prev, confirmed_fields: updatedConfirmed }));
      } finally { 
        setIsUploading(prev => ({ ...prev, [type]: false })); 
        event.target.value = ''; 
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) return <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" /></div>;
  if (!project) return <div className="p-8 font-bold text-slate-600">找不到此專案</div>;

  // 🚀 加入「唯讀檢視者」的設定區塊
  const teamConfig = [
    { key: '應用科', textClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { key: '企劃科', textClass: 'text-blue-600', bgClass: 'bg-blue-50 border-blue-200 text-blue-700' },
    { key: '科技科', textClass: 'text-purple-600', bgClass: 'bg-purple-50 border-purple-200 text-purple-700' },
    { key: '唯讀檢視者', textClass: 'text-slate-500', bgClass: 'bg-slate-100 border-slate-300 text-slate-600' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] w-full h-screen overflow-y-auto custom-scrollbar relative font-sans">
      
      {/* 頂部導覽列 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>
          {/* 🚀 顯示明顯的提示標籤 */}
          {isReadOnlyMember && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-black shadow-sm">
              <Lock className="w-3.5 h-3.5" /> 唯讀模式 (禁止修改)
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* 🚀 隱藏唯讀人員的全站解鎖按鈕 */}
          {!isReadOnlyMember && (
            <button 
              onClick={handleGlobalUnlock} 
              disabled={isUnlocking}
              className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm disabled:opacity-50"
            >
              {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />} 強制解除全站鎖定
            </button>
          )}

          <button 
            onClick={() => setIsReportOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" /> 產生 A4 簡報
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUserId ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-800">{currentUserName}</span>
                  <span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black border border-blue-200">
                  {currentUserName.charAt(0)}
                </div>
                <button onClick={handleSignOut} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/auth')} className="text-xs font-bold text-blue-600">前往登入</button>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 pt-8 pb-24 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">個別專案綜合評估</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completenessPercent}%` }}></div>
              </div>
              <span className="text-xs font-black text-slate-600">{completenessPercent}%</span>
            </div>
          </div>
        </div>

        {/* 基本資訊區塊 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2">專案編號</p>
            <p className="text-sm font-black text-slate-500 font-mono bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">{project.project_code}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">單位</p>
            {/* 🚀 唯讀者不可點擊變更單位 */}
            <button onClick={() => !isReadOnlyMember && setIsDeptModalOpen(true)} className={`w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl transition-all group ${isReadOnlyMember ? 'cursor-not-allowed opacity-80' : 'hover:bg-white hover:border-blue-300'}`}>
              <div className="flex items-center gap-2">
                <Building2 className={`w-4 h-4 text-slate-500 ${!isReadOnlyMember && 'group-hover:text-blue-500'}`} />
                <span className={`text-sm font-bold text-slate-700 ${!isReadOnlyMember && 'group-hover:text-blue-700'}`}>{project.department || '請選擇單位'}</span>
              </div>
              {!isReadOnlyMember && <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />}
            </button>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">專案名稱 {!isReadOnlyMember && <Edit2 className="w-3 h-3 text-slate-300" />}</p>
              <p className="text-[11px] font-bold text-slate-400 mb-2">專案狀態</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 🚀 唯讀者不可點擊編輯名稱 */}
              <div className={`flex-1 px-2 py-2.5 rounded-lg border border-transparent transition-colors group ${isReadOnlyMember ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50 hover:border-slate-200'}`} onClick={() => { if(!isReadOnlyMember){ setNameValue(project.name); setEditingName(true); }}}>
                {editingName ? (
                  <input autoFocus value={nameValue} onChange={e => setNameValue(e.target.value)} onBlur={handleSaveName} onKeyDown={e => e.key === 'Enter' && handleSaveName()} className="w-full text-base font-black text-slate-800 border border-blue-400 rounded px-2 outline-none" onClick={e => e.stopPropagation()} />
                ) : (
                  <p className={`text-base font-black text-slate-800 truncate ${!isReadOnlyMember && 'group-hover:text-blue-600'}`}>{project.name}</p>
                )}
              </div>
              {/* 🚀 唯讀者不可更改狀態 */}
              <button onClick={() => !isReadOnlyMember && setIsStatusModalOpen(true)} className={`flex items-center justify-between gap-4 px-4 py-2.5 bg-white border border-slate-200 rounded-xl transition-all shrink-0 ${isReadOnlyMember ? 'cursor-not-allowed opacity-80' : 'hover:bg-blue-50 hover:border-blue-300'}`}>
                <span className="text-sm font-black text-[#3B82F6]">{project.status_name_snapshot}</span>
                {!isReadOnlyMember && <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* 專案負責人名單 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-800 mb-4">專案負責人管理</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {teamConfig.map(team => {
               const members = project.team_members?.[team.key] || [];
               return (
                 <div key={team.key} className="flex flex-col gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                   <h3 className={`text-xs font-black ${team.textClass}`}>{team.key}</h3>
                   <div className="flex flex-wrap gap-2">
                     {members.map((member: string) => (
                       <span key={member} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold shadow-sm ${team.bgClass}`}>
                         {member} 
                         {/* 🚀 唯讀者看不到刪除 X 按鈕 */}
                         {!isReadOnlyMember && <X onClick={() => handleRemoveMemberInline(team.key, member)} className="w-3 h-3 opacity-50 hover:opacity-100 cursor-pointer" />}
                       </span>
                     ))}
                   </div>
                   {/* 🚀 唯讀者看不到新增按鈕 */}
                   {!isReadOnlyMember && (
                    <button onClick={() => openAssigneeModal(team.key)} className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all bg-white">
                      選擇人員 <Plus className="w-3.5 h-3.5" />
                    </button>
                   )}
                 </div>
               );
            })}
          </div>
        </div>

        {/* 11 格評估卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 🚀 將 isReadOnlyMember 屬性往下傳給卡片，讓卡片內部禁用編輯 */}
          <EditableCard theme="blue" title="現行工作職掌與工作流程" fieldKey="workflow_text" projectId={projectId} initialValue={project.workflow_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['workflow_text']} placeholder="請輸入現行工作職掌與流程說明..." isReadOnlyMember={isReadOnlyMember} />
          <EditableCard theme="rose" title="現行作業痛點" fieldKey="as_is_text" projectId={projectId} initialValue={project.as_is_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['as_is_text']} placeholder="請輸入現行作業遭遇的痛點..." isReadOnlyMember={isReadOnlyMember} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EditableCard theme="purple" title="影響範圍－人員" fieldKey="impact_people_text" projectId={projectId} initialValue={project.impact_people_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['impact_people_text']} placeholder="專案影響人員、業務相關人員等..." minHeight="min-h-[180px]" isReadOnlyMember={isReadOnlyMember} />
          <EditableCard theme="orange" title="影響範圍－時間" fieldKey="impact_time_text" projectId={projectId} initialValue={project.impact_time_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['impact_time_text']} placeholder="預估每月可節省約多少小時..." minHeight="min-h-[180px]" isReadOnlyMember={isReadOnlyMember} />
          <EditableCard theme="teal" title="影響範圍－效益" fieldKey="impact_benefit_text" projectId={projectId} initialValue={project.impact_benefit_text} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['impact_benefit_text']} placeholder="提升需求處理效率與準確性..." minHeight="min-h-[180px]" isReadOnlyMember={isReadOnlyMember} />
        </div>

        {/* 圖片區塊 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileImage className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-black text-slate-800">AS-IS / TO-BE 系統架構對照</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative border border-slate-200 rounded-xl overflow-hidden min-h-[260px] flex flex-col group bg-slate-50/50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700">AS-IS 現行流程圖</h3>
                <div className="flex gap-2">
                  {images.AS_IS && <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">已上傳</span>}
                  {confirmedFields['image_as_is'] && <span className="text-[10px] bg-white border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3"/> 已確認</span>}
                </div>
              </div>
              <div className="flex-1 relative flex items-center justify-center flex-col">
                <input type="file" ref={asIsInputRef} onChange={(e) => handleImageUpload(e, 'AS_IS')} accept="image/*" className="hidden" />
                {isUploading.AS_IS ? (
                  <div className="flex flex-col items-center text-blue-500"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">上傳中...</span></div>
                ) : images.AS_IS ? (
                  <>
                    <img src={images.AS_IS.thumbnail_binary} className="w-full h-full object-cover absolute inset-0" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                      <button onClick={() => { setViewerMode('SINGLE_AS_IS'); setIsViewerOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-100 shadow-sm"><Eye className="w-4 h-4" /> 檢視</button>
                      {/* 🚀 唯讀者不可替換圖片 */}
                      {!isReadOnlyMember && <button onClick={() => asIsInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 border border-white/30"><RefreshCw className="w-4 h-4" /> 替換</button>}
                    </div>
                    {/* 🚀 唯讀者不可確認圖片 */}
                    {!isReadOnlyMember && !confirmedFields['image_as_is'] && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                        <button onClick={() => handleConfirmField('image_as_is')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-full hover:bg-emerald-600 shadow-lg animate-bounce"><CheckCircle2 className="w-4 h-4" /> 確認圖片無誤</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div onClick={() => !isReadOnlyMember && asIsInputRef.current?.click()} className={`flex flex-col items-center justify-center w-full h-full transition-all ${isReadOnlyMember ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-white cursor-pointer'}`}>
                    <UploadCloud className="w-8 h-8 mb-2" />
                    <span className="text-sm font-bold">{isReadOnlyMember ? '尚無圖片' : '上傳 AS-IS 圖片'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative border border-slate-200 rounded-xl overflow-hidden min-h-[260px] flex flex-col group bg-slate-50/50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700">TO-BE 目標架構圖</h3>
                <div className="flex gap-2">
                  {images.TO_BE && <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">已上傳</span>}
                  {confirmedFields['image_to_be'] && <span className="text-[10px] bg-white border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm"><Check className="w-3 h-3"/> 已確認</span>}
                </div>
              </div>
              <div className="flex-1 relative flex items-center justify-center flex-col">
                <input type="file" ref={toBeInputRef} onChange={(e) => handleImageUpload(e, 'TO_BE')} accept="image/*" className="hidden" />
                {isUploading.TO_BE ? (
                  <div className="flex flex-col items-center text-blue-500"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">上傳中...</span></div>
                ) : images.TO_BE ? (
                  <>
                    <img src={images.TO_BE.thumbnail_binary} className="w-full h-full object-cover absolute inset-0" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                      <button onClick={() => { setViewerMode('SINGLE_TO_BE'); setIsViewerOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-100 shadow-sm"><Eye className="w-4 h-4" /> 檢視</button>
                      {!isReadOnlyMember && <button onClick={() => toBeInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 border border-white/30"><RefreshCw className="w-4 h-4" /> 替換</button>}
                    </div>
                    {!isReadOnlyMember && !confirmedFields['image_to_be'] && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                        <button onClick={() => handleConfirmField('image_to_be')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-full hover:bg-emerald-600 shadow-lg animate-bounce"><CheckCircle2 className="w-4 h-4" /> 確認圖片無誤</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div onClick={() => !isReadOnlyMember && toBeInputRef.current?.click()} className={`flex flex-col items-center justify-center w-full h-full transition-all ${isReadOnlyMember ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-white cursor-pointer'}`}>
                    <UploadCloud className="w-8 h-8 mb-2" />
                    <span className="text-sm font-bold">{isReadOnlyMember ? '尚無圖片' : '上傳 TO-BE 圖片'}</span>
                  </div>
                )}
              </div>
            </div>
            
            {(images.AS_IS && images.TO_BE) && (
              <div className="col-span-1 md:col-span-2 flex justify-center mt-2">
                <button onClick={() => { setViewerMode('DUAL'); setIsViewerOpen(true); }} className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-blue-200 text-blue-600 text-xs font-black rounded-full hover:bg-blue-50 transition-all shadow-sm"><Columns className="w-4 h-4" /> 進入雙圖對照模式</button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableCard theme="emerald" title="業務評估 (Business Evaluation)" fieldKey="eval_business" projectId={projectId} initialValue={project.eval_business} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_business']} placeholder="業務價值、成本效益分析..." isReadOnlyMember={isReadOnlyMember} />
          <EditableCard theme="purple" title="技術評估 (Technical Assessment)" fieldKey="eval_technical" projectId={projectId} initialValue={project.eval_technical} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_technical']} placeholder="架構設計、資安風險、技術可行性..." isReadOnlyMember={isReadOnlyMember} />
          <EditableCard theme="orange" title="成效追蹤指標 (Tracking Metrics)" fieldKey="eval_kpi" projectId={projectId} initialValue={project.eval_kpi} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_kpi']} placeholder="上線後的追蹤指標..." isReadOnlyMember={isReadOnlyMember} />
          <EditableCard theme="blue" title="綜合評估 (Comprehensive Judgment)" fieldKey="eval_conclusion" projectId={projectId} initialValue={project.eval_conclusion} currentUserId={currentUserId} onSave={handleSaveText} onConfirm={handleConfirmField} isConfirmed={confirmedFields['eval_conclusion']} placeholder="最終核定意見與建議..." isReadOnlyMember={isReadOnlyMember} />
        </div>
      </div>

      {/* 彈窗：選擇專案狀態 */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-800">選擇專案狀態</h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-slate-50/50 space-y-2">
              {statusOptions.map((opt) => (
                <button key={opt} onClick={() => handleUpdateStatus(opt)} className={`w-full flex items-center justify-between p-3 border rounded-xl font-bold text-sm transition-all ${project.status_name_snapshot === opt ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  {opt}{project.status_name_snapshot === opt && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isDeptModalOpen && <DepartmentSelector currentDept={project.department} onSave={handleSaveDept} onClose={() => setIsDeptModalOpen(false)} />}
      
      {/* 彈窗：管理成員名單 */}
      {memberModalConfig?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800">管理 {memberModalConfig.deptKey} 成員</h2>
              <button onClick={() => setMemberModalConfig(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋姓名..." className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {systemUsers.filter(u => u.full_name && u.full_name.includes(searchTerm)).map(u => {
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
                })}
              </div>
            </div>
            <div className="px-5 py-4 border-t flex gap-3 bg-slate-50/50">
              <button onClick={() => setMemberModalConfig(null)} className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white border rounded-xl hover:bg-slate-50">取消</button>
              <button onClick={confirmAssignees} className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">確認名單</button>
            </div>
          </div>
        </div>
      )}

      {/* A4 簡報預覽元件 */}
      {isReportOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-400/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 print:bg-white print:p-0">
          <style dangerouslySetInnerHTML={{__html: ` @media print { @page { size: A4 landscape; margin: 10mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } ::-webkit-scrollbar { display: none; } }`}} />
          <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 print:hidden shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><FileText className="w-5 h-5" /></div>
              <h2 className="font-extrabold text-slate-800 text-lg">A4 專案評估簡報預覽</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm"><Printer className="w-4 h-4" /> 列印 / 匯出 PDF</button>
              <button onClick={() => setIsReportOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><X className="w-5 h-5" /></button>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-12 py-12 print:block print:py-0 print:gap-0">
            {/* P1: 基本評估 */}
            <article className="w-[297mm] h-[210mm] max-w-full bg-white shadow-2xl p-10 flex flex-col shrink-0 print:w-full print:h-screen print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page overflow-hidden">
              <div className="flex items-end justify-between border-b border-slate-800 pb-3 mb-5 shrink-0">
                <div className="flex items-baseline gap-4"><h1 className="text-2xl font-black text-slate-900">{project.name}</h1><span className="text-sm font-bold text-slate-500">{project.project_code}</span></div>
                <div className="flex gap-4 text-[11px] font-bold text-slate-600"><span>單位：{project.department}</span><span>狀態：{project.status_name_snapshot}</span></div>
              </div>
              <h2 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4 shrink-0">第一頁：專案基本評估</h2>
              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">現行工作職掌與工作流程</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.workflow_text || '尚未填寫'}</p></div>
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">現行作業痛點</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.as_is_text || '尚未填寫'}</p></div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 mt-4 min-h-0">
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">影響範圍－人員</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.impact_people_text || '尚未填寫'}</p></div>
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">影響範圍－時間</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.impact_time_text || '尚未填寫'}</p></div>
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">影響範圍－效益</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.impact_benefit_text || '尚未填寫'}</p></div>
              </div>
            </article>
            
            {/* P2: 前後對比圖 */}
            <article className="w-[297mm] h-[210mm] max-w-full bg-white shadow-2xl p-10 flex flex-col shrink-0 print:w-full print:h-screen print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page overflow-hidden">
              <div className="flex items-end justify-between border-b border-slate-800 pb-3 mb-5 shrink-0"><div className="flex items-baseline gap-4"><h1 className="text-2xl font-black text-slate-900">{project.name}</h1><span className="text-sm font-bold text-slate-500">{project.project_code}</span></div></div>
              <h2 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4 shrink-0">第二頁：AS-IS / TO-BE 系統架構對照</h2>
              <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col border border-slate-200 rounded-lg p-3 bg-slate-50/30"><h3 className="text-xs font-black text-slate-700 mb-3 shrink-0">AS-IS 現行流程</h3><div className="flex-1 flex items-center justify-center min-h-0">{images.AS_IS ? <img src={images.AS_IS.image_binary} className="max-w-full max-h-full object-contain" /> : <span className="text-slate-400 font-bold text-xs">尚無圖片</span>}</div></div>
                <div className="flex flex-col border border-slate-200 rounded-lg p-3 bg-slate-50/30"><h3 className="text-xs font-black text-slate-700 mb-3 shrink-0">TO-BE 目標架構</h3><div className="flex-1 flex items-center justify-center min-h-0">{images.TO_BE ? <img src={images.TO_BE.image_binary} className="max-w-full max-h-full object-contain" /> : <span className="text-slate-400 font-bold text-xs">尚無圖片</span>}</div></div>
              </div>
            </article>

            {/* P3: 進階評估 */}
            <article className="w-[297mm] h-[210mm] max-w-full bg-white shadow-2xl p-10 flex flex-col shrink-0 print:w-full print:h-screen print:border-none print:shadow-none print:p-0 print:m-0 overflow-hidden">
              <div className="flex items-end justify-between border-b border-slate-800 pb-3 mb-5 shrink-0"><div className="flex items-baseline gap-4"><h1 className="text-2xl font-black text-slate-900">{project.name}</h1><span className="text-sm font-bold text-slate-500">{project.project_code}</span></div></div>
              <h2 className="text-sm font-black text-slate-800 border-b border-slate-200 pb-2 mb-4 shrink-0">第三頁：進階評估與成效追蹤</h2>
              <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6 min-h-0">
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">業務評估 (Business Evaluation)</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.eval_business || '尚未填寫'}</p></div>
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">技術評估 (Technical Assessment)</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.eval_technical || '尚未填寫'}</p></div>
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">成效追蹤指標 (Tracking Metrics)</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.eval_kpi || '尚未填寫'}</p></div>
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 flex flex-col min-h-0"><h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-200 pb-1.5 shrink-0">綜合評估 (Comprehensive Judgment)</h3><p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 font-medium">{project.eval_conclusion || '尚未填寫'}</p></div>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* 雙圖檢視器 */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-4">
              <h2 className="text-white font-bold text-sm flex items-center gap-2"><Eye className="w-5 h-5 text-blue-400" /> 流程圖檢視器</h2>
              {viewerMode === 'DUAL' && <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded">雙圖對照模式</span>}
            </div>
            <button onClick={() => setIsViewerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex overflow-hidden p-6 gap-6">
            {(viewerMode === 'SINGLE_AS_IS' || viewerMode === 'DUAL') && images.AS_IS && (
              <div className="flex-1 flex flex-col items-center bg-black/50 rounded-xl border border-white/10 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white text-xs font-bold">現行流程 (AS-IS)</div>
                <img src={images.AS_IS.image_binary} className="w-full h-full object-contain p-2" />
              </div>
            )}
            {(viewerMode === 'SINGLE_TO_BE' || viewerMode === 'DUAL') && images.TO_BE && (
              <div className="flex-1 flex flex-col items-center bg-black/50 rounded-xl border border-white/10 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-emerald-500/30 text-emerald-400 text-xs font-bold">目標架構 (TO-BE)</div>
                <img src={images.TO_BE.image_binary} className="w-full h-full object-contain p-2" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}