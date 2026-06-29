'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Search, Loader2, Folder, CheckCircle2, FlaskConical, Hourglass, Plus, LogOut, User as UserIcon, Send, FileSignature } from 'lucide-react';
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

export default function MyProjectsPage() {
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

  const handleRiskChange = async (projectId: string, newRisk: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, risk_level: newRisk } : p));
    await supabase.from('m01_projects').update({ risk_level: newRisk }).eq('id', projectId);
  };

  const getRiskSelector = (proj: any) => {
    const currentRisk = proj.risk_level || '低';
    const bg = currentRisk === '高' ? 'bg-rose-50 text-rose-600 border-rose-200' : currentRisk === '中' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
    return (
      // 🚀 修復下拉選單藍框：加入 focus:ring-2 focus:ring-blue-400 focus:relative focus:z-10
      <select value={currentRisk} onChange={(e) => handleRiskChange(proj.id, e.target.value)} onClick={(e) => e.stopPropagation()} className={`text-[10px] font-black border rounded px-1.5 py-0.5 outline-none cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:relative focus:z-10 transition-shadow ${bg}`}>
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
      
      {/* 頂部導覽列 */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Folder className="w-5 h-5 text-blue-500" /> 我的負責案件
        </h1>
        <div className="flex items-center gap-6">
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> 建立案件
          </button>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            {currentUserId ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                   <span className="text-sm font-bold text-slate-800">{currentUserName}</span>
                   <span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black border border-blue-200 text-sm">
                   {currentUserName ? currentUserName.charAt(0) : <UserIcon className="w-4 h-4" />}
                </div>
                <button onClick={handleSignOut} title="登出" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (<button onClick={() => router.push('/auth')} className="text-sm font-bold text-blue-600">前往登入</button>)}
          </div>
        </div>
      </div>

      <div className="px-6 pt-8 pb-24 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-8">
        
        {/* 狀態過濾卡片 */}
        <div className="flex gap-4 cursor-pointer select-none shrink-0 overflow-x-auto pb-2">
          {/* 🚀 卡片加入 tabIndex 與藍色點擊光暈 focus:ring-2 */}
          <div onClick={() => setActiveFilter('ALL')} tabIndex={0} className={`flex-1 min-w-[120px] bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all gap-2 border focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${activeFilter === 'ALL' ? 'ring-1 ring-blue-500 border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'}`}>
            <div className="flex justify-between items-center w-full">
              <p className="text-xs font-bold text-slate-500">我的專案</p>
              <Folder className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">{projects.length}</p>
          </div>
          
          {statusDict.map((status) => {
            const count = projects.filter(p => p.status_name_snapshot === status.name).length;
            const color = colorMap[status.color_key] || colorMap['slate'];
            const IconComponent = iconMap[status.icon] || Folder;
            const isActive = activeFilter === status.name;
            const displayName = status.name.replace('科技科/企劃科', '科技/企劃');
            return (
              // 🚀 卡片加入 tabIndex 與藍色點擊光暈 focus:ring-2
              <div key={status.id} onClick={() => setActiveFilter(status.name)} tabIndex={0} className={`flex-1 min-w-[120px] bg-white rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all gap-2 border focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${isActive ? `ring-1 ${color.ring} ${color.border} ${color.badgeBg}` : `border-slate-200 hover:border-slate-300`}`}>
                <div className="flex justify-between items-center w-full">
                  <p className="text-xs font-bold text-slate-500 truncate">{displayName}</p>
                  <IconComponent className={`w-4 h-4 ${color.iconText}`} />
                </div>
                <p className={`text-2xl font-black ${color.text}`}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* 列表與搜尋區域 */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-h-[500px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-800">
                {activeFilter === 'ALL' ? '全部專案清單' : activeFilter}
              </h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">共 {finalFilteredProjects.length} 筆</span>
            </div>
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {/* 🚀 搜尋框加入正確的藍色光暈 */}
              <input type="text" placeholder="搜尋專案名稱、編號或負責人..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white transition-colors" />
            </div>
          </div>

          {/* 🚀 移除 overflow-hidden，防止下拉選單的藍色 Focus Ring 邊界被切斷 */}
          <div className="flex-1 bg-white rounded-b-xl relative">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                <span className="text-sm font-bold">資料載入中...</span>
              </div>
            ) : finalFilteredProjects.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Folder className="w-12 h-12 mb-3 text-slate-200" />
                <span className="text-sm font-bold">目前沒有符合條件的專案</span>
              </div>
            ) : (
              <>
                {/* 🚀 加入 p-[2px] 讓藍色外框有渲染的空間不被捲軸切齊 */}
                <div className="overflow-x-auto p-[2px]">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">專案編號</th>
                        <th className="px-4 py-4 text-xs font-bold text-slate-500">專案名稱</th>
                        <th className="px-4 py-4 text-xs font-bold text-slate-500">提案單位</th>
                        <th className="px-4 py-4 text-xs font-bold text-slate-500">目前狀態</th>
                        <th className="px-4 py-4 text-xs font-bold text-slate-500">負責人</th>
                        <th className="px-4 py-4 text-xs font-bold text-slate-500 w-32">資料完整度</th>
                        <th className="px-4 py-4 text-xs font-bold text-slate-500 text-center">風險等級</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finalFilteredProjects.map((proj) => {
                        const comp = calculateCompleteness(proj);
                        const responsibles = getResponsiblesString(proj);
                        const dictObj = statusDict.find(s => s.name === proj.status_name_snapshot);
                        const badgeColor = dictObj ? colorMap[dictObj.color_key] : colorMap['slate'];
                        return (
                          // 🚀 Table Row 加上 tabIndex 與 focus:ring-2 以達到點選發藍光的效果，並提升層級 z-10 防止被下方元素遮擋
                          <tr key={proj.id} tabIndex={0} onClick={() => router.push(`/project/${proj.id}`)} className="hover:bg-blue-50/50 cursor-pointer transition-colors group focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:relative focus:z-10">
                            <td className="px-6 py-4"><span className="text-[11px] font-bold text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200 group-hover:bg-white">{proj.project_code}</span></td>
                            <td className="px-4 py-4"><div className="text-sm font-bold text-slate-800 truncate max-w-[280px]">{proj.name}</div></td>
                            <td className="px-4 py-4"><span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md">{proj.department || '-'}</span></td>
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
              </>
            )}
          </div>
        </div>
      </div>
      
      {isCreateModalOpen && (
        <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} onSuccess={(projectId) => { setIsCreateModalOpen(false); router.push(`/project/${projectId}`); }} />
      )}
    </div>
  );
}