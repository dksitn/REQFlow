'use client';

import React, { useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { X, Loader2, FolderPlus } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  managerId: string | null; // 接收當前真實使用者的 UUID
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess, managerId }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('智金處');
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerId) {
      setErrorMsg('無法取得您的身分，請重新登入。');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // 🚀 自動產生專案代號 (例如：REQ-171829384)
      const projectCode = `REQ-${Math.floor(Date.now() / 1000)}`;

      // 🚀 將資料寫入我們剛剛建立的 m01_projects 資料表
      const { error } = await supabase
        .from('m01_projects')
        .insert([
          {
            project_code: projectCode,
            name: name,
            department: department,
            budget: Number(budget) || 0,
            manager_id: managerId, // 🔗 核心：把這筆專案綁定給現在登入的你！
            status: '評估中'
          }
        ]);

      if (error) throw error;

      // 成功後清除表單並關閉 Modal
      setName('');
      setBudget('');
      onSuccess(); // 通知父元件重新抓取資料
      onClose();
    } catch (error: any) {
      console.error('新增專案失敗:', error);
      setErrorMsg(error.message || '寫入資料庫時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal 標題區 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">建立新專案</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表單區塊 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">專案名稱 <span className="text-rose-500">*</span></label>
            <input 
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="例如：核心系統雲端轉型評估"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">所屬部門</label>
            <input 
              type="text" required value={department} onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">預估預算 (NTD)</label>
            <input 
              type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
              placeholder="例如：500000"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button 
              type="submit" disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '確認建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}