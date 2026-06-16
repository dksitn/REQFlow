'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Users, Building2 } from 'lucide-react';
import { supabase } from '@/core/client/supabase';

interface CreateProjectModalProps {
  onClose: () => void;
  // 🚀 關鍵修改：讓 onSuccess 可以接收一個字串參數 (projectId)
  onSuccess: (projectId: string) => void; 
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 表單狀態
  const [projectName, setProjectName] = useState('');
  const [department, setDepartment] = useState('');
  const [autoProjectCode, setAutoProjectCode] = useState('');

  // 單位選單資料
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);

  useEffect(() => {
    fetchUnits();
    generateNextProjectCode();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('core_units').select('name').order('created_at');
      if (error) throw error;
      setUnitOptions(data.map(d => d.name));
      if (data.length > 0) setDepartment(data[0].name);
    } catch (err) {
      console.error('讀取單位失敗:', err);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const generateNextProjectCode = async () => {
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}${dd}`;

      const { data, error } = await supabase.from('m01_projects').select('project_code');
      if (error) throw error;

      let maxSequence = 0;
      
      if (data && data.length > 0) {
        data.forEach(proj => {
          const codeParts = proj.project_code.split('-');
          if (codeParts.length >= 4) {
            const lastPart = codeParts[codeParts.length - 1];
            const sequenceNum = parseInt(lastPart, 10);
            if (!isNaN(sequenceNum) && sequenceNum > maxSequence) {
              maxSequence = sequenceNum;
            }
          }
        });
      }

      const nextSequence = maxSequence + 1;
      const sequenceString = String(nextSequence).padStart(3, '0');
      const newCode = `REQ-${dateString}-${sequenceString}`;
      setAutoProjectCode(newCode);

    } catch (err) {
      console.error('產生專案編號失敗:', err);
      setAutoProjectCode(`REQ-${new Date().getFullYear()}-XXXX-001`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !department) {
      return alert('請填寫專案名稱並選擇提案單位');
    }

    setIsProcessing(true);
    try {
      const initialTeamMembers = {
        '應用科': [],
        '企劃科': [],
        '科技科': [],
        '唯讀檢視者': []
      };

      // 🚀 關鍵修改：使用 .select().single() 拿回剛剛建立的資料 (包含資料庫自動產生的 uuid)
      const { data: newProject, error } = await supabase.from('m01_projects').insert({
        name: projectName.trim(),
        project_code: autoProjectCode,
        department: department,
        status_name_snapshot: '需求單位討論', 
        team_members: initialTeamMembers,
        confirmed_fields: {}
      }).select().single();

      if (error) throw error;
      
      // 🚀 關鍵修改：將拿到的 newProject.id 傳給 onSuccess
      if (newProject && newProject.id) {
        onSuccess(newProject.id); 
      } else {
        onClose(); // 防呆機制
      }
      
    } catch (error: any) {
      console.error('建立專案失敗:', error);
      alert(`建立失敗: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">建立新專案</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">系統配發專案編號</label>
            <input type="text" value={autoProjectCode || '計算中...'} disabled className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-black text-slate-500 font-mono" />
            <span className="text-[10px] text-slate-400 mt-1 block">接續目前資料庫最大流水號自動產生</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">專案名稱 <span className="text-rose-500">*</span></label>
            <input type="text" required autoFocus value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="例如：智能客服系統升級專案" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:font-medium placeholder:text-slate-300" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">提案單位 <span className="text-rose-500">*</span></label>
            {isLoadingUnits ? (
              <div className="w-full border border-slate-200 rounded-lg px-4 py-2.5 flex items-center justify-center bg-slate-50">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : (
              <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                <option value="" disabled>請選擇單位...</option>
                {unitOptions.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            )}
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            取消
          </button>
          <button type="button" onClick={handleCreate} disabled={isProcessing || !projectName.trim() || !department} className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            建立專案
          </button>
        </div>
      </div>
    </div>
  );
}