'use client';

import React, { useState } from 'react';
import { supabase } from '@/core/client/supabase';
import { X, Loader2, FolderPlus } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  managerId: string | null;
  managerName: string | null; // 🚀 接收使用者的真實姓名
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess, managerId, managerName }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('數位金融處');
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
      // 1. 取得初始狀態「需求單位討論」的 status_id
      const { data: statusObj } = await supabase
        .from('m01_project_status_options')
        .select('status_id')
        .eq('status_code', 'REQ_UNIT_DISCUSSION')
        .single();

      const projectCode = `REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

      // 2. 寫入專案主檔 (m01_projects)
      const { data: newProject, error: projectError } = await supabase
        .from('m01_projects')
        .insert([{
          project_code: projectCode,
          name: name,
          department: department,
          status_id: statusObj?.status_id || null,
          status_name_snapshot: '需求單位討論',
          project_type: '評估案',
          completion_rate: 15,
          risk_level: '低'
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // 3. 🚀 寫入負責人關聯表 (m01_project_responsibles) - 符合 v1.3 規格
      if (newProject) {
        const { error: responsibleError } = await supabase
          .from('m01_project_responsibles')
          .insert([{
            project_id: newProject.id,
            user_id: managerId,
            responsible_name_snapshot: managerName || 'Admin',
            section_name_snapshot: '應用科', // 預設帶入
            responsibility_role: '主責'
          }]);
        
        if (responsibleError) console.error('寫入負責人失敗:', responsibleError);
      }

      setName('');
      onSuccess();
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">建立新專案 (REQ)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">{errorMsg}</div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">專案名稱 <span className="text-rose-500">*</span></label>
            <input 
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="例如：AI 智能客服轉型評估"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">提出單位 <span className="text-rose-500">*</span></label>
            <select 
              value={department} onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
            >
              <option value="數位金融處">數位金融處</option>
              <option value="作業服務總部">作業服務總部</option>
              <option value="資訊總部">資訊總部</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">取消</button>
            <button type="submit" disabled={isLoading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-70">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '確認建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}