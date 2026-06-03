'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Plus, Trash2, ShieldAlert, Check, Minus, Mail, User as UserIcon, Edit2, X, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PermissionsAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 資料狀態 (以 m01_users 為唯一真相來源)
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  
  // 新增表單狀態
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('應用科');
  const [newRole, setNewRole] = useState('user');

  // 編輯彈窗狀態
  const [editModal, setEditModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { checkAuthAndFetchData(); }, []);

  const checkAuthAndFetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const { data: profile } = await supabase.from('m01_users').select('*').eq('email', user.email).maybeSingle();
      
      if (profile?.system_role === 'admin') {
        setIsAdmin(true);
        const { data: uData } = await supabase.from('m01_users').select('*').order('created_at', { ascending: false });
        if (uData) setSystemUsers(uData);
      } else {
        setIsAdmin(false);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  // --- 🚀 統一新增：同時寫入 users 與 personnel ---
  const handleAddUser = async () => {
    if (!newEmail.trim() || !newName.trim() || !newDept || !isAdmin) {
      alert('請填寫完整資訊 (Email、姓名、科別)！');
      return;
    }
    setIsProcessing(true);
    try {
      // 1. 寫入 m01_users (系統帳號)
      const { error: userError } = await supabase.from('m01_users').upsert(
        { email: newEmail.trim(), full_name: newName.trim(), system_role: newRole, department: newDept },
        { onConflict: 'email' }
      );
      if (userError) throw userError;

      // 2. 為了專案下拉選單，同步寫入 m01_personnel
      await supabase.from('m01_personnel').insert({ name: newName.trim(), role_type: newDept });

      setNewEmail(''); setNewName(''); setNewDept('應用科'); setNewRole('user');
      await checkAuthAndFetchData();
    } catch (error: any) { alert('新增失敗：' + error.message); } finally { setIsProcessing(false); }
  };

  // --- 🚀 編輯與更新：同時更新 users 與 personnel ---
  const handleUpdateUser = async () => {
    if (!editModal.data.full_name.trim() || !editModal.data.email.trim()) return;
    setIsProcessing(true);
    try {
      // 1. 更新 m01_users
      await supabase.from('m01_users').update({
        email: editModal.data.email.trim(),
        full_name: editModal.data.full_name.trim(),
        department: editModal.data.department,
        system_role: editModal.data.system_role
      }).eq('id', editModal.data.id);

      // 2. 同步更新 m01_personnel (找舊名字替換成新名字與新科別)
      await supabase.from('m01_personnel').update({
        name: editModal.data.full_name.trim(),
        role_type: editModal.data.department
      }).eq('name', editModal.data.original_name); // original_name 確保我們改對人

      setEditModal({ isOpen: false, data: null });
      await checkAuthAndFetchData();
    } catch (error: any) { alert('更新失敗：' + error.message); } finally { setIsProcessing(false); }
  };

  // --- 🚀 刪除：同時移除 users 與 personnel ---
  const handleDeleteUser = async (user: any) => {
    if (!confirm(`確定要移除 [${user.full_name}] 嗎？這將同時撤銷他的系統權限。`)) return;
    try {
      await supabase.from('m01_users').delete().eq('id', user.id);
      await supabase.from('m01_personnel').delete().eq('name', user.full_name);
      await checkAuthAndFetchData();
    } catch (error) { console.error(error); }
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

  // 將人員依科別分組
  const departmentsList = ['應用科', '企劃科', '科技科', '未分類'];
  const groupedUsers = departmentsList.reduce((acc: any, dept) => {
    acc[dept] = systemUsers.filter(u => u.department === dept || (!u.department && dept === '未分類'));
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans w-full max-w-[1400px] mx-auto">
      
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">權限與人員管理</h1>
        <p className="text-sm font-bold text-slate-500 mt-1">管理角色權限、一次性指派人員科別與系統登入 Email，確保資料同步一致。</p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* ========================================== */}
        {/* 1. 角色與權限矩陣 */}
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
        {/* 2. 一站式人員新增區 */}
        {/* ========================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</div>
            <h2 className="text-lg font-bold text-slate-800">新增系統人員與 Email 綁定</h2>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col xl:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-center">
              <div className="relative flex-1 w-full xl:w-auto">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Google 登入 Email (如: test@gmail.com)" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 font-bold" />
              </div>
              <div className="relative w-full xl:w-48">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="真實姓名 (如: 任x燕)" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 font-bold" />
              </div>
              <div className="flex w-full xl:w-auto gap-3">
                <select value={newDept} onChange={e => setNewDept(e.target.value)} className="flex-1 xl:w-32 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-bold text-slate-600 bg-white">
                  <option value="應用科">應用科</option><option value="企劃科">企劃科</option><option value="科技科">科技科</option>
                </select>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="flex-1 xl:w-36 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-bold text-slate-600 bg-white">
                  <option value="user">User (一般)</option>
                  <option value="admin">Admin (管理)</option>
                </select>
                <button onClick={handleAddUser} disabled={isProcessing} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 whitespace-nowrap transition-all disabled:opacity-50">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4"/>} 新增綁定
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. 人員管理名單庫 (含編輯功能) */}
        {/* ========================================== */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">3</div>
            <h2 className="text-lg font-bold text-slate-800">全站人員名單庫</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {departmentsList.map((deptName) => {
                const usersInDept = groupedUsers[deptName];
                if (deptName === '未分類' && usersInDept.length === 0) return null; // 隱藏空的未分類
                
                return (
                  <div key={deptName} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                    <h3 className="text-sm font-black text-blue-600 mb-4 pb-2 border-b border-blue-100 flex items-center justify-between">
                      {deptName} <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{usersInDept.length} 人</span>
                    </h3>
                    <div className="space-y-3">
                      {usersInDept.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold text-center py-6">此科別尚無人員</p>
                      ) : (
                        usersInDept.map((u: any) => (
                          <div key={u.id} className="flex flex-col p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group relative">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${u.system_role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{u.system_role === 'admin' ? 'Admin' : 'User'}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditModal({ isOpen: true, data: { ...u, original_name: u.full_name } })} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5"/></button>
                                <button onClick={() => handleDeleteUser(u)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black shrink-0">{u.full_name.charAt(0)}</div>
                              <span className="text-sm font-black text-slate-800 truncate">{u.full_name}</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 truncate pl-8">{u.email}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </div>

      {/* ========================================== */}
      {/* 🚀 編輯人員彈窗 (Edit Modal) */}
      {/* ========================================== */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-800">編輯人員資料</h2>
              <button onClick={() => setEditModal({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4 bg-slate-50">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">真實姓名</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={editModal.data.full_name} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, full_name: e.target.value}}))} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">登入 Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={editModal.data.email} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, email: e.target.value}}))} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">所屬科別</label>
                  <select value={editModal.data.department} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, department: e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400">
                    <option value="應用科">應用科</option><option value="企劃科">企劃科</option><option value="科技科">科技科</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">系統權限</label>
                  <select value={editModal.data.system_role} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, system_role: e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400">
                    <option value="user">User (一般)</option><option value="admin">Admin (管理)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditModal({ isOpen: false, data: null })} className="flex-1 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleUpdateUser} disabled={isProcessing} className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex justify-center items-center">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : '儲存變更'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}