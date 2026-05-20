'use client';

import React, { useMemo } from 'react';
import { Briefcase, AlertTriangle, ClipboardList, Activity, Clock } from 'lucide-react';

export default function MyStatCards() {
  // 1. 單一事實來源 (SSOT)：模擬當前使用者（沈廷翼）負責的案件狀態
  const myProjects = useMemo(() => [
    { type: '評估案', isOverdue: false },
    { type: 'POC案', isOverdue: true }, // 超過三個工作天未更新
    { type: 'POC案', isOverdue: false },
    { type: '評估案', isOverdue: false },
    { type: 'Pending', isOverdue: true }
  ], []);

  // 2. 動態推導所有統計數字
  const stats = useMemo(() => {
    return {
      total: myProjects.length,
      overdue: myProjects.filter(p => p.isOverdue).length,
      eval: myProjects.filter(p => p.type === '評估案').length,
      poc: myProjects.filter(p => p.type === 'POC案').length,
      pending: myProjects.filter(p => p.type === 'Pending').length,
    };
  }, [myProjects]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 select-none">
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-indigo-800">我負責的案件</span>
          <Briefcase className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-indigo-900">{stats.total}</span>
          <span className="text-[10px] font-bold text-indigo-600">件</span>
        </div>
      </div>

      <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-rose-800">三天未更新</span>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-rose-900">{stats.overdue}</span>
          <span className="text-[10px] font-bold text-rose-600">件</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">評估案</span>
          <ClipboardList className="w-4 h-4 text-slate-400" />
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{stats.eval}</span>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">POC案</span>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{stats.poc}</span>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Pending中</span>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <span className="text-2xl font-extrabold text-slate-800">{stats.pending}</span>
      </div>
    </div>
  );
}