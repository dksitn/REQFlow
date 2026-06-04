'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/core/client/supabase';
import { X, Loader2, FolderPlus } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 當彈窗打開時，去資料庫抓取單位清單供下拉選單使用
  useEffect(() => {
    if (isOpen) {
      const fetchUnits = async () => {
        const { data } = await supabase.from('core_units').select('*').order('created_at');
        if (data) setUnits(data);
      };
      fetchUnits();
    } else {
      // 關閉時清空表單
      setName('');
      setDepartment('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('請輸入專案名稱');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 🤖 自動產生具有企業感的專案編號 (例如: REQ-2026-0604-001)
      const d = new Date();
      const yyyy = d.getFullYear();
      const mmdd = String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const projectCode = `REQ-${yyyy}-${mmdd}-${randomNum}`;

      // 將基本資料寫入專案主表，並設定預設狀態為「需求單位討論」
      const { data, error } = await supabase
        .from('m01_projects')
        .insert({
          name: name.trim(),
          project_code: projectCode,
          department: department || null,
          status_name_snapshot: '需求單位討論', 
          confirmed_fields: {} 
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        onSuccess(data.id); // 將新建的 ID 傳出，供父層跳轉使用
      }
    } catch (err: any) {
      console.error('建立專案失敗:', err);
      setErrorMsg(`建立失敗：${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">建立新案件</h2>
          </div>
          <button onClick={onClose} disabled={isLoading} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">專案名稱 <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              required
              autoFocus
              placeholder="例如：全通路會員智能推薦系統..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">提案單位 (可選)</label>
            <select 
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 cursor-pointer appearance-none"
            >
              <option value="" className="text-slate-400">請選擇單位...</option>
              {units.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading}
              className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !name.trim()}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '確認建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}