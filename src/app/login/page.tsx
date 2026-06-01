'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 傳統帳號密碼登入
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) router.push('/');
    } catch (error: any) {
      console.error('登入失敗:', error.message);
      setErrorMsg('帳號或密碼錯誤，請重新輸入。');
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 全新升級：Google 單一登入 (SSO)
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 登入後自動導回目前的網址 (localhost 或 pages.dev)
          redirectTo: `${window.location.origin}`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google 登入失敗:', error.message);
      setErrorMsg('Google 登入發生異常，請稍後再試。');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* 標題區塊 */}
        <div className="bg-indigo-600 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <ShieldCheck className="w-12 h-12 text-white mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight relative z-10">REQFlow 系統登入</h1>
          <p className="text-indigo-200 text-sm mt-2 font-medium relative z-10">智金處專案架構與資源列管平台</p>
        </div>

        {/* 登入表單 */}
        <div className="p-8">
          
          {/* 錯誤訊息提示區 */}
          {errorMsg && (
            <div className="mb-5 bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded-lg border border-rose-100 text-center">
              {errorMsg}
            </div>
          )}

          {/* 🚀 Google 登入按鈕 */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 mb-5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            使用 Google 帳號登入
          </button>

          {/* 分隔線 */}
          <div className="relative flex items-center py-2 mb-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">或使用系統帳號</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">電子郵件 (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@reqflow.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">系統密碼 (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading || isGoogleLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '一般登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}