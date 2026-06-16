'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Search, Loader2, Folder, Clock, CheckSquare, FlaskConical, Hourglass, Plus, ChevronRight, LogOut, User as UserIcon, Send, CheckCircle2, FileSignature } from 'lucide-react';
import CreateProjectModal from '@/components/CreateProjectModal';

const iconMap: Record<string, React.ElementType> = {
  'Send': Send,
  'CheckCircle2': CheckCircle2,
  'FlaskConical': FlaskConical,
  'FileSignature': FileSignature,
  'Hourglass': Hourglass,
};

const colorMap: Record<string, { ring: string, text: string, border: string, iconText: string }> = {
  blue: { ring: 'ring-blue-500', text: 'text-blue-600', border: 'hover:border-blue-200', iconText: 'text-blue-500' },
  emerald: { ring: 'ring-emerald-500', text: 'text-emerald-600', border: 'hover:border-emerald-200', iconText: 'text-emerald-500' },
  purple: { ring: 'ring-purple-500', text: 'text-purple-600', border: 'hover:border-purple-200', iconText: 'text-purple-500' },
  orange: { ring: 'ring-orange-500', text: 'text-orange-600', border: 'hover:border-orange-200', iconText: 'text-orange-500' },
  slate: { ring: 'ring-slate-500', text: 'text-slate-600', border: 'hover:border-slate-300', iconText: 'text-slate-500' },
};

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [statusDict, setStatusDict] = useState<any[]>([]); // 🚀 儲存狀態字典
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    async function fetchMyProjectsData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let loggedInName = '';
        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserEmail(user.email || '');
          const { data: profile } = await supabase.from('m01_users').select('full_name').eq('email', user.email).maybeSingle();
          if (profile?.full_name) {
            loggedInName = profile.full_name;
            setCurrentUserName(loggedInName);
          }
        }

        const [projRes, statRes] = await Promise.all([
          supabase.from('m01_projects').select('*').order('created_at', { ascending: false }),
          supabase.from('m01_status_dict').select('*').order('sort_order', { ascending: true })
        ]);

        if (projRes.error) throw projRes.error;
        if (statRes.error) throw statRes.error;
        
        // 過濾自己有參與的專案
        const myData = (projRes.data || []).filter(proj => {
          if (!loggedInName) return false;
          const team = proj.team_members || {};
          const allMembers = [
            ...(team['應用科']||[]), 
            ...(team['企劃科']||[]), 
            ...(team['科技科']||[]),
            ...(team['唯讀檢視者']||[])
          ].map(m => m.trim());
          return allMembers.includes(loggedInName);
        });

        setProjects(myData);
        setStatusDict(statRes.data || []);
      } catch (error) {
        console.error('讀取專案資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyProjectsData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const calculateCompleteness = (proj: any) => {
    let score = 0;
    const confirmed = proj.confirmed_fields || {};
    const fields = ['workflow_text', 'as_is_text', 'impact_people_text', 'impact_time_text', 'impact_benefit_text', 'image_as_is', 'image_to_be', 'eval_business', 'eval_technical', 'eval_kpi', 'eval_conclusion'];
    fields.forEach(f => { if (confirmed[f]) score++; });
    return Math.round((score / 11) * 100);
  };

  const getResponsiblesString = (proj: any) => {
    const team = proj.team_members || {};
    const all = [...(team['應用科']||[]), ...(team['企劃科']||[]), ...(team['科技科']||[])];
    return all.length > 0 ? all.join(', ') : '未指定';
  };

  // 🚀 動態過濾邏輯
  let baseFilteredProjects = projects;
  if (activeFilter !== 'ALL') {
    baseFilteredProjects = projects.filter(p => p.status_name_snapshot === activeFilter);
  }

  const finalFilteredProjects = baseFilteredProjects.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.project_code?.toLowerCase().includes(s) ||
      p.department?.toLowerCase().includes(s) ||
      getResponsiblesString(p).toLowerCase().includes(s)
    );
  });

  const staleProjectsCount = projects.filter(p => {
    if (!p.updated_at) return false;
    const diffTime = Math.abs(new Date().getTime() - new Date(p.updated_at).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) > 3;
  }).length;

  return (
    <div className="flex-1 flex flex-col w-full relative font-sans min-h-screen">
      
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex flex-wrap md:flex-nowrap items-center justify-between shadow-sm shrink-0 gap-4">
        <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight ml-12 md:ml-0 flex items-center gap-2">
          <Folder className="w-5 h-5 text-indigo-500" /> 我的負責案件
        </h1>
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors w-full md:w-auto shrink-0">
            <Plus className="w-4 h-4" /> 建立案件
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUserId ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-end hidden md:flex"><span className="text-xs font-black text-slate-800">{currentUserName}</span><span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span></div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black border border-indigo-200 text-sm">{currentUserName ? currentUserName.charAt(0) : <UserIcon className="w-4 h-4" />}</div>
                <button onClick={handleSignOut} title="登出" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (<button onClick={() => router.push('/auth')} className="text-xs font-bold text-indigo-600">前往登入</button>)}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-24 max-w-[1600px] mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        
        <div className="flex-1 flex flex-col gap-6 md:gap-8 w-full min-w-0">
          
          {/* 🚀 4. 動態生成統計卡片 */}
          <div className="flex overflow-x-auto gap-3 md:gap-4 cursor-pointer select-none shrink-0 pb-2 custom-scrollbar">
            
            {/* 固定的全部專案 */}
            <div onClick={() => setActiveFilter('ALL')} className={`min-w-[140px] md:min-w-[180px] bg-white rounded-2xl p-4 md:p-5 shadow-sm flex flex-col items-start justify-between transition-all gap-2 ${activeFilter === 'ALL' ? 'ring-2 ring-indigo-500 border-transparent shadow-md' : 'border border-slate-100 hover:border-indigo-200'}`}>
              <div className="flex justify-between w-full items-start">
                <p className="text-[11px] font-bold text-slate-400">我的專案</p>
                <Folder className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">{projects.length}</p>
            </div>
            
            {/* 動態渲染狀態字典 */}
            {statusDict.map((status) => {
              const count = projects.filter(p => p.status_name_snapshot === status.name).length;
              const color = colorMap[status.color_key] || colorMap['slate'];
              const IconComponent = iconMap[status.icon] || Folder;
              const isActive = activeFilter === status.name;

              return (
                <div key={status.id} onClick={() => setActiveFilter(status.name)} className={`min-w-[140px] md:min-w-[180px] bg-white rounded-2xl p-4 md:p-5 shadow-sm flex flex-col items-start justify-between transition-all gap-2 ${isActive ? `ring-2 ${color.ring} border-transparent shadow-md` : `border border-slate-100 ${color.border}`}`}>
                  <div className="flex justify-between w-full items-start">
                    <p className="text-[11px] font-bold text-slate-400">{status.name}</p>
                    <IconComponent className={`w-4 h-4 ${color.iconText}`} />
                  </div>
                  <p className={`text-3xl font-black mt-2 ${color.text}`}>{count}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
            <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base md:text-lg font-black text-slate-800">
                  {activeFilter === 'ALL' ? '全部專案' : activeFilter}
                </h2>
                <span className="text-xs md:text-sm font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">共 {finalFilteredProjects.length} 筆</span>
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="搜尋專案名稱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 md:py-2 bg-[#F8FAFC] border rounded-lg text-sm font-bold outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="flex-1 bg-slate-50/30 rounded-b-2xl">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" /><span className="text-sm font-bold">資料載入中...</span></div>
              ) : finalFilteredProjects.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400"><Folder className="w-12 h-12 mb-3 text-slate-200" /><span className="text-sm font-bold">您目前沒有負責符合條件的專案</span></div>
              ) : (
                <>
                  <div className="md:hidden flex flex-col gap-3 p-4">
                    {finalFilteredProjects.map((proj) => {
                      const comp = calculateCompleteness(proj);
                      return (
                        <div key={proj.id} onClick={() => router.push(`/project/${proj.id}`)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{proj.project_code}</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded border bg-slate-50 text-slate-600">{proj.status_name_snapshot}</span>
                          </div>
                          <h3 className="text-sm font-black text-slate-800 leading-snug">{proj.name}</h3>
                        </div>
                      )
                    })}
                  </div>

                  <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                      <thead className="bg-slate-50/80 sticky top-0 z-10">
                        <tr className="border-b-2 border-slate-100">
                          <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase">專案編號</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">專案名稱</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">提案單位</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">目前狀態</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">負責人</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase w-32">完整度</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {finalFilteredProjects.map((proj) => {
                          const comp = calculateCompleteness(proj);
                          const responsibles = getResponsiblesString(proj);
                          return (
                            <tr key={proj.id} onClick={() => router.push(`/project/${proj.id}`)} className="hover:bg-indigo-50/30 cursor-pointer">
                              <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border">{proj.project_code}</span></td>
                              <td className="px-4 py-4 text-sm font-black text-slate-700 truncate max-w-[250px]">{proj.name}</td>
                              <td className="px-4 py-4"><span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md">{proj.department || '-'}</span></td>
                              <td className="px-4 py-4"><span className="text-[10px] font-black px-2 py-1 rounded-md border bg-slate-50 text-slate-600">{proj.status_name_snapshot}</span></td>
                              <td className="px-4 py-4"><div className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]">{responsibles}</div></td>
                              <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${comp}%` }}></div></div></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 w-full md:w-72 lg:w-80 shrink-0 md:sticky md:top-8">
          <section>
            <h3 className="text-sm font-black text-slate-800 mb-4 px-1">待處理事項</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><Clock className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-600">待更新 <span className="text-slate-400 font-medium">(超過3天)</span></span></div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">{staleProjectsCount} <ChevronRight className="w-3.5 h-3.5 text-slate-300" /></div>
              </div>
            </div>
          </section>
        </div>

      </div>

      {isCreateModalOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(projectId) => {
            setIsCreateModalOpen(false);
            router.push(`/project/${projectId}`);
          }}
        />
      )}
    </div>
  );
}