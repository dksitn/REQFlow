'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, FileDown, Lock, Edit3, X, UserPlus, Image as ImageIcon, Unlock } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 🚀 核心修復：將外部圖片網址轉換為 Base64 以繞過 CORS 限制
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  if (url.startsWith('data:image')) return url; // 如果已經是 Base64 就直接回傳
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
    console.warn('無法將圖片轉為 Base64:', url, error);
    return url; // 轉換失敗則回傳原網址，盡力而為
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
          if (!projRes.data.team_members) {
            projRes.data.team_members = { '應用科': [], '企劃科': [], '科技科': [] };
          }
        }
        if (statRes.data) setStatusDict(statRes.data);
        if (usersRes.data) setUsersList(usersRes.data);

        if (locksRes.data) {
          const lockMap: Record<string, any> = {};
          locksRes.data.forEach(l => lockMap[l.field_name] = l);
          setLocks(lockMap);
        }

        // 🚀 核心修復：載入圖片時，預先將圖片轉為 Base64
        if (imagesRes.data) {
          const imgMap: Record<string, string> = {};
          for (const img of imagesRes.data) {
            imgMap[img.image_type] = await fetchImageAsBase64(img.image_url);
          }
          setImages(imgMap);
        }
      } catch (error) {
        console.error('資料載入失敗:', error);
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
    } catch (error) {
      console.error('儲存失敗', error);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    saveProjectToDB({ status_name_snapshot: newStatus });
  };

  const handleEdit = async (field: string, currentValue: string) => {
    if (locks[field] && locks[field].user_id !== currentUser?.id) return; 
    setEditingField(field);
    setDrafts(prev => ({ ...prev, [field]: currentValue || '' }));
    await supabase.from('m01_edit_locks').upsert({
      project_id: projectId,
      field_name: field,
      user_id: currentUser?.id,
      user_name: currentUser?.full_name,
      locked_at: new Date().toISOString()
    });
  };

  const handleCancel = async (field: string) => {
    setEditingField(null);
    setDrafts(prev => ({ ...prev, [field]: '' }));
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
    if (!confirm('確定要解除所有人的編輯鎖定嗎？')) return;
    await supabase.from('m01_edit_locks').delete().eq('project_id', projectId);
    setLocks({});
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'AS-IS' | 'TO-BE') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🚀 將上傳的圖片轉為 Base64 存入 DB，確保 html2canvas 可以讀取
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await supabase.from('m01_project_assessment_images').upsert({
        project_id: projectId,
        image_type: type,
        image_url: base64String
      });
      setImages(prev => ({ ...prev, [type]: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const openUserModal = (dept: string) => {
    setActiveDept(dept);
    setIsUserModalOpen(true);
  };

  const toggleUserSelection = async (userName: string) => {
    const currentTeam = projectData.team_members || { '應用科': [], '企劃科': [], '科技科': [] };
    const deptUsers = currentTeam[activeDept] || [];
    let newDeptUsers = deptUsers.includes(userName) ? deptUsers.filter((n: string) => n !== userName) : [...deptUsers, userName];
    const newTeam = { ...currentTeam, [activeDept]: newDeptUsers };
    await saveProjectToDB({ team_members: newTeam });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    setTimeout(async () => {
      try {
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pdfWidth = 297; 
        
        const pages = ['hidden-pdf-page-1', 'hidden-pdf-page-2', 'hidden-pdf-page-3'];
        
        for (let i = 0; i < pages.length; i++) {
          const element = document.getElementById(pages[i]);
          if (!element) continue;

          // 🚀 加入 logging 以利除錯，並強制使用 CORS
          const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true, 
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: true 
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save(`${projectData?.project_code || '專案'}_綜合評估報告.pdf`);
      } catch (error) {
        console.error('PDF 匯出失敗', error);
        alert('匯出 PDF 時發生錯誤。請確認圖片來源是否支援。');
      } finally {
        setIsExporting(false);
      }
    }, 300); // 稍微拉長一點延遲，確保圖片 Base64 完全渲染
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!projectData) return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;

  const totalGrids = 11; 
  const completedGrids = Object.keys(confirmedFields).filter(k => confirmedFields[k]).length;
  const completeness = Math.round((completedGrids / totalGrids) * 100);

  // --- 共用的格子 UI 元件 (網頁顯示用) ---
  const GridBlock = ({ title, dbField, type = 'textarea', heightClass = 'min-h-[200px]' }: { title: string, dbField: string, type?: 'textarea' | 'image', heightClass?: string }) => {
    const isEditing = editingField === dbField;
    const isCompleted = confirmedFields[dbField];
    const value = projectData[dbField] || '';
    const isLockedByOther = locks[dbField] && locks[dbField].user_id !== currentUser?.id;

    return (
      <div className={`flex flex-col bg-white border ${isCompleted ? 'border-emerald-500 shadow-emerald-50' : isEditing ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-emerald-500'} rounded-xl shadow-sm overflow-hidden transition-all ${heightClass}`}>
        <div className={`px-4 py-3 flex items-center justify-between border-b ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-emerald-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isLockedByOther ? 'bg-rose-500' : isEditing ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <h3 className="text-sm font-black text-slate-800">{title}</h3>
          </div>
          <div className="flex gap-2">
            {isLockedByOther ? (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded flex items-center gap-1"><Lock className="w-3 h-3"/> {locks[dbField].user_name} 編輯中</span>
            ) : (
              <>
                {!isEditing && !isCompleted && (
                  <button onClick={() => handleEdit(dbField, value)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded flex items-center gap-1"><Edit3 className="w-3.5 h-3.5"/> 編輯</button>
                )}
                {isCompleted && (
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4"/> 已完成</span>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col gap-3 relative">
          {isEditing ? (
            type === 'textarea' ? (
              <textarea 
                value={drafts[dbField] !== undefined ? drafts[dbField] : value} 
                onChange={(e) => setDrafts({...drafts, [dbField]: e.target.value})}
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 resize-none"
              />
            ) : null
          ) : (
            <div className={`flex-1 flex ${type==='image'? 'items-center justify-center bg-slate-50/50 rounded-lg border border-slate-100' : ''} text-sm whitespace-pre-wrap ${value || images[dbField] ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {type === 'image' && images[dbField] ? (
                 // 🚀 加上 crossOrigin 屬性以防萬一
                 <img src={images[dbField]} crossOrigin="anonymous" className="max-w-full max-h-[150px] object-contain" alt={title}/> 
              ) : type === 'image' ? (
                 <span>尚未上傳圖片</span>
              ) : value || '尚未填寫資料...'}
            </div>
          )}

          {type === 'image' && !isCompleted && !isLockedByOther && (
             <label className="absolute bottom-4 right-4 cursor-pointer bg-white border border-slate-200 shadow-sm text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg flex items-center gap-2">
               <ImageIcon className="w-4 h-4"/> 上傳圖片
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, dbField as 'AS-IS'|'TO-BE')} />
             </label>
          )}

          <div>
            {isEditing && (
              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
                <button onClick={() => handleCancel(dbField)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md flex items-center gap-1"><X className="w-3.5 h-3.5"/> 取消</button>
                <button onClick={() => handleSaveGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-md flex items-center gap-1"><Save className="w-3.5 h-3.5"/> 儲存</button>
              </div>
            )}
            {!isEditing && !isCompleted && (value || images[dbField]) && !isLockedByOther && (
              <div className="flex justify-end mt-2 pt-3 border-t border-slate-100">
                <button onClick={() => handleCompleteGrid(dbField)} className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-md flex items-center gap-1"><Check className="w-3.5 h-3.5"/> 標記為完成</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 overflow-x-hidden relative">
      
      {/* 頂部固定資訊列 */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
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
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-slate-400">專案狀態</span>
                <select value={projectData.status_name_snapshot} onChange={(e) => handleStatusChange(e.target.value)} disabled={isExporting} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-700 outline-none focus:border-indigo-500 cursor-pointer">
                  {statusDict.map(status => (
                    <option key={status.id} value={status.name}>{status.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
                {isExporting ? '產出 PDF 中...' : '產出 PDF 檔案'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-600 whitespace-nowrap">資料完整度 {completeness}%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${completeness === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${completeness}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 網頁可視區域 */}
      <div className="max-w-[1600px] mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行工作職掌與工作流程" dbField="workflow_text" />
          <GridBlock title="現行作業痛點" dbField="pain_points_text" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GridBlock title="影響範圍 - 人員" dbField="impact_people_text" heightClass="min-h-[150px]" />
          <GridBlock title="影響範圍 - 時間" dbField="impact_time_text" heightClass="min-h-[150px]" />
          <GridBlock title="影響範圍 - 效益" dbField="impact_benefit_text" heightClass="min-h-[150px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="現行系統架構 (AS-IS)" dbField="AS-IS" type="image" heightClass="min-h-[150px]" />
          <GridBlock title="未來系統架構 (TO-BE)" dbField="TO-BE" type="image" heightClass="min-h-[150px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GridBlock title="業務面評估" dbField="eval_business" />
          <GridBlock title="技術面評估" dbField="eval_technical" />
          <GridBlock title="成效追蹤指標 (KPI)" dbField="eval_kpi" />
          <GridBlock title="綜合評估結論" dbField="eval_conclusion" />
        </div>
      </div>

      {/* Admin 強制解除鎖定 */}
      {currentUser?.system_role === 'admin' && Object.keys(locks).length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={handleUnlockAll} className="bg-rose-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold hover:bg-rose-700 hover:scale-105 transition-all">
            <Unlock className="w-5 h-5"/> 強制解除所有編輯鎖定
          </button>
        </div>
      )}

      {/* 人員選擇 Modal */}
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

      {/* 🚀 隱藏的 PDF 生成專用排版區塊 */}
      <div className="absolute left-[-9999px] top-0 w-[1122px] bg-white text-slate-800 font-sans">
        
        <div id="hidden-pdf-page-1" className="w-[1122px] h-[793px] p-8 flex flex-col gap-6 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2 mb-2">
            <h1 className="text-2xl font-black text-slate-900">{projectData.name} - 綜合評估報告</h1>
            <div className="text-sm font-bold text-slate-500">專案編號: {projectData.project_code} | 提案單位: {projectData.department}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['應用科', '企劃科', '科技科'].map(dept => (
              <div key={dept} className="flex flex-col p-3 border-2 border-emerald-500 rounded-lg">
                <span className="text-sm font-bold mb-2">{dept}負責人</span>
                <span className="text-sm">{(projectData.team_members?.[dept] || []).join(', ') || '未指派'}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">現行工作職掌與工作流程</span><span className="text-sm whitespace-pre-wrap">{projectData.workflow_text || '無'}</span></div>
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">現行作業痛點</span><span className="text-sm whitespace-pre-wrap">{projectData.pain_points_text || '無'}</span></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">影響範圍 - 人員</span><span className="text-sm whitespace-pre-wrap">{projectData.impact_people_text || '無'}</span></div>
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">影響範圍 - 時間</span><span className="text-sm whitespace-pre-wrap">{projectData.impact_time_text || '無'}</span></div>
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">影響範圍 - 效益</span><span className="text-sm whitespace-pre-wrap">{projectData.impact_benefit_text || '無'}</span></div>
          </div>
        </div>

        <div id="hidden-pdf-page-2" className="w-[1122px] h-[793px] p-8 flex flex-col gap-6 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2 mb-2">
            <h2 className="text-xl font-black text-slate-800">系統架構圖 (AS-IS / TO-BE)</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 flex-1">
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col h-[650px]">
              <span className="font-bold border-b border-emerald-200 pb-2 mb-2 text-emerald-700">現行系統架構 (AS-IS)</span>
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                {images['AS-IS'] ? <img src={images['AS-IS']} crossOrigin="anonymous" className="max-w-full max-h-[500px] object-contain" /> : '無圖片'}
              </div>
            </div>
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col h-[650px]">
              <span className="font-bold border-b border-emerald-200 pb-2 mb-2 text-emerald-700">未來系統架構 (TO-BE)</span>
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                {images['TO-BE'] ? <img src={images['TO-BE']} crossOrigin="anonymous" className="max-w-full max-h-[500px] object-contain" /> : '無圖片'}
              </div>
            </div>
          </div>
        </div>

        <div id="hidden-pdf-page-3" className="w-[1122px] h-[793px] p-8 flex flex-col gap-6 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2 mb-2">
            <h2 className="text-xl font-black text-slate-800">綜合評估與簽核</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">業務面評估</span><span className="text-sm whitespace-pre-wrap">{projectData.eval_business || '無'}</span></div>
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">技術面評估</span><span className="text-sm whitespace-pre-wrap">{projectData.eval_technical || '無'}</span></div>
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">成效追蹤指標 (KPI)</span><span className="text-sm whitespace-pre-wrap">{projectData.eval_kpi || '無'}</span></div>
            <div className="border-2 border-emerald-500 rounded-lg p-4 flex flex-col"><span className="font-bold border-b pb-2 mb-2">綜合評估結論</span><span className="text-sm whitespace-pre-wrap">{projectData.eval_conclusion || '無'}</span></div>
          </div>
          
          <div className="border-2 border-black mt-4">
            <h2 className="text-lg font-black text-black bg-slate-100 p-2 text-center border-b-2 border-black tracking-widest">專案簽核流程</h2>
            <div className="grid grid-cols-6 w-full">
              {['需求單位經辦', '需求單位科主管', '需求單位主管', '智慧金融處經辦', '智慧金融處科主管', '智慧金融處主管'].map((role, idx) => (
                <div key={idx} className={`flex flex-col h-[150px] ${idx !== 5 ? 'border-r-2 border-black' : ''}`}>
                  <div className="bg-slate-50 border-b-2 border-black py-2 px-1 text-center text-sm font-black">{role}</div>
                  <div className="flex-1 bg-white"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}