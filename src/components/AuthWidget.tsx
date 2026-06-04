'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { LogOut, User as UserIcon, Loader2, LogIn } from 'lucide-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function AuthWidget() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // 初始化獲取 Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setIsLoading(false);
    });

    // 監聽 Auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          fetchProfile(currentSession.user.id);
          setShowAuthModal(false); // 登入成功自動關閉彈窗
        } else {
          // 🚀 修復 Bug：登出時強制清空 profile 狀態
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('m01_users').select('*').eq('id', userId).maybeSingle();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // 🚀 狀態會在 onAuthStateChange 裡面被清空
  };

  if (isLoading) {
    return (
      <div className="p-4 border-t border-slate-100 flex items-center justify-center bg-slate-50">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col shrink-0">
        {session ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black border border-indigo-200 shrink-0">
                {profile?.full_name ? profile.full_name.charAt(0) : <UserIcon className="w-5 h-5" />}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-black text-slate-800 truncate">{profile?.full_name || '使用者'}</span>
                <span className="text-[10px] font-bold text-slate-500 truncate">{session.user.email}</span>
              </div>
            </div>
            <button 
              onClick={handleSignOut} 
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0" 
              title="登出"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" /> 點此登入
          </button>
        )}
      </div>

      {/* 左下角的登入彈窗 (備用) */}
      {showAuthModal && !session && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h3 className="text-lg font-black text-slate-800 mb-4 text-center">存取 REQFlow</h3>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
            />
          </div>
        </div>
      )}
    </>
  );
}