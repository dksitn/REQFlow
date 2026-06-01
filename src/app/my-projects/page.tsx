'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import StatCards from '@/modules/M01_ConsolidatedProjects/components/StatCards';
import ProjectTable from '@/modules/M01_ConsolidatedProjects/components/ProjectTable';
import AuditSidebar from '@/modules/M01_ConsolidatedProjects/components/AuditSidebar';
import { Loader2 } from 'lucide-react';

export default function MyWorkspacePage() {
  const router = useRouter();
  
  // 儲存真實使用者的狀態
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // 身份驗證載入中狀態

  useEffect(() => {
    async function checkUser() {
      try {
        // 1. 向 Supabase 詢問：「現在這個瀏覽器裡，有合法登入的人嗎？」
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          // 🛡️ 路由守衛發威：沒有登入，或 Token 失效，立刻踢回登入頁！
          console.warn('未登入或身分驗證失效，導向登入頁...');
          router.push('/login');
          return;
        }

        // 2. 🚀 拿著通行證上的 ID，去 m01_users 找真實姓名
        const { data: profile, error: profileError } = await supabase
          .from('m01_users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('找不到使用者擴充資料，退回顯示 Email');
          setCurrentUser(user.email ?? '未知使用者');
        } else {
          // 成功撈到名牌！顯示真實姓名
          setCurrentUser(profile.full_name);
        }

      } catch (error) {
        console.error('身分驗證發生異常:', error);
        router.push('/login');
      } finally {
        setIsAuthChecking(false);
      }
    }

    checkUser();
  }, [router]);

  // 在驗證完成前，顯示全畫面載入中 (避免畫面閃爍)
  if (isAuthChecking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-indigo-50/30 w-full min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-indigo-900 animate-pulse">驗證身分與權限中...</p>
        </div>
      </div>
    );
  }

  // 驗證通過，正常渲染個人戰情室
  return (
    <div className="flex-1 flex min-w-0 bg-white w-full">
      <main className="flex-1 bg-indigo-50/30 p-8 overflow-y-auto w-full min-w-0 transition-all duration-300">
        
        {/* 頂部標題區 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-100 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-indigo-900 tracking-tight">我的負責案件 (個人戰情室)</h1>
            <p className="text-xs text-indigo-400 font-medium mt-1">
              當前身份：<span className="text-indigo-600 font-bold">{currentUser}</span>。這裡僅顯示由您負責或建立的專案。
            </p>
          </div>
        </div>

        {/* 核心組件：把真實身分傳給子元件進行過濾 */}
        <div className="mb-6">
          <StatCards targetUser={currentUser ?? undefined} />
        </div>

        <div className="w-full overflow-hidden border border-indigo-100/50 rounded-xl shadow-sm">
          <ProjectTable targetUser={currentUser ?? undefined} />
        </div>

      </main>

      <AuditSidebar />
    </div>
  );
}