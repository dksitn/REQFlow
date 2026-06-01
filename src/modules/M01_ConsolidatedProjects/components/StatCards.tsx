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
        // 🚀 撈取所有專案與負責人姓名
        const { data, error } = await supabase
          .from('m01_projects')
          .select(`
            status,
            m01_users ( full_name )
          `);

        if (error) throw error;

        let filteredData = data || [];

        // 🛡️ 如果是個人戰情室，只統計該負責人的專案
        if (targetUser) {
          filteredData = filteredData.filter(
            (p) => p.m01_users?.full_name === targetUser
          );
        }

        // 📊 動態計算各狀態的加總數量
        const evaluatingCount = filteredData.filter((p) => p.status === '評估中').length;
        const pocCount = filteredData.filter((p) => p.status === '進行中').length;
        const pendingCount = filteredData.filter((p) => p.status === '已結案').length; // 暫以已結案對應第三張卡片

        setStats({
          evaluating: evaluatingCount,
          poc: pocCount,
          pending: pendingCount,
        });
      } catch (error: any) {
        // 🚀 智慧錯誤捕捉：印出真實報錯訊息
        console.error('統計數據讀取失敗:', error.message || JSON.stringify(error));
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [targetUser]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-6 rounded-xl border border-indigo-100/50 shadow-sm items-center justify-center">
        <div className="col-span-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-400 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          正在計算真實統計數據...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      
      {/* 卡片 1：評估案 */}
      <div className="bg-white p-6 rounded-xl border border-indigo-100/50 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400">評估案總數</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            {stats.evaluating} <span className="text-xs font-bold text-slate-400 ml-1">件</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">智金處專案架構評估中</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <ClipboardList className="w-5 h-5" />
        </div>
      </div>

      {/* 卡片 2：POC 執行中 */}
      <div className="bg-white p-6 rounded-xl border border-indigo-100/50 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
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
      <div className="bg-white p-6 rounded-xl border border-indigo-100/50 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400">Pending中案件</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">
            {stats.pending} <span className="text-xs font-bold text-slate-400 ml-1">件</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">等待需求單位補充文件</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
          <Clock className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
}