'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Search, Loader2, Folder, Clock, CheckSquare, FlaskConical, Hourglass, Plus, ChevronRight, LogOut, User as UserIcon, BarChart2 } from 'lucide-react';
import CreateProjectModal from '@/components/CreateProjectModal';

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EVAL' | 'POC' | 'PENDING'>('ALL');

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

        const { data, error } = await supabase.from('m01_projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        // 🚀 過濾出「自己有參與」的專案
        const myData = (data || []).filter(proj => {
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

  const handleRiskChange = async (projectId: string, newRisk: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, risk_level: newRisk } : p));
    await supabase.from('m01_projects').update({ risk_level: newRisk }).eq('id', projectId);
  };

  const getRiskSelector = (proj: any) => {
    const currentRisk = proj.risk_level || '低';
    const bg = currentRisk === '高' ? 'bg-rose-50 text-rose-600 border-rose-200' : currentRisk === '中' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
    return (
      <select 
        value={currentRisk} 
        onChange={(e) => handleRiskChange(proj.id, e.target.value)} 
        onClick={(e) => e.stopPropagation()}
        className={`text-[10px] font-black border rounded px-1.5 py-0.5 outline-none cursor-pointer hover:shadow-sm ${bg}`}
      >
        <option value="低" className="text-emerald-600">低</option>
        <option value="中" className="text-amber-600">中</option>
        <option value="高" className="text-rose-600">高</option>
      </select>
    );
  };

  const getResponsiblesString = (proj: any) => {
    const team = proj.team_members || {};
    const all = [...(team['應用科']||[]), ...(team['企劃科']||[]), ...(team['科技科']||[])];
    return all.length > 0 ? all.join(', ') : '未指定';
  };

  const evalStatuses = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成'];
  const pocStatuses = ['POC案執行中'];
  const pendingStatuses = ['暫緩案'];

  const evalCount = projects.filter(p => evalStatuses.includes(p.status_name_snapshot)).length;
  const pocCount = projects.filter(p => pocStatuses.includes(p.status_name_snapshot)).length;
  const pendingCount = projects.filter(p => pendingStatuses.includes(p.status_name_snapshot)).length;
  const totalProjects = evalCount + pocCount + pendingCount;

  let baseFilteredProjects = projects;
  if (activeFilter === 'EVAL') baseFilteredProjects = projects.filter(p => evalStatuses.includes(p.status_name_snapshot));
  else if (activeFilter === 'POC') baseFilteredProjects = projects.filter(p => pocStatuses.includes(p.status_name_snapshot));
  else if (activeFilter === 'PENDING') baseFilteredProjects = projects.filter(p => pendingStatuses.includes(p.status_name_snapshot));

  const finalFilteredProjects = baseFilteredProjects.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.project_code?.toLowerCase().includes(s) ||
      p.department?.toLowerCase().includes(s) ||
      getResponsiblesString(p).toLowerCase().includes(s)
    );
  });

  const staleProjectsCount = finalFilteredProjects.filter(p => {
    if (!p.updated_at) return false;
    const diffTime = Math.abs(new Date().getTime() - new Date(p.updated_at).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  }).length;

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] w-full min-h-screen relative font-sans">
      
      {/* 🚀 頂部導覽列 (Responsive) */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex flex-wrap md:flex-nowrap items-center justify-between shadow-sm shrink-0 gap-4">
        <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight ml-12 md:ml-0 flex items-center gap-2">
          <Folder className="w-5 h-5 text-indigo-500" /> 我的負責案件
        </h1>
        
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors w-full md:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> 建立案件
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUserId ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-xs font-black text-slate-800">{currentUserName}</span>
                  <span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black border border-indigo-200 text-sm">
                  {currentUserName ? currentUserName.charAt(0) : <UserIcon className="w-4 h-4" />}
                </div>
                <button onClick={handleSignOut} title="登出" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/auth')} className="text-xs font-bold text-indigo-600">前往登入</button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-24 max-w-[1600px] mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        
        <div className="flex-1 flex flex-col gap-6 md:gap-8 w-full min-w-0">
          
          {/* 統計卡片區域 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 cursor-pointer select-none shrink-0">
            <div onClick={() => setActiveFilter('ALL')} className={`bg-white rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start justify-between transition-all gap-2 ${activeFilter === 'ALL' ? 'ring-2 ring-indigo-500 border-transparent shadow-md' : 'border border-slate-100 hover:border-indigo-200'}`}>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 mb-1">我的專案</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900">{totalProjects}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 self-end md:self-auto"><Folder className="w-4 h-4 md:w-5 md:h-5" /></div>
            </div>
            
            <div onClick={() => setActiveFilter('EVAL')} className={`bg-white rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start justify-between transition-all gap-2 ${activeFilter === 'EVAL' ? 'ring-2 ring-emerald-500 border-transparent shadow-md' : 'border border-slate-100 hover:border-emerald-200'}`}>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 mb-1">評估案</p>
                <p className="text-2xl md:text-3xl font-black text-[#10B981]">{evalCount}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0 self-end md:self-auto"><CheckSquare className="w-4 h-4 md:w-5 md:h-5" /></div>
            </div>
            
            <div onClick={() => setActiveFilter('POC')} className={`bg-white rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start justify-between transition-all gap-2 ${activeFilter === 'POC' ? 'ring-2 ring-purple-500 border-transparent shadow-md' : 'border border-slate-100 hover:border-purple-200'}`}>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 mb-1">POC案</p>
                <p className="text-2xl md:text-3xl font-black text-[#A855F7]">{pocCount}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-50 text-[#A855F7] flex items-center justify-center shrink-0 self-end md:self-auto"><FlaskConical className="w-4 h-4 md:w-5 md:h-5" /></div>
            </div>
            
            <div onClick={() => setActiveFilter('PENDING')} className={`bg-white rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start justify-between transition-all gap-2 ${activeFilter === 'PENDING' ? 'ring-2 ring-amber-500 border-transparent shadow-md' : 'border border-slate-100 hover:border-amber-200'}`}>
              <div>
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 mb-1">暫緩案</p>
                <p className="text-2xl md:text-3xl font-black text-[#F59E0B]">{pendingCount}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0 self-end md:self-auto"><Hourglass className="w-4 h-4 md:w-5 md:h-5" /></div>
            </div>
          </div>

          {/* 主要內容區塊 (搜尋列與專案列表) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
            
            <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base md:text-lg font-black text-slate-800">
                  {activeFilter === 'ALL' ? '全部專案' : activeFilter === 'EVAL' ? '評估案' : activeFilter === 'POC' ? 'POC案' : '暫緩案'}
                </h2>
                <span className="text-xs md:text-sm font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">共 {finalFilteredProjects.length} 筆</span>
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="搜尋專案名稱、負責人..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-9 pr-4 py-2.5 md:py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm md:text-xs font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all" 
                />
              </div>
            </div>

            <div className="flex-1 bg-slate-50/30 rounded-b-2xl">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
                  <span className="text-sm font-bold">資料載入中...</span>
                </div>
              ) : finalFilteredProjects.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Folder className="w-12 h-12 mb-3 text-slate-200" />
                  <span className="text-sm font-bold">您目前沒有負責符合條件的專案</span>
                </div>
              ) : (
                <>
                  {/* 📱 手機版：卡片式列表 */}
                  <div className="md:hidden flex flex-col gap-3 p-4">
                    {finalFilteredProjects.map((proj) => {
                      const comp = calculateCompleteness(proj);
                      return (
                        <div 
                          key={proj.id}
                          onClick={() => router.push(`/project/${proj.id}`)}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 active:scale-[0.98] transition-transform"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{proj.project_code}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                              proj.status_name_snapshot === '暫緩案' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              proj.status_name_snapshot === 'POC案執行中' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                              'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>{proj.status_name_snapshot}</span>
                          </div>
                          <h3 className="text-sm font-black text-slate-800 leading-snug">{proj.name}</h3>
                          
                          <div className="flex items-center justify-between text-xs mt-2 border-t border-slate-100 pt-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 font-bold text-[10px]">單位</span>
                              <span className="text-slate-700 font-black">{proj.department || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                              <span className="text-slate-400 font-bold text-[10px]">完整度</span>
                              <span className={`font-black ${comp === 100 ? 'text-emerald-500' : comp >= 50 ? 'text-blue-500' : 'text-amber-500'}`}>{comp}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 💻 電腦版：表格列表 */}
                  <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                      <thead className="bg-slate-50/80 sticky top-0">
                        <tr className="border-b-2 border-slate-100">
                          <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">專案編號</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">專案名稱</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">提案單位</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">目前狀態</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">專案負責人</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-32">資料完整度</th>
                          <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center">風險(可選)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {finalFilteredProjects.map((proj) => {
                          const comp = calculateCompleteness(proj);
                          const responsibles = getResponsiblesString(proj);
                          return (
                            <tr 
                              key={proj.id} 
                              onClick={() => router.push(`/project/${proj.id}`)}
                              className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                            >
                              <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">{proj.project_code}</span></td>
                              <td className="px-4 py-4 text-sm font-black text-slate-700 group-hover:text-indigo-600 truncate max-w-[250px]">{proj.name}</td>
                              <td className="px-4 py-4"><span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md">{proj.department || '-'}</span></td>
                              <td className="px-4 py-4">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${
                                  proj.status_name_snapshot === '暫緩案' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                  proj.status_name_snapshot === 'POC案執行中' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                  'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>{proj.status_name_snapshot}</span>
                              </td>
                              <td className="px-4 py-4"><div className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]" title={responsibles}>{responsibles}</div></td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full ${comp === 100 ? 'bg-emerald-500' : comp >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${comp}%` }}></div></div>
                                  <span className={`text-[10px] font-black w-8 text-right ${comp === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>{comp}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">{getRiskSelector(proj)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="hidden md:block px-6 py-4 text-[11px] font-bold text-slate-400 bg-white rounded-b-2xl">顯示第 1 - {finalFilteredProjects.length} 筆，共 {finalFilteredProjects.length} 筆</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 右側：待處理事項側邊欄 */}
        <div className="flex flex-col gap-8 w-full md:w-72 lg:w-80 shrink-0 md:sticky md:top-8">
          <section>
            <h3 className="text-sm font-black text-slate-800 mb-4 px-1">待處理事項</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><Clock className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-600 group-hover:text-orange-600 transition-colors">待更新 <span className="text-slate-400 font-medium">(超過3工作天)</span></span></div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">{staleProjectsCount} <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-400 transition-colors" /></div>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* 🚀 關鍵修改處：去除了多餘且錯誤的參數傳遞 */}
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