'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Check, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/core/client/supabase';

interface ProjectData {
  id: string;
  unit: string;
  name: string;
  type: string;
  priority: string;
  status: string;
  owners: string[];
  completeness: number;
  risk: string;
  lastUpdated: string;
}

// 🛡️ 新增 targetUser 屬性，當有傳入此值時，只撈取該人員的案件
export default function ProjectTable({ refreshKey = 0, targetUser }: { refreshKey?: number, targetUser?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setIsLoading(true);
      try {
        // 1. 建立基礎查詢器
        let query = supabase.from('m01_projects').select('*').order('created_at', { ascending: false });

        // 2. 如果外部有傳入 targetUser，就加上 .eq() 過濾條件！
        if (targetUser) {
          query = query.eq('created_by', targetUser);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const liveData = data.map(row => ({
            id: row.project_code,
            unit: row.unit_name_snapshot || '未指定單位',
            name: row.project_name,
            type: row.case_type,
            priority: row.priority,
            status: row.status_name_snapshot || '未指定狀態',
            owners: ['沈廷翼（應用科）'], 
            completeness: row.data_completeness_score || 0,
            risk: row.risk_level || '低',
            lastUpdated: new Date(row.updated_at).toLocaleString('zh-TW', {
              month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            }).replace(/\//g, '-')
          }));
          setProjects(liveData);
        }
      } catch (error) {
        console.error('資料庫連線失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [refreshKey, targetUser]); // 👈 監聽 targetUser 變化

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.unit.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = selectedType === 'ALL' || p.type === selectedType;
      return matchSearch && matchType;
    });
  }, [searchQuery, selectedType, projects]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm shadow-slate-100/40 overflow-hidden flex flex-col select-none relative min-h-[300px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white gap-4 relative z-20">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜尋專案編號、名稱或單位..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all text-slate-800 font-medium"
          />
        </div>

        <div className="relative">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm">
            <span>案型過濾: {selectedType === 'ALL' ? '全部' : selectedType}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {isFilterOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-40">
                {['ALL', '評估案', 'POC案', 'Pending'].map((t) => (
                  <button key={t} onClick={() => { setSelectedType(t); setIsFilterOpen(false); }} className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded text-slate-700 hover:bg-slate-50">
                    <span>{t === 'ALL' ? '全部案型' : t}</span>
                    {selectedType === t && <Check className="w-3 h-3 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 flex-col gap-2 pt-16">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs font-bold text-indigo-800 tracking-wider animate-pulse">正在自 Supabase 讀取即時專案數據...</span>
        </div>
      )}

      <div className="overflow-x-auto relative z-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-3.5">專案編號</th>
              <th className="px-6 py-3.5">單位</th>
              <th className="px-6 py-3.5">專案名稱</th>
              <th className="px-6 py-3.5">案件類型</th>
              <th className="px-6 py-3.5">優先級</th>
              <th className="px-6 py-3.5">狀態</th>
              <th className="px-6 py-3.5">專案負責人</th>
              <th className="px-6 py-3.5">資料完整度</th>
              <th className="px-6 py-3.5">風險</th>
              <th className="px-6 py-3.5">最後更新</th>
              <th className="px-6 py-3.5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold text-slate-600">
            {filteredProjects.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-medium">
                  目前尚無專案資料，請點擊右上角建立新專案。
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/20 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{project.id}</td>
                  <td className="px-6 py-4 text-slate-500">{project.unit}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 max-w-xs truncate">{project.name}</td>
                  <td className="px-6 py-4"><span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60 text-[10px] font-bold">{project.type}</span></td>
                  <td className="px-6 py-4"><span className={`text-[10px] font-extrabold ${project.priority === 'P0' ? 'text-rose-600' : 'text-amber-600'}`}>{project.priority}</span></td>
                  <td className="px-6 py-4"><span className="bg-indigo-50/60 text-indigo-600 border border-indigo-100/70 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{project.status}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {project.owners.map((owner, i) => (
                        <span key={i} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm text-slate-600 font-medium">{owner}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/20">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${project.completeness}%` }}></div>
                      </div>
                      <span className="font-mono text-slate-700 font-bold text-[11px]">{project.completeness}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-0.5 font-bold ${project.risk === '高' ? 'text-rose-600' : project.risk === '中' ? 'text-amber-600' : 'text-slate-400'}`}>{project.risk === '高' && <AlertCircle className="w-3 h-3 text-rose-500" />} {project.risk}</span></td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">{project.lastUpdated}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/project/${project.id}`} className="inline-flex items-center gap-0.5 px-2.5 py-1 font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:text-indigo-600 hover:bg-indigo-50/40 shadow-sm transition-all group/btn">
                      <span>進入評估</span> <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-indigo-600 transition-transform" />
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