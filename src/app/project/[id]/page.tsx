'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, FileDown, Lock, Edit3, X, UserPlus, Image as ImageIcon, Unlock } from 'lucide-react';

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

        if (imagesRes.data) {
          const imgMap: Record<string, string> = {};
          imagesRes.data.forEach(img => imgMap[img.image_type] = img.image_url);
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

    // 將圖片轉為 base64 存入 DB (實務建議存 Storage)
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

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!projectData) return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;

  const totalGrids = 11; 
  const completedGrids = Object.keys(confirmedFields).filter(k => confirmedFields[k]).length;
  const completeness = Math.round((completedGrids / totalGrids) * 100);

  // --- 共用的格子 UI 元件 ---
  // heightClass 用來控制網頁版的預設高度 (如圖片區塊不需 800px 那麼高)
  const GridBlock = ({ title, dbField, type = 'textarea', heightClass = 'h-full' }: { title: string, dbField: string, type?: 'textarea' | 'image', heightClass?: string }) => {
    const isEditing = editingField === dbField;
    const isCompleted = confirmedFields[dbField];
    const value = projectData[dbField] || '';
    const isLockedByOther = locks[dbField] && locks[dbField].user_id !== currentUser?.id;

    return (
      <div className={`flex flex-col bg-white border ${isCompleted ? 'border-emerald-500 shadow-emerald-50' : isEditing ? 'border-indigo-300 shadow-md ring-1 ring-indigo-500' : 'border-emerald-500'} rounded-xl shadow-sm overflow-hidden transition-all break-inside-avoid ${heightClass}`}>
        <div className={`px-4 py-3 flex items-center justify-between border-b ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isLockedByOther ? 'bg-rose-500' : isEditing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <h3 className="text-sm font-black text-slate-800">{title}</h3>
          </div>
          <div className="flex gap-2 print:hidden">
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
                className="w-full flex-1 min-h-[120px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 resize-none print:hidden"
              />
            ) : null
          ) : (
            <div className={`flex-1 flex ${type==='image'? 'items-center justify-center' : ''} text-sm whitespace-pre-wrap ${value || images[dbField] ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {type === 'image' && images[dbField] ? (
                 <img src={images[dbField]} className="max-w-full max-h-[400px] object-contain print:max-h-[600px] print:w-auto" alt={title}/> 
              ) : type === 'image' ? (
                 <span>尚未上傳圖片</span>
              ) : value || '尚未填寫資料...'}
            </div>
          )}

          {/* 圖片上傳按鈕 (只在非編輯與非完成狀態下顯示) */}
          {type === 'image' && !isCompleted && !isLockedByOther && (
             <label className="absolute bottom-4 right-4 print:hidden cursor-pointer bg-white border border-slate-200 shadow-sm text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg flex items-center gap-2">
               <ImageIcon className="w-4 h-4"/> 上傳圖片
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, dbField as 'AS-IS'|'TO-BE')} />
             </label>
          )}

          <div className="print:hidden">
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:page-1 { page-break-after: always; }
          .print\\:page-2 { page-break-before: always; page-break-after: always; height: 100vh; padding-top: 10mm; }
          .print\\:page-3 { page-break-before: always; padding-top: 10mm; }
          .print\\:grid-rows-1 { grid-template-rows: 1fr; }
        }
      `}} />

      <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-24 print:bg-white print:pb-0">
        
        {/* 第一層：頂部固定資訊列 */}
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm print:static print:shadow-none print:border-none print:mb-4">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors print:hidden"><ArrowLeft className="w-5 h-5" /></button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono border border-indigo-200">{projectData.project_code}</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{projectData.department}</span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 mt-1">{projectData.name}</h1>
                </div>
              </div>
              <div className="flex items-center gap-4 print:hidden">
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

            <div className="flex items-center gap-4 print:hidden">
              <span className="text-xs font-black text-slate-600 whitespace-nowrap">資料完整度 {completeness}%</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${completeness === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${completeness}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto w-full px-6 py-4 flex flex-col gap-6 print:p-0 print:gap-4 print:w-full">
          
          {/* PDF 第一頁 (1~4 層) */}
          <div className="print:page-1 flex flex-col gap-6">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-500 flex flex-col gap-4 print:border-emerald-500 print:shadow-none print:p-4">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-500"/> 專案負責人編制</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['應用科', '企劃科', '科技科'].map(dept => (
                  <div key={dept} className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl print:bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-slate-700">{dept}</span>
                      <button onClick={() => openUserModal(dept)} className="print:hidden text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1"><UserPlus className="w-3 h-3"/> 加入</button>
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
              <GridBlock title="影響範圍 - 人員" dbField="impact_people_text" />
              <GridBlock title="影響範圍 - 時間" dbField="impact_time_text" />
              <GridBlock title="影響範圍 - 效益" dbField="impact_benefit_text" />
            </div>
          </div>

          {/* PDF 第二頁 (第 5 層) - 確保圖片高度適中、綠色邊框 */}
          <div className="print:page-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full print:grid-rows-1">
              <GridBlock title="現行系統架構 (AS-IS)" dbField="AS-IS" type="image" heightClass="min-h-[400px] print:h-[160mm]" />
              <GridBlock title="未來系統架構 (TO-BE)" dbField="TO-BE" type="image" heightClass="min-h-[400px] print:h-[160mm]" />
            </div>
          </div>

          {/* PDF 第三頁 (第 6 層 + 簽核表) */}
          <div className="print:page-3 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GridBlock title="業務面評估" dbField="eval_business" />
              <GridBlock title="技術面評估" dbField="eval_technical" />
              <GridBlock title="成效追蹤指標 (KPI)" dbField="eval_kpi" />
              <GridBlock title="綜合評估結論" dbField="eval_conclusion" />
            </div>

            {/* 簽核表單 (僅限列印時顯示) */}
            <div className="hidden print:block mt-8">
               <h2 className="text-lg font-black text-slate-800 mb-4 text-center">專案簽核流程</h2>
               <div className="grid grid-cols-6 border-t-2 border-l-2 border-black w-full">
                 {['需求單位經辦', '需求單位科主管', '需求單位主管', '智慧金融處經辦', '智慧金融處科主管', '智慧金融處主管'].map((role, idx) => (
                   <div key={idx} className="border-r-2 border-b-2 border-black flex flex-col h-[100px]">
                     <div className="bg-slate-100 border-b border-black py-2 px-1 text-center text-[10px] font-black">{role}</div>
                     <div className="flex-1"></div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

        </div>

        {/* Admin 強制解除鎖定 */}
        {currentUser?.system_role === 'admin' && Object.keys(locks).length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 print:hidden">
            <button onClick={handleUnlockAll} className="bg-rose-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold hover:bg-rose-700 hover:scale-105 transition-all">
              <Unlock className="w-5 h-5"/> 強制解除所有編輯鎖定
            </button>
          </div>
        )}

        {/* 人員選擇 Modal */}
        {isUserModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in print:hidden">
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
    </>
  );
}