'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/core/client/supabase';
import { useRouter } from 'next/navigation';
// 🚀 修復：在這裡補上了 LayoutGrid 的引入
import { Loader2, Mail, Lock, ArrowRight, LayoutGrid } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // 切換登入或註冊模式

  useEffect(() => {
    // 進入頁面時，檢查如果已經登入，就直接踢回首頁
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkUser();

    // 監聽登入狀態：一旦 Google 或 Email 登入成功，立刻跳回首頁
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // 🚀 處理 Email / 密碼 登入與註冊
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('註冊成功！若您有開啟 Email 驗證，請前往信箱點擊驗證信，或直接嘗試登入。');
        setIsSignUp(false); // 註冊完切回登入模式
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // 登入成功後，onAuthStateChange 會自動觸發轉址
      }
    } catch (error: any) {
      alert(`錯誤: ${error.message || '驗證失敗'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 處理 Google OAuth 登入
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`, // 登入成功後重導回網站根目錄
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(`Google 登入錯誤: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* 背景裝飾 (科技感 SaaS 風格) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo 與標題 */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">REQflow</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">智金處專案需求管理平台</p>
        </div>

        {/* 🚀 Google 登入按鈕 */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-black py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all mb-6 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          {isLoading ? '連線中...' : '使用 Google 帳號登入'}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-xs font-bold text-slate-400">或使用測試帳號登入</span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        {/* 🚀 Email / 密碼 登入表單 */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 pl-1">電子郵件 (Email)</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="例如: dksitn@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 pl-1">密碼 (Password)</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="請輸入密碼"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-3 px-4 rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20 disabled:opacity-50 mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? '建立帳號' : '登入系統')}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            {isSignUp ? '已經有帳號了？點此登入' : '還沒有測試帳號？點此註冊 (SignUp)'}
          </button>
        </div>

      </div>

      <div className="absolute bottom-6 text-[10px] font-bold text-slate-400 text-center w-full">
        <p>測試帳號：任x燕 (dksitn@gmail.com) / 沈x翼 (jassie45214@gmail.com)</p>
      </div>
    </div>
  );
}