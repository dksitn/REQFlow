'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Plus, Trash2, ShieldAlert, Check, Minus, Mail, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PermissionsAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 資料狀態
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  
  // 表單狀態
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonDept, setNewPersonDept] = useState('應用科');

  useEffect(() => { checkAuthAndFetchData(); }, []);

  const checkAuthAndFetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const { data: profile } = await supabase.from('m01_users').select('*').eq('email', user.email).maybeSingle();
      
      if (profile?.system_role === 'admin') {
        setIsAdmin(true);
        const [{ data: uData }, { data: pData }] = await Promise.all([
          supabase.from('m01_users').select('*').order('created_at', { ascending: false }),
          supabase.from('m01_personnel').select('*').order('role_type')
        ]);
        if (uData) setSystemUsers(uData);
        if (pData) setPersonnel(pData);
      } else {
        setIsAdmin(false);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  // --- 處理 Email 與系統登入帳號綁定 ---
  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim() || !isAdmin) return;
    const { error } = await supabase.from('m01_users').upsert(
      { email: newUserEmail.trim(), full_name: newUserName.trim(), system_role: newUserRole },
      { onConflict: 'email' }
    );
    if (error) { alert('新增失敗：' + error.message); return; }
    setNewUserEmail(''); setNewUserName(''); checkAuthAndFetchData();
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`確定要移除 ${email} 的登入權限嗎？`)) return;
    await supabase.from('m01_users').delete().eq('email', email);
    checkAuthAndFetchData();
  };

  // --- 處理專案可選人員名單 ---
  const handleAddPerson = async () => {
    if (!newPersonName.trim() || !isAdmin) return;
    await supabase.from('m01_personnel').insert({ name: newPersonName.trim(), role_type: newPersonDept });
    setNewPersonName(''); checkAuthAndFetchData();
  };

  const handleDeletePerson = async (id: string) => {
    if (!confirm('確定刪除此人員？')) return;
    await supabase.from('m01_personnel').delete().eq('id', id);
    checkAuthAndFetchData();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-800 mb-2">無權限訪問此頁面</h1>
        <p className="text-sm font-bold text-slate-500 mb-6">您的帳號未具備管理員 (Admin) 權限。</p>
        <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all">返回系統</button>
      </div>
    );
  }

  // 將人員依科別分組 (為了致敬你的設計圖 UI)
  const groupedPersonnel = {
    '應用科': personnel.filter(p => p.role_type === '應用科'),
    '企劃科': personnel.filter(p => p.role_type === '企劃科'),
    '科技科': personnel.filter(p => p.role_type === '科技科')
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans w-full max-w-[1400px] mx-auto">
      
      {/* 標題區塊 */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">權限管理</h1>
        <p className="text-sm font-bold text-slate-500 mt-1">管理角色權限、人員指派與狀態選項，確保系統操作安全與治理一致。</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* ========================================== */}
        {/* 1. 角色與權限矩陣 (致敬設計圖) */}
        {/* ========================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</div>
            <h2 className="text-lg font-bold text-slate-800">角色與權限矩陣</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-500">
                  <th className="px-6 py-4">角色</th>
                  <th className="px-6 py-4 text-center">查看全部專案</th>
                  <th className="px-6 py-4 text-center">編輯負責專案</th>
                  <th className="px-6 py-4 text-center">管理專案狀態</th>
                  <th className="px-6 py-4 text-center">管理專案負責人</th>
                  <th className="px-6 py-4 text-center">管理系統權限</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2"><div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center"><UserIcon className="w-3 h-3" /></div> Admin (管理員)</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2"><div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center"><UserIcon className="w-3 h-3" /></div> User (一般用戶)</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Minus className="w-5 h-5 text-slate-300 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Minus className="w-5 h-5 text-slate-300 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Minus className="w-5 h-5 text-slate-300 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================== */}
        {/* 2. 系統登入帳號綁定 (新增的重點功能) */}
        {/* ========================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</div>
              <h2 className="text-lg font-bold text-slate-800">系統登入帳號與 Email 綁定</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Google 登入 Email (如: test@gmail.com)" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 font-bold" />
              </div>
              <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="綁定真實姓名 (如: 任x燕)" className="w-full md:w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 font-bold" />
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full md:w-36 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 font-bold text-slate-600 bg-white">
                <option value="user">User (一般)</option>
                <option value="admin">Admin (管理員)</option>
              </select>
              <button onClick={handleAddUser} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 whitespace-nowrap"><Plus className="w-4 h-4"/> 新增綁定</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemUsers.map(u => (
                <div key={u.id} className="flex flex-col p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all relative group bg-white">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${u.system_role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{u.system_role === 'admin' ? 'Admin' : 'User'}</span>
                    <button onClick={() => handleDeleteUser(u.email)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <h3 className="text-base font-black text-slate-800">{u.full_name}</h3>
                  <p className="text-xs font-bold text-slate-400">{u.email}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. 人員科別清單 (致敬設計圖卡片排列) */}
        {/* ========================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">3</div>
              <h2 className="text-lg font-bold text-slate-800">專案負責人可選名單庫</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <select value={newPersonDept} onChange={e => setNewPersonDept(e.target.value)} className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 font-bold text-slate-600 bg-white">
                <option value="應用科">應用科</option><option value="企劃科">企劃科</option><option value="科技科">科技科</option>
              </select>
              <input value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="輸入人員姓名..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 font-bold" />
              <button onClick={handleAddPerson} className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 flex items-center gap-1.5 whitespace-nowrap"><Plus className="w-4 h-4"/> 新增至資料庫</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {['應用科', '企劃科', '科技科'].map((deptName) => (
                <div key={deptName} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h3 className="text-sm font-black text-blue-600 mb-4 pb-2 border-b border-blue-100">{deptName}</h3>
                  <div className="space-y-2">
                    {groupedPersonnel[deptName as keyof typeof groupedPersonnel]?.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold text-center py-4">尚無人員</p>
                    ) : (
                      groupedPersonnel[deptName as keyof typeof groupedPersonnel]?.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm group">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black">{p.name.charAt(0)}</div>
                            <span className="text-sm font-bold text-slate-700">{p.name}</span>
                          </div>
                          <button onClick={() => handleDeletePerson(p.id)} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}