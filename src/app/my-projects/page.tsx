'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Search, Loader2, Folder, CheckCircle2, FlaskConical, Hourglass, Plus, LogOut, User as UserIcon, BarChart2, Send, FileSignature } from 'lucide-react';
import CreateProjectModal from '@/components/CreateProjectModal';

const iconMap: Record<string, React.ElementType> = {
  'Send': Send,
  'CheckCircle2': CheckCircle2,
  'FlaskConical': FlaskConical,
  'FileSignature': FileSignature,
  'Hourglass': Hourglass,
  'Folder': Folder,
};

const colorMap: Record<string, { ring: string, text: string, border: string, iconText: string, badgeBg: string, badgeText: string, badgeBorder: string }> = {
  blue: { ring: 'ring-blue-500', text: 'text-blue-600', border: 'hover:border-blue-200', iconText: 'text-blue-500', badgeBg: 'bg-blue-50', badgeText: 'text-blue-600', badgeBorder: 'border-blue-200' },
  emerald: { ring: 'ring-emerald-500', text: 'text-emerald-600', border: 'hover:border-emerald-200', iconText: 'text-emerald-500', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', badgeBorder: 'border-emerald-200' },
  purple: { ring: 'ring-purple-500', text: 'text-purple-600', border: 'hover:border-purple-200', iconText: 'text-purple-500', badgeBg: 'bg-purple-50', badgeText: 'text-purple-600', badgeBorder: 'border-purple-200' },
  indigo: { ring: 'ring-indigo-500', text: 'text-indigo-600', border: 'hover:border-indigo-200', iconText: 'text-indigo-500', badgeBg: 'bg-indigo-50', badgeText: 'text-indigo-600', badgeBorder: 'border-indigo-200' },
  orange: { ring: 'ring-orange-500', text: 'text-orange-600', border: 'hover:border-orange-200', iconText: 'text-orange-500', badgeBg: 'bg-orange-50', badgeText: 'text-orange-600', badgeBorder: 'border-orange-200' },
  slate: { ring: 'ring-slate-500', text: 'text-slate-600', border: 'hover:border-slate-300', iconText: 'text-slate-500', badgeBg: 'bg-slate-50', badgeText: 'text-slate-600', badgeBorder: 'border-slate-200' },
};

// 🚀 同步個別專案頁的 11 個標準欄位，用於精確計算完成度
const VALID_EVAL_FIELDS = [
  'workflow_text', 'pain_points_text', 
  'impact_people_text', 'impact_time_text', 'impact_benefit_text',
  'AS-IS', 'TO-BE',
  'eval_business', 'eval_technical', 'eval_kpi', 'eval_conclusion'
];

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [statusDict, setStatusDict] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
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
        
        const myData = (projRes.data || []).filter(proj => {
          if (!loggedInName) return false;
          const team = proj.team_members || {};
          // 🚀 納入唯讀檢視者權限判斷
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
        console.error('讀取資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const calculateCompleteness = (proj: any) => {
    let score = 0;
    const confirmed = proj.confirmed_fields || {};
    // 🚀 採用與個別專案頁完全一致的欄位計算邏輯
    VALID_EVAL_FIELDS.forEach(f => { if (confirmed[f]) score++; });
    return Math.min(100, Math.round((score / VALID_EVAL_FIELDS.length) * 100));
  };

  const handleRiskChange = async (projectId: string, newRisk: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, risk_level: newRisk } : p));
    await supabase.from('m01_projects').update({ risk_level: newRisk }).eq('id', projectId);
  };

  const getRiskSelector = (proj: any) => {
    const currentRisk = proj.risk_level || '低';
    const bg = currentRisk === '高' ? 'bg-rose-50 text-rose-600 border-rose-200' : currentRisk === '中' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
    return (
      <select value={currentRisk} onChange={(e) => handleRiskChange(proj.id, e.target.value)} onClick={(e) => e.stopPropagation()} className={`text-[10px] font-black border rounded px-1.5 py-0.5 outline-none cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:relative focus:z-10 transition-shadow ${bg}`}>
        <option value="低" className="text-emerald-600">低</option>
        <option value="中" className="text-amber-600">中</option>
        <option value="高" className="text-rose-600">高</option>
      </select>
    );
  };

  const getResponsiblesString = (proj: any) => {
    const team = proj.team_members || {};
    // 🚀 包含唯讀檢視者以便搜尋
    const all = [
      ...(team['應用科']||[]), 
      ...(team['企劃科']||[]), 
      ...(team['科技科']||[]),
      ...(team['唯讀檢視者']||[])
    ];
    return all.length > 0 ? all.join(', ') : '未指定';
  };

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

  return (
    <div className="flex-1 flex flex-col w-full relative font-sans min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex flex-wrap md:flex-nowrap items-center justify-between shadow-sm shrink-0 gap-4">
        <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight ml-12 md:ml-0 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-500" /> 系統專案總覽
        </h1>
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 transition-colors w-full md:w-auto shrink-0">
            <Plus className="w-4 h-4" /> 建立案件
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUserId ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-end hidden md:flex"><span className="text-xs font-black text-slate-800">{currentUserName}</span><span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span></div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black border border-indigo-200 text-sm">{currentUserName ? currentUserName.charAt(0) : <UserIcon className="w-4 h-4" />}</div>
                <button onClick={handleSignOut} title="登出" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-colors"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (<button onClick={() => router.push('/auth')} className="text-xs font-bold text-indigo-600 focus:outline-none focus:underline">前往登入</button>)}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-24 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-6 md:gap-8 items-start">
        <div className="flex-1 flex flex-col gap-6 md:gap-8 w-full min-w-0">
          
          <div className="flex overflow-x-auto gap-2 md:gap-3 cursor-pointer select-none shrink-0 pb-2 custom-scrollbar lg:flex-wrap xl:flex-nowrap">
            <div onClick={() => setActiveFilter('ALL')} tabIndex={0} className={`flex-1 min-w-[100px] bg-white rounded-xl p-3 shadow-sm flex flex-col items-start justify-between transition-all gap-1 border focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${activeFilter === 'ALL' ? 'ring-2 ring-indigo-500 border-transparent shadow-md' : 'border-slate-100 hover:border-indigo-200'}`}>
              <div className="flex justify-between w-full items-start">
                <p className="text-[10px] md:text-xs font-bold text-slate-500 line-clamp-2 leading-tight">全部專案</p>
                <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0 ml-1" />
              </div>
              <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">{projects.length}</p>
            </div>
            
            {statusDict.map((status) => {
              const count = projects.filter(p => p.status_name_snapshot === status.name).length;
              const color = colorMap[status.color_key] || colorMap['slate'];
              const IconComponent = iconMap[status.icon] || Folder;
              const isActive = activeFilter === status.name;
              const displayName = status.name.replace('科技科/企劃科', '科技/企劃');
              return (
                <div key={status.id} onClick={() => setActiveFilter(status.name)} tabIndex={0} className={`flex-1 min-w-[100px] bg-white rounded-xl p-3 shadow-sm flex flex-col items-start justify-between transition-all gap-1 border focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${isActive ? `ring-2 ${color.ring} border-transparent shadow-md` : `border-slate-100 hover:border-indigo-200 ${color.border}`}`}>
                  <div className="flex justify-between w-full items-start">
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 line-clamp-2 leading-tight">{displayName}</p>
                    <IconComponent className={`w-3.5 h-3.5 ${color.iconText} shrink-0 ml-1`} />
                  </div>
                  <p className={`text-xl md:text-2xl font-black mt-1 ${color.text}`}>{count}</p>
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
                <input type="text" placeholder="搜尋專案名稱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 md:py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
              </div>
            </div>

            <div className="flex-1 bg-slate-50/30 rounded-b-2xl">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" /><span className="text-sm font-bold">資料載入中...</span></div>
              ) : finalFilteredProjects.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400"><Folder className="w-12 h-12 mb-3 text-slate-200" /><span className="text-sm font-bold">沒有符合條件的專案</span></div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar p-[2px]">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                    <thead className="bg-slate-50/80 sticky top-0 z-10">
                      <tr className="border-b-2 border-slate-100">
                        <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase">專案編號</th>
                        <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">專案名稱</th>
                        <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">提案單位</th>
                        <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">目前狀態</th>
                        <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">負責人</th>
                        <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase w-32">完整度</th>
                        <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase text-center">風險</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {finalFilteredProjects.map((proj) => {
                        const comp = calculateCompleteness(proj);
                        const responsibles = getResponsiblesString(proj);
                        const dictObj = statusDict.find(s => s.name === proj.status_name_snapshot);
                        const badgeColor = dictObj ? colorMap[dictObj.color_key] : colorMap['slate'];
                        return (
                          <tr key={proj.id} tabIndex={0} onClick={() => router.push(`/project/${proj.id}`)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors focus:outline-none focus:bg-indigo-50/50 focus:ring-2 focus:ring-indigo-400 focus:relative focus:z-10 group">
                            <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border group-focus:bg-white transition-colors">{proj.project_code}</span></td>
                            <td className="px-4 py-4 text-sm font-black text-slate-700 truncate max-w-[250px]">{proj.name}</td>
                            <td className="px-4 py-4"><span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md group-focus:bg-white transition-colors">{proj.department || '-'}</span></td>
                            <td className="px-4 py-4"><span className={`text-[10px] font-black px-2 py-1 rounded-md border ${badgeColor?.badgeBg} ${badgeColor?.badgeText} ${badgeColor?.badgeBorder}`}>{proj.status_name_snapshot}</span></td>
                            <td className="px-4 py-4"><div className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]">{responsibles}</div></td>
                            <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${comp}%` }}></div></div></div></td>
                            <td className="px-4 py-4 text-center">{getRiskSelector(proj)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isCreateModalOpen && <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} onSuccess={(projectId) => { setIsCreateModalOpen(false); router.push(`/project/${projectId}`); }} />}
    </div>
  );
}