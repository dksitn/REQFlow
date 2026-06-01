'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { LogOut, UserCircle, Loader2 } from 'lucide-react';

export default function AuthWidget() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 如果在登入頁，不需要顯示這個元件
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 向 m01_users 查詢真實姓名
        const { data: profile } = await supabase
          .from('m01_users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        setUserName(profile?.full_name || user.email);
      } catch (error) {
        console.error('讀取使用者失敗:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [pathname]);

  // 🚀 執行登出並清除本地 Token
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 登入頁不渲染此元件
  if (pathname === '/login') return null;

  return (
    <div className="flex flex-col gap-2 p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-bold">載入身分中...</span>
        </div>
      ) : userName ? (
        <>
          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
              <UserCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold">{userName}</span>
              <span className="text-[10px] text-slate-400 font-bold">已登入</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-rose-600 bg-white border border-rose-100 rounded-lg shadow-sm hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            安全登出
          </button>
        </>
      ) : null}
    </div>
  );
}