'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Search, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation'; // 🚀 1. 引入 Router

export default function ProjectTable() {
  const router = useRouter(); // 🚀 2. 宣告 Router
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('m01_projects')
          .select(`*, m01_project_responsibles(responsible_name_snapshot)`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData = (data || []).map((p) => {
          const ownerName = p.m01_project_responsibles?.[0]?.responsible_name_snapshot || '未指定';
          return { ...p, owner_name: ownerName };
        });

        setProjects(formattedData);
        if (formattedData.length > 0) setSelectedId(formattedData[0].id);
      } catch (error: any) {
        console.error('讀取專案失敗:', error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P1': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100">P1</span>;
      case 'P2': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-100">P2</span>;
      case 'P3': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100">P3</span>;
      default: return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-100">{priority || 'P2'}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '需求單位討論': return <span className="text-blue-600 font-bold text-xs">(1)需求單位討論</span>;
      case '需求單位送單': return <span className="text-blue-700 font-bold text-xs">(2)需求單位送單</span>;
      case '應用科評估完成': return <span className="text-emerald-600 font-bold text-xs">(3)應用科評估完成</span>;
      case '智金處評估完成': return <span className="text-purple-600 font-bold text-xs">(4)智金處評估完成</span>;
      case 'POC案執行中': return <span className="text-orange-600 font-bold text-xs">(5)POC案執行中</span>;
      case '專案處理': return <span className="text-cyan-600 font-bold text-xs">(6)專案處理</span>;
      default: return <span className="text-slate-600 font-bold text-xs">{status}</span>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case '低': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">低</span>;
      case '中': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">中</span>;
      case '高': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">高</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">{risk || '低'}</span>;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-100 shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">載入專案資料中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col w-full rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-slate-800">全部專案 <span className="text-slate-400 font-medium ml-1">（共 {projects.length} 筆）</span></h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select className="text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"><option>全部狀態</option></select>
          <select className="text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"><option>全部優先級</option></select>
          <select className="text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"><option>全部單位</option></select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="搜尋專案名稱或編號..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 font-medium" />
          </div>
          <button className="ml-auto p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"><SlidersHorizontal className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="px-4 py-3 text-xs font-bold text-slate-400 w-10 text-center"></th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">專案編號</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">單位</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">專案名稱</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">案件類型</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">優先級</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">狀態</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">專案負責人</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">資料完整度</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">風險</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-400">最後更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {projects.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-16 text-center font-bold text-slate-400 bg-slate-50/50">目前還沒有任何專案資料。</td></tr>
            ) : (
              projects.map((project) => (
                <tr 
                  key={project.id} 
                  onClick={() => setSelectedId(project.id)}
                  onDoubleClick={() => router.push(`/project/${project.id}`)} // 🚀 3. 綁定雙擊事件跳轉
                  title="雙擊進入專案評估表"
                  className={`cursor-pointer transition-colors ${selectedId === project.id ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}
                >
                  <td className="px-4 py-4 text-center">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mx-auto ${selectedId === project.id ? 'border-blue-600' : 'border-slate-300'}`}>
                      {selectedId === project.id && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 font-bold">{project.project_code}</td>
                  <td className="px-4 py-4 text-slate-600">{project.department}</td>
                  <td className="px-4 py-4 font-bold text-slate-800">{project.name}</td>
                  <td className="px-4 py-4 text-slate-600">{project.project_type || '評估案'}</td>
                  <td className="px-4 py-4">{getPriorityBadge(project.priority)}</td>
                  <td className="px-4 py-4">{getStatusBadge(project.status_name_snapshot)}</td>
                  <td className="px-4 py-4 text-slate-600 font-bold">{project.owner_name}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 w-28">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${project.completion_rate || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 w-8">{project.completion_rate || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getRiskBadge(project.risk_level)}</td>
                  <td className="px-4 py-4 text-slate-400 font-mono tracking-tight">{formatTime(project.updated_at || project.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs font-medium text-slate-500">
        <div>顯示第 1 - {Math.min(10, projects.length)} 筆，共 {projects.length} 筆</div>
      </div>
    </div>
  );
}