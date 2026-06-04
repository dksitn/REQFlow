'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { Loader2, Plus, Trash2, ShieldAlert, Check, Minus, Mail, User as UserIcon, Edit2, X, LogOut, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PermissionsAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 頂部導覽列的使用者狀態
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  
  // 資料狀態 (以 m01_users 為唯一真相來源)
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  
  // 新增表單狀態
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  // 🚀 預設科別
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
      
      setCurrentUserEmail(user.email || '');

      const { data: currentUserProfile } = await supabase.from('m01_users').select('full_name, system_role').eq('email', user.email).maybeSingle();
      
      if (currentUserProfile) {
        setCurrentUserName(currentUserProfile.full_name);
        if (currentUserProfile.system_role === 'admin') {
          setIsAdmin(true);
          fetchSystemUsers(); 
        } else {
          setIsAdmin(false); 
        }
      } else {
         setIsAdmin(false); 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemUsers = async () => {
    const { data } = await supabase.from('m01_users').select('*').order('created_at', { ascending: false });
    if (data) setSystemUsers(data);
  };

  const handleSignOut = async () => { 
    await supabase.auth.signOut(); 
    router.push('/auth'); 
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return alert('請填寫完整資訊');
    setIsProcessing(true);
    try {
      // 1. 寫入 m01_users
      const { error: userError } = await supabase.from('m01_users').insert({
        email: newEmail.trim(),
        full_name: newName.trim(),
        department: newDept,
        system_role: newRole
      });
      if (userError) throw userError;

      // 2. 同步寫入 m01_personnel (這樣評估表裡面的下拉選單才能選到這個人)
      const { error: personnelError } = await supabase.from('m01_personnel').insert({
        name: newName.trim(),
        role_type: newDept
      });
      if (personnelError) console.warn('同步至 personnel 失敗', personnelError);

      setNewEmail(''); 
      setNewName('');
      await fetchSystemUsers();
      alert('新增成功！');
    } catch (err: any) {
      alert(`新增失敗: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editModal.data) return;
    setIsProcessing(true);
    try {
      const originalUser = systemUsers.find(u => u.id === editModal.data.id);
      
      // 1. 更新 m01_users
      const { error: userError } = await supabase.from('m01_users').update({
        email: editModal.data.email,
        full_name: editModal.data.full_name,
        department: editModal.data.department,
        system_role: editModal.data.system_role
      }).eq('id', editModal.data.id);
      
      if (userError) throw userError;

      // 2. 同步更新 m01_personnel
      if (originalUser) {
        await supabase.from('m01_personnel').update({
          name: editModal.data.full_name,
          role_type: editModal.data.department
        }).eq('name', originalUser.full_name);
      }

      setEditModal({ isOpen: false, data: null });
      await fetchSystemUsers();
      alert('更新成功！');
    } catch (err: any) {
      alert(`更新失敗: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string, dept: string) => {
    if (!confirm(`確定要刪除 ${name} 嗎？此操作不可逆。`)) return;
    setIsProcessing(true);
    try {
      // 同步刪除兩邊的資料
      await supabase.from('m01_users').delete().eq('id', id);
      await supabase.from('m01_personnel').delete().eq('name', name);
      
      await fetchSystemUsers();
    } catch (err: any) {
      alert(`刪除失敗: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-100 flex flex-col items-center max-w-md text-center">
          <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">無權限訪問此頁面</h2>
          <p className="text-sm font-bold text-slate-500 mb-6">您的帳號並未具備 Admin 權限，無法進入權限管理後台。</p>
          <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors">
            返回專案總覽
          </button>
        </div>
      </div>
    );
  }

  // 🚀 分類名單，將唯讀檢視者也加入渲染陣列中
  const groupedUsers = {
    '應用科': systemUsers.filter(u => u.department === '應用科'),
    '企劃科': systemUsers.filter(u => u.department === '企劃科'),
    '科技科': systemUsers.filter(u => u.department === '科技科'),
    '唯讀檢視者': systemUsers.filter(u => u.department === '唯讀檢視者'),
  };

  return (
    // 🚀 解除高度封印，改為 min-h-screen 搭配 pb-32，讓頁面自然撐開
    <div className="flex-1 flex flex-col bg-[#F8FAFC] w-full min-h-screen relative font-sans">
      
      {/* 頂部導覽 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            系統權限與人員管理 <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md ml-2">Admin Only</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 pl-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-slate-800">{currentUserName}</span>
              <span className="text-[10px] font-bold text-slate-400">{currentUserEmail}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black border border-indigo-200">
              {currentUserName ? currentUserName.charAt(0) : <UserIcon className="w-4 h-4" />}
            </div>
            <button onClick={handleSignOut} title="登出" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 pt-8 pb-32 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
        
        {/* 區塊 1: 權限矩陣說明 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" /> 角色與權限矩陣
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-extrabold text-slate-600 w-1/4">功能權限</th>
                  <th className="px-4 py-3 font-extrabold text-indigo-600 text-center w-1/4">Admin (系統管理員)</th>
                  <th className="px-4 py-3 font-extrabold text-blue-600 text-center w-1/4">User (一般成員)</th>
                  <th className="px-4 py-3 font-extrabold text-amber-600 text-center w-1/4">唯讀檢視者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">瀏覽專案總覽與個人案件</td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">進入專案填寫評估資料</td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Minus className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">變更專案狀態與單位</td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Minus className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-indigo-50/30">
                  <td className="px-4 py-3 font-bold text-indigo-900">進入「權限管理」後台</td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-indigo-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Minus className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Minus className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-indigo-50/30">
                  <td className="px-4 py-3 font-bold text-indigo-900">新增/刪除系統帳號與身分</td>
                  <td className="px-4 py-3 text-center"><Check className="w-4 h-4 text-indigo-500 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Minus className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Minus className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 區塊 2: 新增系統人員 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400" /> 新增系統人員與 Email 綁定
            </h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">資料將同步至專案負責人下拉選單</span>
          </div>
          
          <form onSubmit={handleAddUser} className="flex items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">登入 Email (Google/微軟)</label>
              <input type="email" required value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="例如: name@example.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="w-40">
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">真實姓名</label>
              <input type="text" required value={newName} onChange={e=>setNewName(e.target.value)} placeholder="例如: 王大明" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="w-36">
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">所屬科別 (角色)</label>
              {/* 🚀 補上唯讀檢視者選項 */}
              <select value={newDept} onChange={e=>setNewDept(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-indigo-400">
                <option value="應用科">應用科</option>
                <option value="企劃科">企劃科</option>
                <option value="科技科">科技科</option>
                <option value="唯讀檢視者">唯讀檢視者</option>
              </select>
            </div>
            <div className="w-36">
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">系統權限</label>
              <select value={newRole} onChange={e=>setNewRole(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-indigo-400">
                <option value="user">User (一般)</option>
                <option value="admin">Admin (管理)</option>
              </select>
            </div>
            <button type="submit" disabled={isProcessing} className="h-[38px] px-6 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> 新增綁定</>}
            </button>
          </form>
        </section>

        {/* 區塊 3: 全站人員名單庫 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-slate-800">全站人員名單庫</h2>
            <span className="text-xs font-bold text-slate-500">共 {systemUsers.length} 人</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {Object.entries(groupedUsers).map(([deptName, users]) => (
              <div key={deptName} className="flex flex-col gap-3">
                <div className={`px-3 py-2 rounded-lg text-xs font-black border flex justify-between items-center ${
                  deptName === '應用科' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                  deptName === '企劃科' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                  deptName === '科技科' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                  'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {deptName === '唯讀檢視者' ? <Lock className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                    {deptName}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded shadow-sm">{users.length}</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  {users.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400">尚無人員</div>
                  ) : (
                    users.map(u => (
                      <div key={u.id} className="group relative p-3 border border-slate-100 rounded-xl bg-white hover:border-indigo-200 hover:shadow-md transition-all flex flex-col gap-1 overflow-hidden">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-black text-slate-800">{u.full_name}</span>
                          {u.system_role === 'admin' && <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">Admin</span>}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 truncate flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span>
                        
                        <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                           <button onClick={() => setEditModal({ isOpen: true, data: u })} className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDeleteUser(u.id, u.full_name, u.department)} className="w-7 h-7 rounded bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* 🚀 編輯人員彈窗 */}
      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-extrabold text-slate-800">編輯人員資料</h2>
              <button onClick={() => setEditModal({ isOpen: false, data: null })} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">登入 Email</label>
                <input type="email" value={editModal.data.email} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, email: e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">真實姓名</label>
                <input type="text" value={editModal.data.full_name} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, full_name: e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">所屬科別</label>
                  {/* 🚀 編輯視窗也補上唯讀選項 */}
                  <select value={editModal.data.department} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, department: e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400">
                    <option value="應用科">應用科</option>
                    <option value="企劃科">企劃科</option>
                    <option value="科技科">科技科</option>
                    <option value="唯讀檢視者">唯讀檢視者</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">系統權限</label>
                  <select value={editModal.data.system_role} onChange={e => setEditModal(prev => ({...prev, data: {...prev.data, system_role: e.target.value}}))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400">
                    <option value="user">User (一般)</option>
                    <option value="admin">Admin (管理)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditModal({ isOpen: false, data: null })} className="flex-1 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">取消</button>
              <button onClick={handleUpdateUser} disabled={isProcessing} className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : '儲存變更'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}