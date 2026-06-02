'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Building2, Users, Plus, Trash2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  
  // 🚀 RBAC 權限狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [newDept, setNewDept] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRole, setNewPersonRole] = useState('應用科');

  useEffect(() => { 
    checkAuthAndFetchData(); 
  }, []);

  const checkAuthAndFetchData = async () => {
    setIsLoading(true);
    try {
      // 1. 驗證登入者身分
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // 2. 查驗權限 (從 m01_users 抓取 system_role)
      const { data: profile } = await supabase.from('m01_users').select('*').eq('email', user.email).maybeSingle();
      
      if (profile?.system_role === 'admin') {
        setIsAdmin(true);
        setCurrentUser(profile);
        // 3. 是 Admin 才拉取資料
        const [{ data: dData }, { data: pData }] = await Promise.all([
          supabase.from('m01_departments').select('*').order('created_at'),
          supabase.from('m01_personnel').select('*').order('role_type')
        ]);
        if (dData) setDepartments(dData);
        if (pData) setPersonnel(pData);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDept = async () => {
    if (!newDept.trim() || !isAdmin) return;
    await supabase.from('m01_departments').insert({ name: newDept.trim() });
    setNewDept(''); checkAuthAndFetchData();
  };

  const handleDeleteDept = async (id: string) => {
    if (!isAdmin || !confirm('確定刪除此單位？')) return;
    await supabase.from('m01_departments').delete().eq('id', id);
    checkAuthAndFetchData();
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim() || !isAdmin) return;
    await supabase.from('m01_personnel').insert({ name: newPersonName.trim(), role_type: newPersonRole });
    setNewPersonName(''); checkAuthAndFetchData();
  };

  const handleDeletePerson = async (id: string) => {
    if (!isAdmin || !confirm('確定刪除此人員？')) return;
    await supabase.from('m01_personnel').delete().eq('id', id);
    checkAuthAndFetchData();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

  // 🚀 防護牆：非 Admin 顯示無權限
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-800 mb-2">無權限訪問此頁面</h1>
        <p className="text-sm font-bold text-slate-500 mb-6">您的帳號未具備管理員 (Admin) 權限。</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all">返回系統</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans flex flex-col items-center">
      <div className="max-w-5xl w-full flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-2"><ArrowLeft className="w-4 h-4"/> 返回系統</button>
          <h1 className="text-2xl font-black text-slate-900">系統主檔管理 (Admin Settings)</h1>
          <p className="text-sm font-bold text-emerald-600 mt-1">目前登入管理員：{currentUser?.full_name}</p>
        </div>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 單位管理 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">單位主檔管理</h2>
          </div>
          <div className="flex gap-2 mb-6">
            <input value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="輸入新單位名稱..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            <button onClick={handleAddDept} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4"/> 新增</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {departments.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                <span className="text-sm font-bold text-slate-700">{d.name}</span>
                <button onClick={() => handleDeleteDept(d.id)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* 人員管理 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">專案人員管理</h2>
          </div>
          <div className="flex gap-2 mb-6">
            <select value={newPersonRole} onChange={e => setNewPersonRole(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-emerald-400 font-bold text-slate-600 bg-slate-50">
              <option value="應用科">應用科</option><option value="企劃科">企劃科</option><option value="科技科">科技科</option>
            </select>
            <input value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="輸入人員姓名..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            <button onClick={handleAddPerson} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-1"><Plus className="w-4 h-4"/> 新增</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {personnel.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded ${p.role_type==='應用科'?'bg-emerald-100 text-emerald-700':p.role_type==='企劃科'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'}`}>{p.role_type}</span>
                  <span className="text-sm font-bold text-slate-700">{p.name}</span>
                </div>
                <button onClick={() => handleDeletePerson(p.id)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}