'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';

// 🚀 標準、正確、絕不出錯的匯入路徑！
import ProjectTable from '@/modules/M01_ConsolidatedProjects/components/ProjectTable';
import CreateProjectModal from '@/components/CreateProjectModal';
import { Loader2, Plus, FileText, Beaker, Clock, Layers } from 'lucide-react';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ evaluating: 0, poc: 0, pending: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          const { data: profile } = await supabase.from('m01_users').select('full_name').eq('id', user.id).single();
          setCurrentUser(profile?.full_name || user.email);
        }

        const { data: projects, error } = await supabase.from('m01_projects').select('status_name_snapshot, project_type');
        if (error) throw error;

        const safeProjects = projects || [];
        
        const evaluating = safeProjects.filter(p => 
          ['需求單位討論', '需求單位送單', '應用科評估完成', '智金處評估完成'].includes(p.status_name_snapshot)
        ).length;
        
        const poc = safeProjects.filter(p => 
          ['POC案執行中', '專案處理'].includes(p.status_name_snapshot)
        ).length;
        
        const pending = safeProjects.filter(p => p.status_name_snapshot === 'Pending中').length;

        setStats({ evaluating, poc, pending, total: safeProjects.length });
      } catch (error) {
        console.error('讀取總覽資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-slate-50/50 w-full min-h-screen">
      <main className="flex-1 p-8 overflow-y-auto min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">彙整全部專案</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              歡迎回來，<span className="font-bold text-blue-600">{currentUser || 'Admin'}</span>。智金處目前所有評估與 POC 案件進度總覽。
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            建立新專案
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-500">評估案</span>
              </div>
              <div className="text-3xl font-black text-blue-600">{stats.evaluating}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Beaker className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-500">POC案</span>
              </div>
              <div className="text-3xl font-black text-emerald-600">{stats.poc}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-500">Pending中</span>
              </div>
              <div className="text-3xl font-black text-orange-600">{stats.pending}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-slate-500">全部專案</span>
              </div>
              <div className="text-3xl font-black text-purple-600">{stats.total}</div>
            </div>
          </div>
        </div>

        {/* 核心表格 */}
        <ProjectTable />
      </main>

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