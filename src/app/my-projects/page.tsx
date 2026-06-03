'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Search, Loader2, Folder, Clock, CheckSquare, FlaskConical, Hourglass, SlidersHorizontal, ChevronDown, Plus, ChevronRight, AlertTriangle, LogOut, User as UserIcon } from 'lucide-react';

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🚀 真實登入狀態與使用者資訊
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    async function fetchMyProjectsData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let myEmail = '';
        let myName = ''; 

        // 🚀 1. 寫死的強綁定字典 (Hardcoded Email to Name Map)
        const emailToNameMap: Record<string, string> = {
          'jassie45214@gmail.com': '沈x翼',
          'dksitn@gmail.com': '任x燕'
        };

        if (user) {
          myEmail = user.email || '';
          setCurrentUserId(user.id);
          setCurrentUserEmail(myEmail);
          
          // 優先使用我們寫死的字典，如果不在字典內，再去資料庫撈
          if (emailToNameMap[myEmail]) {
            myName = emailToNameMap[myEmail];
          } else {
            const { data: profile } = await supabase.from('m01_users').select('full_name').eq('email', myEmail).maybeSingle();
            if (profile?.full_name) myName = profile.full_name;
          }
          setCurrentUserName(myName);
        }

        // 🚀 2. 取得所有專案
        const { data, error } = await supabase
          .from('m01_projects')
          .select(`*, m01_project_assessment_images (image_type, is_current)`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 🚀 3. 強力過濾邏輯：只要專案負責人 JSON 裡面有包含我的名字，就撈出來
        const searchName = myName.replace(/\[|\]/g, ''); // 移除可能的括號防呆
        
        const myFilteredProjects = (data || []).filter(p => {
          if (!searchName) return false; // 沒名字直接不顯示
          
          const team = p.team_members || {};
          const allMembers = [...(team.app || []), ...(team.planning || []), ...(team.tech || [])]
                              .map(m => m.replace(/\[|\]/g, ''));
                              
          // 只要有任何一個成員的名字包含 (includes) 我的名字，就符合！
          return allMembers.some(m => m.includes(searchName) || searchName.includes(m));
        });

        setProjects(myFilteredProjects);
      } catch (err) {
        console.error('讀取我的專案資料失敗:', err);
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
    const fields = ['workflow_text', 'as_is_text', 'to_be_text', 'impact_people_text', 'impact_time_text', 'impact_benefit_text', 'image_as_is', 'image_to_be', 'eval_business', 'eval_technical', 'eval_kpi', 'eval_conclusion'];
    fields.forEach(f => { if (confirmed[f]) score++; });
    return Math.round((score / 12) * 100);
  };

  const getRiskStatus = (percent: number) => {
    if (percent > 80) return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: '低' };
    if (percent >= 40) return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: '中' };
    return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', label: '高' };
  };

  const formatDate = (dateString: string, isShort = false) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    if (isShort) return `${mm}/${dd} ${HH}:${min}`;
    return `${date.getFullYear()}/${mm}/${dd} ${HH}:${min}`;
  };

  const getResponsiblesString = (proj: any) => {
    const team = proj.team_members || {};
    const allMembers = [...(team.app || []), ...(team.planning || []), ...(team.tech || [])];
    return allMembers.length > 0 ? allMembers.join(', ') : '未指定';
  };

  const totalMyProjects = projects.length;
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  const staleProjectsCount = projects.filter(p => (Date.now() - new Date(p.updated_at || p.created_at).getTime()) > threeDaysInMs).length;
  const evalCount = projects.filter(p => !p.status_name_snapshot?.toUpperCase().includes('POC')).length;
  const pocCount = projects.filter(p => p.status_name_snapshot?.toUpperCase().includes('POC')).length;
  const pendingCount = projects.filter(p => p.status_name_snapshot?.includes('Pending') || p.status_name_snapshot?.includes('暫停')).length;
  const incompleteProjectsCount = projects.filter(p => calculateCompleteness(p) < 100).length;

  const finalRenderedProjects = projects.filter(p => 
    p.name.includes(searchTerm) || p.project_code.includes(searchTerm) || (p.department && p.department.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* 🚀 統一的頂部導覽列 (TopBar) */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black text-slate-900 tracking-tight">我的負責案件 (個人工作區)</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white text-xs font-bold rounded-lg hover:bg-blue-600 shadow-sm transition-all">
            <Plus className="w-4 h-4" /> 建立專案
          </button>

          {/* 🚀 登入狀態顯示區塊 */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUserId ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-800">{currentUserName || '尚未設定姓名'}</span>
                  <span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black border border-blue-200">
                  {currentUserName ? currentUserName.charAt(0) : <UserIcon className="w-5 h-5" />}
                </div>
                <button onClick={handleSignOut} title="登出" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/auth')} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                未登入 (前往登入)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 pt-8 pb-12 max-w-[1600px] mx-auto w-full flex-1 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          
          {/* 🚀 防呆提示框 */}
          {!isLoading && totalMyProjects === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-800">目前沒有匹配的案件</h3>
                <p className="text-xs text-amber-700 mt-1">
                  系統正在尋找專案成員包含 <strong className="bg-amber-200 px-1 rounded">{currentUserName || '您的帳號'}</strong> 的案件。
                  如果你是剛登入，請前往「專案總覽」進入任一專案，將 <strong>{currentUserName}</strong> 加入負責人中，這裡就會自動顯示該專案！
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden">
              <div><p className="text-[11px] font-bold text-slate-400 mb-1">案件總數</p><p className="text-3xl font-black text-slate-900">{totalMyProjects}</p></div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0"><Folder className="w-5 h-5" /></div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden">
              <div><p className="text-[11px] font-bold text-slate-400 mb-1">三個工作天未更新</p><p className="text-3xl font-black text-[#F97316]">{staleProjectsCount}</p></div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0"><Clock className="w-5 h-5" /></div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden">
              <div><p className="text-[11px] font-bold text-slate-400 mb-1">評估案</p><p className="text-3xl font-black text-slate-900">{evalCount}</p></div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0"><CheckSquare className="w-5 h-5" /></div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden">
              <div><p className="text-[11px] font-bold text-slate-400 mb-1">POC案</p><p className="text-3xl font-black text-slate-900">{pocCount}</p></div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#A855F7] flex items-center justify-center shrink-0"><FlaskConical className="w-5 h-5" /></div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden">
              <div><p className="text-[11px] font-bold text-slate-400 mb-1">Pending中</p><p className="text-3xl font-black text-slate-900">{pendingCount}</p></div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0"><Hourglass className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col flex-1 min-h-[500px]">
            <div className="p-6 border-b border-slate-50">
              <div className="flex items-center gap-3 mb-5"><h2 className="text-lg font-black text-slate-800">專案清單</h2><span className="text-sm font-bold text-slate-400">(共 {finalRenderedProjects.length} 筆)</span></div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 overflow-x-auto pb-1 scrollbar-hide">
                  <button className="flex items-center justify-between gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 w-28 shrink-0">全部狀態 <ChevronDown className="w-4 h-4 text-slate-400" /></button>
                  <button className="flex items-center justify-between gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 w-28 shrink-0">全部優先級 <ChevronDown className="w-4 h-4 text-slate-400" /></button>
                  <div className="relative flex-1 min-w-[200px] max-w-sm ml-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="搜尋專案名稱或編號..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-medium" />
                  </div>
                </div>
                <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all shrink-0"><SlidersHorizontal className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-slate-100 bg-white">
                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">專案編號</th>
                    <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">專案名稱</th>
                    <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">狀態</th>
                    <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">負責人</th>
                    <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-32">資料完整度</th>
                    <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center">風險</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">最後更新</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />載入中...</td></tr>
                  ) : finalRenderedProjects.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm font-bold text-slate-400">目前沒有您負責的專案</td></tr>
                  ) : (
                    finalRenderedProjects.map((proj) => {
                      const completeness = calculateCompleteness(proj);
                      const risk = getRiskStatus(completeness);
                      
                      return (
                        <tr key={proj.id} onDoubleClick={() => router.push(`/project/${proj.id}`)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                          <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-[14px] h-[14px] rounded-full border-[3px] border-[#3B82F6] flex items-center justify-center shrink-0"><div className="w-[4px] h-[4px] rounded-full bg-[#3B82F6]"></div></div><span className="text-xs font-bold text-slate-500">{proj.project_code}</span></div></td>
                          <td className="px-4 py-4"><span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{proj.name}</span></td>
                          <td className="px-4 py-4"><span className="text-xs font-black text-[#3B82F6]">{proj.status_name_snapshot || '未立案'}</span></td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-700 truncate max-w-[150px]">{getResponsiblesString(proj)}</td>
                          <td className="px-4 py-4"><div className="flex items-center gap-2 w-full"><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex-1"><div className="h-full bg-[#3B82F6] rounded-full transition-all duration-1000 ease-out" style={{ width: `${completeness}%` }} /></div><span className="text-[10px] font-black text-slate-600 w-6">{completeness}%</span></div></td>
                          <td className="px-4 py-4 text-center"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${risk.bg} ${risk.text} ${risk.border}`}>{risk.label}</span></td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-400 font-mono tracking-tighter">{formatDate(proj.updated_at || proj.created_at, true)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-slate-50 text-[11px] font-bold text-slate-400 bg-white rounded-b-2xl">顯示第 1 - {finalRenderedProjects.length} 筆，共 {finalRenderedProjects.length} 筆</div>
          </div>
        </div>

        <div className="flex flex-col gap-8 w-full sticky top-8">
          <section>
            <h3 className="text-sm font-black text-slate-800 mb-4 px-1">我的待辦事項</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><Clock className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-600 group-hover:text-orange-600 transition-colors">待更新 <span className="text-slate-400 font-medium">(超時未動)</span></span></div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">{staleProjectsCount} <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-400 transition-colors" /></div>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><Folder className="w-4 h-4" /></div><span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">待補資料 <span className="text-slate-400 font-medium">(未達100%)</span></span></div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">{incompleteProjectsCount} <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" /></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}