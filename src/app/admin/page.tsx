'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Building2, Users, Plus, Trash2, ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  
  // 🚀 RBAC 權限狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 表單狀態
  const [newDept, setNewDept] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRole, setNewPersonRole] = useState('應用科');
  
  // 新增系統使用者表單
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  useEffect(() => { 
    checkAuthAndFetchData(); 
  }, []);

  const checkAuthAndFetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const { data: profile } = await supabase.from('m01_users').select('*').eq('email', user.email).maybeSingle();
      
      if (profile?.system_role === 'admin') {
        setIsAdmin(true);
        setCurrentUser(profile);
        
        // 🚀 同時抓取三個主檔資料
        const [{ data: dData }, { data: pData }, { data: uData }] = await Promise.all([
          supabase.from('m01_departments').select('*').order('created_at'),
          supabase.from('m01_personnel').select('*').order('role_type'),
          supabase.from('m01_users').select('*').order('created_at', { ascending: false })
        ]);
        if (dData) setDepartments(dData);
        if (pData) setPersonnel(pData);
        if (uData) setSystemUsers(uData);
      } else {
        setIsAdmin(false);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  // --- 單位管理邏輯 ---
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

  // --- 專案人員主檔邏輯 ---
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

  // --- 🚀 系統權限與 Email 綁定邏輯 ---
  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim() || !isAdmin) return;
    
    // 使用 upsert 避免重複建立相同的 email
    const { error } = await supabase.from('m01_users').upsert(
      { email: newUserEmail.trim(), full_name: newUserName.trim(), system_role: newUserRole },
      { onConflict: 'email' }
    );
    
    if (error) { alert('新增失敗：' + error.message); return; }
    setNewUserEmail(''); setNewUserName(''); checkAuthAndFetchData();
  };
  const handleDeleteUser = async (email: string) => {
    if (!isAdmin || !confirm(`確定要移除 ${email} 的系統登入權限嗎？`)) return;
    if (email === currentUser?.email) { alert('你不能刪除自己的管理員帳號！'); return; }
    
    await supabase.from('m01_users').delete().eq('email', email);
    checkAuthAndFetchData();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

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
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans flex flex-col items-center">
      <div className="max-w-[1200px] w-full flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-2"><ArrowLeft className="w-4 h-4"/> 返回專案總覽</button>
          <h1 className="text-2xl font-black text-slate-900">系統主檔與權限管理 (Admin)</h1>
          <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> 目前登入管理員：{currentUser?.full_name}</p>
        </div>
      </div>

      <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 🚀 區塊 1：系統帳號與權限綁定 (RBAC) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[500px] lg:col-span-3">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-800">系統帳號與權限綁定 (Email Mapping)</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="登入用 Email (如: test@gmail.com)" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 font-medium" />
            <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="綁定真實姓名 (如: 沈x翼)" className="w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 font-medium" />
            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 font-bold text-slate-600 bg-white">
              <option value="user">一般使用者</option>
              <option value="admin">管理員</option>
            </select>
            <button onClick={handleAddUser} className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 flex items-center justify-center gap-1.5 transition-colors"><Plus className="w-4 h-4"/> 新增綁定</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemUsers.map(u => (
              <div key={u.id} className="flex flex-col p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors relative group bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${u.system_role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{u.system_role === 'admin' ? '管理員 Admin' : '一般用戶 User'}</span>
                  <button onClick={() => handleDeleteUser(u.email)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4"/></button>
                </div>
                <h3 className="text-base font-black text-slate-800">{u.full_name}</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">{u.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 區塊 2：單位管理 */}
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

        {/* 區塊 3：專案人員主檔清單 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[500px] lg:col-span-2">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">專案人員名單 (供專案內頁下拉選擇)</h2>
          </div>
          <div className="flex gap-2 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <select value={newPersonRole} onChange={e => setNewPersonRole(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-emerald-400 font-bold text-slate-600 bg-white">
              <option value="應用科">應用科</option><option value="企劃科">企劃科</option><option value="科技科">科技科</option>
            </select>
            <input value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="輸入人員姓名..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            <button onClick={handleAddPerson} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-1"><Plus className="w-4 h-4"/> 新增至名單</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            {personnel.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-1 rounded ${p.role_type==='應用科'?'bg-emerald-100 text-emerald-700':p.role_type==='企劃科'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>{p.role_type}</span>
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