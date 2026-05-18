'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUpRight, AlertCircle, Check, ChevronDown } from 'lucide-react';

interface ProjectData {
  id: string;
  unit: string;
  name: string;
  type: '評估案' | 'POC案' | 'Pending';
  priority: 'P0' | 'P1' | 'P2';
  status: string;
  owners: string[];
  completeness: number;
  risk: '低' | '中' | '高';
  lastUpdated: string;
}

export default function ProjectTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 嚴格綁定 2.2 節指派同仁名單與科別字串，無隨機野人名
  const projects = useMemo<ProjectData[]>(() => [
    { id: 'REQ-2026-001', unit: '消金暨信用卡總處', name: '全通路會員智能推薦系統', type: '評估案', priority: 'P0', status: '應用科評估完成', owners: ['趙俊安（應用科）', '任文燕（企劃科）'], completeness: 85, risk: '低', lastUpdated: '2026-05-18 14:20' },
    { id: 'REQ-2026-002', unit: '資訊總部', name: 'AI 語音客服自動摘要模組', type: 'POC案', priority: 'P1', status: 'POC案執行中', owners: ['邱仕翔（應用科）', '謝琇旻（科技科）'], completeness: 60, risk: '中', lastUpdated: '2026-05-18 11:05' },
    { id: 'REQ-2026-003', unit: '國際金融總處', name: '海外分行核心授信審查優化', type: '評估案', priority: 'P0', status: '需求單位討論', owners: ['許志豪（應用科）'], completeness: 30, risk: '高', lastUpdated: '2026-05-17 09:45' },
    { id: 'REQ-2026-004', unit: '法人金融總處', name: '區塊鏈供應鏈金融平台', type: 'Pending', priority: 'P2', status: '需求單位送單', owners: ['呂易容（應用科）', '郭珊珊（科技科）'], completeness: 45, risk: '低', lastUpdated: '2026-05-16 16:30' }
  ], []);

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
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm shadow-slate-100/40 overflow-hidden flex flex-col select-none">
      {/* 搜尋與篩選列 */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜尋專案編號、名稱或單位..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 font-medium"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <span>案型過濾: {selectedType === 'ALL' ? '全部' : selectedType}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {isFilterOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-40">
                {['ALL', '評估案', 'POC案', 'Pending'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setSelectedType(t); setIsFilterOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded text-slate-700 hover:bg-slate-50"
                  >
                    <span>{t === 'ALL' ? '全部案型' : t}</span>
                    {selectedType === t && <Check className="w-3 h-3 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 核心 10 大必填欄位 Data Grid */}
      <div className="overflow-x-auto">
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
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50/20 transition-colors group">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">{project.id}</td>
                <td className="px-6 py-4 text-slate-500">{project.unit}</td>
                <td className="px-6 py-4 font-bold text-slate-800 max-w-xs truncate">{project.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200/60 text-[10px] font-bold">{project.type}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-extrabold ${project.priority === 'P0' ? 'text-rose-600' : 'text-amber-600'}`}>{project.priority}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-indigo-50/60 text-indigo-600 border border-indigo-100/70 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{project.status}</span>
                </td>
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
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-0.5 font-bold ${project.risk === '高' ? 'text-rose-600' : project.risk === '中' ? 'text-amber-600' : 'text-slate-400'}`}>
                    {project.risk === '高' && <AlertCircle className="w-3 h-3 text-rose-500" />} {project.risk}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">{project.lastUpdated}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/project/${project.id}`} className="inline-flex items-center gap-0.5 px-2.5 py-1 font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:text-indigo-600 hover:bg-indigo-50/40 hover:border-indigo-100 shadow-sm transition-all group/btn">
                    <span>進入評估</span> 
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-indigo-600 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}