'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUpRight, AlertCircle, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';

// 定義符合強型別防呆的專案資料介面 (TypeScript Interface)
interface ProjectItem {
  id: string;
  name: string;
  unit: string;
  type: '評估案' | 'POC案' | 'Pending';
  status: string;
  statusColor: string;
  owners: string[];
  completeness: number;
  risk: '低' | '中' | '高';
}

export default function ProjectTable() {
  // 搜尋字串與高級篩選狀態控制
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // 模擬符合 PRD v1.6 的專案範例資料 (單一事實來源)
  const projects = useMemo<ProjectItem[]>(() => [
    {
      id: 'REQ-2026-001',
      name: '全通路會員智能推薦系統',
      unit: '消金暨信用卡總處',
      type: '評估案',
      status: '應用科評估完成',
      statusColor: 'bg-indigo-50/60 text-indigo-600 border-indigo-100/70',
      owners: ['趙俊安', '任文燕'],
      completeness: 85,
      risk: '低'
    },
    {
      id: 'REQ-2026-002',
      name: 'AI 語音客服自動摘要模組',
      unit: '資訊總部',
      type: 'POC案',
      status: 'POC案執行中',
      statusColor: 'bg-emerald-50/60 text-emerald-600 border-emerald-100/70',
      owners: ['邱仕翔', '謝琇旻'],
      completeness: 60,
      risk: '中'
    },
    {
      id: 'REQ-2026-003',
      name: '海外分行核心授信審查優化',
      unit: '國際金融總處',
      type: '評估案',
      status: '需求單位討論',
      statusColor: 'bg-slate-100/80 text-slate-600 border-slate-200/60',
      owners: ['許志豪'],
      completeness: 30,
      risk: '高'
    },
    {
      id: 'REQ-2026-004',
      name: '區塊鏈供應鏈金融平台',
      unit: '法人金融總處',
      type: 'Pending',
      status: '需求單位送單',
      statusColor: 'bg-amber-50/60 text-amber-600 border-amber-100/70',
      owners: ['呂易容', '郭珊珊'],
      completeness: 45,
      risk: '低'
    }
  ], []);

  // 防禦性前端搜尋與案型聯動篩選計算邏輯
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = 
        project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.unit.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'ALL' || project.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType, projects]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm shadow-slate-100/40 overflow-hidden flex flex-col">
      
      {/* =========================================================================
          1. 表格頂部控制列：純白搜尋與篩選器
          ========================================================================= */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
        {/* 搜尋輸入框 */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜尋專案編號、名稱或單位..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
          />
        </div>

        {/* 案型高級動態篩選按鈕區 */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end relative">
          <button 
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>案型過濾: {selectedType === 'ALL' ? '全部' : selectedType}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* 篩選小下拉彈窗 */}
          {isFilterDropdownOpen && (
            <div className="absolute right-0 top-9 w-40 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-40 animate-in fade-in slide-in-from-top-1 duration-700">
              {['ALL', '評估案', 'POC案', 'Pending'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setIsFilterDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>{type === 'ALL' ? '顯示全部案型' : type}</span>
                  {selectedType === type && <Check className="w-3 h-3 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. 核心 Data Grid 表格：遵守 Google SEO 語意化 HTML 規範
          ========================================================================= */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 select-none">
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">專案編號</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">需求單位</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">專案名稱</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">案型</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">當前狀態</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">負責人</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">完整度</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">風險</th>
              <th className="px-6 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-slate-50/30 transition-colors group"
                >
                  {/* 專案編號 */}
                  <td className="px-6 py-4 text-xs font-bold text-slate-900 font-mono tracking-tight">
                    {project.id}
                  </td>
                  
                  {/* 需求單位 */}
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {project.unit}
                  </td>
                  
                  {/* 專案名稱 */}
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 max-w-xs truncate group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </td>
                  
                  {/* 案型標籤 */}
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200/50 font-sans">
                      {project.type}
                    </span>
                  </td>
                  
                  {/* 當前狀態：點擊會前往評估頁彈窗修改 (全白微調膠囊) */}
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm shadow-slate-100/10 cursor-pointer hover:brightness-98 transition-all ${project.statusColor}`}>
                      {project.status}
                    </span>
                  </td>
                  
                  {/* 負責人複選標籤陣列 */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {project.owners.map((owner, i) => (
                        <span 
                          key={i} 
                          className="text-[11px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm"
                        >
                          {owner}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  {/* 進度完整度條 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/20">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${project.completeness}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 font-mono">{project.completeness}%</span>
                    </div>
                  </td>
                  
                  {/* 風險控管指標 */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold inline-flex items-center gap-1 ${
                      project.risk === '高' ? 'text-rose-600 font-extrabold' : project.risk === '中' ? 'text-amber-600' : 'text-slate-400 font-medium'
                    }`}>
                      {project.risk === '高' && <AlertCircle className="w-3 h-3 text-rose-500" />}
                      {project.risk}
                    </span>
                  </td>
                  
                  {/* 操作入口：一鍵優化轉場至 UI-002 */}
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/project/${project.id}`}
                      className="inline-flex items-center gap-0.5 px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:text-indigo-600 hover:bg-indigo-50/40 hover:border-indigo-100 shadow-sm transition-all group/btn"
                    >
                      <span>進入評估</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-indigo-600 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              /* 空白防禦提示 UI */
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-xs font-medium text-slate-400">
                  沒有找到符合條件的專案案件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          3. 表格底部數據摘要列
          ========================================================================= */}
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between text-xs font-medium text-slate-400">
        <div>
          顯示第 <span className="text-slate-600 font-semibold">{filteredProjects.length}</span> 筆，共計 <span className="text-slate-600 font-semibold">{projects.length}</span> 筆紀錄
        </div>
        <div className="font-mono text-[10px] tracking-wider uppercase text-slate-300">
          REQflow Grid Engine v1.6
        </div>
      </div>

    </div>
  );
}