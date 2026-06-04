'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, LockKeyhole, ArrowRight } from 'lucide-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginUI, setShowLoginUI] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthorized(!!session);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthorized(!!session);
      if (session) setShowLoginUI(false); // 登入成功就關閉 UI
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">驗證存取權限中...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F8FAFC] animate-in fade-in duration-300 relative">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <LockKeyhole className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">系統已鎖定</h2>
        <p className="text-sm font-bold text-slate-500 mb-8">為了保護專案機密，請登入您的企業帳號。</p>
        
        {/* 🚀 中間的大登入按鈕，點擊展開 Supabase UI */}
        {!showLoginUI ? (
          <button 
            onClick={() => setShowLoginUI(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            開啟登入面板 <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm animate-in zoom-in-95 duration-200">
             <Auth
                supabaseClient={supabase}
                appearance={{ 
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#4f46e5', // indigo-600
                        brandAccent: '#4338ca', // indigo-700
                      }
                    }
                  }
                }}
                providers={['google']}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: '企業信箱',
                      password_label: '密碼',
                      button_label: '安全登入',
                    }
                  }
                }}
              />
              <button 
                onClick={() => setShowLoginUI(false)} 
                className="mt-4 w-full text-xs font-bold text-slate-400 hover:text-slate-600 text-center"
              >
                取消
              </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}