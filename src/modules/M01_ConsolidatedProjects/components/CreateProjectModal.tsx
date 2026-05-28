'use client';

import React, { useState } from 'react';
import { X, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/core/client/supabase';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 新增成功後觸發畫面更新
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unitId: 'UNIT-001',
    type: '評估案',
    priority: 'P1'
  });

  const units = [
    { id: 'UNIT-001', name: '消金暨信用卡總處' },
    { id: 'UNIT-002', name: '資訊總部' },
    { id: 'UNIT-003', name: '國際金融總處' },
    { id: 'UNIT-004', name: '法人金融總處' }
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('請輸入專案名稱');
    setIsSubmitting(true);

    try {
      // 1. 取得「需求單位討論」的初始狀態 ID
      const { data: statusData } = await supabase
        .from('m01_project_status_options')
        .select('status_id')
        .eq('status_code', 'REQ_UNIT_DISCUSSION')
        .single();

      // 2. 隨機生成一個專案編號 (模擬系統流水號)
      const randomNum = Math.floor(Math.random() * 900) + 100;
      const newProjectCode = `REQ-2026-${randomNum}`;
      const unitName = units.find(u => u.id === formData.unitId)?.name;

      // 3. 正式寫入資料庫
      const { error } = await supabase.from('m01_projects').insert({
        project_code: newProjectCode,
        project_name: formData.name,
        unit_id: formData.unitId,
        unit_name_snapshot: unitName,
        case_type: formData.type,
        priority: formData.priority,
        status_id: statusData?.status_id,
        status_name_snapshot: '需求單位討論',
        data_completeness_score: 10, // 初始完整度
        risk_level: '低',
        created_by: '沈廷翼 Admin'
      });

      if (error) throw error;

      // 4. 成功後關閉彈窗並觸發父層更新
      onSuccess();
      onClose();
      setFormData({ name: '', unitId: 'UNIT-001', type: '評估案', priority: 'P1' }); // 重置表單
    } catch (error) {
      console.error('建立專案失敗:', error);
      alert('建立專案失敗，請檢查資料庫連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">建立新專案案源</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">專案名稱 <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="例如：全通路會員智能推薦系統"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 shadow-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">提出需求單位</label>
            <select 
              value={formData.unitId}
              onChange={(e) => setFormData({...formData, unitId: e.target.value})}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 shadow-sm bg-white"
            >
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">案件類型</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 shadow-sm bg-white"
              >
                <option value="評估案">評估案</option>
                <option value="POC案">POC案</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">優先級</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 shadow-sm bg-white"
              >
                <option value="P0">P0 (最高)</option>
                <option value="P1">P1 (高)</option>
                <option value="P2">P2 (中)</option>
                <option value="P3">P3 (低)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              取消
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '確認建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}