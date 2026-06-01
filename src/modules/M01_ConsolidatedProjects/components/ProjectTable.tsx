'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Search, ArrowRight, Activity, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProjectTableProps {
  targetUser?: string; // 如果有傳入，代表只要顯示該使用者的專案 (個人戰情室用)
}

export default function ProjectTable({ targetUser }: ProjectTableProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        // 🚀 核心查詢：撈取所有專案，並「關聯 (JOIN)」m01_users 表格抓出負責人真實姓名
        const { data, error } = await supabase
          .from('m01_projects')
          .select(`
            *,
            m01_users ( full_name )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 整理資料格式，把關聯撈出來的名字扁平化
        let formattedData = (data || []).map((p) => ({
          ...p,
          manager_name: p.m01_users?.full_name || '未知負責人',
        }));

        // 🛡️ 如果有傳入 targetUser (例如在「我的負責案件」頁面)，就在前端進行過濾
        if (targetUser) {
          formattedData = formattedData.filter((p) => p.manager_name === targetUser);
        }

        setProjects(formattedData);
      } catch (error) {
        console.error('讀取真實專案失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [targetUser]);

  // 狀態對應的視覺標籤設計
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '進行中':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><Activity className="w-3 h-3" /> {status}</span>;
      case '已結案':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
      case '評估中':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> {status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">正在載入真實專案資料...</p>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col w-full h-full">
      {/* 表格工具列 */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋專案代號或名稱..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          共找到 <span className="text-indigo-600">{projects.length}</span> 筆專案
        </div>
      </div>

      {/* 表格本體 */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">專案代號</th>
              <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">專案名稱</th>
              <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">負責單位/人員</th>
              <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">當前狀態</th>
              <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">預算 (NTD)</th>
              <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                  目前還沒有任何專案喔！趕快點擊右上角建立一筆吧！
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                      {project.project_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{project.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">{project.department}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{project.manager_name}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600">
                    ${Number(project.budget).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/project/${project.project_code}`}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"
                    >
                      進入評估 <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}