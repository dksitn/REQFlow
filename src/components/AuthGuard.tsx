'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, LockKeyhole } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. 初始檢查 Session
    const checkAuth = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthorized(!!session);
      setIsLoading(false);
    };

    checkAuth();

    // 2. 監聽登入/登出狀態改變 (當你在左下角 AuthWidget 登入成功時，這裡會立刻觸發解鎖)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthorized(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 狀態 A：檢查中 (顯示載入動畫)
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">驗證存取權限中...</p>
      </div>
    );
  }

  // 狀態 B：未登入 (顯示鎖定畫面，引導使用者去點擊左下角)
  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F8FAFC] animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <LockKeyhole className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">系統已鎖定</h2>
        <p className="text-sm font-bold text-slate-500">為了保護專案機密，請透過左側導覽列下方的按鈕進行登入。</p>
      </div>
    );
  }

  // 狀態 C：已登入 (正常渲染專案總覽或評估表內容)
  return <>{children}</>;
}