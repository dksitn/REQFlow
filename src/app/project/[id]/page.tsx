'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/core/client/supabase';
import { ArrowLeft, Save, Check, Loader2, Clock } from 'lucide-react';

// 🚀 關鍵修正：將相對路徑 './components/...' 改為絕對路徑 '@/components/...'
import WorkflowEditor from '@/components/WorkflowEditor';
import ImpactAnalysis from '@/components/ImpactAnalysis';
import ArchitectureEditor from '@/components/ArchitectureEditor';
import EvaluationMatrix from '@/components/EvaluationMatrix';
import PersonnelSelector from '@/components/PersonnelSelector';

export default function ProjectEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [projectData, setProjectData] = useState<any>(null);
  const [statusDict, setStatusDict] = useState<any[]>([]); // 儲存從資料庫撈回來的狀態字典
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, statRes] = await Promise.all([
          supabase.from('m01_projects').select('*').eq('id', projectId).single(),
          supabase.from('m01_status_dict').select('*').order('sort_order', { ascending: true })
        ]);

        if (projRes.error) throw projRes.error;
        if (statRes.error) throw statRes.error;

        setProjectData(projRes.data);
        setStatusDict(statRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const handleUpdateField = (field: string, value: any) => {
    setProjectData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (newStatus: string) => {
    setProjectData((prev: any) => ({ ...prev, status_name_snapshot: newStatus }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const { error } = await supabase
        .from('m01_projects')
        .update({
          ...projectData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;
      setSaveMessage('儲存成功！');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('儲存失敗:', error);
      setSaveMessage('儲存失敗，請重試。');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <span className="font-bold tracking-widest text-sm">載入專案資料中...</span>
      </div>
    );
  }

  if (!projectData) {
    return <div className="p-8 text-center text-red-500 font-bold">找不到專案資料</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative font-sans">
      
      {/* 🚀 頂部固定控制列 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-wrap md:flex-nowrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] md:text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">{projectData.project_code}</span>
              <h1 className="text-base md:text-xl font-black text-slate-900 tracking-tight line-clamp-1">{projectData.name}</h1>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> 最後更新：{new Date(projectData.updated_at).toLocaleString('zh-TW')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {saveMessage && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-right-4">
              <Check className="w-4 h-4" /> {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors active:scale-95 shrink-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            儲存變更
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
        
        {/* 🚀 左側主內容區 */}
        <div className="flex-1 flex flex-col gap-6 md:gap-8 w-full min-w-0">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <WorkflowEditor 
              value={projectData.workflow_text} 
              onChange={(val) => handleUpdateField('workflow_text', val)} 
            />
            <ImpactAnalysis 
              people={projectData.impact_people_text}
              time={projectData.impact_time_text}
              benefit={projectData.impact_benefit_text}
              onChange={(field, val) => handleUpdateField(`impact_${field}_text`, val)} 
            />
          </div>

          <ArchitectureEditor 
            asIs={projectData.image_as_is} 
            toBe={projectData.image_to_be} 
            onChange={(field, val) => handleUpdateField(`image_${field}`, val)} 
          />

          <EvaluationMatrix 
            business={projectData.eval_business}
            technical={projectData.eval_technical}
            kpi={projectData.eval_kpi}
            conclusion={projectData.eval_conclusion}
            onChange={(field, val) => handleUpdateField(`eval_${field}`, val)} 
          />

        </div>

        {/* 🚀 右側側邊設定區 (狀態、人員) */}
        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
          
          {/* 專案狀態控制卡片 */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800">專案狀態管理</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">目前階段</label>
                
                {/* 🚀 動態渲染資料庫撈下來的狀態字典 */}
                <select
                  value={projectData.status_name_snapshot}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {statusDict.map(status => (
                    <option key={status.id} value={status.name}>{status.name}</option>
                  ))}
                </select>

              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-slate-500">風險等級評估</label>
                <select
                  value={projectData.risk_level || '低'}
                  onChange={(e) => handleUpdateField('risk_level', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-bold outline-none cursor-pointer ${
                    projectData.risk_level === '高' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    projectData.risk_level === '中' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
                >
                  <option value="低" className="text-emerald-600 font-bold bg-white">低 (Low)</option>
                  <option value="中" className="text-amber-600 font-bold bg-white">中 (Medium)</option>
                  <option value="高" className="text-rose-600 font-bold bg-white">高 (High)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 專案人員設定 */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800">專案負責人員</h3>
            </div>
            <div className="p-5">
              <PersonnelSelector 
                value={projectData.team_members || {}} 
                onChange={(val) => handleUpdateField('team_members', val)} 
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}