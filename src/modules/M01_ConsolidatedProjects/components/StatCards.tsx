'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { ClipboardList, Zap, Clock, Loader2 } from 'lucide-react';

interface StatCardsProps {
  targetUser?: string; // 用於個人戰情室過濾
}

export default function StatCards({ targetUser }: StatCardsProps) {
  const [stats, setStats] = useState({
    evaluating: 0,
    poc: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 🚀 撈取所有專案
        const { data, error } = await supabase.from('m01_projects').select('*');
        if (error) throw error;

        let filteredData = data || [];

        // 🛡️ JSON 負責人解析：如果是個人戰情室，只統計自己有參與的專案
        if (targetUser) {
          filteredData = filteredData.filter((p: any) => {
            const team = p.team_members || {};
            const allMembers = [
              ...(team['應用科'] || []), 
              ...(team['企劃科'] || []), 
              ...(team['科技科'] || []),
              ...(team['app'] || []),
              ...(team['planning'] || []),
              ...(team['tech'] || [])
            ];
            return allMembers.includes(targetUser);
          });
        }

        // 📊 計算各狀態案件數
        const evaluatingCount = filteredData.filter((p: any) => p.status_name_snapshot && !p.status_name_snapshot.includes('POC') && !p.status_name_snapshot.includes('Pending')).length;
        const pocCount = filteredData.filter((p: any) => p.status_name_snapshot && p.status_name_snapshot.includes('POC')).length;
        const pendingCount = filteredData.filter((p: any) => p.status_name_snapshot && (p.status_name_snapshot.includes('Pending') || p.status_name_snapshot.includes('暫停'))).length;

        setStats({
          evaluating: evaluatingCount,
          poc: pocCount,
          pending: pendingCount,
        });

      } catch (error) {
        console.error('統計卡片讀取錯誤:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [targetUser]);

  if (isLoading) {
    return <div className="h-24 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
      {/* 卡片 1：評估中案件 */}
      <div className="bg-white p-6 rounded-xl border border-blue-100/50 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400">處理 / 評估中案件</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            {stats.evaluating} <span className="text-xs font-bold text-slate-400 ml-1">件</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">前期架構梳理與效益評估</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
          <ClipboardList className="w-5 h-5" />
        </div>
      </div>

      {/* 卡片 2：POC 案件 */}
      <div className="bg-white p-6 rounded-xl border border-emerald-100/50 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400">POC案執行中</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            {stats.poc} <span className="text-xs font-bold text-slate-400 ml-1">件</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">技術概念驗證與階段開發</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      {/* 卡片 3：Pending 案件 */}
      <div className="bg-white p-6 rounded-xl border border-amber-100/50 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400">Pending中案件</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            {stats.pending} <span className="text-xs font-bold text-slate-400 ml-1">件</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">等待外部資源或暫停評估</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}