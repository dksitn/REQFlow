'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Activity, Clock, Layers, Loader2 } from 'lucide-react';
import { supabase } from '@/core/client/supabase';

interface RawStatItem {
  key: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  desc: string;
}

// 🛡️ 新增 targetUser 屬性
export default function StatCards({ refreshKey = 0, targetUser }: { refreshKey?: number, targetUser?: string }) {
  const [rawStats, setRawStats] = useState<RawStatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        let query = supabase.from('m01_projects').select('case_type');
        
        // 如果有傳入 targetUser，就進行過濾計算
        if (targetUser) {
          query = query.eq('created_by', targetUser);
        }
        
        const { data, error } = await query;
        if (error) throw error;

        if (data) {
          const evalCount = data.filter(d => d.case_type === '評估案').length;
          const pocCount = data.filter(d => d.case_type === 'POC案').length;
          const pendingCount = data.filter(d => d.case_type === 'Pending').length;

          setRawStats([
            { key: 'EVAL', label: '評估案總數', count: evalCount, icon: <ClipboardList className="w-4 h-4 text-indigo-600" />, desc: '智金處專案架構評估中' },
            { key: 'POC', label: 'POC案執行中', count: pocCount, icon: <Activity className="w-4 h-4 text-emerald-600" />, desc: '技術概念驗證與階段開發' },
            { key: 'PEND', label: 'Pending中案件', count: pendingCount, icon: <Clock className="w-4 h-4 text-amber-600" />, desc: '等待需求單位補充文件' }
          ]);
        }
      } catch (error) {
        console.error('統計數據讀取失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [refreshKey, targetUser]);

  const totalCases = useMemo(() => {
    return rawStats.reduce((sum, item) => sum + item.count, 0);
  }, [rawStats]);

  return (
    <div className="space-y-4 select-none relative">
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{targetUser ? '我的個人列管案源' : '智金處列管案源總計'}</span>
        </div>
        <span className="text-xs font-bold bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 shadow-sm font-mono flex items-center gap-2">
          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          {totalCases} Active Projects
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
           [1, 2, 3].map(i => (
             <div key={i} className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm h-[118px] animate-pulse">
                <div className="w-24 h-4 bg-slate-200 rounded mb-4"></div>
                <div className="w-12 h-8 bg-slate-200 rounded"></div>
             </div>
           ))
        ) : (
          rawStats.map((stat) => (
            <div key={stat.key} className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm shadow-slate-100/40 hover:border-slate-300/80 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">{stat.count}</span>
                <span className="text-xs font-bold text-slate-400">件</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">{stat.desc}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}