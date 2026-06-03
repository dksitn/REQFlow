'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Search, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProjectTable() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        // 🚀 1. 改為直接讀取 m01_projects 全欄位 (包含 team_members)
        const { data, error } = await supabase
          .from('m01_projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 🚀 2. 解析 JSON 負責人結構
        const formattedData = (data || []).map((p) => {
          const team = p.team_members || {};
          const allMembers = [
            ...(team['應用科'] || []), 
            ...(team['企劃科'] || []), 
            ...(team['科技科'] || []),
            ...(team['app'] || []),
            ...(team['planning'] || []),
            ...(team['tech'] || [])
          ];
          const ownerName = allMembers.length > 0 ? allMembers.join(', ') : '未指定';
          
          return { ...p, owner_name: ownerName };
        });

        setProjects(formattedData);
      } catch (error: any) {
        console.error('讀取專案列表錯誤:', error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const getStatusBadge = (status: string) => {
    if (!status) return <span className="text-xs font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md">未立案</span>;
    if (status.includes('討論') || status.includes('送單')) return <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{status}</span>;
    if (status.includes('POC')) return <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">{status}</span>;
    if (status.includes('完成')) return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">{status}</span>;
    return <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">{status}</span>;
  };

  const getPriorityBadge = (p: string) => {
    if (p === 'P0') return <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">P0</span>;
    if (p === 'P1') return <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">P1</span>;
    return <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">{p || 'P2'}</span>;
  };

  const getRiskBadge = (level: string) => {
    if (level === 'High') return <span className="text-xs font-black text-rose-600">高風險</span>;
    if (level === 'Medium') return <span className="text-xs font-bold text-amber-500">中風險</span>;
    return <span className="text-xs font-bold text-emerald-500">低風險</span>;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black text-slate-800">所有專案清單</h2>
          <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">共 {projects.length} 筆</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="搜尋專案..." className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 shadow-sm" />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5" /> 篩選
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b-2 border-slate-100">
              <th className="px-5 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">專案編號</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">專案名稱</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">類型</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">優先級</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">目前狀態</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">負責人</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">資料完整度</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">評估風險</th>
              <th className="px-4 py-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">最後更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />載入中...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm font-bold text-slate-400">尚無專案資料</td></tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} onClick={() => router.push(`/project/${project.id}`)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                  <td className="px-5 py-4"><span className="text-xs font-bold text-slate-500 font-mono">{project.project_code || project.id}</span></td>
                  <td className="px-4 py-4"><span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{project.name || project.project_name || '未命名專案'}</span></td>
                  <td className="px-4 py-4 text-slate-600 text-xs font-bold">{project.department || project.unit_name_snapshot || '未分類'}</td>
                  <td className="px-4 py-4">{getPriorityBadge(project.priority)}</td>
                  <td className="px-4 py-4">{getStatusBadge(project.status_name_snapshot)}</td>
                  <td className="px-4 py-4 text-slate-700 text-xs font-bold truncate max-w-[150px]">{project.owner_name}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 w-24">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${project.completion_rate || 20}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-600 w-8">{project.completion_rate || 20}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getRiskBadge(project.risk_level)}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-400 font-mono tracking-tight">{formatTime(project.updated_at || project.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
        <span className="text-xs font-bold text-slate-500">顯示第 1 到 {projects.length} 筆</span>
        <div className="flex items-center gap-1">
          <button className="p-1 text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1 text-slate-400 hover:text-slate-600"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}