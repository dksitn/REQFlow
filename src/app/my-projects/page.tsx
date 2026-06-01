'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';

// 🚀 這裡！已經把路徑加上 components/ 了，精準對齊我們剛重置的架構
import ProjectTable from '@/modules/M01_ConsolidatedProjects/components/ProjectTable';
import CreateProjectModal from '@/components/CreateProjectModal';
import { Loader2, Plus, Folder, Clock, CheckSquare, Beaker, Hourglass, ChevronRight, AlertCircle } from 'lucide-react';

export default function MyWorkspacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, overdue: 0, evaluating: 0, poc: 0, pending: 0 });

  useEffect(() => {
    async function checkUserAndFetchStats() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('m01_users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const fullName = profile?.full_name || user.email || '未知使用者';
        setCurrentUser(fullName);
        setCurrentUserId(user.id);

        // 撈取統計數據
        const { data: projects } = await supabase.from('m01_projects').select('status_name_snapshot, m01_project_responsibles(user_id)');
        
        // 篩選出含有登入者 UUID 的專案
        const myProjects = (projects || []).filter((p: any) => 
          p.m01_project_responsibles?.some((r: any) => r.user_id === user.id)
        );

        setStats({
          total: myProjects.length,
          overdue: myProjects.filter((p: any) => p.status_name_snapshot === '需求單位討論').length, // 模擬未更新數
          evaluating: myProjects.filter((p: any) => p.status_name_snapshot === '評估中' || p.status_name_snapshot === '需求單位送單' || p.status_name_snapshot === '應用科評估完成').length,
          poc: myProjects.filter((p: any) => p.status_name_snapshot === 'POC案執行中' || p.status_name_snapshot === '專案處理').length,
          pending: myProjects.filter((p: any) => p.status_name_snapshot === 'Pending中').length,
        });

      } catch (error) {
        console.error(error);
        router.push('/login');
      } finally {
        setIsAuthChecking(false);
      }
    }
    checkUserAndFetchStats();
  }, [router]);

  if (isAuthChecking) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-slate-50/50 w-full min-h-screen">
      {/* 左側主工作區：佔 3/4 寬度 */}
      <main className="flex-1 p-8 overflow-y-auto min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">我的負責案件</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            New REQ
          </button>
        </div>

        {/* 頂部 5 張高標誌規格統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">我的負責案件</div>
              <div className="text-3xl font-black text-slate-800 mt-1">{stats.total}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Folder className="w-5 h-5" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">三個工作天未更新</div>
              <div className="text-3xl font-black text-orange-600 mt-1">{stats.overdue}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">評估案</div>
              <div className="text-3xl font-black text-slate-800 mt-1">{stats.evaluating}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckSquare className="w-5 h-5" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">POC案</div>
              <div className="text-3xl font-black text-slate-800 mt-1">{stats.poc}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Beaker className="w-5 h-5" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400">Pending中</div>
              <div className="text-3xl font-black text-slate-800 mt-1">{stats.pending}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Hourglass className="w-5 h-5" /></div>
          </div>
        </div>

        {/* 核心高保真數據表格 */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <ProjectTable targetUserId={currentUserId} />
        </div>
      </main>

      {/* 右側資訊面板欄：佔 1/4 寬度 */}
      <aside className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto hidden xl:flex">
        {/* 待處理事項 */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4">待處理事項</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100/70 transition-all cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <Clock className="w-4 h-4 text-orange-500" /> 待更新 (超過3工作天)
              </div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">2 <ChevronRight className="w-3 h-3 text-slate-400" /></span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100/70 transition-all cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <Folder className="w-4 h-4 text-blue-500" /> 待補資料
              </div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">3 <ChevronRight className="w-3 h-3 text-slate-400" /></span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100/70 transition-all cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <AlertCircle className="w-4 h-4 text-purple-500" /> 待確認狀態
              </div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">2 <ChevronRight className="w-3 h-3 text-slate-400" /></span>
            </div>
          </div>
        </div>

        {/* 最近更新紀錄時間軸 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">最近更新紀錄</h3>
            <span className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">查看全部</span>
          </div>
          <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-5">
            <div className="relative">
              <span className="absolute -left-[21px] top-1 bg-emerald-500 w-2 h-2 rounded-full ring-4 ring-white"></span>
              <div className="text-[11px] text-slate-400 font-bold flex justify-between"><span>REQ-2025-001</span> <span>05/24 10:35</span></div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">任文燕</div>
              <div className="text-xs text-slate-500 bg-slate-50 p-1.5 rounded mt-1">狀態更新為「(2)需求單位送單」</div>
            </div>
            <div className="relative">
              <span className="absolute -left-[21px] top-1 bg-blue-500 w-2 h-2 rounded-full ring-4 ring-white"></span>
              <div className="text-[11px] text-slate-400 font-bold flex justify-between"><span>REQ-2025-005</span> <span>05/23 16:20</span></div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">李明穎</div>
              <div className="text-xs text-slate-500 bg-slate-50 p-1.5 rounded mt-1">完成應用科評估</div>
            </div>
          </div>
        </div>
      </aside>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => window.location.reload()} 
        managerId={currentUserId}
        managerName={currentUser}
      />
    </div>
  );
}