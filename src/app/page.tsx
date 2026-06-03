'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Search, Loader2, Folder, Clock, CheckSquare, FlaskConical, Hourglass, SlidersHorizontal, ChevronDown, Plus, LogOut, User as UserIcon } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserEmail(user.email || '');
          const { data: profile } = await supabase.from('m01_users').select('full_name').eq('email', user.email).maybeSingle();
          setCurrentUserName(profile?.full_name || '已登入使用者');
        }

        const { data, error } = await supabase.from('m01_projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('讀取首頁資料失敗:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  // 🚀 資料完整度計算 (基準：11格)
  const calculateCompleteness = (proj: any) => {
    let score = 0;
    const confirmed = proj.confirmed_fields || {};
    const fields = ['workflow_text', 'as_is_text', 'impact_people_text', 'impact_time_text', 'impact_benefit_text', 'image_as_is', 'image_to_be', 'eval_business', 'eval_technical', 'eval_kpi', 'eval_conclusion'];
    fields.forEach(f => { if (confirmed[f]) score++; });
    return Math.round((score / 11) * 100);
  };

  // 🚀 風險直接切換寫入 DB
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
        className={`text-[10px] font-black border rounded px-1.5 py-0.5 outline-none cursor-pointer hover:shadow-sm transition-all ${bg}`}
      >
        <option value="低" className="text-emerald-600 font-bold">低</option>
        <option value="中" className="text-amber-600 font-bold">中</option>
        <option value="高" className="text-rose-600 font-bold">高</option>
      </select>
    );
  };

  const formatDate = (dateString: string, isShort = false) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return isShort ? `${mm}/${dd} ${HH}:${min}` : `${d.getFullYear()}/${mm}/${dd} ${HH}:${min}`;
  };

  const getResponsiblesString = (proj: any) => {
    const team = proj.team_members || {};
    const all = [...(team['應用科']||[]), ...(team['企劃科']||[]), ...(team['科技科']||[])];
    return all.length > 0 ? all.join(', ') : '未指定';
  };

  // 🚀 嚴格分類計算邏輯
  const evalStatuses = ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成'];
  const pocStatuses = ['POC案執行中'];
  const pendingStatuses = ['暫緩案'];

  const evalCount = projects.filter(p => evalStatuses.includes(p.status_name_snapshot)).length;
  const pocCount = projects.filter(p => pocStatuses.includes(p.status_name_snapshot)).length;
  const pendingCount = projects.filter(p => pendingStatuses.includes(p.status_name_snapshot)).length;
  const totalCount = evalCount + pocCount + pendingCount; // 嚴格相加

  const filteredProjects = projects.filter(p => {
    const s = searchTerm.toLowerCase();
    return (p.name?.toLowerCase().includes(s) || p.project_code?.toLowerCase().includes(s) || p.department?.toLowerCase().includes(s) || getResponsiblesString(p).toLowerCase().includes(s));
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-black text-slate-900 tracking-tight">智金處專案總覽</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-600"><Plus className="w-4 h-4" /> New REQ</button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUserId ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end"><span className="text-xs font-black text-slate-800">{currentUserName}</span><span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span></div>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black border border-blue-200">{currentUserName.charAt(0)}</div>
                <button onClick={handleSignOut} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : <button onClick={() => router.push('/auth')} className="text-xs font-bold text-blue-600">前往登入</button>}
          </div>
        </div>
      </div>

      <div className="px-8 pt-8 pb-12 max-w-[1600px] mx-auto w-full flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between">
            <div><p className="text-[11px] font-bold text-slate-400 mb-1">專案總數</p><p className="text-3xl font-black text-slate-900">{totalCount}</p></div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center"><Folder className="w-5 h-5" /></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between">
            <div><p className="text-[11px] font-bold text-slate-400 mb-1">評估案</p><p className="text-3xl font-black text-[#10B981]">{evalCount}</p></div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center"><CheckSquare className="w-5 h-5" /></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between">
            <div><p className="text-[11px] font-bold text-slate-400 mb-1">POC案</p><p className="text-3xl font-black text-[#A855F7]">{pocCount}</p></div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#A855F7] flex items-center justify-center"><FlaskConical className="w-5 h-5" /></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start justify-between">
            <div><p className="text-[11px] font-bold text-slate-400 mb-1">暫緩案</p><p className="text-3xl font-black text-[#F59E0B]">{pendingCount}</p></div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center"><Hourglass className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3"><h2 className="text-lg font-black text-slate-800">全部專案</h2><span className="text-sm font-bold text-slate-400">(共 {filteredProjects.length} 筆)</span></div>
            <div className="relative w-64"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="搜尋專案..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500" /></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-white">
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase">編號</th>
                  <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">單位</th>
                  <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">專案名稱</th>
                  <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">狀態</th>
                  <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase">負責人</th>
                  <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase w-32">完整度</th>
                  <th className="px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase text-center">風險(可點擊)</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase">最後更新</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></td></tr> : 
                  filteredProjects.map((proj) => {
                    const comp = calculateCompleteness(proj);
                    return (
                      <tr key={proj.id} onDoubleClick={() => router.push(`/project/${proj.id}`)} className="hover:bg-blue-50/50 cursor-pointer">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{proj.project_code}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-700">{proj.department || '-'}</td>
                        <td className="px-4 py-4 text-sm font-black text-slate-800">{proj.name || proj.project_name}</td>
                        <td className="px-4 py-4 text-xs font-black text-[#3B82F6]">{proj.status_name_snapshot || '未立案'}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-700 truncate max-w-[150px]">{getResponsiblesString(proj)}</td>
                        <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex-1"><div className="h-full bg-[#3B82F6] rounded-full" style={{ width: `${comp}%` }} /></div><span className="text-[10px] font-black text-slate-600">{comp}%</span></div></td>
                        <td className="px-4 py-4 text-center">{getRiskSelector(proj)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400 font-mono">{formatDate(proj.updated_at || proj.created_at, true)}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}